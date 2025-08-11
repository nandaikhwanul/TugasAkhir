"use client";
import { useState, useEffect } from "react";
import { FiEdit2 } from "react-icons/fi";
import { FiEye, FiEyeOff } from "react-icons/fi"; // Import eye icons

// Helper: get token from cookie
function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// SVG Illustration (cat & dog, black & white, dot style)
function AccountSettingsIllustration() {
  return (
    <svg width="90" height="70" viewBox="0 0 90 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
      <g stroke="#222" strokeWidth="2" strokeLinecap="round">
        {/* Cat */}
        <ellipse cx="70" cy="30" rx="15" ry="18" fill="#fff" />
        <ellipse cx="70" cy="30" rx="10" ry="13" fill="url(#dots)" />
        <path d="M60 15 Q65 5 70 15 Q75 5 80 15" />
        <path d="M80 45 Q85 55 80 65" />
        <path d="M60 45 Q55 55 60 65" />
        <path d="M75 48 Q78 60 90 60" />
        <path d="M65 48 Q62 60 50 60" />
        {/* Dog */}
        <ellipse cx="50" cy="40" rx="10" ry="8" fill="#fff" />
        <ellipse cx="50" cy="40" rx="7" ry="5" fill="url(#dots2)" />
        <path d="M40 40 Q35 35 40 30 Q45 25 50 30" />
        <path d="M45 48 Q43 55 35 55" />
        <path d="M55 48 Q57 55 65 55" />
        <circle cx="47" cy="38" r="1" fill="#222" />
        <circle cx="53" cy="38" r="1" fill="#222" />
        <path d="M48 43 Q50 45 52 43" />
      </g>
      <defs>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="4" height="4">
          <circle cx="1" cy="1" r="1" fill="#222" />
        </pattern>
        <pattern id="dots2" patternUnits="userSpaceOnUse" width="3" height="3">
          <circle cx="1" cy="1" r="0.7" fill="#222" />
        </pattern>
      </defs>
    </svg>
  );
}

// Modal component
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  // Email state, fetched from API
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // For email edit
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(""); // Success message for email

  // For password edit
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(""); // Success message

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Store alumni profile for PATCH
  const [alumniProfile, setAlumniProfile] = useState(null);

  // Fetch alumni data on mount
  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true);
      setFetchError("");
      try {
        const token = getTokenFromCookie("token");
        if (!token) {
          setFetchError("Token tidak ditemukan. Silakan login ulang.");
          setLoading(false);
          return;
        }
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal mengambil data alumni");
        }
        const data = await res.json();
        setEmail(data.email || "");
        setNewEmail(data.email || "");
        setAlumniProfile(data); // Save for PATCH
      } catch (err) {
        setFetchError(err.message || "Gagal mengambil data alumni");
      } finally {
        setLoading(false);
      }
    }
    fetchAlumni();
  }, []);

  // Save handler for email using PATCH /alumni/me/profil
  async function handleSaveEmail(e) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!newEmail.trim()) {
      setEmailError("Email tidak boleh kosong");
      return;
    }
    if (!alumniProfile) {
      setEmailError("Data profil belum dimuat. Silakan coba lagi.");
      return;
    }
    const token = getTokenFromCookie("token");
    if (!token) {
      setEmailError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }

    // Compose PATCH body with all required fields, update email
    const patchBody = {
      name: alumniProfile.name || "",
      nim: alumniProfile.nim || "",
      nohp: alumniProfile.nohp || "",
      alamat: alumniProfile.alamat || "",
      program_studi: alumniProfile.program_studi || "",
      tahun_lulus: alumniProfile.tahun_lulus || "",
      email: newEmail,
      foto_profil: alumniProfile.foto_profil || "",
      // password and confPassword are not sent for email change
    };

    try {
      const patchRes = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchBody),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengubah email");
      }
      setEmail(newEmail);
      setShowEditEmail(false);
      setEmailError("");
      setEmailSuccess("Email berhasil diubah.");
      // Optionally update alumniProfile with new email
      setAlumniProfile(prev => prev ? { ...prev, email: newEmail } : prev);
    } catch (err) {
      setEmailError(err.message || "Gagal mengubah email");
    }
  }

  // Password change handler using check-old-password and PATCH /alumni/me/profil
  async function handleSavePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Semua field wajib diisi");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru dan konfirmasi tidak sama");
      return;
    }
    if (!alumniProfile) {
      setPasswordError("Data profil belum dimuat. Silakan coba lagi.");
      return;
    }
    const token = getTokenFromCookie("token");
    if (!token) {
      setPasswordError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }

    // 1. Check old password
    try {
      const checkRes = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/check-old-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword: currentPassword }),
      });
      if (!checkRes.ok) {
        const err = await checkRes.json().catch(() => ({}));
        throw new Error(err.message || "Password lama salah");
      }
    } catch (err) {
      setPasswordError(err.message || "Password lama salah");
      return;
    }

    // 2. PATCH alumni profile with new password
    try {
      // Compose PATCH body with all required fields
      const patchBody = {
        name: alumniProfile.name || "",
        nim: alumniProfile.nim || "",
        nohp: alumniProfile.nohp || "",
        alamat: alumniProfile.alamat || "",
        program_studi: alumniProfile.program_studi || "",
        tahun_lulus: alumniProfile.tahun_lulus || "",
        email: alumniProfile.email || "",
        foto_profil: alumniProfile.foto_profil || "",
        password: newPassword,
        confPassword: confirmPassword,
      };
      const patchRes = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchBody),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengubah password");
      }
      setPasswordSuccess("Password berhasil diubah.");
      setShowEditPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (err) {
      setPasswordError(err.message || "Gagal mengubah password");
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Account settings</h1>
        <AccountSettingsIllustration />
      </div>
      <div className="border-t border-gray-200 mt-2" />
      {/* Email & password section */}
      <div className="px-6 py-8">
        <div className="text-lg font-semibold text-gray-800 mb-6">Email &amp; password</div>
        {loading ? (
          <div className="text-gray-500">Memuat data...</div>
        ) : fetchError ? (
          <div className="text-red-500 text-sm mb-4">{fetchError}</div>
        ) : (
          <>
            {/* Email row */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">Email address</div>
                <div className="text-gray-800">{email}</div>
              </div>
              <button
                className="p-2 rounded hover:bg-gray-100"
                title="Edit email"
                onClick={() => {
                  setNewEmail(email);
                  setEmailError("");
                  setEmailSuccess("");
                  setShowEditEmail(true);
                }}
                tabIndex={0}
                type="button"
              >
                <FiEdit2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {emailSuccess && (
              <div className="text-green-600 text-sm mb-4">{emailSuccess}</div>
            )}
            <hr className="border-gray-200 mb-6" />
            {/* Password row */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Password</div>
                <div className="text-gray-800">********</div>
              </div>
              <button
                className="p-2 rounded hover:bg-gray-100"
                title="Edit password"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                  setPasswordSuccess("");
                  setShowEditPassword(true);
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
                tabIndex={0}
                type="button"
              >
                <FiEdit2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {passwordSuccess && (
              <div className="text-green-600 text-sm mt-4">{passwordSuccess}</div>
            )}
          </>
        )}
      </div>

      {/* Email Edit Modal */}
      <Modal open={showEditEmail} onClose={() => setShowEditEmail(false)}>
        <form onSubmit={handleSaveEmail}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              autoFocus
            />
            {emailError && (
              <div className="text-xs text-red-500 mt-1">{emailError}</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => setShowEditEmail(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Edit Modal */}
      <Modal open={showEditPassword} onClose={() => setShowEditPassword(false)}>
        <form onSubmit={handleSavePassword}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password saat ini
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black pr-10"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowCurrentPassword(v => !v)}
                aria-label={showCurrentPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password baru
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black pr-10"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewPassword(v => !v)}
                aria-label={showNewPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi password baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black pr-10"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(v => !v)}
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          {passwordError && (
            <div className="text-xs text-red-500 mb-2">{passwordError}</div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => setShowEditPassword(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
