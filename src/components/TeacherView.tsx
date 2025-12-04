/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { Search, Plus, Edit, User } from "lucide-react";

// Types
interface Teacher {
  _id?: string;
  staff_id: string;
  full_name: string;
  department: string;
  email?: string;
}

// Helper: GlassCard
const GlassCard = ({ children, className = "" }: any) => (
  <div
    className={`relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl ${className}`}
  >
    <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent opacity-50" />
    <div className="relative">{children}</div>
  </div>
);

export default function TeacherView() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Teacher>({
    staff_id: "",
    full_name: "",
    department: "",
    email: "",
  });

  // Fetch Data
  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teacher/status");
      if (response.ok) {
        const result = await response.json();
        setTeachers(result.teachers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // --- Handlers ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ staff_id: "", full_name: "", department: "", email: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setIsEditing(true);
    setFormData(teacher);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = isEditing ? "/api/staff/update" : "/api/staff/add";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(isEditing ? "Updated Successfully!" : "Added Successfully!");
        setIsModalOpen(false);
        fetchTeachers();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message}`);
      }
    } catch (error) {
      alert("Cannot connect to server");
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.staff_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <GlassCard className="p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-['Orbitron']">
              Staff Directory
            </h2>
            <p className="text-xs text-slate-400">Manage academic personnel</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-hover:text-cyan-400" />
              <input
                type="text"
                placeholder="Search Name/ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-11 pr-6 py-3 bg-black/20 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-xs tracking-wider shadow-lg shadow-cyan-900/20 transition-all"
            >
              <Plus className="w-4 h-4" /> ADD NEW
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-xs text-slate-400 uppercase font-['Orbitron']">
              <tr>
                <th className="p-5">ID</th>
                <th className="p-5">Name</th>
                <th className="p-5">Department</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Loading Data...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No staff found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr
                    key={t.staff_id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-5 font-mono text-cyan-400 font-bold">
                      {t.staff_id}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">
                          {t.full_name.charAt(0)}
                        </div>
                        <span className="text-slate-200">{t.full_name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-slate-400 text-sm">
                      {t.department}
                    </td>
                    <td className="p-5 text-right">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-yellow-400 transition-all"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold text-white font-['Orbitron'] mb-6">
              {isEditing ? "Edit Staff" : "Add New Staff"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                  Staff ID
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.staff_id}
                  onChange={(e) =>
                    setFormData({ ...formData, staff_id: e.target.value })
                  }
                  className={`w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500 ${
                    isEditing ? "opacity-50" : ""
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
