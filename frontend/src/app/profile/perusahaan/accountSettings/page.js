"use client";
import React, { useState, useEffect } from "react";
import { FiEdit2, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc"; // Import Google icon
import { IoLogoWhatsapp } from "react-icons/io"; // Import WhatsApp icon
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper: get token from cookie
function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Ambil id perusahaan dari token
function getPerusahaanIdFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || null;
  } catch (e) {
    return null;
  }
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

// SVG Illustration (reuse from alumni)
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

// Helper: Format nomor telp for display (+62 8xxx...) and for backend (08xxx...)
function formatNomorTelpForDisplay(nomor) {
  if (!nomor) return "";
  let n = nomor.trim();
  if (n.startsWith("+62")) {
    n = n.slice(3);
    if (n.startsWith("0")) n = n.slice(1);
    return "+62 " + n;
  }
  if (n.startsWith("62")) {
    n = n.slice(2);
    if (n.startsWith("0")) n = n.slice(1);
    return "+62 " + n;
  }
  if (n.startsWith("0")) {
    return "+62 " + n.slice(1);
  }
  // fallback
  return "+62 " + n;
}

// Helper: Format nomor telp for backend (always 08xxx...)
function formatNomorTelpForBackend(nomor) {
  if (!nomor) return "";
  let n = nomor.trim();
  if (n.startsWith("+62")) {
    n = n.replace(/^\+62/, "0");
  } else if (n.startsWith("62")) {
    n = n.replace(/^62/, "0");
  }
  // If already starts with 0, keep as is
  return n;
}

export default function PerusahaanAccountSettings() {
  // Email perusahaan state, fetched from API
  const [emailPerusahaan, setEmailPerusahaan] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // For email_perusahaan edit
  const [newEmailPerusahaan, setNewEmailPerusahaan] = useState("");
  const [emailPerusahaanError, setEmailPerusahaanError] = useState("");
  const [emailPerusahaanSuccess, setEmailPerusahaanSuccess] = useState(""); // Success message for email_perusahaan

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

  // Store perusahaan profile for PATCH
  const [perusahaanProfile, setPerusahaanProfile] = useState(null);

  // --- nomor_telp state and edit modal ---
  const [nomorTelp, setNomorTelp] = useState("");
  const [showEditNomorTelp, setShowEditNomorTelp] = useState(false);
  const [newNomorTelp, setNewNomorTelp] = useState("");
  const [nomorTelpError, setNomorTelpError] = useState("");
  const [nomorTelpSuccess, setNomorTelpSuccess] = useState("");

  // Fetch perusahaan data on mount
  // GET /perusahaan/me
  useEffect(() => {
    let isMounted = true;
    async function fetchPerusahaan() {
      setLoading(true);
      setFetchError("");
      try {
        const token = getTokenFromCookie("token");
        if (!token) {
          if (isMounted) {
            setFetchError("Token tidak ditemukan. Silakan login ulang.");
            setLoading(false);
          }
          return;
        }
        const res = await fetch("http://localhost:5000/perusahaan/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal mengambil data perusahaan");
        }
        const data = await res.json();
        if (isMounted) {
          setEmailPerusahaan(data.email_perusahaan || "");
          setNewEmailPerusahaan(data.email_perusahaan || "");
          setNomorTelp(data.nomor_telp || "");
          // For input, always show as 8xxx... (remove +62/62/0 prefix)
          let inputNomor = "";
          if (data.nomor_telp) {
            let n = data.nomor_telp.trim();
            if (n.startsWith("+62")) n = n.slice(3);
            else if (n.startsWith("62")) n = n.slice(2);
            else if (n.startsWith("0")) n = n.slice(1);
            inputNomor = n;
          }
          setNewNomorTelp(inputNomor);
          setPerusahaanProfile(data); // Save for PATCH
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || "Gagal mengambil data perusahaan");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchPerusahaan();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save handler for email_perusahaan using PATCH /perusahaan/:id
  async function handleSaveEmailPerusahaan(e) {
    e.preventDefault();
    setEmailPerusahaanError("");
    setEmailPerusahaanSuccess("");
    if (!newEmailPerusahaan.trim()) {
      setEmailPerusahaanError("Email perusahaan tidak boleh kosong");
      return;
    }
    if (!perusahaanProfile) {
      setEmailPerusahaanError("Data profil belum dimuat. Silakan coba lagi.");
      return;
    }
    const token = getTokenFromCookie("token");
    if (!token) {
      setEmailPerusahaanError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    const perusahaanId = perusahaanProfile.id || getPerusahaanIdFromToken(token);
    if (!perusahaanId) {
      setEmailPerusahaanError("ID perusahaan tidak ditemukan di token.");
      return;
    }

    // Compose PATCH body with all required fields, update email_perusahaan
    const patchBody = {
      ...perusahaanProfile,
      email_perusahaan: newEmailPerusahaan,
    };

    try {
      const patchRes = await fetch(`http://localhost:5000/perusahaan/${perusahaanId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchBody),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengubah email perusahaan");
      }
      setEmailPerusahaan(newEmailPerusahaan);
      setShowEditEmail(false);
      setEmailPerusahaanError("");
      setEmailPerusahaanSuccess("Email perusahaan berhasil diubah.");
      setPerusahaanProfile(prev => prev ? { ...prev, email_perusahaan: newEmailPerusahaan } : prev);
      // Show toastify success
      toast.success("Email perusahaan berhasil diubah.");
    } catch (err) {
      setEmailPerusahaanError(err.message || "Gagal mengubah email perusahaan");
      // Show toastify error
      toast.error(err.message || "Gagal mengubah email perusahaan");
    }
  }

  // Save handler for nomor_telp using PATCH /perusahaan/:id
  async function handleSaveNomorTelp(e) {
    e.preventDefault();
    setNomorTelpError("");
    setNomorTelpSuccess("");
    if (!newNomorTelp.trim()) {
      setNomorTelpError("Nomor WhatsApp tidak boleh kosong");
      return;
    }
    // Only allow 8xxxxxxxxxx (user only types 8...)
    if (!/^8[1-9][0-9]{6,11}$/.test(newNomorTelp.trim())) {
      setNomorTelpError("Format nomor WhatsApp tidak valid. Masukkan tanpa 0 atau +62, cukup 8xxx...");
      return;
    }
    if (!perusahaanProfile) {
      setNomorTelpError("Data profil belum dimuat. Silakan coba lagi.");
      return;
    }
    const token = getTokenFromCookie("token");
    if (!token) {
      setNomorTelpError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    const perusahaanId = perusahaanProfile.id || getPerusahaanIdFromToken(token);
    if (!perusahaanId) {
      setNomorTelpError("ID perusahaan tidak ditemukan di token.");
      return;
    }

    // Compose PATCH body with all required fields, update nomor_telp
    // Always send as 08xxx... to backend
    const nomorTelpForBackend = "0" + newNomorTelp.trim();
    const patchBody = {
      ...perusahaanProfile,
      nomor_telp: nomorTelpForBackend,
    };

    try {
      const patchRes = await fetch(`http://localhost:5000/perusahaan/${perusahaanId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchBody),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengubah nomor WhatsApp");
      }
      setNomorTelp(nomorTelpForBackend);
      setShowEditNomorTelp(false);
      setNomorTelpError("");
      setNomorTelpSuccess("Nomor WhatsApp berhasil diubah.");
      setPerusahaanProfile(prev => prev ? { ...prev, nomor_telp: nomorTelpForBackend } : prev);
      // Show toastify success
      toast.success("Nomor WhatsApp berhasil diubah.");
    } catch (err) {
      setNomorTelpError(err.message || "Gagal mengubah nomor WhatsApp");
      // Show toastify error
      toast.error(err.message || "Gagal mengubah nomor WhatsApp");
    }
  }

  // Password change handler using checkoldpassword and PATCH /perusahaan/:id
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
    if (!perusahaanProfile) {
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
      const checkRes = await fetch("http://localhost:5000/perusahaan/me/checkoldpassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword: currentPassword }),
      });
      if (!checkRes.ok) {
        const err = await checkRes.json().catch(() => ({}));
        throw new Error(err.msg || err.message || "Password lama salah");
      }
    } catch (err) {
      setPasswordError(err.message || "Password lama salah");
      // Show toastify error
      toast.error(err.message || "Password lama salah");
      return;
    }

    // 2. PATCH perusahaan profile with new password
    try {
      const perusahaanId = perusahaanProfile.id || getPerusahaanIdFromToken(token);
      if (!perusahaanId) {
        setPasswordError("ID perusahaan tidak ditemukan di token.");
        return;
      }
      // Compose PATCH body with all required fields
      const patchBody = {
        ...perusahaanProfile,
        password: newPassword,
        confPassword: confirmPassword,
      };
      const patchRes = await fetch(`http://localhost:5000/perusahaan/${perusahaanId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchBody),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.msg || err.message || "Gagal mengubah password");
      }
      setPasswordSuccess("Password berhasil diubah.");
      setShowEditPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      // Show toastify success
      toast.success("Password berhasil diubah.");
    } catch (err) {
      setPasswordError(err.message || "Gagal mengubah password");
      // Show toastify error
      toast.error(err.message || "Gagal mengubah password");
    }
  }

  // Handler for Google connect (dummy for now)
  function handleConnectGoogle() {
    // TODO: Implement Google OAuth flow
    alert("Fitur hubungkan ke akun Google belum diimplementasikan.");
  }

  return (
    <>
      <ToastContainer />
      <div className="max-w-2xl mx-auto mt-8 bg-white rounded-lg shadow border border-gray-200 relative top-14 mb-20">
        {/* Header */}
        <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
          <h1 className="text-2xl font-semibold text-gray-700 mb-2">Account settings</h1>
          <div className="flex flex-row items-center gap-4">
            <AccountSettingsIllustration />
            {/* Button Hubungkan ke Google */}
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 shadow-sm text-gray-700 font-medium"
              onClick={handleConnectGoogle}
              title="Hubungkan ke akun Google Anda"
            >
              <FcGoogle className="w-5 h-5" />
              <span>Hubungkan ke akun Google Anda</span>
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-2" />
        {/* Email & password section */}
        <div className="px-6 py-8">
          <div className="text-lg font-semibold text-gray-800 mb-6">Email perusahaan &amp; password</div>
          {loading ? (
            <div className="text-gray-500">Memuat data...</div>
          ) : fetchError ? (
            <div className="text-red-500 text-sm mb-4">{fetchError}</div>
          ) : (
            <>
              {/* Email perusahaan row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Email perusahaan</div>
                  <div className="text-gray-800">{emailPerusahaan}</div>
                </div>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  title="Edit email perusahaan"
                  onClick={() => {
                    setNewEmailPerusahaan(emailPerusahaan);
                    setEmailPerusahaanError("");
                    setEmailPerusahaanSuccess("");
                    setShowEditEmail(true);
                  }}
                  tabIndex={0}
                  type="button"
                >
                  <FiEdit2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {emailPerusahaanSuccess && (
                <div className="text-green-600 text-sm mb-4">{emailPerusahaanSuccess}</div>
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

        {/* Email Perusahaan Edit Modal */}
        <Modal open={showEditEmail} onClose={() => setShowEditEmail(false)}>
          <form onSubmit={handleSaveEmailPerusahaan}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email perusahaan
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
                value={newEmailPerusahaan}
                onChange={e => setNewEmailPerusahaan(e.target.value)}
                autoFocus
              />
              {emailPerusahaanError && (
                <div className="text-xs text-red-500 mt-1">{emailPerusahaanError}</div>
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

      {/* Nomor WhatsApp Section (di luar container) */}
      <div className="max-w-2xl mx-auto mt-6 mb-10 px-6">
        <div className="flex items-center justify-between bg-white rounded-lg shadow border border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <IoLogoWhatsapp className="text-green-500 w-7 h-7" />
            <div>
              <div className="text-xs text-gray-500 mb-1">Nomor WhatsApp</div>
              <div className="text-gray-800 text-base">
                {loading ? (
                  <span className="text-gray-400">Memuat...</span>
                ) : nomorTelp ? (
                  formatNomorTelpForDisplay(nomorTelp)
                ) : (
                  <span className="text-gray-400 italic">Belum diisi</span>
                )}
              </div>
              {nomorTelpSuccess && (
                <div className="text-green-600 text-xs mt-1">{nomorTelpSuccess}</div>
              )}
            </div>
          </div>
          <button
            className="p-2 rounded hover:bg-gray-100"
            title="Edit nomor WhatsApp"
            onClick={() => {
              // For input, always show as 8xxx... (remove +62/62/0 prefix)
              let inputNomor = "";
              if (nomorTelp) {
                let n = nomorTelp.trim();
                if (n.startsWith("+62")) n = n.slice(3);
                else if (n.startsWith("62")) n = n.slice(2);
                else if (n.startsWith("0")) n = n.slice(1);
                inputNomor = n;
              }
              setNewNomorTelp(inputNomor);
              setNomorTelpError("");
              setNomorTelpSuccess("");
              setShowEditNomorTelp(true);
            }}
            tabIndex={0}
            type="button"
          >
            <FiEdit2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Edit Nomor WhatsApp Modal */}
      <Modal open={showEditNomorTelp} onClose={() => setShowEditNomorTelp(false)}>
        <form onSubmit={handleSaveNomorTelp}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp
            </label>
            <div className="flex items-center">
              <span className="inline-block px-2 py-2 bg-gray-100 border border-gray-300 rounded-l text-gray-700 select-none">
                +62
              </span>
              <input
                type="tel"
                className="w-full border border-gray-300 rounded-r px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 text-black"
                value={newNomorTelp}
                onChange={e => {
                  // Only allow numbers, max 13 digits
                  let val = e.target.value.replace(/[^0-9]/g, "");
                  if (val.length > 13) val = val.slice(0, 13);
                  setNewNomorTelp(val);
                }}
                placeholder="81234567890"
                autoFocus
                style={{ borderLeft: "none" }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Masukkan nomor tanpa 0 atau +62 di depan, cukup 8xxx...
            </div>
            {nomorTelpError && (
              <div className="text-xs text-red-500 mt-1">{nomorTelpError}</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => setShowEditNomorTelp(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
