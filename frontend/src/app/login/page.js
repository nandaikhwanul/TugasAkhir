"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Simpan info login ke localStorage
function saveLoginInfo(email, password) {
  try {
    localStorage.setItem("savedLoginEmail", email);
    localStorage.setItem("savedLoginPassword", password);
  } catch (e) {}
}

// Hapus info login dari localStorage
function clearLoginInfo() {
  try {
    localStorage.removeItem("savedLoginEmail");
    localStorage.removeItem("savedLoginPassword");
  } catch (e) {}
}

// Ambil info login dari localStorage
function getSavedLoginInfo() {
  if (typeof window === "undefined") return { email: "", password: "" };
  return {
    email: localStorage.getItem("savedLoginEmail") || "",
    password: localStorage.getItem("savedLoginPassword") || "",
  };
}

export default function LoginPage() {
  // Login hanya pakai email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // error: { email: string, password: string, general: string }
  const [error, setError] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Prefill email/password jika ada di localStorage
  useEffect(() => {
    const saved = getSavedLoginInfo();
    if (saved.email || saved.password) {
      setEmail(saved.email);
      setPassword(saved.password);
      setRememberMe(true);
    }
  }, []);

  // Cek status login ke backend sebelum render login
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        // Ganti endpoint sesuai backend Anda, misal /me atau /profile
        await axios.get(
          "https://tugasakhir-production-6c6c.up.railway.app/me",
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!cancelled) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        // Belum login, lanjutkan render login
      }
      if (!cancelled) setCheckingSession(false);
    }
    checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ email: "", password: "", general: "" });
    setLoading(true);

    // Simple client-side validation
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
      // Kirim email dan password
      const payload = {
        email,
        password,
      };

      await axios.post(
        "https://tugasakhir-production-6c6c.up.railway.app/login",
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      // Setelah login, token akan terset di cookie oleh backend (karena withCredentials)
      if (rememberMe) {
        saveLoginInfo(email, password);
      } else {
        clearLoginInfo();
      }
      router.push("/dashboard");
    } catch (err) {
      // Default error state
      let newError = { email: "", password: "", general: "" };
      if (err.response) {
        // Cek error spesifik dari backend
        let msg = err.response.data?.message || err.response.data?.msg || "Terjadi kesalahan pada server.";
        // Deteksi error email/password dari pesan
        if (
          /email/i.test(msg) &&
          (/tidak ditemukan|not found|invalid|salah|required|wajib/i.test(msg) || /email/i.test(msg))
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

  if (checkingSession) {
    // Bisa ganti dengan spinner atau null, biar ga render login page dulu
    return null;
  }

  // Helper: apakah error.email adalah "user tidak ditemukan"?
  function isUserNotFound(msg) {
    if (!msg) return false;
    // Cek kata kunci "tidak ditemukan" atau "not found"
    return /tidak ditemukan|not found/i.test(msg);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex">
        <div className="w-1/2 pr-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Login</h2>
            <p className="text-gray-600 mb-8">
              Selamat datang di platform pencarian kerja
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                {/* Error email di atas input dan di bawah label */}
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                {error.email && (
                  <div className="mb-2 text-sm text-red-600">{error.email}</div>
                )}
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                  placeholder="Masukkan Email"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                  Password
                </label>
                {/* Error password di atas input password dan di bawah label */}
                {error.password && (
                  <div className="mb-2 text-sm text-red-600">{error.password}</div>
                )}
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Save my info
                </label>
              </div>
            </div>

            {/* Error general di bawah semua input */}
            {error.general && (
              <div className="mt-4 text-center text-sm text-red-600">
                {error.general}
              </div>
            )}

            <button
              type="submit"
              className={`mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-900">Tidak Punya Akun ? </span>
              <button
                type="button"
                className="text-blue-600 hover:underline font-semibold"
                onClick={handleGoToRegister}
              >
                Register sekarang!
              </button>
            </div>
          </form>
        </div>

        <div className="w-1/2 flex items-center justify-center">
          {/* Ganti Three.js dengan image 15.svg */}
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
        </div>
      </div>
    </div>
  );
}