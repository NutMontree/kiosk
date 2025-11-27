"use client";
import React, { useState, useEffect, useCallback } from "react";
// ERROR FIX: Removed import Head from 'next/head' as it caused compilation failure in some environments.

// URL ของ API Flask ที่รันอยู่
const API_BASE_URL = "http://localhost:5000/api";

// --- 1. กำหนด TypeScript Interfaces สำหรับ Data Structure ---
interface Teacher {
  _id: string;
  staff_id: string;
  full_name: string;
  department: string;
  email: string;
  // schedule array ถูกรวมอยู่ใน Staff document แต่ไม่จำเป็นต้องดึงมาแสดงใน Dashboard
}

interface Room {
  _id: string;
  room_id: string;
  room_name: string;
  lock_status: "LOCK" | "UNLOCK";
}

interface KioskData {
  teachers: Teacher[];
  rooms: Room[];
  timestamp?: string;
}

// กำหนด Type สำหรับ State Error
type ErrorState = string | null;

const KioskDashboard = () => {
  // 2. กำหนด Type ให้กับ useState อย่างชัดเจน
  const [data, setData] = useState<KioskData>({ teachers: [], rooms: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState>(null); // แก้ไข: ให้รับค่า string หรือ null

  // สถานะจำลองสำหรับ AI/Voice Interaction
  const [aiStatus, setAiStatus] = useState<string>("IDLE");
  // กำหนด Type ให้ currentTeacher เป็น Teacher หรือ null
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  // ฟังก์ชันสำหรับดึงข้อมูลสถานะทั้งหมดจาก Flask API
  const fetchKioskData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: KioskData = await response.json();
      setData(result);
      setLoading(false);

      // *** จำลองการอัปเดตสถานะ AI (ในโค้ดจริงจะมาจาก WebSocket) ***
      const r1Status = result.rooms.find((r: Room) => r.room_id === "R1"); // แก้ไข: กำหนด Type r
      if (r1Status && r1Status.lock_status === "UNLOCK") {
        setAiStatus("ACCESS GRANTED");
      } else {
        setAiStatus("IDLE");
      }
      // *** สิ้นสุดการจำลอง ***
    } catch (e) {
      console.error("Error fetching Kiosk data:", e);
      // แก้ไข: ให้ setError รับค่า string
      setError("Failed to fetch data from Flask API. Is app.py running?");
      setLoading(false);
    }
  }, []);

  // Hook สำหรับการดึงข้อมูลทุกๆ 3 วินาที
  useEffect(() => {
    fetchKioskData();

    const interval = setInterval(() => {
      fetchKioskData();
    }, 3000); // ดึงข้อมูลทุก 3 วินาที

    return () => clearInterval(interval);
  }, [fetchKioskData]);

  // Hook สำหรับการจำลองสถานะครูที่สแกนสำเร็จ
  useEffect(() => {
    // Logic: ถ้าไม่มีการโต้ตอบ และมีข้อมูลครูในระบบ ให้ตั้ง T001 เป็น Interacting User
    if (aiStatus === "IDLE" && data.teachers.length > 0) {
      // ค้นหา T001 จากข้อมูลที่ดึงมา
      const t001 = data.teachers.find((t) => t.staff_id === "T001");
      if (t001) {
        setCurrentTeacher(t001);
      }
    } else if (aiStatus === "ACCESS GRANTED" && data.teachers.length > 0) {
      const t001 = data.teachers.find((t) => t.staff_id === "T001");
      setCurrentTeacher(t001 || null);
    }
  }, [aiStatus, data.teachers]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-cyan-300">
        Loading AI Kiosk Data...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-cyan-300 font-mono p-4 sm:p-8 overflow-hidden">
      {/* ERROR FIX: Removed Head component */}

      <header className="text-center mb-8 border-b border-cyan-500/50 pb-4">
        <h1 className="text-4xl sm:text-5xl font-['Orbitron'] font-bold tracking-wider uppercase">
          AI SMART INFO KIOSK
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Panel 1: AI Interaction Status */}
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg border border-cyan-600/50 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400 border-b border-cyan-700 pb-2">
              SYSTEM STATUS
            </h2>
            {/* WARNING FIX: ลบ className ที่ซ้ำซ้อน */}
            <div
              className={`text-4xl font-bold font-['Orbitron'] p-4 rounded-lg text-center ${
                aiStatus === "IDLE"
                  ? "bg-green-700/30 text-green-400"
                  : aiStatus === "ACCESS GRANTED"
                  ? "bg-cyan-700/50 text-cyan-300 animate-pulse"
                  : aiStatus === "LISTENING"
                  ? "bg-yellow-700/50 text-yellow-300"
                  : "bg-red-700/50 text-red-400"
              }`}
            >
              {aiStatus}
            </div>

            {/* สถานะตารางสอนปัจจุบันของอาจารย์ที่สแกน */}
            {currentTeacher && (
              <div className="mt-6 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <p className="text-sm text-white">INTERACTING USER:</p>
                {/* แก้ไข: ใช้ Property ที่ถูกกำหนดใน Teacher Interface */}
                <p className="text-xl font-bold text-cyan-300">
                  {currentTeacher.full_name}
                </p>
                <p className="text-xs text-gray-400">
                  Dept: {currentTeacher.department}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600 mt-4">
            Last API Fetch: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Panel 2: ROOM ACCESS STATUS (IoT Status) */}
        <div className="lg:col-span-3 bg-gray-800 p-6 rounded-xl shadow-lg border border-cyan-600/50">
          <h2 className="text-2xl font-semibold mb-4 text-cyan-400 border-b border-cyan-700 pb-2">
            ROOM ACCESS & SCHEDULE OVERVIEW
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* แก้ไข: Map over data.rooms และใช้ Room interface */}
            {data.rooms.map((room: Room) => (
              <div
                key={room.room_id}
                className={`p-4 rounded-lg transition duration-300 transform ${
                  room.lock_status === "UNLOCK"
                    ? "bg-green-900/40 border-2 border-green-500 shadow-green-700/50"
                    : "bg-red-900/40 border border-red-700"
                }`}
              >
                {/* แก้ไข: ใช้ Property ที่ถูกกำหนดใน Room Interface */}
                <div className="text-lg font-bold text-white">
                  {room.room_name} ({room.room_id})
                </div>
                <div
                  className={`text-sm font-['Orbitron'] ${
                    room.lock_status === "UNLOCK"
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  LOCK STATUS: {room.lock_status}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {/* Logic จำลอง */}
                  {room.room_id === "R1" && room.lock_status === "UNLOCK"
                    ? "Current User: T001"
                    : "Vacant or Scheduled"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Staff Roster */}
        <div className="lg:col-span-4 bg-gray-800 p-6 rounded-xl shadow-lg border border-cyan-600/50 mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-cyan-400 border-b border-cyan-700 pb-2">
            STAFF ROSTER ({data.teachers.length} Entries)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left">
              <thead>
                <tr className="bg-gray-700 text-gray-300">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Full Name</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Email (Debug)</th>
                </tr>
              </thead>
              <tbody>
                {/* แก้ไข: Map over data.teachers และใช้ Teacher interface */}
                {data.teachers.map((teacher: Teacher, index) => (
                  <tr
                    key={teacher.staff_id}
                    className={`border-b border-gray-700 ${
                      index % 2 === 0 ? "bg-gray-800/50" : "bg-gray-800"
                    }`}
                  >
                    {/* แก้ไข: ใช้ Property ที่ถูกกำหนดใน Teacher Interface */}
                    <td className="px-4 py-2 text-yellow-400">
                      {teacher.staff_id}
                    </td>
                    <td className="px-4 py-2">{teacher.full_name}</td>
                    <td className="px-4 py-2 text-gray-400">
                      {teacher.department}
                    </td>
                    <td className="px-4 py-2 text-xs text-cyan-500">
                      {teacher.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KioskDashboard;
