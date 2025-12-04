// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Font หลักให้อ่านง่าย
        orbitron: ["Orbitron", "sans-serif"], // Font หัวข้อให้ดู Tech
      },
    },
  },
  plugins: [],
};
export default config;
