import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@streak-map/core', '@streak-map/store'],
};

export default nextConfig;
