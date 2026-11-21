/** Business photos in R2 (binding MEDIA). Server-only. */
import "server-only";
import { getDb, getEnv } from "./db";

export type ImageKind = "cover" | "logo";

export const IMAGE_KINDS: ImageKind[] = ["cover", "logo"];
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const COLUMN: Record<ImageKind, "cover_key" | "logo_key"> = {
  cover: "cover_key",
  logo: "logo_key",
};

/**
 * Detects the real image type from the file's first bytes (never trust the
 * browser's Content-Type) — only JPEG, PNG and WebP are accepted.
 */
export function sniffImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

/** Stores a new image for the business and removes the one it replaces. */
export async function saveBusinessImage(
  businessId: string,
  kind: ImageKind,
  bytes: Uint8Array,
  type: { mime: string; ext: string },
): Promise<string> {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const key = `businesses/${businessId}/${kind}-${rand}.${type.ext}`;
  const { MEDIA } = getEnv();
  await MEDIA.put(key, bytes, { httpMetadata: { contentType: type.mime } });

  const col = COLUMN[kind];
  const old = await getDb()
    .prepare(`SELECT ${col} AS k FROM businesses WHERE id = ?`)
    .bind(businessId)
    .first<{ k: string | null }>();
  await getDb()
    .prepare(`UPDATE businesses SET ${col} = ?, updated_at = ? WHERE id = ?`)
    .bind(key, new Date().toISOString(), businessId)
    .run();
  if (old?.k) await MEDIA.delete(old.k);
  return key;
}

export async function removeBusinessImage(businessId: string, kind: ImageKind): Promise<void> {
  const col = COLUMN[kind];
  const old = await getDb()
    .prepare(`SELECT ${col} AS k FROM businesses WHERE id = ?`)
    .bind(businessId)
    .first<{ k: string | null }>();
  await getDb()
    .prepare(`UPDATE businesses SET ${col} = NULL, updated_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), businessId)
    .run();
  if (old?.k) await getEnv().MEDIA.delete(old.k);
}

/** Deletes every image of a business (used when the business is deleted). */
export async function removeAllBusinessImages(businessId: string): Promise<void> {
  const { MEDIA } = getEnv();
  const listed = await MEDIA.list({ prefix: `businesses/${businessId}/` });
  if (listed.objects.length) await MEDIA.delete(listed.objects.map((o) => o.key));
}
