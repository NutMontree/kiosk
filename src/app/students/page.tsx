/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Camera,
  X,
  Video,
  User,
  Upload,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  Save,
} from "lucide-react";

// --- Configuration ---
const API_BASE_URL = "http://localhost:5000/api";

// --- Types ---
interface Student {
  student_id: string;
  full_name: string;
  year_level: string;
  class_code: string;
  image_base64?: string;
}

type GroupedStudents = Record<string, Record<string, Student[]>>;

// Helper Component
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
    <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent opacity-50" />
    <div className="relative">{children}</div>
  </div>
);

export default function StudentView() {
  const [studentMode, setStudentMode] = useState<"LIST" | "REGISTER">("LIST");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับการเลือกและแก้ไข
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);

  const [newStudent, setNewStudent] = useState<Student>({
    student_id: "",
    full_name: "",
    year_level: "",
    class_code: "",
    image_base64: "",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // --- Fetch Students ---
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students`);
      if (res.ok) {
        setStudents(await res.json());
      } else {
        console.error("Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // --- Handlers: Add / Update ---
  const handleSaveStudent = async () => {
    if (!newStudent.student_id || !newStudent.full_name) {
      alert("กรุณากรอกรหัสนักเรียนและชื่อ");
      return;
    }

    // เลือก Endpoint และ Method ตามโหมด (เพิ่มใหม่ vs แก้ไข)
    const endpoint = isEditMode
      ? `${API_BASE_URL}/student/update`
      : `${API_BASE_URL}/student/add`;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });

      if (res.ok) {
        alert(isEditMode ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มนักเรียนสำเร็จ");
        resetForm();
        fetchStudents();
        setStudentMode("LIST");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Server Error: Is Flask running?");
    }
  };

  // --- Handlers: Delete Single ---
  const handleDeleteSingle = async (id: string) => {
    if (!confirm(`ต้องการลบข้อมูลรหัส ${id} ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/student/delete?student_id=${id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        alert("ลบข้อมูลสำเร็จ");
        fetchStudents();
      } else {
        alert("ลบข้อมูลไม่สำเร็จ");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Handlers: Delete Multiple ---
  const handleDeleteMultiple = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`ยืนยันการลบข้อมูลจำนวน ${ids.length} รายการ?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/student/delete-multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_ids: ids }),
      });

      if (res.ok) {
        alert("ลบข้อมูลที่เลือกสำเร็จ");
        setSelectedIds(new Set());
        fetchStudents();
      } else {
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    } catch (error) {
      console.error(error);
      alert("Server connection failed");
    }
  };

  // --- Handlers: Selection & Edit UI ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set()); // Deselect all
    } else {
      setSelectedIds(new Set(students.map((s) => s.student_id))); // Select all
    }
  };

  const handleEditClick = (student: Student) => {
    setNewStudent(student);
    setIsEditMode(true);
    setStudentMode("REGISTER");
  };

  const resetForm = () => {
    setNewStudent({
      student_id: "",
      full_name: "",
      year_level: "",
      class_code: "",
      image_base64: "",
    });
    setIsEditMode(false);
    setIsCameraOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // --- Camera & File Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudent({ ...newStudent, image_base64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    if (newStudent.image_base64)
      setNewStudent({ ...newStudent, image_base64: "" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเปิดกล้องได้");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const imageSrc = canvas.toDataURL("image/jpeg");
      setNewStudent({ ...newStudent, image_base64: imageSrc });
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  // --- Grouping Logic ---
  const groupedStudents = students.reduce<GroupedStudents>((acc, student) => {
    const year = student.year_level || "Unknown";
    const classroom = student.class_code || "Unknown";
    if (!acc[year]) acc[year] = {};
    if (!acc[year][classroom]) acc[year][classroom] = [];
    acc[year][classroom].push(student);
    return acc;
  }, {});

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-cyan-500 font-['Orbitron']">
        Loading Students...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white font-mono">
      {/* --- Top Navigation Bar --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="bg-slate-900/50 p-1 rounded-full border border-white/10 flex">
          <button
            onClick={() => {
              setStudentMode("LIST");
              resetForm();
            }}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              studentMode === "LIST"
                ? "bg-cyan-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            VIEW ALL LIST
          </button>
          <button
            onClick={() => {
              setStudentMode("REGISTER");
              resetForm();
            }}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              studentMode === "REGISTER"
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            NEW REGISTER
          </button>
        </div>

        {/* --- Action Bar (Visible in LIST mode) --- */}
        {studentMode === "LIST" && (
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs hover:bg-slate-700 flex items-center gap-2"
            >
              {selectedIds.size === students.length && students.length > 0 ? (
                <CheckSquare size={16} className="text-cyan-400" />
              ) : (
                <Square size={16} />
              )}
              SELECT ALL
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteMultiple}
                className="px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 rounded-lg text-xs hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 animate-pulse"
              >
                <Trash2 size={16} /> DELETE ({selectedIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {studentMode === "LIST" ? (
        <div className="grid gap-6">
          {Object.keys(groupedStudents)
            .sort()
            .map((year) => (
              <div key={year} className="space-y-4">
                <h3 className="text-xl font-['Orbitron'] text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full" /> Year:{" "}
                  {year}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(groupedStudents[year])
                    .sort()
                    .map((cls) => (
                      <GlassCard
                        key={cls}
                        className="p-5 border-l-4 border-l-purple-500"
                      >
                        <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                          <span className="font-bold text-white">
                            Class: {cls}
                          </span>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {groupedStudents[year][cls].length} Students
                          </span>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {groupedStudents[year][cls].map((s) => {
                            const isSelected = selectedIds.has(s.student_id);
                            return (
                              <div
                                key={s.student_id}
                                className={`flex items-center gap-3 text-sm p-2 rounded transition-all border ${
                                  isSelected
                                    ? "bg-cyan-900/30 border-cyan-500/50"
                                    : "border-transparent hover:bg-white/5"
                                }`}
                              >
                                {/* Checkbox */}
                                <div
                                  onClick={() => toggleSelection(s.student_id)}
                                  className="cursor-pointer text-slate-400 hover:text-white"
                                >
                                  {isSelected ? (
                                    <CheckSquare
                                      size={18}
                                      className="text-cyan-400"
                                    />
                                  ) : (
                                    <Square size={18} />
                                  )}
                                </div>
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden relative shrink-0">
                                  {s.image_base64 ? (
                                    <Image
                                      src={s.image_base64}
                                      alt={s.full_name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <User className="w-4 h-4" />
                                  )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-white truncate">
                                    {s.full_name}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500">
                                    {s.student_id}
                                  </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditClick(s)}
                                    className="p-1.5 hover:bg-yellow-500/20 rounded text-slate-400 hover:text-yellow-400 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteSingle(s.student_id)
                                    }
                                    className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </GlassCard>
                    ))}
                </div>
              </div>
            ))}
          {students.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              No students found.
            </div>
          )}
        </div>
      ) : (
        // --- REGISTER / EDIT FORM ---
        <GlassCard className="p-8 max-w-3xl mx-auto border-t-4 border-t-purple-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white font-['Orbitron'] flex items-center gap-3">
              {isEditMode ? (
                <Edit className="text-yellow-400" />
              ) : (
                <Plus className="text-purple-400" />
              )}
              {isEditMode
                ? "Edit Student Information"
                : "New Student Registration"}
            </h2>
            {isEditMode && (
              <button
                onClick={resetForm}
                className="text-xs text-red-400 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {/* 1. Education Level */}
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase">
                  1. Education Level
                </label>
                <select
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 focus:border-cyan-500 outline-none appearance-none cursor-pointer"
                  value={newStudent.year_level}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, year_level: e.target.value })
                  }
                >
                  <option value="" className="text-slate-500">
                    -- เลือกระดับชั้น --
                  </option>
                  <optgroup label="ระดับ ปวช.">
                    <option value="ปวช.1">ปวช. 1</option>
                    <option value="ปวช.2">ปวช. 2</option>
                    <option value="ปวช.3">ปวช. 3</option>
                  </optgroup>
                  <optgroup label="ระดับ ปวส.">
                    <option value="ปวส.1">ปวส. 1</option>
                    <option value="ปวส.2">ปวส. 2</option>
                  </optgroup>
                </select>
              </div>
              {/* 2. Full Name */}
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase">
                  2. Full Name
                </label>
                <input
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 focus:border-cyan-500 outline-none"
                  placeholder="ชื่อ-นามสกุล"
                  value={newStudent.full_name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, full_name: e.target.value })
                  }
                />
              </div>
              {/* 3. Student ID */}
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase">
                  3. Student ID
                </label>
                <input
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 focus:border-cyan-500 outline-none"
                  placeholder="รหัสนักศึกษา"
                  value={newStudent.student_id}
                  disabled={isEditMode}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, student_id: e.target.value })
                  }
                />
              </div>
              {/* 4. Class Room */}
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase">
                  4. Class Room
                </label>
                <input
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 focus:border-cyan-500 outline-none"
                  placeholder="ห้องเรียน (เช่น 1/1)"
                  value={newStudent.class_code}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, class_code: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Camera / Image Upload */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-4 bg-black/20">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              {isCameraOpen ? (
                <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg"
                  >
                    CAPTURE
                  </button>
                </div>
              ) : newStudent.image_base64 ? (
                <div className="relative w-40 h-40 mb-4">
                  <img
                    src={newStudent.image_base64}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl border border-white/20"
                  />
                  <button
                    onClick={() =>
                      setNewStudent({ ...newStudent, image_base64: "" })
                    }
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 z-10"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  className="text-center text-slate-500 mb-4 cursor-pointer hover:text-cyan-400 transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="relative inline-block">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <Upload className="w-5 h-5 absolute -right-1 -bottom-1 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-bold group-hover:underline decoration-cyan-400 underline-offset-4">
                    No Image Captured
                  </p>
                  <p className="text-[10px] opacity-70 mt-1">
                    (Click to Upload)
                  </p>
                </div>
              )}
              {!isCameraOpen && !newStudent.image_base64 && (
                <button
                  onClick={startCamera}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-2 mt-2"
                >
                  <Video className="w-3 h-3" /> OPEN CAMERA
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveStudent}
            className={`w-full py-4 mt-6 text-white font-bold rounded-xl shadow-lg transition-all font-['Orbitron'] tracking-widest text-sm ${
              isEditMode
                ? "bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500"
                : "bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
            }`}
          >
            {isEditMode ? (
              <span className="flex items-center justify-center gap-2">
                <Save size={18} /> SAVE CHANGES
              </span>
            ) : (
              "REGISTER STUDENT"
            )}
          </button>
        </GlassCard>
      )}
    </div>
  );
}
