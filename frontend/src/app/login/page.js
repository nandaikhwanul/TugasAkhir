"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromSessionStorage } from "../sessiontoken";
import { motion, AnimatePresence } from "framer-motion";

// Simpan info login ke localStorage
function saveLoginInfo(email, password) {
  try {
    localStorage.setItem("savedLoginEmail", email);
    localStorage.setItem("savedLoginPassword", password);
    console.debug("Saved login info to localStorage:", { email, password });
  } catch (e) {
    console.error("Failed to save login info:", e);
  }
}

// Hapus info login dari localStorage
function clearLoginInfo() {
  try {
    localStorage.removeItem("savedLoginEmail");
    localStorage.removeItem("savedLoginPassword");
    console.debug("Cleared login info from localStorage");
  } catch (e) {
    console.error("Failed to clear login info:", e);
  }
}

// Ambil info login dari localStorage
function getSavedLoginInfo() {
  if (typeof window === "undefined") return { email: "", password: "" };
  const email = localStorage.getItem("savedLoginEmail") || "";
  const password = localStorage.getItem("savedLoginPassword") || "";
  console.debug("Loaded saved login info from localStorage:", { email, password });
  return { email, password };
}

// Helper untuk set cookie token secara manual (jika perlu)
function setTokenCookie(token, options = {}) {
  let cookie = `token=${encodeURIComponent(token)}`;
  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.expires) cookie += `; Expires=${options.expires}`;
  if (options.secure) cookie += `; Secure`;
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  document.cookie = cookie;
  console.debug("Set token cookie:", cookie);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = getSavedLoginInfo();
    if (saved.email || saved.password) {
      setEmail(saved.email);
      setPassword(saved.password);
      setRememberMe(true);
      console.debug("Auto-filled login form with saved credentials.");
    }
  }, []);

  // Cek token dari sessionStorage sebelum render login
  useEffect(() => {
    const token = getTokenFromSessionStorage();
    console.debug("Token from sessionStorage:", token);
    if (token) {
      console.debug("Token found, redirecting to /dashboard");
      router.replace("/dashboard");
      return;
    }
    setCheckingToken(false);
    // eslint-disable-next-line
  }, []); // <--- HAPUS router dari dependency array, hanya [] saja

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
      console.debug("Validation error:", newError);
      return;
    }

    try {
      const payload = { email, password };
      console.debug("Submitting login payload:", payload);

      // Ganti ke fetch agar bisa ambil cookie dari body JSON response
      fetch("https://tugasakhir-production-6c6c.up.railway.app/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // agar cookie dari server tetap dikirim/disimpan browser
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          setLoading(false);
          let responseData = {};
          try {
            responseData = await res.json();
          } catch (e) {
            responseData = {};
          }

          if (res.ok) {
            // Ambil cookie/token dari body JSON response
            let token = null;
            if (responseData.cookie) {
              // Jika backend mengirimkan cookie string (misal: "token=xxx; Path=/; ...")
              // Ambil nilai token dari string cookie
              const match = responseData.cookie.match(/token=([^;]+)/);
              if (match) {
                token = match[1];
              }
            }
            // Atau jika backend mengirimkan token langsung
            if (!token && responseData.token) {
              token = responseData.token;
            }

            if (token) {
              // Simpan token ke sessionStorage
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem("token", token);
                console.debug("Token set to sessionStorage from response body (cookie/token field)");
              }
              // (Opsional) juga set cookie jika ingin, tapi source of truth sessionStorage
              setTokenCookie(token, {
                maxAge: 1800,
                path: "/",
                secure: false,
                sameSite: "None",
              });
            }

            if (rememberMe) {
              saveLoginInfo(email, password);
            } else {
              clearLoginInfo();
            }
            console.debug("Redirecting to /dashboard after successful login");
            router.push("/dashboard");
          } else {
            let msg = "Terjadi kesalahan pada server. Silakan coba lagi.";
            msg = responseData.message || responseData.msg || msg;
            let newError = { email: "", password: "", general: "" };
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
            setError(newError);
            console.error("Login error:", msg);
          }
        })
        .catch((err) => {
          setLoading(false);
          setError({
            email: "",
            password: "",
            general: "Terjadi kesalahan pada server. Silakan coba lagi.",
          });
          console.error("Login error: Network/Server error", err);
        });
    } catch (err) {
      setLoading(false);
      let newError = { email: "", password: "", general: "" };
      newError.general = "Terjadi kesalahan pada server. Silakan coba lagi.";
      setError(newError);
      console.error("Login error:", err);
    }
  };

  const handleGoToRegister = () => {
    console.debug("Navigating to /register");
    router.push("/register");
  };

  if (checkingToken) {
    console.debug("Checking token, not rendering login form yet.");
    return null;
  }

  function isUserNotFound(msg) {
    if (!msg) return false;
    return /tidak ditemukan|not found/i.test(msg);
  }

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
    exit: { opacity: 0, y: 40, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 18 } }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.92, x: 40 },
    visible: { opacity: 1, scale: 1, x: 0, transition: { type: "spring", stiffness: 60, damping: 18, delay: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-8 px-2 sm:px-6 lg:px-8">
      <AnimatePresence>
        <motion.div
          className="max-w-4xl w-full flex flex-col-reverse md:flex-row bg-white rounded-xl shadow-lg overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Left: Form */}
          <motion.div
            className="w-full md:w-1/2 px-4 sm:px-8 py-8 flex flex-col justify-center"
            variants={itemVariants}
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">Login</h2>
              <p className="text-gray-600 mb-8 text-center md:text-left">
                Selamat datang di platform pencarian kerja
              </p>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              className="w-full"
              variants={itemVariants}
              initial={false}
              animate="visible"
            >
              <div className="space-y-4">
                <motion.div variants={itemVariants}>
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
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                    Password
                  </label>
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
                </motion.div>

                <motion.div className="flex items-center" variants={itemVariants}>
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
                </motion.div>
              </div>

              <AnimatePresence>
                {error.general && (
                  <motion.div
                    className="mt-4 text-center text-sm text-red-600"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {error.general}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className={`mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={loading}
                variants={itemVariants}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: loading ? 1 : 1.03 }}
              >
                {loading ? "Logging in..." : "Login"}
              </motion.button>

              <motion.div className="mt-4 text-center text-sm" variants={itemVariants}>
                <span className="text-gray-900">Tidak Punya Akun ? </span>
                <button
                  type="button"
                  className="text-blue-600 hover:underline font-semibold"
                  onClick={handleGoToRegister}
                >
                  Register sekarang!
                </button>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Right: Illustration */}
          <motion.div
            className="w-full md:w-1/2 flex items-center justify-center"
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              minHeight: 220,
              minWidth: 0,
            }}
          >
            <motion.div
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.92, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.3 }}
              style={{
                minHeight: 220,
                minWidth: 220,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              <img
                src="/15.svg"
                alt="Login Illustration"
                width={320}
                height={220}
                style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
                className="select-none pointer-events-none"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <style jsx global>{`
        @media (max-width: 768px) {
          .max-w-4xl {
            max-width: 100vw !important;
          }
        }
      `}</style>
    </div>
  );
}