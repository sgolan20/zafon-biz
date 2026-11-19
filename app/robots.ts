import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/notify";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/account/",
          "/api/",
          "/login/",
          "/forgot-password/",
          "/reset-password/",
          "/thank-you/",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
