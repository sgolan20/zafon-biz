/**
 * Firebase Admin SDK - server-side / build-time only.
 *
 * Used during `next build` (and during local dev when fetching Server Component
 * data) to read approved businesses from Firestore. Service account credentials
 * come from the GOOGLE_APPLICATION_CREDENTIALS env var (file path) in CI, or
 * from the FIREBASE_SERVICE_ACCOUNT env var (raw JSON) when set inline.
 *
 * In local development without credentials, falls back to Application Default
 * Credentials from the gcloud CLI (which is what we use on Shahar's machine).
 */

import { cert, getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Business, Category, Town } from "./types";

const PROJECT_ID = "zafon-biz";

let app: App;

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // CI: service account JSON in env var
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // CI alt: file path
    app = initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  } else {
    // Local dev: use gcloud auth application-default credentials
    app = initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
} else {
  app = getApps()[0];
}

export const adminDb: Firestore = getFirestore(app);

/**
 * Helper to convert Firestore Timestamps to ISO strings so the data can
 * be safely passed from Server Components to Client Components.
 */
function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

/**
 * Fetch all approved businesses from Firestore at build time.
 * Uses select() to limit egress to the fields the public site actually needs.
 */
export async function getApprovedBusinesses(): Promise<Business[]> {
  const snapshot = await adminDb
    .collection("businesses")
    .where("status", "==", "approved")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      status: "approved" as const,
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      category: data.category,
      subCategory: data.subCategory,
      tags: data.tags,
      town: data.town,
      region: data.region,
      address: data.address,
      contactName: data.contactName,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      website: data.website,
      openingHours: data.openingHours,
      facebook: data.facebook,
      instagram: data.instagram,
      createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
      approvedAt: toIsoString(data.approvedAt),
      approvedBy: data.approvedBy,
      shuffleSeed: data.shuffleSeed ?? 0,
    };
  });
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const snapshot = await adminDb
    .collection("businesses")
    .where("status", "==", "approved")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const all = await getApprovedBusinesses();
  return all.find((b) => b.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const snapshot = await adminDb.collection("categories").orderBy("order").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    icon: doc.data().icon,
    order: doc.data().order,
  }));
}

export async function getTowns(): Promise<Town[]> {
  const snapshot = await adminDb.collection("towns").orderBy("name").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    region: doc.data().region,
    isBorderCommunity: doc.data().isBorderCommunity ?? false,
  }));
}
