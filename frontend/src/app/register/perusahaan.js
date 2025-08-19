"use client";
import { useState } from "react";
import axios from "axios";
import { FiEye } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function RegisterPerusahaan({
  loading: parentLoading,
  setLoading: setParentLoading,
  error: parentError,
  setError: setParentError,
  success: parentSuccess,
  setSuccess: setParentSuccess,
  router: parentRouter,
}) {
  const [perusahaan, setPerusahaan] = useState({
    nama_perusahaan: "",
    email_perusahaan: "",
    password: "",
    confPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({
    nama_perusahaan: "",
    email_perusahaan: "",
    password: "",
    confPassword: "",
  });

  const [loading, setLoading] = setParentLoading
    ? [parentLoading, setParentLoading]
    : useState(false);
  const [error, setError] = setParentError
    ? [parentError, setParentError]
    : useState("");
  const [success, setSuccess] = setParentSuccess
    ? [parentSuccess, setParentSuccess]
    : useState("");
  const router = parentRouter || useRouter();

  const handlePerusahaanChange = (e) => {
    const { name, value } = e.target;
    setPerusahaan((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handlePerusahaanSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({
      nama_perusahaan: "",
      email_perusahaan: "",
      password: "",
      confPassword: "",
    });

    setLoading(true);
    try {
      await axios.post(
        "https://tugasakhir-production-6c6c.up.railway.app/perusahaan",
        {
          nama_perusahaan: perusahaan.nama_perusahaan,
          email_perusahaan: perusahaan.email_perusahaan,
          password: perusahaan.password,
          confPassword: perusahaan.confPassword,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      setSuccess("Registrasi perusahaan berhasil! Silakan login.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (err.response?.data) {
        // Handle field errors from backend
        if (err.response.data.errors) {
          const errors = err.response.data.errors;
          const newFieldErrors = {};

          // Ambil error nama_perusahaan jika ada (string langsung atau objek)
          if (typeof errors.nama_perusahaan === "string") {
            newFieldErrors.nama_perusahaan = errors.nama_perusahaan;
          } else if (
            errors.nama_perusahaan &&
            typeof errors.nama_perusahaan === "object" &&
            errors.nama_perusahaan.errors &&
            typeof errors.nama_perusahaan.errors.undefined === "string"
          ) {
            newFieldErrors.nama_perusahaan = errors.nama_perusahaan.errors.undefined;
          }

          // Ambil error email_perusahaan jika ada (string langsung atau objek)
          if (typeof errors.email_perusahaan === "string") {
            newFieldErrors.email_perusahaan = errors.email_perusahaan;
          } else if (
            errors.email_perusahaan &&
            typeof errors.email_perusahaan === "object" &&
            errors.email_perusahaan.errors &&
            typeof errors.email_perusahaan.errors.undefined === "string"
          ) {
            newFieldErrors.email_perusahaan = errors.email_perusahaan.errors.undefined;
          }

          // Ambil error password jika ada (string langsung atau objek)
          if (typeof errors.password === "string") {
            newFieldErrors.password = errors.password;
          } else if (
            errors.password &&
            typeof errors.password === "object" &&
            errors.password.errors &&
            typeof errors.password.errors.undefined === "string"
          ) {
            newFieldErrors.password = errors.password.errors.undefined;
          }

          // Ambil error confPassword jika ada (string langsung atau objek)
          if (typeof errors.confPassword === "string") {
            newFieldErrors.confPassword = errors.confPassword;
          } else if (
            errors.confPassword &&
            typeof errors.confPassword === "object" &&
            errors.confPassword.errors &&
            typeof errors.confPassword.errors.undefined === "string"
          ) {
            newFieldErrors.confPassword = errors.confPassword.errors.undefined;
          }

          setFieldErrors(newFieldErrors);
        }

        // Handle global error message
        const errorMessage = err.response.data.message || err.response.data.msg;
        if (typeof errorMessage === 'string') {
          setError(errorMessage);
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
      className="w-full max-w-md mx-auto px-4 sm:px-6 md:px-8 space-y-4 sm:space-y-5 lg:space-y-6"
      onSubmit={handlePerusahaanSubmit}
      autoComplete="off"
    >
      {(error || success) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`mb-2 text-center text-xs sm:text-sm font-medium rounded py-2 px-3 ${error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
        >
          {error || success}
        </motion.div>
      )}
      {/* Input Nama Perusahaan */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeIn" }}
      >
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
          Nama Perusahaan
        </label>
        {fieldErrors.nama_perusahaan && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.nama_perusahaan}</div>
        )}
        <input
          className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border ${fieldErrors.nama_perusahaan ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition`}
          placeholder="Masukkan nama perusahaan"
          name="nama_perusahaan"
          value={perusahaan.nama_perusahaan}
          onChange={handlePerusahaanChange}
          required
        />
      </motion.div>
      {/* Input Email Perusahaan */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeIn" }}
      >
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
          Email Perusahaan
        </label>
        {fieldErrors.email_perusahaan && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.email_perusahaan}</div>
        )}
        <input
          className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border ${fieldErrors.email_perusahaan ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition`}
          placeholder="perusahaan@email.com"
          name="email_perusahaan"
          type="email"
          value={perusahaan.email_perusahaan}
          onChange={handlePerusahaanChange}
          required
          autoComplete="email"
        />
      </motion.div>
      {/* Input Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeIn" }}
      >
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
        {fieldErrors.password && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.password}</div>
        )}
          <input
            type={showPassword ? "text" : "password"}
            className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border ${fieldErrors.password ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-8 sm:pr-10`}
            placeholder="••••••••"
            name="password"
            value={perusahaan.password}
            onChange={handlePerusahaanChange}
            required
            autoComplete="new-password"
          />
          <span
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 cursor-pointer text-sm sm:text-base"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={0}
            role="button"
            aria-label="Tampilkan Password"
          >
            <FiEye />
          </span>
        </div>
      </motion.div>
      {/* Input Konfirmasi Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeIn" }}
      >
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
          Konfirmasi Password
        </label>
        <div className="relative">
        {fieldErrors.confPassword && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.confPassword}</div>
        )}
          <input
            type={showConfPassword ? "text" : "password"}
            className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-base border ${fieldErrors.confPassword ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-8 sm:pr-10`}
            placeholder="••••••••"
            name="confPassword"
            value={perusahaan.confPassword}
            onChange={handlePerusahaanChange}
            required
            autoComplete="new-password"
          />
          <span
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 cursor-pointer text-sm sm:text-base"
            onClick={() => setShowConfPassword((v) => !v)}
            tabIndex={0}
            role="button"
            aria-label="Tampilkan Konfirmasi Password"
          >
            <FiEye />
          </span>
        </div>
      </motion.div>
      <button
        className="w-full py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-base bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            <svg className="animate-spin h-3 w-3 sm:h-5 sm:w-5 text-white" viewBox="0 0 24 24">
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
