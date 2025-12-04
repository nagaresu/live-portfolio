import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,  // Disable Next.js image optimization to serve pre-optimized images directly
    remotePatterns: [],
  },
};

export default nextConfig;
