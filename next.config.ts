import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'neofuture.in',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
