import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { KioskProvider } from "@/context/KioskContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "AI Smart Kiosk",
  description: "Access Control Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${orbitron.variable} font-sans bg-[#030305] text-slate-200 selection:bg-cyan-500/30 `}
      >
        {/* ✅ สำคัญมาก: KioskProvider ต้องอยู่ชั้นนอกสุด ห่อ Navbar และ children ไว้ข้างใน */}
        <KioskProvider>
          <div className="min-h-screen w-full relative flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-500/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/5 rounded-full blur-[120px]" />
              <div className="absolute inset-0 bg-[url('https://grainy-linears.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            {/* ✅ Navbar ต้องอยู่ข้างใน KioskProvider เท่านั้น */}
            <Navbar />

            {/* Main Content */}
            <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
              <div className="max-w-[1600px] mx-auto">{children}</div>
            </main>
          </div>
        </KioskProvider>
      </body>
    </html>
  );
}
