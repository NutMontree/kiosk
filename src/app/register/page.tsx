/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Key, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  // mode: 'REGISTER' = ลงทะเบียนใหม่, 'UPDATE' = เปลี่ยนรหัส
  const [mode, setMode] = useState<"REGISTER" | "UPDATE">("REGISTER");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation เบื้องต้น
    if (formData.password !== formData.confirm_password) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      return;
    }
    if (formData.password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);

    try {
      // เลือก URL ตามโหมด
      const url =
        mode === "REGISTER"
          ? "/api/auth/register"
          : "/api/auth/update-password";

      const method = mode === "REGISTER" ? "POST" : "PUT";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name, // ส่งไปเฉพาะตอน Register (API update ไม่ได้ใช้แต่ส่งไปไม่เสียหาย)
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text:
            mode === "REGISTER"
              ? "Registration Successful!"
              : "Password Updated Successfully!",
        });

        // เคลียร์ฟอร์ม
        setFormData({
          full_name: "",
          email: "",
          password: "",
          confirm_password: "",
        });

        // รอ 2 วินาทีแล้วกลับหน้า Login
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Operation failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server connection failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-mono">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => {
              setMode("REGISTER");
              setMessage(null);
            }}
            className={`flex-1 py-4 text-sm font-bold tracking-wider transition-colors flex items-center justify-center gap-2 ${
              mode === "REGISTER"
                ? "bg-gray-800 text-cyan-400 border-b-2 border-cyan-400"
                : "bg-gray-900/50 text-gray-500 hover:text-gray-300"
            }`}
          >
            <UserPlus className="w-4 h-4" /> REGISTER
          </button>
          <button
            onClick={() => {
              setMode("UPDATE");
              setMessage(null);
            }}
            className={`flex-1 py-4 text-sm font-bold tracking-wider transition-colors flex items-center justify-center gap-2 ${
              mode === "UPDATE"
                ? "bg-gray-800 text-yellow-400 border-b-2 border-yellow-400"
                : "bg-gray-900/50 text-gray-500 hover:text-gray-300"
            }`}
          >
            <Key className="w-4 h-4" /> RESET PASSWORD
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-['Orbitron'] text-white font-bold mb-6 text-center">
            {mode === "REGISTER" ? "NEW ACCOUNT" : "UPDATE CREDENTIALS"}
          </h2>

          {/* Alert Message */}
          {message && (
            <div
              className={`mb-6 p-3 rounded flex items-center gap-2 text-sm ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                  : "bg-red-500/20 text-red-400 border border-red-500/50"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                "⚠️"
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Show only in Register mode) */}
            {mode === "REGISTER" && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required={mode === "REGISTER"}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-bold uppercase">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                placeholder="admin@system"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">
                  Confirm
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-3 rounded font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                mode === "REGISTER"
                  ? "bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-900/50"
                  : "bg-yellow-600 hover:bg-yellow-500 shadow-lg shadow-yellow-900/50"
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : mode === "REGISTER" ? (
                "CREATE ACCOUNT"
              ) : (
                "UPDATE PASSWORD"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-gray-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
