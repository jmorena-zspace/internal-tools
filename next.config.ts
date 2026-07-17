import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/internal-tools',
  images: { unoptimized: true },
};

export default nextConfig;
