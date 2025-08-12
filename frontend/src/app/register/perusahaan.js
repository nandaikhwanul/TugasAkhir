"use client";
import { useState } from "react";
import axios from "axios";
import { FiEye } from "react-icons/fi";
import { useRouter } from "next/navigation";

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
          
          // Handle nested error object format
          if (typeof errors === 'object' && !Array.isArray(errors)) {
            Object.entries(errors).forEach(([field, errorObj]) => {
              if (errorObj?.msg) {
                newFieldErrors[field] = errorObj.msg;
              }
            });
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
    <form
      className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl space-y-6"
      onSubmit={handlePerusahaanSubmit}
      autoComplete="off"
    >
      {(error || success) && (
        <div className={`mb-2 text-center text-sm font-medium rounded py-2 px-3 ${error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {error || success}
        </div>
      )}
      {/* Input Nama Perusahaan */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nama Perusahaan
        </label>
        {fieldErrors.nama_perusahaan && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.nama_perusahaan}</div>
        )}
        <input
          className={`w-full px-3 py-2 border ${fieldErrors.nama_perusahaan ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition`}
          placeholder="Masukkan nama perusahaan"
          name="nama_perusahaan"
          value={perusahaan.nama_perusahaan}
          onChange={handlePerusahaanChange}
          required
        />
      </div>
      {/* Input Email Perusahaan */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Email Perusahaan
        </label>
        {fieldErrors.email_perusahaan && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.email_perusahaan}</div>
        )}
        <input
          className={`w-full px-3 py-2 border ${fieldErrors.email_perusahaan ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition`}
          placeholder="perusahaan@email.com"
          name="email_perusahaan"
          type="email"
          value={perusahaan.email_perusahaan}
          onChange={handlePerusahaanChange}
          required
          autoComplete="email"
        />
      </div>
      {/* Input Password */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
        {fieldErrors.password && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.password}</div>
        )}
          <input
            type={showPassword ? "text" : "password"}
            className={`w-full px-3 py-2 border ${fieldErrors.password ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10`}
            placeholder="••••••••"
            name="password"
            value={perusahaan.password}
            onChange={handlePerusahaanChange}
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
      </div>
      {/* Input Konfirmasi Password */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Konfirmasi Password
        </label>
        <div className="relative">
        {fieldErrors.confPassword && (
          <div className="mb-1 text-xs text-red-600">{fieldErrors.confPassword}</div>
        )}
          <input
            type={showConfPassword ? "text" : "password"}
            className={`w-full px-3 py-2 border ${fieldErrors.confPassword ? "border-red-400" : "border-gray-200"} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10`}
            placeholder="••••••••"
            name="confPassword"
            value={perusahaan.confPassword}
            onChange={handlePerusahaanChange}
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
      </div>
      {/* Checkbox Terms */}
      {/* Checkbox terms dihapus */}
      {/* {fieldErrors.terms && (
        <div className="mb-2 text-xs text-red-600">{fieldErrors.terms}</div>
      )} */}
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
    </form>
  );
}
