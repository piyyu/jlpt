/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native Node.js module — must not be bundled by webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
  // Ensure API routes run in Node.js runtime
  experimental: {},
};

export default nextConfig;
