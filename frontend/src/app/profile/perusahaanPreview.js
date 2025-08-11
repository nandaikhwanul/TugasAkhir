"use client";
import { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper untuk mengambil token dari cookie
function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Helper untuk resolve URL logo_perusahaan ke localhost:5000/uploads jika perlu
function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `ttps://tugasakhir-production-6c6c.up.railway.app${logo_perusahaan}`;
  }
  return `ttps://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo_perusahaan}`;
}

// Helper untuk mengambil inisial dari nama perusahaan
function getInitials(name) {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0][0]?.toUpperCase() || "";
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Dummy illustration SVG (replace with your own or use an <img src="..." /> if you have the asset)
function ProfileIllustration() {
  return (
    <svg width="160" height="90" viewBox="0 0 320 180" fill="none">
      <rect width="320" height="180" rx="12" fill="#F5F6FA" />
      <g>
        <circle cx="60" cy="60" r="24" fill="#E0E7FF" />
        <rect x="100" y="40" width="60" height="16" rx="8" fill="#C7D2FE" />
        <rect x="100" y="64" width="100" height="12" rx="6" fill="#E0E7FF" />
        <rect x="100" y="84" width="80" height="12" rx="6" fill="#E0E7FF" />
      </g>
    </svg>
  );
}

// Modal untuk update profil perusahaan
function PerusahaanUpdateModal({ onClose, initialProfile, onSaved }) {
  const [form, setForm] = useState({
    nama_perusahaan: "",
    nama_brand: "",
    jumlah_karyawan: "",
    email_perusahaan: "",
    alamat: "",
    bidang_perusahaan: "",
    // nomor_telp: "", // HAPUS
    logo_perusahaan: "",
    deskripsi_perusahaan: "",
  });
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [perusahaanId, setPerusahaanId] = useState(null);

  useEffect(() => {
    if (initialProfile) {
      setForm({
        nama_perusahaan: initialProfile.nama_perusahaan || "",
        nama_brand: initialProfile.nama_brand || "",
        jumlah_karyawan: initialProfile.jumlah_karyawan || "",
        email_perusahaan: initialProfile.email_perusahaan || "",
        alamat: initialProfile.alamat || "",
        bidang_perusahaan: initialProfile.bidang_perusahaan || "",
        // nomor_telp: initialProfile.nomor_telp || "", // HAPUS
        logo_perusahaan: initialProfile.logo_perusahaan || "",
        deskripsi_perusahaan: initialProfile.deskripsi_perusahaan || "",
      });
      setPerusahaanId(initialProfile._id || initialProfile.id || initialProfile.perusahaanId || null);
    }
  }, [initialProfile]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getTokenFromCookie("token");
      if (!token) throw new Error("Token not found");
      if (!perusahaanId) throw new Error("ID perusahaan tidak ditemukan");

      let logo_perusahaan_url = form.logo_perusahaan || "";

      // PATCH logo_perusahaan ke endpoint PATCH /perusahaan/:id jika ada file baru
      if (avatarFile && perusahaanId) {
        const formData = new FormData();
        formData.append("logo_perusahaan", avatarFile);
        const uploadRes = await fetch(`ttps://tugasakhir-production-6c6c.up.railway.app/perusahaan/${perusahaanId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.message || "Gagal upload logo perusahaan");
        }
        const uploadData = await uploadRes.json();
        logo_perusahaan_url = uploadData.logo_perusahaan || logo_perusahaan_url;
      }

      // PATCH profil ke endpoint /perusahaan/:id
      const res = await fetch(`ttps://tugasakhir-production-6c6c.up.railway.app/perusahaan/${perusahaanId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_perusahaan: form.nama_perusahaan,
          nama_brand: form.nama_brand,
          jumlah_karyawan: form.jumlah_karyawan,
          email_perusahaan: form.email_perusahaan,
          alamat: form.alamat,
          bidang_perusahaan: form.bidang_perusahaan,
          // nomor_telp: form.nomor_telp, // HAPUS
          logo_perusahaan: logo_perusahaan_url,
          deskripsi_perusahaan: form.deskripsi_perusahaan,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menyimpan data");
      }
      // Show toast success
      toast.success("Profil perusahaan berhasil disimpan!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      if (onSaved) onSaved();
      // Refresh browser setelah simpan, delay agar toast sempat tampil
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
      // Tidak perlu panggil onClose, karena reload akan menutup modal
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan data", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-40 backdrop-blur-[1px]">
      <ToastContainer />
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md relative flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="font-semibold text-lg">Edit Profil Perusahaan</div>
          <button
            className="text-gray-400 hover:text-gray-700 text-xl"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="flex flex-col items-center mt-4">
          <div
            className="w-36 h-36 rounded-full bg-[#1D4F7B] flex items-center justify-center shadow-md mb-2 relative group transition-all"
            style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)" }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Logo"
                className="w-full h-full object-cover rounded-full"
              />
            ) : form.logo_perusahaan ? (
              <img
                src={getLogoUrl(form.logo_perusahaan)}
                alt="Logo"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span
                className="flex items-center justify-center w-full h-full rounded-full text-5xl font-bold text-white select-none"
                style={{
                  background: "#1D4F7B",
                  userSelect: "none",
                  letterSpacing: "1px",
                }}
                aria-label={form.nama_perusahaan}
              >
                {getInitials(form.nama_perusahaan)}
              </span>
            )}
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center backdrop-blur-[4px] bg-opacity-0 group-hover:bg-opacity-50 transition group-hover:opacity-100 opacity-0 rounded-full cursor-pointer"
              style={{ transition: "opacity 0.2s" }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              tabIndex={0}
              aria-label="Ubah logo perusahaan"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 20 20" stroke="white">
                <path d="M4 13.5V16h2.5l7.06-7.06a1 1 0 0 0 0-1.41l-2.09-2.09a1 1 0 0 0-1.41 0L4 13.5z" strokeWidth="1.5" />
              </svg>
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
          </div>
        </div>
        <form
          className="px-6 pt-2 pb-4 flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            overflowX: "hidden", // HILANGKAN SCROLL X
          }}
          onSubmit={handleSave}
          id="perusahaan-update-form"
        >
          <style jsx>{`
            form::-webkit-scrollbar {
              display: none;
            }
            form {
              overflow-x: hidden !important;
            }
          `}</style>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nama Perusahaan<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_perusahaan"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-black placeholder-black"
              value={form.nama_perusahaan}
              onChange={handleChange}
              required
              style={{ color: "#000" }}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nama Brand
            </label>
            <input
              type="text"
              name="nama_brand"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-black placeholder-black"
              value={form.nama_brand}
              onChange={handleChange}
              style={{ color: "#000" }}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jumlah Karyawan
            </label>
            <input
              type="text"
              name="jumlah_karyawan"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-black placeholder-black"
              value={form.jumlah_karyawan}
              onChange={handleChange}
              style={{ color: "#000" }}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Perusahaan<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email_perusahaan"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-black placeholder-black"
              value={form.email_perusahaan}
              onChange={handleChange}
              required
              style={{ color: "#000" }}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <input
              type="text"
              name="alamat"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-black placeholder-black"
              value={form.alamat}
              onChange={handleChange}
              style={{ color: "#000" }}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Bidang Perusahaan
            </label>
            <input
              type="text"
              name="bidang_perusahaan"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-black placeholder-black"
              value={form.bidang_perusahaan}
              onChange={handleChange}
              style={{ color: "#000" }}
            />
          </div>
          {/* HAPUS Kontak HRD */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Deskripsi Perusahaan
            </label>
            <textarea
              name="deskripsi_perusahaan"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-black placeholder-black"
              value={form.deskripsi_perusahaan}
              onChange={handleChange}
              rows={3}
              style={{ color: "#000" }}
            />
          </div>
        </form>
        <div className="px-6 py-4 border-t bg-white sticky bottom-0 z-10">
          <button
            type="submit"
            form="perusahaan-update-form"
            className={`w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Komponen utama: Preview profil perusahaan
function PerusahaanPreview() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const token = getTokenFromCookie("token");
        if (!token) throw new Error("Token not found");
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Gagal mengambil data perusahaan");
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message || "Gagal mengambil data perusahaan");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [showModal]);

  function openModal() {
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
  }
  function handleSaved() {
    setShowModal(false);
    // Tidak perlu reload di sini, sudah di handle di modal
  }

  return (
    <>
      <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm mt-20 mb-5" style={{ overflowX: "hidden" }}>
        <div className="p-6 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">Profile</h1>
        <div className="flex-shrink-0">
          {/* Bebas SVG illustration */}
          <svg width="160" height="90" viewBox="0 0 320 180" fill="none">
            <rect width="320" height="180" rx="16" fill="#F5F6FA" />
            <g>
              <circle cx="60" cy="60" r="32" fill="#E0E7FF" />
              <rect x="110" y="48" width="80" height="18" rx="9" fill="#C7D2FE" />
              <rect x="110" y="76" width="120" height="12" rx="6" fill="#E0E7FF" />
              <rect x="110" y="96" width="100" height="12" rx="6" fill="#E0E7FF" />
              <ellipse cx="240" cy="60" rx="24" ry="16" fill="#FDE68A" />
              <rect x="220" y="110" width="60" height="10" rx="5" fill="#FCA5A5" />
            </g>
          </svg>
        </div>
        </div>
        <hr className="my-0 border-gray-200" />
        <div className="p-6">
          <div className="flex items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 mr-2">Informasi Perusahaan</h2>
            <button
              className="text-gray-500 hover:text-blue-600 p-1 rounded transition"
              title="Edit"
              aria-label="Edit"
              tabIndex={0}
              onClick={openModal}
              type="button"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                <path d="M4 13.5V16h2.5l7.06-7.06a1 1 0 0 0 0-1.41l-2.09-2.09a1 1 0 0 0-1.41 0L4 13.5z" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <div className="text-gray-500 text-sm mb-6">
            Lengkapi profil perusahaan Anda untuk mendapatkan kandidat terbaik dan meningkatkan kepercayaan.
          </div>
          {loading ? (
            <div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : profile ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Nama Perusahaan</div>
                <div className="text-gray-900">
                  {profile.nama_perusahaan ? profile.nama_perusahaan : <span className="text-gray-400">--</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Nama Brand</div>
                <div className="text-gray-900">
                  {profile.nama_brand ? profile.nama_brand : <span className="text-gray-400">--</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Jumlah Karyawan</div>
                <div className="text-gray-900">
                  {profile.jumlah_karyawan ? profile.jumlah_karyawan : <span className="text-gray-400">--</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Email Perusahaan</div>
                <div className="text-gray-900">
                  {profile.email_perusahaan ? profile.email_perusahaan : <span className="text-gray-400">--</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Alamat</div>
                <div className="text-gray-900">
                  {profile.alamat ? profile.alamat : <span className="text-gray-400">--</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Bidang Perusahaan</div>
                <div className="text-gray-900">
                  {profile.bidang_perusahaan ? profile.bidang_perusahaan : <span className="text-gray-400">--</span>}
                </div>
              </div>
              {/* HAPUS Kontak HRD */}
              <div>
                <div className="text-xs text-gray-500 font-medium mb-1">Deskripsi Perusahaan</div>
                <div className="text-gray-900">
                  {profile.deskripsi_perusahaan ? profile.deskripsi_perusahaan : <span className="text-gray-400">--</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No profile data.</div>
          )}
        </div>
      </div>
      {/* Modal perusahaanUpdate */}
      {showModal && (
        <PerusahaanUpdateModal
          onClose={closeModal}
          initialProfile={profile}
          onSaved={handleSaved}
        />
      )}
      <ToastContainer />
    </>
  );
}

export default PerusahaanPreview;
