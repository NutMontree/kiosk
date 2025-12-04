/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useKiosk } from "@/context/KioskContext"; // FIX 1: Import Context

const LoginPage = () => {
  const router = useRouter();

  // FIX 2: ดึงฟังก์ชัน Setters มาจาก Context
  const { setIsAdmin, setCurrentUser } = useKiosk();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // --- FIX 3: เริ่มต้นส่วนที่แก้ไข ---

        // A. บันทึกลง LocalStorage (ใช้ setItem ไม่ใช่ getItem)
        localStorage.setItem("kiosk_user", JSON.stringify(data.user));

        // B. อัปเดต Context ทันที! (Navbar จะเปลี่ยนทันทีโดยไม่ต้อง Refresh)
        setIsAdmin(true);
        setCurrentUser(data.user.full_name);

        // --- สิ้นสุดส่วนที่แก้ไข ---

        alert(`Welcome back, ${data.user.full_name}`);
        router.push("/"); // ไปหน้า Dashboard
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4 font-mono text-cyan-300">
      <div className="w-full max-w-md rounded-xl border border-cyan-500/50 bg-gray-800 p-8 shadow-2xl shadow-cyan-900/50">
        <h2 className="mb-2 text-center font-['Orbitron'] text-3xl font-bold tracking-wider text-white">
          SYSTEM <span className="text-cyan-400">LOGIN</span>
        </h2>
        <p className="mb-6 text-center text-xs text-gray-400 tracking-widest">
          AUTHENTICATION REQUIRED
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-500 bg-red-900/30 p-2 text-center text-sm text-red-300 animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-400">
              EMAIL
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded bg-gray-900 p-3 text-white outline-none ring-1 ring-cyan-700 focus:ring-2 focus:ring-cyan-400 transition-all"
              placeholder="admin@kiosk.com"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-400">
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded bg-gray-900 p-3 text-white outline-none ring-1 ring-cyan-700 focus:ring-2 focus:ring-cyan-400 transition-all"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            // แก้ไข class bg-linear เป็น bg-gradient เพื่อให้แสดงผลถูกต้องใน Tailwind ส่วนใหญ่ (ถ้าของคุณใช้ linear ก็เปลี่ยนกลับได้)
            className="w-full mt-6 rounded bg-linear-to-r from-cyan-700 to-blue-700 py-3 font-bold text-white hover:from-cyan-600 hover:to-blue-600 hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "ACCESS SYSTEM"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          New personnel?{" "}
          <Link href="/register" className="text-cyan-400 hover:underline">
            Register ID
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
