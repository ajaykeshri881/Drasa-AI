import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from trying to bundle server-only packages
  serverExternalPackages: ["mongoose", "ioredis"],

  images: {
    remotePatterns: [
      {
        // Google profile images (used for Google OAuth avatar)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
