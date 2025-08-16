import type {NextConfig} from 'next';

require('dotenv').config({ path: './.env' });

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(handlebars|hbs|dotprompt)$/i,
      type: 'asset/source',
    });
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      handlebars: require.resolve('handlebars/dist/cjs/handlebars.js'),
    };
    return config;
  },
};

export default nextConfig;
