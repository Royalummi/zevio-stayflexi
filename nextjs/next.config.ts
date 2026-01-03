import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Image optimization for external URLs
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
