/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1';
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = isVercel
  ? {
      // Vercel: full server-side Next.js, no static export needed
      images: { unoptimized: true },
    }
  : {
      // Local dev / GitHub Pages: static export
      output: 'export',
      basePath: isProd ? '/Notegenious_ai' : '',
      images: { unoptimized: true },
      trailingSlash: true,
    };

module.exports = nextConfig;
