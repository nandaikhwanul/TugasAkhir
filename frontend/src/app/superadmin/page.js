"use client";
import React, { useState, useEffect } from "react";
import { getTokenFromSessionStorage } from "../sessiontoken";
import Sidebar from "./sidebar/page";

// Halaman Super Admin: Form Registrasi Admin Baru (oleh SuperAdmin)
export default function SuperAdminRegisterPage() {
  // Gunakan mounting state untuk menghindari SSR/CSR mismatch
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Ambil token dari sessionStorage (hanya di client)
      let token = getTokenFromSessionStorage();
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login ulang.");
      }

      // Payload hanya username, password, email (tanpa role)
      const payload = {
        ...form,
      };

      const res = await fetch(
        "https://tugasakhir-production-6c6c.up.railway.app/superadmin/create-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        let data = {};
        try {
          data = await res.json();
        } catch (e) {
          // ignore, fallback to default error
        }
        throw new Error(data.message || "Gagal mendaftarkan admin");
      }
      setSuccessMsg("Admin berhasil didaftarkan!");
      setForm({
        username: "",
        password: "",
        email: "",
      });
    } catch (err) {
      setErrorMsg(err?.message || "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  if (!mounted) {
    // Hindari render apapun sampai client mount, untuk mencegah hydration mismatch
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:ml-64 transition-all duration-300">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
            Register Admin
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block font-medium mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={form.username}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan username"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan email"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Masukkan password"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Mendaftarkan..." : "Daftarkan Admin"}
            </button>
          </form>
          {successMsg && (
            <div className="mt-4 text-green-600 text-center font-medium">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 text-red-600 text-center font-medium">
              {errorMsg}
            </div>
          )}
        </div>
      </main>
      {/* Responsive: push content right on desktop */}
      <style jsx global>{`
        @media (min-width: 768px) {
          body {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
