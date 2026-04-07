import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Redirects for deprecated/legacy routes
  async redirects() {
    return [
      // /auth/login → homepage (login is a modal on the homepage)
      {
        source: "/auth/login",
        destination: "/",
        permanent: false,
      },
      // /dashboard/wishlist → /dashboard/favorites (canonical route)
      {
        source: "/dashboard/wishlist",
        destination: "/dashboard/favorites",
        permanent: true,
      },
      // /bookings → /dashboard/bookings
      {
        source: "/bookings",
        destination: "/dashboard/bookings",
        permanent: true,
      },
    ];
  },
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
      {
        protocol: "https",
        hostname: "pub-6c324d7c9f5e49859e5016309646ff83.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
