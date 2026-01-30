import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@forks/shared', '@forks/m2her', '@forks/agents'],
  // Exclude native modules from bundling (serverComponentsExternalPackages moved to serverExternalPackages in Next.js 15)
  serverExternalPackages: ['better-sqlite3', '@forks/db'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
};

export default nextConfig;
