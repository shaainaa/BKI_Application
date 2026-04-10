import type { NextConfig } from "next";

// Tambahkan origin dev tambahan via ALLOWED_DEV_ORIGINS (pisah dengan koma)
// contoh: ALLOWED_DEV_ORIGINS="http://172.16.10.108:3000,http://192.168.1.10:3000"
const extraAllowedOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedDevOrigins = Array.from(new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://172.16.10.108:3000',
  ...extraAllowedOrigins,
]));

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins,
  serverExternalPackages: ['sequelize'],
};

export default nextConfig;