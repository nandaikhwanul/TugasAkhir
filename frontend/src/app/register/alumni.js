"use client";
import { useState } from "react";
import axios from "axios";
import { FiEye } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function RegisterAlumni(props) {
  // Hanya field yang diperlukan untuk register: nama, nim, email, password, confPassword
  const [alumni, setAlumni] = useState({
    name: "",
    nim: "",
    email: "",
    password: "",
    confPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);

  // Gunakan parent state jika diberikan, jika tidak pakai local
  const [loading, setLoading] = props.setLoading
    ? [props.loading, props.setLoading]
    : useState(false);
  const [error, setError] = props.setError
    ? [props.error, props.setError]
    : useState("");
  const [success, setSuccess] = props.setSuccess
    ? [props.success, props.setSuccess]
    : useState("");
  const [agree, setAgree] = props.setAgree
    ? [props.agree, props.setAgree]
    : useState(false);
  const router = props.router || useRouter();

  const handleAlumniChange = (e) => {
    const { name, value } = e.target;
    setAlumni((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!agree) {
      setError("Anda harus menyetujui Terms dan Privacy Policies.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/alumni",
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
        setError(
          err.response.data?.message ||
            err.response.data?.msg ||
            "Registrasi alumni gagal."
        );
      } else {
        setError("Terjadi kesalahan pada server.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Grid 2 kolom agar form tidak panjang ke bawah
  return (
    <form
      className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl space-y-6"
      onSubmit={handleAlumniSubmit}
      autoComplete="off"
    >
      {(error || success) && (
        <div className={`mb-2 text-center text-sm font-medium rounded py-2 px-3 ${error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {error || success}
        </div>
      )}

      {/* Input Nama Lengkap */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nama Lengkap
        </label>
        <input
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          placeholder="Masukkan nama lengkap"
          name="name"
          value={alumni.name}
          onChange={handleAlumniChange}
          required
          autoComplete="name"
        />
      </div>

      {/* Input NIM */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">NIM</label>
        <input
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          placeholder="Masukkan NIM"
          name="nim"
          value={alumni.nim}
          onChange={handleAlumniChange}
          required
          autoComplete="off"
        />
      </div>

      {/* Input Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
        <input
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          placeholder="john@example.com"
          name="email"
          type="email"
          value={alumni.email}
          onChange={handleAlumniChange}
          required
          autoComplete="email"
        />
      </div>

      {/* Input Password */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10"
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
      </div>

      {/* Input Konfirmasi Password */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Konfirmasi Password
        </label>
        <div className="relative">
          <input
            type={showConfPassword ? "text" : "password"}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10"
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
      </div>

      {/* Checkbox Terms */}
      <div className="flex items-center mt-2">
        <input
          type="checkbox"
          id="terms"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
          checked={agree}
          onChange={() => setAgree((v) => !v)}
        />
        <label htmlFor="terms" className="ml-2 text-sm text-gray-600 select-none">
          Saya setuju dengan{" "}
          <span className="text-blue-600 underline underline-offset-2 cursor-pointer">Terms</span> dan{" "}
          <span className="text-blue-600 underline underline-offset-2 cursor-pointer">Privacy Policies</span>
        </label>
      </div>
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