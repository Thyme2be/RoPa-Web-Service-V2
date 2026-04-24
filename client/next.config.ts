import path from "path";
import type { NextConfig } from "next";

// ถ้าหา __dirname ไม่เจอ (เช่นตอนรันใน Docker) ให้ไปใช้ process.cwd() แทน
const rootPath = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(rootPath, '..'),
};

export default nextConfig;