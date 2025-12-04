/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KioskProvider, useKiosk } from "@/context/KioskContext";

// Components
import KioskDashboard from "./dashbord";
import TeacherView from "@/components/TeacherView";
// import StudentView from "@/components/StudentView"; // Import Component ใหม่

// --- Types ---
interface Teacher {
  staff_id: string;
  full_name: string;
  department: string;
}
interface Room {
  room_id: string;
  room_name: string;
  lock_status: "LOCK" | "UNLOCK";
}
interface KioskData {
  teachers: Teacher[];
  rooms: Room[];
}

// --- Helper: GlassCard ---
// Fix: Define explicit interface instead of 'any'
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassCard = ({ children, className = "", onClick }: GlassCardProps) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-500 group ${
      onClick ? "cursor-pointer active:scale-[0.98]" : ""
    } ${className}`}
  >
    {/* Fix: bg-linear-to-r -> bg-linear-to-r */}
    <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent opacity-50" />
    <div className="relative">{children}</div>
  </div>
);

// --- Main Page ---
export default function Home() {
  const { activeTab, isAdmin } = useKiosk();

  const [data, setData] = useState<KioskData>({ teachers: [], rooms: [] });
  const [loading, setLoading] = useState<boolean>(true);

  // --- Fetch Logic ---
  const fetchKioskData = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/status`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error("Error fetching kiosk data:", e); // Log error to fix unused var
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKioskData();
    const interval = setInterval(fetchKioskData, 3000);
    return () => clearInterval(interval);
  }, [fetchKioskData]);

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center text-cyan-500 font-['Orbitron']">
        LOADING SYSTEM...
      </div>
    );

  return (
    <KioskProvider>
      <AnimatePresence mode="wait">
        {/* === DASHBOARD VIEW === */}
        {activeTab === "DASHBOARD" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <KioskDashboard teachers={data.teachers} rooms={data.rooms} />
          </motion.div>
        )}

        {/* === TEACHER VIEW === */}
        {activeTab === "TEACHER" && isAdmin && (
          <motion.div
            key="teacher"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TeacherView />
          </motion.div>
        )}

        {/* === STUDENT VIEW (Now using the separated component) === */}
        {activeTab === "STUDENT" && isAdmin && (
          <motion.div
            key="student"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* <StudentView /> */}
          </motion.div>
        )}
      </AnimatePresence>
    </KioskProvider>
  );
}
