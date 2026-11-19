/**
 * One-off: turn .migration/firestore.json into .migration/data.sql for D1.
 *
 *   npx tsx scripts/migrate/firestore-to-sql.ts
 *   npx wrangler d1 execute zafon-biz --remote --file .migration/data.sql
 *
 * - Every distinct business email becomes an 'owner' user with NO password
 *   (they set one through "forgot password").
 * - ADMIN_EMAIL becomes the single 'admin' user.
 * - Each business is linked to its owner by email.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const ADMIN_EMAIL = "sgolan20@gmail.com";

type Doc = Record<string, unknown> & { id: string };
const data = JSON.parse(readFileSync(".migration/firestore.json", "utf8")) as Record<string, Doc[]>;

const q = (v: unknown): string => {
  if (v === undefined || v === null || v === "") return "NULL";
  if (typeof v === "number") return String(Math.trunc(v));
  if (typeof v === "boolean") return v ? "1" : "0";
  if (Array.isArray(v)) return q(JSON.stringify(v));
  return `'${String(v).replace(/'/g, "''")}'`;
};

const now = new Date().toISOString();
const lines: string[] = [];

for (const c of data.categories ?? []) {
  lines.push(
    `INSERT INTO categories (id,name,icon,sort_order) VALUES (${q(c.id)},${q(c.name)},${q(c.icon ?? "more-horizontal")},${q(c.order ?? 0)});`,
  );
}
for (const t of data.towns ?? []) {
  lines.push(
    `INSERT INTO towns (id,name,region,is_border_community) VALUES (${q(t.id)},${q(t.name)},${q(t.region ?? "")},${t.isBorderCommunity ? 1 : 0});`,
  );
}

// Users
const userIdByEmail = new Map<string, string>();
const addUser = (email: string, role: "owner" | "admin") => {
  const key = email.trim().toLowerCase();
  if (!key || userIdByEmail.has(key)) return;
  const id = randomUUID();
  userIdByEmail.set(key, id);
  lines.push(
    `INSERT INTO users (id,email,password_hash,role,created_at) VALUES (${q(id)},${q(key)},NULL,${q(role)},${q(now)});`,
  );
};
addUser(ADMIN_EMAIL, "admin");
for (const b of data.businesses ?? []) {
  if (typeof b.email === "string") addUser(b.email, "owner");
}

for (const b of data.businesses ?? []) {
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const ownerId = email ? userIdByEmail.get(email) : undefined;
  lines.push(
    `INSERT INTO businesses (id,owner_id,status,name,slug,description,short_description,category,sub_category,tags,town,region,address,contact_name,phone,whatsapp,email,website,opening_hours,facebook,instagram,created_at,approved_at,approved_by,shuffle_seed) VALUES (` +
      [
        b.id, ownerId, b.status, b.name, b.slug, b.description, b.shortDescription, b.category,
        b.subCategory, b.tags, b.town, b.region, b.address, b.contactName, b.phone, b.whatsapp,
        email || undefined, b.website, b.openingHours, b.facebook, b.instagram,
        b.createdAt ?? now, b.approvedAt, b.approvedBy, b.shuffleSeed ?? 0,
      ].map(q).join(",") +
      ");",
  );
}

writeFileSync(".migration/data.sql", lines.join("\n") + "\n");
console.log(
  `categories ${data.categories?.length}, towns ${data.towns?.length}, users ${userIdByEmail.size}, businesses ${data.businesses?.length}`,
);
