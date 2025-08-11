"use client";
import { useEffect, useState, useRef } from "react";
import { FiEdit2, FiLogOut } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper: get token from cookie
function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Helper untuk resolve URL foto_profil alumni ke localhost:5000/uploads jika perlu
function getProfileImageUrl(foto_profil) {
  if (!foto_profil) return "";
  if (/^https?:\/\//.test(foto_profil)) return foto_profil;
  if (foto_profil.startsWith("/uploads/")) {
    return `ttps://tugasakhir-production-6c6c.up.railway.app${foto_profil}`;
  }
  return `ttps://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/${foto_profil}`;
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

// Helper untuk menghapus cookie token (mengikuti code referensi)
function removeTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie =
    "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
}

// Menu links untuk alumni
const alumniMenuLinks = [
  { href: "/profile", label: "Profile", key: "profile" },
  // { href: "/profile/alumni/jobActivity", label: "Job activity", key: "jobActivity" }, // dihapus
  { href: "/profile/alumni/accountSettings", label: "Account settings", key: "accountSettings" },
];

// Menu links untuk perusahaan (sesuai gambar)
const perusahaanMenuLinks = [
  { href: "/profile/perusahaanPreview", label: "INFORMASI UTAMA", key: "perusahaanPreview" },
  { href: "/profile/perusahaan/accountSettings", label: "KEAMANAN AKUN", key: "accountSettings" },
  { href: "/profile/perusahaan/notifikasi", label: "NOTIFIKASI", key: "notifikasi" },
  { href: "/profile/perusahaan/profilPerusahaan", label: "PROFIL PERUSAHAAN", key: "profilPerusahaan" },
];

export default function SidebarProfile({ onMenuClick, activeMenu }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [role, setRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch profile (alumni or perusahaan) on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      try {
        const token = getTokenFromCookie("token");
        if (!token) {
          if (isMounted) {
            setProfile(null);
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // Cek role dari endpoint alumni/me dan perusahaan/me
        // Cek perusahaan dulu, jika gagal baru cek alumni
        let res, data;
        try {
          res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (err) {
          res = { ok: false, status: 0 };
        }

        if (res.ok) {
          data = await res.json();
          if (isMounted) {
            setProfile(data);
            setRole("perusahaan");
            setLoading(false);
          }
          return;
        }
        try {
          res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (err) {
          res = { ok: false, status: 0 };
        }
        if (res.ok) {
          data = await res.json();
          if (isMounted) {
            setProfile(data);
            setRole("alumni");
            setLoading(false);
          }
          return;
        }
        if (isMounted) {
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        if (isMounted) {
          setProfile(null);
          setRole(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine avatar URL (if available)
  let avatarUrl = "";
  if (role === "perusahaan" && profile && profile.logo_perusahaan) {
    avatarUrl = getLogoUrl(profile.logo_perusahaan);
  } else if (role === "alumni" && profile && profile.foto_profil) {
    avatarUrl = getProfileImageUrl(profile.foto_profil);
  }

  // Determine display name and info
  let displayName = loading ? "Loading..." : "Unknown User";
  let displayInfo = "";
  if (role === "perusahaan") {
    displayName =
      profile && profile.nama_perusahaan
        ? profile.nama_perusahaan
        : loading
        ? "Loading..."
        : "Unknown Company";
    displayInfo =
      profile && profile.email_perusahaan
        ? profile.email_perusahaan
        : "Perusahaan";
  } else if (role === "alumni") {
    displayName =
      profile && (profile.name || profile.nama)
        ? profile.name || profile.nama
        : loading
        ? "Loading..."
        : "Unknown User";
    displayInfo =
      profile && profile.program_studi && profile.tahun_lulus
        ? `${profile.program_studi} • ${profile.tahun_lulus}`
        : "Student at Politeknik negeri pontianak";
  }

  // Handle edit icon click
  const handleEditPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Handle file input change and upload
  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (role === "alumni" || role === "perusahaan") {
      if (role === "alumni") {
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = async function () {
          if (img.width !== img.height) {
            toast.error("Gambar harus berbentuk kotak (rasio 1:1)");
            URL.revokeObjectURL(objectUrl);
            return;
          }
          URL.revokeObjectURL(objectUrl);
          setUploading(true);
          try {
            const token = getTokenFromCookie("token");
            if (!token) throw new Error("Token not found");
            const formData = new FormData();
            formData.append("foto_profil", file);
            const uploadRes = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/alumni/me/foto-profil", {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });
            if (!uploadRes.ok) {
              const err = await uploadRes.json().catch(() => ({}));
              throw new Error(err.message || "Gagal upload foto profil");
            }
            toast.success("Foto profil berhasil diupdate!", {
              onClose: () => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              },
              autoClose: 1500,
            });
          } catch (err) {
            toast.error(err.message || "Gagal upload foto");
          } finally {
            setUploading(false);
          }
        };
        img.onerror = function () {
          toast.error("File gambar tidak valid");
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
        return;
      }
    }

    setUploading(true);
    try {
      const token = getTokenFromCookie("token");
      if (!token) throw new Error("Token not found");
      const formData = new FormData();
      if (role === "perusahaan") {
        let perusahaanId = null;
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          perusahaanId = payload && (payload.perusahaanId || payload.id || payload._id);
        } catch (e) {
          throw new Error("Gagal membaca ID perusahaan dari token");
        }
        if (!perusahaanId) throw new Error("ID perusahaan tidak ditemukan di token");
        formData.append("logo_perusahaan", file);
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
        toast.success("Logo perusahaan berhasil diupdate!", {
          onClose: () => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          },
          autoClose: 1500,
        });
        return;
      }
    } catch (err) {
      toast.error(err.message || "Gagal upload foto");
    } finally {
      setUploading(false);
    }
  };

  const handleMenuClick = (key) => (e) => {
    e.preventDefault();
    if (onMenuClick) {
      onMenuClick(key);
    }
    // Tutup sidebar jika di mobile/desktop
    setSidebarOpen(false);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    removeTokenCookie();
    window.location.href = "/login";
  };

  let menuLinks = [];
  if (role === "perusahaan") {
    menuLinks = perusahaanMenuLinks;
  } else if (role === "alumni") {
    menuLinks = alumniMenuLinks;
  }

  // Hamburger button handler
  const handleHamburgerClick = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Close sidebar when clicking overlay (mobile/desktop)
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  // --- FIXED SIDEBAR ---
  // Gunakan fixed dan top-0 left-0 h-screen agar sidebar selalu menempel di kiri dan tidak ikut scroll konten
  // Tambahkan z-40 agar di atas konten lain jika perlu
  // Hilangkan mt-16 agar tidak ada margin atas
  // Tambahkan overflow-y-auto agar jika konten sidebar panjang bisa discroll sendiri
  // Tampilkan hamburger di desktop juga
  // Kebawahkan agar tidak ketutup navbar (top-14, asumsikan navbar tinggi 56px)

  return (
    <div>
      <ToastContainer position="top-center" />
      {/* Hamburger button */}
      {!sidebarOpen && (
        <button
          className="fixed top-[70px] left-0 z-50 bg-white border border-gray-300 rounded p-2 shadow hover:bg-gray-100 transition"
          type="button"
          aria-label="Buka sidebar"
          onClick={handleHamburgerClick}
          style={{}}
        >
          {/* Hamburger icon */}
          <span className="block w-6 h-6 relative">
            <span
              className={`absolute left-0 top-1 w-6 h-0.5 bg-gray-700 rounded transition-transform duration-200`}
            />
            <span
              className={`absolute left-0 top-3 w-6 h-0.5 bg-gray-700 rounded transition-opacity duration-200`}
            />
            <span
              className={`absolute left-0 top-5 w-6 h-0.5 bg-gray-700 rounded transition-transform duration-200`}
            />
          </span>
        </button>
      )}
      {/* Overlay for mobile/desktop when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleOverlayClick}
          aria-label="Tutup sidebar"
        />
      )}
      <aside
        className={`
          fixed top-14 left-0 z-50 w-4/5 max-w-xs md:w-72 h-[calc(100vh-56px)] bg-white border-r border-gray-200 flex flex-col items-center py-8 px-4 overflow-y-auto
          transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          boxShadow: sidebarOpen ? "0 2px 16px rgba(0,0,0,0.08)" : undefined,
          overflowX: "hidden", // Prevent horizontal scroll
        }}
        aria-label="Sidebar"
      >
        {/* Hamburger button di kanan atas sidebar saat sidebar open */}
        {sidebarOpen && (
          <button
            className="absolute top-4 right-4 z-50 bg-white border border-gray-300 rounded p-2 shadow hover:bg-gray-100 transition"
            type="button"
            aria-label="Tutup sidebar"
            onClick={handleHamburgerClick}
            style={{}}
          >
            {/* Hamburger icon (X style) */}
            <span className="block w-6 h-6 relative">
              <span
                className={`absolute left-0 top-3 w-6 h-0.5 bg-gray-700 rounded transition-transform duration-200 rotate-45`}
              />
              <span
                className={`absolute left-0 top-3 w-6 h-0.5 bg-gray-700 rounded transition-transform duration-200 -rotate-45`}
              />
            </span>
          </button>
        )}
        {/* Profile Picture and Edit Icon */}
        <div className="relative flex flex-col items-center mb-2">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-5xl mb-2 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
                <path strokeWidth="1.5" d="M4 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
              </svg>
            )}
          </div>
          <button
            className="absolute bottom-2 right-2 bg-white rounded-full border border-gray-300 p-1 hover:bg-gray-100"
            title={uploading ? "Uploading..." : role === "perusahaan" ? "Edit logo" : "Edit photo"}
            tabIndex={0}
            type="button"
            onClick={handleEditPhotoClick}
            disabled={uploading || !role}
          >
            <FiEdit2 className={`w-4 h-4 text-gray-500 ${uploading ? "animate-spin" : ""}`} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading || !role}
          />
        </div>
        <div className="text-center mb-6">
          <div className="text-base text-gray-900 font-semibold">
            {displayName}
          </div>
          <div className="text-sm text-gray-700 font-normal">
            {displayInfo}
          </div>
        </div>
        <hr className="w-full border-gray-200 mb-2" />
        <nav className="w-full">
          <ul className="flex flex-col gap-1">
            {menuLinks.map((link) => (
              <li key={link.key} className="relative">
                {activeMenu === link.key && (
                  <span
                    className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-r z-10"
                    aria-hidden="true"
                  />
                )}
                <a
                  href={link.href}
                  className={`block px-2 py-2 rounded-l border-l-4 transition-colors text-sm focus:outline-none ${
                    activeMenu === link.key
                      ? "font-semibold text-black border-blue-500 bg-gray-50"
                      : "text-gray-700 border-transparent hover:bg-gray-100"
                  }`}
                  onClick={handleMenuClick(link.key)}
                  tabIndex={0}
                  role="button"
                  aria-current={activeMenu === link.key ? "page" : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="w-full flex flex-col mt-8 gap-2">
          <hr className="w-full border-gray-200 mb-2" />
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-gray-700 hover:text-black px-2 py-2 rounded transition-colors cursor-pointer"
            type="button"
          >
            <span className="mr-2">Sign out</span>
            <FiLogOut className="w-5 h-5" />
          </button>
          <button
            className="mt-4 border border-gray-400 rounded w-full py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            type="button"
          >
            Help Center
          </button>
        </div>
      </aside>
    </div>
  );
}
