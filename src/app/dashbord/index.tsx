/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import {
  Lock,
  Unlock,
  Users,
  GraduationCap,
  Search,
  X,
  Edit2,
  Save,
  Loader2,
} from "lucide-react";

// --- Configuration ---
const API_BASE_URL = "/api";

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

interface Student {
  student_id: string;
  full_name: string;
  class_code: string;
  email?: string;
  phone?: string;
}

interface DashboardProps {
  rooms: Room[];
  teachers: Teacher[];
}

// --- Helper Components ---
const GlassCard = ({ children, className = "", onClick }: any) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-500 group ${
      onClick ? "cursor-pointer active:scale-[0.98]" : ""
    } ${className}`}
  >
    <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent opacity-50" />
    <div className="relative z-10">{children}</div>
  </div>
);

const StatusBadge = ({ status }: { status: "LOCK" | "UNLOCK" }) => {
  const isUnlock = status === "UNLOCK";
  return (
    <div
      className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase border transition-all duration-500 ${
        isUnlock
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
          : "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_20px_-5px_rgba(244,63,94,0.4)]"
      }`}
    >
      <span
        className={`animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 ${
          isUnlock ? "bg-emerald-400" : "bg-rose-400"
        }`}
      ></span>
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${
          isUnlock ? "bg-emerald-500" : "bg-rose-500"
        }`}
      ></span>
      {status}
    </div>
  );
};

// --- Input Component for Forms ---
const GlassInput = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: any) => (
  <div className="mb-4">
    <label className="text-xs text-cyan-400/80 mb-1 block font-mono uppercase tracking-wider">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    />
  </div>
);

// --- Main Component ---
const KioskDashboard = ({ rooms, teachers }: DashboardProps) => {
  // --- States for Student Service ---
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [studentResult, setStudentResult] = useState<Student | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Handlers ---
  const handleSearchStudent = async () => {
    if (!searchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/${searchId}`);
      if (res.ok) {
        const json = await res.json();
        setStudentResult(json.data);
        setEditFormData(json.data);
        setEditMode(false);
      } else {
        alert("ไม่พบข้อมูลนักเรียน / Student Not Found");
        setStudentResult(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editFormData) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        // alert("Updated Successfully!"); // Optional: visual feedback instead
        setStudentResult(editFormData);
        setEditMode(false);
      } else {
        alert("Update Failed");
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-8">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Room Status */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-white flex items-center gap-3 font-['Orbitron']">
              <span className="h-8 w-1 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              Secure Zones
            </h2>
            <span className="text-xs font-mono text-cyan-500/60 bg-cyan-500/5 px-3 py-1 rounded border border-cyan-500/20">
              LIVE • {rooms.length} UNITS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <GlassCard
                key={room.room_id}
                className="p-6 h-full flex flex-col justify-between group hover:border-cyan-500/30"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`p-3 rounded-2xl ${
                      room.lock_status === "UNLOCK"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {room.lock_status === "UNLOCK" ? (
                      <Unlock className="h-6 w-6" />
                    ) : (
                      <Lock className="h-6 w-6" />
                    )}
                  </div>
                  <StatusBadge status={room.lock_status} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors font-['Orbitron'] tracking-wide">
                    {room.room_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-2">
                    ID: {room.room_id}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Right Column: Active Staff */}
        <div className="lg:col-span-4">
          <GlassCard className="h-full flex flex-col p-0">
            <div className="p-6 border-b border-white/5 bg-slate-900/30">
              <h2 className="text-lg font-medium text-white flex items-center gap-3 font-['Orbitron']">
                <Users className="text-purple-400 h-5 w-5" /> Active Staff
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px] custom-scrollbar">
              {teachers.map((t) => (
                <div
                  key={t.staff_id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-linear-to-r from-cyan-900 to-blue-900 flex items-center justify-center font-bold text-white shadow-lg">
                    {t.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-slate-200 font-medium">
                      {t.full_name}
                    </p>
                    <p className="text-[10px] text-cyan-400/70 font-mono mt-0.5">
                      {t.department}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* --- Floating Action Button (Student Service) --- */}
      <button
        onClick={() => setShowStudentModal(true)}
        className="fixed bottom-8 right-8 group flex items-center justify-center h-16 w-16 bg-cyan-600 hover:bg-cyan-500 rounded-full shadow-[0_0_30px_rgba(8,145,178,0.4)] border border-cyan-400/50 z-40 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <GraduationCap className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
      </button>

      {/* --- Student Service Modal --- */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <GlassCard className="w-full max-w-xl p-0 shadow-2xl border-cyan-500/30 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-linear-to-r from-slate-900/80 to-slate-800/80">
              <h2 className="text-2xl font-['Orbitron'] text-white flex items-center gap-3">
                <GraduationCap className="text-cyan-400" />
                Student Service
              </h2>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setStudentResult(null);
                  setSearchId("");
                  setEditMode(false);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-slate-900/80">
              {/* Search Bar */}
              <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Enter Student ID (e.g., S200001)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchStudent()
                    }
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
                <button
                  onClick={handleSearchStudent}
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl font-medium transition-colors shadow-lg shadow-cyan-900/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {/* Result Area */}
              {studentResult && editFormData && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-linear-to-r from-yellow-600 to-orange-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                          {studentResult.student_id.substring(0, 1)}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                            Student ID
                          </p>
                          <p className="text-2xl font-bold text-white font-['Orbitron']">
                            {studentResult.student_id}
                          </p>
                        </div>
                      </div>

                      {/* Edit/Save Toggle */}
                      {!editMode ? (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/30 transition-all hover:scale-105"
                        >
                          <Edit2 className="h-4 w-4" /> Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditMode(false);
                              setEditFormData(studentResult); // Reset
                            }}
                            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateStudent}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                          >
                            {loading ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              <>
                                <Save className="h-4 w-4" /> Save
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 gap-1">
                      <GlassInput
                        label="Full Name"
                        value={
                          editMode
                            ? editFormData.full_name
                            : studentResult.full_name
                        }
                        onChange={(e: any) =>
                          setEditFormData({
                            ...editFormData,
                            full_name: e.target.value,
                          })
                        }
                        disabled={!editMode}
                      />
                      <GlassInput
                        label="Class / Dept"
                        value={
                          editMode
                            ? editFormData.class_code
                            : studentResult.class_code
                        }
                        onChange={(e: any) =>
                          setEditFormData({
                            ...editFormData,
                            class_code: e.target.value,
                          })
                        }
                        disabled={!editMode}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <GlassInput
                          label="Email"
                          value={
                            editMode
                              ? editFormData.email || ""
                              : studentResult.email || "-"
                          }
                          onChange={(e: any) =>
                            setEditFormData({
                              ...editFormData,
                              email: e.target.value,
                            })
                          }
                          placeholder="No Email"
                          disabled={!editMode}
                        />
                        <GlassInput
                          label="Phone"
                          value={
                            editMode
                              ? editFormData.phone || ""
                              : studentResult.phone || "-"
                          }
                          onChange={(e: any) =>
                            setEditFormData({
                              ...editFormData,
                              phone: e.target.value,
                            })
                          }
                          placeholder="No Phone"
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State / Prompt */}
              {!studentResult && !loading && (
                <div className="text-center py-8 text-slate-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">
                    Search via ID to view or edit details.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default KioskDashboard;
