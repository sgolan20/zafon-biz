import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/thank-you/"],
      },
    ],
    sitemap: "https://zafon-biz.web.app/sitemap.xml",
  };
}
