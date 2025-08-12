"use client";
import { useState } from "react";
import axios from "axios";
import { FiEye } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function RegisterAlumni(props) {
  const [alumni, setAlumni] = useState({
    name: "",
    nim: "",
    email: "",
    password: "",
    confPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    nim: "",
    email: "",
    password: "",
    confPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);

  const [loading, setLoading] = props.setLoading
    ? [props.loading, props.setLoading]
    : useState(false);
  const [error, setError] = props.setError
    ? [props.error, props.setError]
    : useState("");
  const [success, setSuccess] = props.setSuccess
    ? [props.success, props.setSuccess]
    : useState("");
  const router = props.router || useRouter();

  const handleAlumniChange = (e) => {
    const { name, value } = e.target;
    setAlumni((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when typing
    setFieldErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  };

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({
      name: "",
      nim: "",
      email: "",
      password: "",
      confPassword: "",
    });
    
    setLoading(true);
    try {
      await axios.post(
        "https://tugasakhir-production-6c6c.up.railway.app/alumni",
        {
          ...alumni,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setSuccess("Registrasi alumni berhasil! Silakan login.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (err.response) {
        if (err.response.data?.errors) {
          // Set field-specific errors
          setFieldErrors(prev => ({
            ...prev,
            ...err.response.data.errors
          }));
        } else {
          setError(
            err.response.data?.message ||
              err.response.data?.msg ||
              "Registrasi alumni gagal."
          );
        }
      } else {
        setError("Terjadi kesalahan pada server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeIn" }}
      className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl space-y-6 md:overflow-y-hidden"
      onSubmit={handleAlumniSubmit}
      autoComplete="off"
    >
      {(error || success) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`mb-2 text-center text-sm font-medium rounded py-2 px-3 ${error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
        >
          {error || success}
        </motion.div>
      )}

      {/* Input Nama Lengkap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeIn" }}
      >
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nama Lengkap
        </label>
        <input
          className={`w-full px-3 py-2 border ${fieldErrors.name ? "border-red-500" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition`}
          placeholder="Masukkan nama lengkap"
          name="name"
          value={alumni.name}
          onChange={handleAlumniChange}
          required
          autoComplete="name"
        />
        {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
      </motion.div>

      {/* Input NIM */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeIn" }}
      >
        <label className="block text-xs font-semibold text-gray-700 mb-1">NIM</label>
        <input
          className={`w-full px-3 py-2 border ${fieldErrors.nim ? "border-red-500" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition`}
          placeholder="Masukkan NIM"
          name="nim"
          value={alumni.nim}
          onChange={handleAlumniChange}
          required
          autoComplete="off"
        />
        {fieldErrors.nim && <p className="mt-1 text-xs text-red-600">{fieldErrors.nim}</p>}
      </motion.div>

      {/* Input Email */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeIn" }}
      >
        <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
        <input
          className={`w-full px-3 py-2 border ${fieldErrors.email ? "border-red-500" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition`}
          placeholder="john@example.com"
          name="email"
          type="email"
          value={alumni.email}
          onChange={handleAlumniChange}
          required
          autoComplete="email"
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </motion.div>

      {/* Input Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeIn" }}
      >
        <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={`w-full px-3 py-2 border ${fieldErrors.password ? "border-red-500" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10`}
            placeholder="••••••••"
            name="password"
            value={alumni.password}
            onChange={handleAlumniChange}
            minLength={6}
            required
            autoComplete="new-password"
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 cursor-pointer"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={0}
            role="button"
            aria-label="Tampilkan Password"
          >
            <FiEye />
          </span>
        </div>
        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
      </motion.div>

      {/* Input Konfirmasi Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeIn" }}
      >
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Konfirmasi Password
        </label>
        <div className="relative">
          <input
            type={showConfPassword ? "text" : "password"}
            className={`w-full px-3 py-2 border ${fieldErrors.confPassword ? "border-red-500" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10`}
            placeholder="••••••••"
            name="confPassword"
            value={alumni.confPassword}
            onChange={handleAlumniChange}
            minLength={6}
            required
            autoComplete="new-password"
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 cursor-pointer"
            onClick={() => setShowConfPassword((v) => !v)}
            tabIndex={0}
            role="button"
            aria-label="Tampilkan Konfirmasi Password"
          >
            <FiEye />
          </span>
        </div>
        {fieldErrors.confPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confPassword}</p>}
      </motion.div>

      <button
        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold text-base shadow hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            Mendaftar...
          </span>
        ) : (
          "Buat Akun"
        )}
      </button>
    </motion.form>
  );
}