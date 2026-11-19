/**
 * Prints a single-use "set password" link for any user, straight from D1.
 * Handy for the admin's first login, or before email sending is connected.
 *
 *   npx tsx scripts/password-link.ts sgolan20@gmail.com           # production
 *   npx tsx scripts/password-link.ts sgolan20@gmail.com --local   # wrangler dev
 *
 * The link is valid for 72 hours and works once.
 */
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";

const email = process.argv[2]?.trim().toLowerCase();
const local = process.argv.includes("--local");
if (!email || !email.includes("@")) {
  console.error("usage: npx tsx scripts/password-link.ts <email> [--local]");
  process.exit(1);
}

const b64url = (b: Buffer) =>
  b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const token = b64url(randomBytes(32));
const id = b64url(createHash("sha256").update(token).digest());
const now = new Date();
const expires = new Date(now.getTime() + 72 * 3_600_000);
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const sql = `INSERT INTO password_tokens (id, user_id, created_at, expires_at)
  SELECT ${q(id)}, id, ${q(now.toISOString())}, ${q(expires.toISOString())}
    FROM users WHERE email = ${q(email)};
  SELECT changes() AS inserted;`;

const out = execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "zafon-biz", local ? "--local" : "--remote", "--json", "--command", sql],
  { encoding: "utf8" },
);
const results = JSON.parse(out) as { results: { inserted?: number }[] }[];
const inserted = results.at(-1)?.results[0]?.inserted ?? 0;
if (!inserted) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

const base = local ? "http://localhost:8788" : process.env.SITE_URL ?? readSiteUrl();
console.log(`${base}/reset-password/?token=${token}`);

function readSiteUrl(): string {
  const cfg = execFileSync("node", [
    "-e",
    "const s=require('fs').readFileSync('wrangler.jsonc','utf8');const m=s.match(/\"SITE_URL\"\\s*:\\s*\"([^\"]+)\"/);process.stdout.write(m?m[1]:'')",
  ]).toString();
  return cfg.replace(/\/$/, "");
}
