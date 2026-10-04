import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@rueckab/calc', '@rueckab/eligibility', '@rueckab/report'],
  // Playwright (PDF-Erzeugung im Webhook) wird zur Laufzeit aus node_modules geladen, nicht gebündelt.
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium'],
  // Prompt 14, 0.6: Produktname „Gutachten“ – alte Adresse bleibt erreichbar.
  redirects: async () => [{ source: '/bericht', destination: '/gutachten', permanent: true }],
};

export default nextConfig;
