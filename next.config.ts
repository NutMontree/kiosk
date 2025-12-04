import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // เก็บค่าเดิมของพี่ไว้ (experimental.reactCompiler ในบางเวอร์ชัน)
  // reactCompiler: true,

  // ✅ เพิ่มส่วนนี้ครับ: ตั้งค่า Proxy สำหรับ Local Development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5000/api/:path*", // ส่งต่อ request ไปหา Flask ที่ Port 5000
      },
    ];
  },
};

export default nextConfig;
