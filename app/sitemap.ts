import type { MetadataRoute } from "next";
import { getApprovedBusinesses } from "@/lib/firebase-admin";

export const dynamic = "force-static";

const SITE_URL = "https://zafon-biz.web.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await getApprovedBusinesses();

  const businessEntries: MetadataRoute.Sitemap = businesses.map((b) => ({
    url: `${SITE_URL}/business/${b.slug}/`,
    lastModified: b.approvedAt ? new Date(b.approvedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/register/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...businessEntries,
  ];
}
