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
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {
    // Empty config to silence the warning
    // The dynamic import in pdf-extract.ts handles the pdf-parse module loading
  },
  experimental: {
    // Mark pdf-parse and pdfjs-dist as external to prevent bundling issues
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', 'pdf2json'],
  },
};

export default nextConfig;
