import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce strict React mode for catching common bugs early
  reactStrictMode: true,

  // Image optimization — add domains when integrating external image CDNs
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Example: { protocol: "https", hostname: "assets.example.com" }
    ],
  },

  // Turbopack is the default bundler in Next.js 16 dev — no config needed.
  // If you need webpack customizations in the future, add them here.

  // Compiler options — remove console logs in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Experimental flags to opt into when ready:
  // experimental: {
  //   ppr: true,          // Partial Pre-rendering
  //   reactCompiler: true // React Compiler (auto-memoization)
  // },

  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
