import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This folder is the project root, even if a parent folder has a lockfile.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  // Studio iframes this app from *.contentstack.com: the canvas (/canvas),
  // template previews and Visual Editor (every other page). A host or CDN that
  // adds X-Frame-Options blocks those frames and Studio shows "refused to
  // connect". frame-ancestors overrides it and names exactly who may frame the
  // site: itself and Contentstack.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.contentstack.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
