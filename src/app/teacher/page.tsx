/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, FormEvent } from "react";
// import Link from "next/link"; // ไม่ได้ใช้ในหน้านี้แล้วถ้ามี Navbar

interface Teacher {
  _id?: string;
  staff_id: string;
  full_name: string;
  department: string;
  email: string;
}

const TeacherPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // State สำหรับ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Teacher>({
    staff_id: "",
    full_name: "",
    department: "",
    email: "",
  });

  // Fetch Data Function
  const fetchTeachers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/teacher/status");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setTeachers(result.teachers);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to Server.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // --- Handlers ---

  // เปิด Modal เพื่อเพิ่มข้อมูล
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ staff_id: "", full_name: "", department: "", email: "" });
    setIsModalOpen(true);
  };

  // เปิด Modal เพื่อแก้ไขข้อมูล
  const handleOpenEdit = (teacher: Teacher) => {
    setIsEditing(true);
    setFormData(teacher); // โหลดข้อมูลเดิมใส่ฟอร์ม
    setIsModalOpen(true);
  };

  // บันทึกข้อมูล (Submit)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = isEditing ? "/api/staff/update" : "/api/staff/add";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(isEditing ? "Updated Successfully!" : "Added Successfully!");
        setIsModalOpen(false);
        fetchTeachers(); // รีโหลดข้อมูลใหม่
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message}`);
      }
    } catch (error) {
      alert("Cannot connect to server");
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.staff_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-cyan-300 font-mono p-4 sm:p-8 relative">
      {/* --- Header & Actions --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-cyan-600/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-['Orbitron'] font-bold tracking-wider text-white">
            ACADEMIC <span className="text-cyan-400">STAFF</span>
          </h1>
          <p className="text-xs text-gray-400 tracking-widest mt-1">
            MANAGEMENT SYSTEM
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-4">
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="grow bg-gray-800/50 border border-cyan-500/50 rounded py-2 px-4 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />

          {/* ADD BUTTON */}
          <button
            onClick={handleOpenAdd}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all whitespace-nowrap"
          >
            + ADD STAFF
          </button>
        </div>
      </div>

      {/* --- Card Grid --- */}
      {loading ? (
        <div className="text-center mt-20">Loading Database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher._id || teacher.staff_id}
              className="bg-gray-800 rounded-xl p-6 border border-cyan-600/30 hover:border-cyan-400 transition-all group relative"
            >
              {/* EDIT BUTTON (มุมขวาบน) */}
              <button
                onClick={() => handleOpenEdit(teacher)}
                className="absolute top-4 right-4 text-gray-500 hover:text-yellow-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </button>

              <div className="text-cyan-500 font-bold mb-2">
                {teacher.staff_id}
              </div>
              <div className="text-xl text-white font-bold mb-1">
                {teacher.full_name}
              </div>
              <div className="text-sm text-gray-400 mb-4">
                {teacher.department}
              </div>
              <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
                {teacher.email || "No Email"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL (POPUP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-cyan-500 rounded-xl p-6 w-full max-w-lg shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h2 className="text-2xl font-['Orbitron'] text-white mb-6 border-b border-gray-700 pb-2">
              {isEditing ? "EDIT STAFF DATA" : "NEW REGISTRATION"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Staff ID
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  // แก้ตรงนี้: เพิ่ม || "" เพื่อกันค่าเป็น undefined
                  value={formData.staff_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, staff_id: e.target.value })
                  }
                  className={`w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none ${
                    isEditing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="e.g., T001"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  // แก้ตรงนี้: เพิ่ม || ""
                  value={formData.full_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Dr. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  // แก้ตรงนี้: เพิ่ม || ""
                  value={formData.department || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  // แก้ตรงนี้: เพิ่ม || "" (สำคัญมาก เพราะข้อมูลเก่าอาจไม่มี email)
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="example@kiosk.com"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded shadow-lg shadow-cyan-900/50 transition-colors"
                >
                  {isEditing ? "UPDATE DATA" : "CONFIRM ADD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPage;
