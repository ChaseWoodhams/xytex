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
  // Prevent search engine crawling (dev site)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
        ],
      },
    ];
  },
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {
    // Empty config to silence the warning
    // The dynamic import in pdf-extract.ts handles the pdf-parse module loading
  },
  // Mark pdf-parse, pdfjs-dist, pdf2json, and puppeteer as external to prevent bundling issues
  // In Next.js 16, this moved from experimental.serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'pdf2json', 'puppeteer', 'puppeteer-core'],
};

export default nextConfig;
