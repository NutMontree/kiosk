/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link"; // เผื่อไว้ใช้

interface Student {
  _id?: string;
  student_id: string;
  full_name: string;
  class_code: string;
  year_level?: string;
}

const StudentPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // State สำหรับการเลือกหลายรายการ
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Student>({
    student_id: "",
    full_name: "",
    class_code: "",
    year_level: "",
  });

  // Fetch Data
  const fetchStudents = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/students");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setStudents(data);
      setLoading(false);
      setSelectedIds([]); // รีเซ็ตการเลือกเมื่อโหลดข้อมูลใหม่
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // --- Filter Logic ---
  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Selection Handlers ---

  // เลือก/ยกเลิกเลือก รายบุคคล
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // เลือกทั้งหมด / ยกเลิกทั้งหมด (เฉพาะที่ Filter อยู่)
  const handleSelectAll = () => {
    if (
      selectedIds.length === filteredStudents.length &&
      filteredStudents.length > 0
    ) {
      setSelectedIds([]); // ยกเลิกทั้งหมด
    } else {
      const allIds = filteredStudents.map((s) => s.student_id);
      setSelectedIds(allIds); // เลือกทั้งหมด
    }
  };

  // --- Action Handlers ---

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      student_id: "",
      full_name: "",
      class_code: "",
      year_level: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setIsEditing(true);
    setFormData(student);
    setIsModalOpen(true);
  };

  // ลบรายคน (Single Delete)
  const handleDeleteOne = async (student_id: string) => {
    if (!confirm(`Are you sure you want to delete ID: ${student_id}?`)) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/student/delete?student_id=${student_id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        fetchStudents();
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      alert("Error connecting to server");
    }
  };

  // ลบหลายรายการ (Bulk Delete)
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    if (
      !confirm(
        `⚠️ WARNING: You are about to delete ${selectedIds.length} students. This cannot be undone.\nConfirm deletion?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/student/delete-multiple",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_ids: selectedIds }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        alert(result.message);
        fetchStudents();
      } else {
        alert("Failed to delete: " + result.message);
      }
    } catch (error) {
      alert("Cannot connect to server");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = isEditing ? "/api/student/update" : "/api/student/add";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchStudents();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message}`);
      }
    } catch (error) {
      alert("Cannot connect to server");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-cyan-300 font-mono p-4 sm:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 border-b border-cyan-600/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-['Orbitron'] font-bold tracking-wider text-white">
            STUDENT <span className="text-cyan-400">ROSTER</span>
          </h1>
          <p className="text-xs text-gray-400 tracking-widest mt-1">
            TOTAL RECORDS: {students.length}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search Student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-gray-800/50 border border-cyan-500/50 rounded py-2 px-4 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />

          {/* BULK ACTIONS */}
          <div className="flex gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all animate-pulse whitespace-nowrap"
              >
                DELETE ({selectedIds.length})
              </button>
            )}

            <button
              onClick={handleSelectAll}
              className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-cyan-300 border border-cyan-500/30 py-2 px-4 rounded transition-all whitespace-nowrap"
            >
              {selectedIds.length === filteredStudents.length &&
              filteredStudents.length > 0
                ? "DESELECT ALL"
                : "SELECT ALL"}
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all whitespace-nowrap"
            >
              + ADD
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="text-center mt-20 text-cyan-500 animate-pulse">
          Accessing Database...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const isSelected = selectedIds.includes(student.student_id);

            return (
              <div
                key={student._id || student.student_id}
                onClick={() => toggleSelect(student.student_id)} // คลิกที่การ์ดเพื่อเลือกได้เลย
                className={`rounded-lg p-5 border transition-all group relative cursor-pointer select-none
                        ${
                          isSelected
                            ? "bg-cyan-900/30 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                            : "bg-gray-800 border-cyan-600/20 hover:border-cyan-400 hover:bg-gray-800/80"
                        }
                    `}
              >
                {/* Checkbox Indicator */}
                <div
                  className={`absolute top-3 left-3 w-5 h-5 rounded border flex items-center justify-center transition-colors
                        ${
                          isSelected
                            ? "bg-cyan-500 border-cyan-500"
                            : "border-gray-500 bg-gray-900"
                        }
                  `}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-black font-bold"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={4}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                {/* Action Buttons (Edit/Delete Single) - หยุด Propagation เพื่อไม่ให้ไปกวนการเลือกการ์ด */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(student);
                    }}
                    className="text-gray-400 hover:text-yellow-400 p-1 hover:bg-gray-700 rounded"
                    title="Edit"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  {/* ปุ่มลบเดี่ยวๆ (เผื่ออยากลบแค่คนเดียวเร็วๆ) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOne(student.student_id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-700 rounded"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-2 mt-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-cyan-300 font-bold border 
                        ${
                          isSelected
                            ? "bg-cyan-800 border-cyan-400"
                            : "bg-cyan-900 border-cyan-500/50"
                        }`}
                  >
                    {student.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-cyan-400 font-bold text-sm">
                      {student.student_id}
                    </div>
                    <div className="text-xs text-gray-400">
                      Class: {student.class_code}
                    </div>
                  </div>
                </div>

                <div className="text-white font-semibold truncate pl-1">
                  {student.full_name}
                </div>
                {student.year_level && (
                  <div className="text-xs text-gray-500 pl-1 mt-1">
                    Year: {student.year_level}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - ใช้เหมือนเดิมแต่ปรับ UI ให้รับ input ได้ถูกต้อง */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-cyan-500 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-['Orbitron'] text-white mb-4">
              {isEditing ? "EDIT STUDENT" : "ADD NEW STUDENT"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.student_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, student_id: e.target.value })
                  }
                  className={`w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none ${
                    isEditing ? "opacity-50" : ""
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">
                    Class Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.class_code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, class_code: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">
                    Year Level
                  </label>
                  <input
                    type="text"
                    value={formData.year_level || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, year_level: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. 1, 2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded shadow-lg shadow-cyan-900/50"
                >
                  CONFIRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
