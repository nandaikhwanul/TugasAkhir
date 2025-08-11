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
  agree: parentAgree,
  setAgree: setParentAgree,
  router: parentRouter,
}) {
  // Hanya field yang diperlukan untuk register: nama_perusahaan, email_perusahaan, password, confPassword
  const [perusahaan, setPerusahaan] = useState({
    nama_perusahaan: "",
    email_perusahaan: "",
    password: "",
    confPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);

  // State untuk error per field
  const [fieldErrors, setFieldErrors] = useState({
    nama_perusahaan: "",
    email_perusahaan: "",
    password: "",
    confPassword: "",
    terms: "",
  });

  // Gunakan parent state jika diberikan, jika tidak pakai local
  const [loading, setLoading] = setParentLoading
    ? [parentLoading, setParentLoading]
    : useState(false);
  const [error, setError] = setParentError
    ? [parentError, setParentError]
    : useState("");
  const [success, setSuccess] = setParentSuccess
    ? [parentSuccess, setParentSuccess]
    : useState("");
  const [agree, setAgree] = setParentAgree
    ? [parentAgree, setParentAgree]
    : useState(false);
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

  const validateFields = () => {
    const errors = {};
    if (!perusahaan.nama_perusahaan.trim()) {
      errors.nama_perusahaan = "Nama perusahaan wajib diisi.";
    }
    if (!perusahaan.email_perusahaan.trim()) {
      errors.email_perusahaan = "Email perusahaan wajib diisi.";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(perusahaan.email_perusahaan)
    ) {
      errors.email_perusahaan = "Format email tidak valid.";
    }
    if (!perusahaan.password) {
      errors.password = "Password wajib diisi.";
    } else if (perusahaan.password.length < 6) {
      errors.password = "Password minimal 6 karakter.";
    }
    if (!perusahaan.confPassword) {
      errors.confPassword = "Konfirmasi password wajib diisi.";
    } else if (perusahaan.confPassword !== perusahaan.password) {
      errors.confPassword = "Konfirmasi password tidak sama.";
    }
    if (!agree) {
      errors.terms = "Anda harus menyetujui Terms dan Privacy Policies.";
    }
    return errors;
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
      terms: "",
    });

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Jika error terms, tampilkan juga di global error agar tetap muncul di atas form
      if (errors.terms) setError(errors.terms);
      return;
    }

    setLoading(true);
    try {
      // Hanya kirim field yang diperlukan
      await axios.post(
        "ttps://tugasakhir-production-6c6c.up.railway.app/perusahaan",
        {
          nama_perusahaan: perusahaan.nama_perusahaan,
          email_perusahaan: perusahaan.email_perusahaan,
          password: perusahaan.password,
          confPassword: perusahaan.confPassword,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // <--- tambahkan ini agar credentials (cookie) dikirim
        }
      );
      setSuccess("Registrasi perusahaan berhasil! Silakan login.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      // Cek jika error dari backend per field
      if (err.response && err.response.data && typeof err.response.data === "object") {
        // Jika backend mengirim error per field
        if (err.response.data.errors) {
          setFieldErrors((prev) => ({
            ...prev,
            ...err.response.data.errors,
          }));
        }
        // Jika ada pesan error global dari backend
        if (err.response.data.message || err.response.data.msg) {
          setError(
            err.response.data.message ||
            err.response.data.msg ||
            "Registrasi perusahaan gagal."
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
      </div>
      {/* Checkbox Terms */}
      <div className="flex items-center mt-2">
        <input
          type="checkbox"
          id="terms"
          className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-400 ${fieldErrors.terms ? "border-red-400" : ""}`}
          checked={agree}
          onChange={() => {
            setAgree((v) => !v);
            setFieldErrors((prev) => ({
              ...prev,
              terms: "",
            }));
          }}
        />
        <label htmlFor="terms" className="ml-2 text-sm text-gray-600 select-none">
          Saya setuju dengan{" "}
          <span className="text-blue-600 underline underline-offset-2 cursor-pointer">Terms</span> dan{" "}
          <span className="text-blue-600 underline underline-offset-2 cursor-pointer">Privacy Policies</span>
        </label>
      </div>
      {fieldErrors.terms && (
        <div className="mb-2 text-xs text-red-600">{fieldErrors.terms}</div>
      )}
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
