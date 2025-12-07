import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    remotePatterns: [],
  },
  // Optimize for Vercel deployment
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
