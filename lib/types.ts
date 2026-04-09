/**
 * Core types for the תומכים בצפון business directory.
 *
 * These types are shared between client and server (build-time) code.
 * Firestore Timestamp values are normalized to ISO strings before being
 * passed to React components, since Server Components serialize their props.
 */

export type BusinessStatus = "pending" | "approved" | "rejected";

export interface Business {
  id: string;
  status: BusinessStatus;

  // Core info
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;

  // Categorization
  category: string;
  subCategory?: string;
  tags?: string[];

  // Location
  town: string;
  region?: string;
  address?: string;

  // Contact
  contactName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;

  // Hours and social
  openingHours?: string;
  facebook?: string;
  instagram?: string;

  // Metadata (ISO strings, not Timestamps)
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  shuffleSeed: number;
}

/**
 * Slim shape used for the public listing page and search index.
 *
 * The home page lazy-loads `/businesses.json` (a dump of every approved
 * business as `BusinessSummary[]`) so the initial HTML stays small even
 * when the catalog grows to thousands of entries. Only the fields the
 * card UI and Fuse search actually need are included — full details are
 * fetched per-page on the static `/business/[slug]/` route.
 */
export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription?: string;
  description: string;
  town: string;
  phone: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface Town {
  id: string;
  name: string;
  region: string;
  isBorderCommunity: boolean;
}

export interface Admin {
  email: string;
  uid: string;
  role: "super" | "editor";
  addedAt: string;
}

/**
 * Form data submitted by the public registration form.
 * Mirrors Business but only the fields a business owner can set.
 */
export interface BusinessRegistrationData {
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
}
