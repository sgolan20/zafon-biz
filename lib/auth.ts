/**
 * Accounts, sessions and password links — all in D1, no third party.
 *
 * - Passwords: PBKDF2-SHA256 (100k iterations, the Workers maximum), random salt.
 * - Sessions: random 256-bit token in an HttpOnly cookie; only its SHA-256 is stored.
 * - Password links: single-use random token, SHA-256 stored, short expiry.
 */
import "server-only";
import { cookies } from "next/headers";
import { getDb } from "./db";
import type { SessionUser, UserRole } from "./types";

export const SESSION_COOKIE = "zb_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100_000;
export const RESET_TOKEN_HOURS = 2;
/** Links the admin copies by hand (e.g. WhatsApp) live longer. */
export const ADMIN_LINK_HOURS = 72;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function randomToken(bytes = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return b64url(new Uint8Array(d));
}
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !iter || !salt || !hash) return false;
  const actual = await pbkdf2(password, fromB64url(salt), Number(iter));
  return timingSafeEqual(actual, fromB64url(hash));
}

export const PASSWORD_MIN = 8;
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== "string" || pw.length < PASSWORD_MIN)
    return `הסיסמה צריכה להכיל לפחות ${PASSWORD_MIN} תווים`;
  if (pw.length > 200) return "הסיסמה ארוכה מדי";
  return null;
}

// ---------- users ----------

export type UserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  role: UserRole;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return getDb()
    .prepare("SELECT id, email, password_hash, role FROM users WHERE email = ?")
    .bind(normalizeEmail(email))
    .first<UserRow>();
}

export async function findUserById(id: string): Promise<UserRow | null> {
  return getDb()
    .prepare("SELECT id, email, password_hash, role FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
}

/** Returns the user id for this email, creating an owner account if needed. */
export async function ensureOwnerUser(
  email: string,
  passwordHash: string | null = null,
): Promise<string> {
  const existing = await findUserByEmail(email);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await getDb()
    .prepare(
      "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, 'owner', ?)",
    )
    .bind(id, normalizeEmail(email), passwordHash, new Date().toISOString())
    .run();
  return id;
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  const db = getDb();
  // New password → sign out every device and burn any open links.
  await db.batch([
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(hash, userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    db
      .prepare("UPDATE password_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL")
      .bind(new Date().toISOString(), userId),
  ]);
}

// ---------- sessions ----------

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  const db = getDb();
  await db.batch([
    db
      .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(await sha256(token), userId, now.toISOString(), expires.toISOString()),
    db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(now.toISOString(), userId),
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now.toISOString()),
  ]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256(token)).run();
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await getDb()
    .prepare(
      `SELECT u.id, u.email, u.role, u.password_hash IS NOT NULL AS has_password
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > ?`,
    )
    .bind(await sha256(token), new Date().toISOString())
    .first<{ id: string; email: string; role: UserRole; has_password: number }>();
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, hasPassword: row.has_password === 1 };
}

// ---------- password links ----------

export async function createPasswordToken(userId: string, hours: number): Promise<string> {
  const token = randomToken();
  const now = new Date();
  await getDb()
    .prepare(
      "INSERT INTO password_tokens (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(
      await sha256(token),
      userId,
      now.toISOString(),
      new Date(now.getTime() + hours * 3_600_000).toISOString(),
    )
    .run();
  return token;
}

/** Validates a token without consuming it. Returns the user's email if valid. */
export async function peekPasswordToken(token: string): Promise<string | null> {
  const row = await getDb()
    .prepare(
      `SELECT u.email FROM password_tokens t JOIN users u ON u.id = t.user_id
        WHERE t.id = ? AND t.used_at IS NULL AND t.expires_at > ?`,
    )
    .bind(await sha256(token), new Date().toISOString())
    .first<{ email: string }>();
  return row?.email ?? null;
}

/** Atomically marks the token used. Returns the user id, or null if invalid. */
export async function consumePasswordToken(token: string): Promise<string | null> {
  const now = new Date().toISOString();
  const row = await getDb()
    .prepare(
      `UPDATE password_tokens SET used_at = ?
        WHERE id = ? AND used_at IS NULL AND expires_at > ?
        RETURNING user_id`,
    )
    .bind(now, await sha256(token), now)
    .first<{ user_id: string }>();
  return row?.user_id ?? null;
}

// ---------- rate limiting ----------

/** Fixed-window counter in D1. Returns false when the limit is exceeded. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - windowSec;
  const row = await getDb()
    .prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
         window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END
       RETURNING count`,
    )
    .bind(key, now, cutoff, cutoff, now)
    .first<{ count: number }>();
  return (row?.count ?? 0) <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local";
}
