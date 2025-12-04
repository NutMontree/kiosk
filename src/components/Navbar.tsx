/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useKiosk } from "@/context/KioskContext";
import { LogOut, User, ShieldCheck } from "lucide-react";

const Navbar = () => {
  // 1. ดึงตัวแปรจาก Context
  const { isAdmin, currentUser, setIsAdmin, setCurrentUser } = useKiosk();
  const [mounted, setMounted] = useState(false);

  // FIX 1: แยก Effect สำหรับ setMounted เพื่อป้องกัน cascading renders
  useEffect(() => {
    setMounted(true);
  }, []);

  // FIX 1: แยก Effect สำหรับเช็ค Login ออกมา
  useEffect(() => {
    const storedUser = localStorage.getItem("kiosk_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setIsAdmin(true);
        setCurrentUser(user.full_name || "Admin");
      } catch {
        // FIX 2: ลบ (e) ออก เพราะไม่ได้ใช้งาน (Unused variable)
        localStorage.removeItem("kiosk_user");
      }
    }
  }, [setIsAdmin, setCurrentUser]);

  // 3. ฟังก์ชัน Logout
  const handleLogout = () => {
    localStorage.removeItem("kiosk_user");
    setIsAdmin(false);
    setCurrentUser("");
    window.location.href = "/";
  };

  if (!mounted) return null;

  return (
    <nav className="w-full bg-gray-900 border-b border-cyan-500/50 px-4 py-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 shadow-lg shadow-cyan-900/50 backdrop-blur-sm bg-opacity-95">
      {/* --- Logo Section --- */}
      <div className="text-center sm:text-left flex items-center gap-4">
        <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
          <ShieldCheck className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <Link href="/" className="cursor-pointer">
            <h1 className="text-2xl sm:text-3xl font-['Orbitron'] font-bold tracking-wider uppercase text-cyan-400 hover:text-cyan-200 transition-colors">
              AI SMART KIOSK
            </h1>
          </Link>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase">
            Intelligent Access Control System
          </p>
        </div>
      </div>

      {/* --- Navigation & User Profile --- */}
      <div className="mt-4 sm:mt-0 flex flex-wrap justify-center gap-6 font-mono text-sm text-cyan-300 items-center">
        {/* เมนูทั่วไป */}
        <Link
          href="/"
          className="hover:text-white hover:underline decoration-cyan-500 underline-offset-4 transition-all"
        >
          DASHBOARD
        </Link>

        {/* แสดงเมนูเฉพาะ Admin */}
        {isAdmin && (
          <>
            <Link
              href="/teacher"
              className="hover:text-white hover:underline decoration-cyan-500 underline-offset-4 transition-all"
            >
              TEACHERS
            </Link>
            <Link
              href="/students"
              className="hover:text-white hover:underline decoration-cyan-500 underline-offset-4 transition-all"
            >
              STUDENTS
            </Link>
          </>
        )}

        {/* --- ส่วนจัดการ Login / User Profile --- */}
        {!isAdmin ? (
          // 🟢 กรณี: ยังไม่ Login -> แสดงปุ่ม LOGIN
          <Link
            href="/login"
            className="px-6 py-2 border border-cyan-500 rounded bg-cyan-900/20 hover:bg-cyan-500/20 transition-all text-xs sm:text-sm font-bold tracking-wide shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            LOGIN
          </Link>
        ) : (
          // 🟢 กรณี: Login แล้ว -> แสดงรูป + ชื่อ + ปุ่ม Logout
          <div className="flex items-center gap-4 bg-gray-800/90 pl-2 pr-4 py-1.5 rounded-full border border-cyan-500/40 shadow-lg">
            {/* FIX 3: เปลี่ยน bg-gradient-to-tr เป็น bg-linear-to-tr ตามคำแนะนำ Linter */}
            <div className="relative h-9 w-9 rounded-full bg-linear-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-inner border border-white/20">
              <User className="h-5 w-5 text-white" />
              {/* จุดสีเขียวแสดงสถานะ Online */}
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-gray-900" />
            </div>

            {/* ชื่อผู้ใช้งาน */}
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 leading-none uppercase tracking-wider">
                Welcome
              </span>
              <span className="text-sm font-bold text-white leading-tight max-w-[120px] truncate">
                {currentUser}
              </span>
            </div>

            {/* เส้นคั่น */}
            <div className="h-6 w-px bg-gray-600 mx-1"></div>

            {/* ปุ่ม Logout */}
            <button
              onClick={handleLogout}
              className="group flex items-center justify-center h-8 w-8 rounded-full hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
