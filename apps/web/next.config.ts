import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@rueckab/calc', '@rueckab/eligibility'],
};

export default nextConfig;
