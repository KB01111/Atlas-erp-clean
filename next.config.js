/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  /* config options here */
  distDir: 'dist',

  // Disable React Strict Mode to prevent double rendering in development
  reactStrictMode: false,

  // The appDir option is no longer needed in Next.js 15
  // as the App Router is the default

  // Experimental features and optimizations
  experimental: {
    // Ensure we only have one copy of React
    esmExternals: 'loose', // Helps with React resolution

    // Optimize imports from these packages
    optimizePackageImports: [
      'motion',
      'motion/react',
      'react-icons',
      'lucide-react',
      '@radix-ui/react-icons',
      '@heroicons/react',
    ],

    // Enable memory optimizations for webpack
    webpackMemoryOptimizations: true,
  },

  // Server components optimization (moved from experimental)
  serverExternalPackages: [],

  // Configure path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Optimize for production
    if (config.mode === 'production') {
      // Enable module concatenation for better tree-shaking
      config.optimization.concatenateModules = true;

      // Minimize CSS
      if (config.optimization.minimizer) {
        config.optimization.minimizer.push(
          new (require('css-minimizer-webpack-plugin'))()
        );
      }
    }

    return config;
  },

  // Configure image optimization
  images: {
    // Increase cache TTL for optimized images
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },
};

module.exports = nextConfig;
