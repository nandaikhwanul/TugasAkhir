"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Prefill email/password jika ada di localStorage
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("savedLoginEmail") || "";
      const savedPassword = localStorage.getItem("savedLoginPassword") || "";
      if (savedEmail || savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch {
      // ignore error
    }
  }, []);

  // Cek apakah user sudah login dengan coba akses endpoint protected backend
  // Asumsikan backend akan tolak jika cookie token tidak valid
  useEffect(() => {
    async function checkAuth() {
      try {
        await axios.get(
          "https://tugasakhir-production-6c6c.up.railway.app/protected",
          { withCredentials: true }
        );
        // Kalau berhasil, berarti user sudah login, redirect ke dashboard
        router.replace("/dashboard");
      } catch {
        // Kalau gagal, berarti belum login
        setCheckingToken(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ email: "", password: "", general: "" });
    setLoading(true);

    let hasError = false;
    let newError = { email: "", password: "", general: "" };
    if (!email) {
      newError.email = "Email wajib diisi.";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newError.email = "Format email tidak valid.";
      hasError = true;
    }
    if (!password) {
      newError.password = "Password wajib diisi.";
      hasError = true;
    }
    if (hasError) {
      setError(newError);
      setLoading(false);
      return;
    }

    try {
      // Kirim email dan password ke backend
      await axios.post(
        "https://tugasakhir-production-6c6c.up.railway.app/login",
        { email, password },
        {
          withCredentials: true, // penting supaya cookie disimpan browser
          headers: { "Content-Type": "application/json" },
        }
      );

      // Jika berhasil, backend sudah set cookie token,
      // frontend tidak perlu simpan token manual

      if (rememberMe) {
        localStorage.setItem("savedLoginEmail", email);
        localStorage.setItem("savedLoginPassword", password);
      } else {
        localStorage.removeItem("savedLoginEmail");
        localStorage.removeItem("savedLoginPassword");
      }

      router.push("/dashboard");
    } catch (err) {
      let newError = { email: "", password: "", general: "" };
      if (err.response) {
        let msg =
          err.response.data?.message ||
          err.response.data?.msg ||
          "Terjadi kesalahan pada server.";
        if (
          /email/i.test(msg) &&
          (/tidak ditemukan|not found|invalid|salah|required|wajib/i.test(msg) ||
            /email/i.test(msg))
        ) {
          newError.email = msg;
        } else if (
          /password/i.test(msg) &&
          (/salah|invalid|required|wajib/i.test(msg) || /password/i.test(msg))
        ) {
          newError.password = msg;
        } else {
          newError.general = msg;
        }
      } else {
        newError.general = "Terjadi kesalahan pada server. Silakan coba lagi.";
      }
      setError(newError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    router.push("/register");
  };

  if (checkingToken) {
    return null; // atau spinner loading
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl w-full flex flex-col md:flex-row">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
          className="w-full md:w-1/2 md:pr-8 mb-8 md:mb-0"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              Login
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8">
              Selamat datang di platform pencarian kerja
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeIn" }}
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-900 mb-1"
                >
                  Email
                </label>
                {error.email && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 text-sm text-red-600"
                  >
                    {error.email}
                  </motion.div>
                )}
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                  placeholder="Masukkan Email"
                  autoComplete="username"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeIn" }}
              >
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900 mb-1"
                >
                  Password
                </label>
                {error.password && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 text-sm text-red-600"
                  >
                    {error.password}
                  </motion.div>
                )}
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: "easeIn" }}
                className="flex items-center"
              >
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Save my info
                </label>
              </motion.div>
            </div>

            {error.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center text-sm text-red-600"
              >
                {error.general}
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: "easeIn" }}
              type="submit"
              className={`mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5, ease: "easeIn" }}
              className="mt-4 text-center text-sm"
            >
              <span className="text-gray-900">Tidak Punya Akun ? </span>
              <button
                type="button"
                className="text-blue-600 hover:underline font-semibold"
                onClick={handleGoToRegister}
              >
                Register sekarang!
              </button>
            </motion.div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
          className="w-full md:w-1/2 flex items-center justify-center"
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              minHeight: 220,
              minWidth: 320,
              maxWidth: "175%",
              maxHeight: "175%",
              transform: "translateX(5rem)",
            }}
          >
            <img
              src="/15.svg"
              alt="Login Illustration"
              width={320}
              height={220}
              style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
