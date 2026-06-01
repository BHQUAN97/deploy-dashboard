import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Cho phép SSH2 native module chạy trong standalone (Next.js 15+)
  serverExternalPackages: ["ssh2"],
}

export default nextConfig;
