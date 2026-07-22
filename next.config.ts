import type { NextConfig } from "next";

/**
 * Cloudflare-compatible Next.js config.
 * Key changes for @opennextjs/cloudflare:
 * - turbopack removed (not supported in edge builds)
 * - images.remotePatterns is fine for Cloudflare
 */
const nextConfig: NextConfig = {
  // Turbopack causes build failures with opennext — remove entirely
  // turbopack: { root: "." }

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/article-images/**",
      },
    ],
  },
};

export default nextConfig;
