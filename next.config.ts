import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  // Allow Supabase Storage images for article covers and inline images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/article-images/**",
      },
    ],
  },
  // --------------- Performance ---------------
  // Enable React compiler for automatic memoization (Next.js 16)
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
