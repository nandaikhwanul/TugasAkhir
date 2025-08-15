"use client";

import React, { useState } from "react";
import { getTokenFromSessionStorage } from "../sessiontoken";

// Halaman Super Admin: Form Registrasi Super Admin Baru
export default function SuperAdminRegisterPage() {
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
      // Ambil token dari sessionStorage
      const token = getTokenFromSessionStorage();
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login ulang.");
      }

      const res = await fetch(
        "https://tugasakhir-production-6c6c.up.railway.app/superadmin/register-superadmin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal mendaftarkan super admin");
      }
      setSuccessMsg("Super admin berhasil didaftarkan!");
      setForm({
        username: "",
        password: "",
        email: "",
      });
    } catch (err) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Register Super Admin
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? "Mendaftarkan..." : "Daftarkan Super Admin"}
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
    </div>
  );
}
