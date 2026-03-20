import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  // Explicitly set the root if needed, but usually ensuring the bundler
  // respects the local src is enough. 
  // Next.js 16/Turbopack sometimes needs help with workspace roots.
};

export default nextConfig;
