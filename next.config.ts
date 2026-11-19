import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;

// Gives `next dev` access to the Cloudflare bindings (D1 etc.) from wrangler.jsonc.
initOpenNextCloudflareForDev();
