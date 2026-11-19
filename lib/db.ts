/**
 * D1 data layer (Cloudflare). Server-only.
 *
 * All pages render on demand inside the Worker and read straight from D1,
 * so admin/owner changes appear on the live site immediately.
 */
import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Business, BusinessStatus, BusinessSummary, Category, Town } from "./types";

export function getEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}

export function getDb(): D1Database {
  return getEnv().DB;
}

type BusinessRow = {
  id: string;
  owner_id: string | null;
  status: BusinessStatus;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  category: string;
  sub_category: string | null;
  tags: string | null;
  town: string;
  region: string | null;
  address: string | null;
  contact_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  opening_hours: string | null;
  facebook: string | null;
  instagram: string | null;
  created_at: string;
  updated_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  shuffle_seed: number;
};

const u = <T,>(v: T | null): T | undefined => (v === null ? undefined : v);

export function rowToBusiness(r: BusinessRow): Business {
  let tags: string[] | undefined;
  if (r.tags) {
    try {
      tags = JSON.parse(r.tags);
    } catch {
      tags = undefined;
    }
  }
  return {
    id: r.id,
    ownerId: u(r.owner_id),
    status: r.status,
    name: r.name,
    slug: r.slug,
    description: r.description,
    shortDescription: u(r.short_description),
    category: r.category,
    subCategory: u(r.sub_category),
    tags,
    town: r.town,
    region: u(r.region),
    address: u(r.address),
    contactName: r.contact_name,
    phone: r.phone,
    whatsapp: u(r.whatsapp),
    email: u(r.email),
    website: u(r.website),
    openingHours: u(r.opening_hours),
    facebook: u(r.facebook),
    instagram: u(r.instagram),
    createdAt: r.created_at,
    updatedAt: u(r.updated_at),
    approvedAt: u(r.approved_at),
    approvedBy: u(r.approved_by),
    shuffleSeed: r.shuffle_seed,
  };
}

export async function getApprovedBusinesses(): Promise<Business[]> {
  const { results } = await getDb()
    .prepare("SELECT * FROM businesses WHERE status = 'approved'")
    .all<BusinessRow>();
  return results.map(rowToBusiness);
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const row = await getDb()
    .prepare("SELECT * FROM businesses WHERE slug = ? AND status = 'approved'")
    .bind(slug)
    .first<BusinessRow>();
  return row ? rowToBusiness(row) : null;
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const row = await getDb()
    .prepare("SELECT * FROM businesses WHERE id = ?")
    .bind(id)
    .first<BusinessRow>();
  return row ? rowToBusiness(row) : null;
}

export async function getBusinessesByOwner(ownerId: string): Promise<Business[]> {
  const { results } = await getDb()
    .prepare("SELECT * FROM businesses WHERE owner_id = ? ORDER BY created_at")
    .bind(ownerId)
    .all<BusinessRow>();
  return results.map(rowToBusiness);
}

export async function getBusinessesByStatus(status: BusinessStatus): Promise<Business[]> {
  const order = status === "approved" ? "approved_at DESC" : "created_at DESC";
  const { results } = await getDb()
    .prepare(`SELECT * FROM businesses WHERE status = ? ORDER BY ${order}`)
    .bind(status)
    .all<BusinessRow>();
  return results.map(rowToBusiness);
}

export async function getCategories(): Promise<Category[]> {
  const { results } = await getDb()
    .prepare("SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order")
    .all<{ id: string; name: string; icon: string; sort_order: number }>();
  return results.map((c) => ({ id: c.id, name: c.name, icon: c.icon, order: c.sort_order }));
}

export async function getTowns(): Promise<Town[]> {
  const { results } = await getDb()
    .prepare("SELECT id, name, region, is_border_community FROM towns ORDER BY name")
    .all<{ id: string; name: string; region: string; is_border_community: number }>();
  return results.map((t) => ({
    id: t.id,
    name: t.name,
    region: t.region,
    isBorderCommunity: t.is_border_community === 1,
  }));
}

/** Slim shape used by the listing grid and the search index. */
export function toBusinessSummary(b: Business): BusinessSummary {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    category: b.category,
    shortDescription: b.shortDescription,
    description: b.description,
    town: b.town,
    phone: b.phone,
    whatsapp: b.whatsapp,
    tags: b.tags,
  };
}

/** Editable business fields (shared by registration, owner edit, admin edit). */
export type BusinessFields = {
  name: string;
  description: string;
  category: string;
  town: string;
  contactName: string;
  phone: string;
  address?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  facebook?: string;
  instagram?: string;
};

const FIELD_COLUMNS: Record<keyof BusinessFields, string> = {
  name: "name",
  description: "description",
  category: "category",
  town: "town",
  contactName: "contact_name",
  phone: "phone",
  address: "address",
  whatsapp: "whatsapp",
  email: "email",
  website: "website",
  openingHours: "opening_hours",
  facebook: "facebook",
  instagram: "instagram",
};

const emptyToNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export async function insertBusiness(input: {
  id: string;
  slug: string;
  ownerId: string | null;
  fields: BusinessFields;
}): Promise<void> {
  const f = input.fields;
  await getDb()
    .prepare(
      `INSERT INTO businesses (id, owner_id, status, name, slug, description, category, town,
         contact_name, phone, address, whatsapp, email, website, opening_hours, facebook,
         instagram, created_at, shuffle_seed)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.ownerId,
      f.name.trim(),
      input.slug,
      f.description.trim(),
      f.category,
      f.town,
      f.contactName.trim(),
      f.phone.trim(),
      emptyToNull(f.address),
      emptyToNull(f.whatsapp),
      emptyToNull(f.email?.toLowerCase()),
      emptyToNull(f.website),
      emptyToNull(f.openingHours),
      emptyToNull(f.facebook),
      emptyToNull(f.instagram),
      new Date().toISOString(),
      Math.floor(Math.random() * 1_000_000_000),
    )
    .run();
}

export async function updateBusinessFields(id: string, fields: BusinessFields): Promise<void> {
  const keys = Object.keys(FIELD_COLUMNS) as (keyof BusinessFields)[];
  const sets = keys.map((k) => `${FIELD_COLUMNS[k]} = ?`).join(", ");
  const values = keys.map((k) => {
    const v = fields[k];
    if (k === "email") return emptyToNull(v?.toLowerCase());
    return typeof v === "string" ? (v.trim() ? v.trim() : null) : null;
  });
  await getDb()
    .prepare(`UPDATE businesses SET ${sets}, updated_at = ? WHERE id = ?`)
    .bind(...values, new Date().toISOString(), id)
    .run();
}

export type UserOverview = {
  id: string;
  email: string;
  role: "owner" | "admin";
  hasPassword: boolean;
  lastLoginAt?: string;
  businessNames: string[];
};

/** Every user with their businesses — for the admin "users" tab. */
export async function getUsersOverview(): Promise<UserOverview[]> {
  const { results } = await getDb()
    .prepare(
      `SELECT u.id, u.email, u.role, u.password_hash IS NOT NULL AS has_password,
              u.last_login_at, group_concat(b.name, '|') AS names
         FROM users u LEFT JOIN businesses b ON b.owner_id = u.id
        GROUP BY u.id
        ORDER BY u.role = 'admin' DESC, u.email`,
    )
    .all<{
      id: string;
      email: string;
      role: "owner" | "admin";
      has_password: number;
      last_login_at: string | null;
      names: string | null;
    }>();
  return results.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    hasPassword: r.has_password === 1,
    lastLoginAt: r.last_login_at ?? undefined,
    businessNames: r.names ? r.names.split("|") : [],
  }));
}
