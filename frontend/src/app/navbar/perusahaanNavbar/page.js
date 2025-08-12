"use client";
import { useEffect, useState, useRef } from "react";
import { FiSettings, FiLogOut } from "react-icons/fi";
import { IoMailOutline, IoSearchOutline } from "react-icons/io5";
import axios from "axios";
import Link from "next/link";
import PesanPerusahaanModal from "../../pesan/page";
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Helper untuk resolve URL foto_profil perusahaan ke localhost:5000/uploads jika perlu
function getProfileImageUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${logo_perusahaan}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo_perusahaan}`;
}

// Helper untuk mengambil inisial dari nama
function getInitials(name) {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() || "";
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Debounce helper
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function PerusahaanNavbar() {
  const [profileImage, setProfileImage] = useState("");
  const [profileName, setProfileName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // State untuk search alumni
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // State untuk modal pesan perusahaan
  const [showPesanModal, setShowPesanModal] = useState(false);

  // Fungsi untuk menghapus cookie token
  function removeTokenCookie() {
    if (typeof document === "undefined") return;
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  }

  // Fungsi untuk menghapus sessionStorage token
  function removeTokenFromSessionStorage() {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem("token");
    }
  }

  // Ambil data perusahaan (foto profil & nama)
  useEffect(() => {
    const token = getTokenFromSessionStorage();
    if (!token) {
      setProfileImage("");
      setProfileName("");
      return;
    }
    let payload = null;
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "perusahaan") {
        setProfileImage("");
        setProfileName("");
        return;
      }
    } catch (e) {
      setProfileImage("");
      setProfileName("");
      return;
    }

    async function fetchProfileImage() {
      try {
        const res = await axios.get("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileImage(getProfileImageUrl(res.data.logo_perusahaan));
        setProfileName(res.data.nama_perusahaan || "");
      } catch (err) {
        setProfileImage("");
        setProfileName("");
      }
    }

    fetchProfileImage();
  }, []);

  // Close dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close search dropdown jika klik di luar
  const searchDropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false);
      }
    }
    if (showSearchDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchDropdown]);

  const handleLogout = () => {
    removeTokenCookie();
    removeTokenFromSessionStorage();
    window.location.reload();
  };

  // Komponen avatar inisial
  function InitialsAvatar({ name }) {
    const initials = getInitials(name);
    return (
      <div
        className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-base"
        style={{ userSelect: "none" }}
        aria-label={name}
      >
        {initials || "?"}
      </div>
    );
  }

  // Emoji animasi berganti-ganti (global, di luar komponen)
  const emojiList = ["🏢", "💼", "🚀", "🌟", "📈", "🤝", "🧑‍💼", "🏆"];
  // Komponen global AnimatedEmoji
  function AnimatedEmoji() {
    const [index, setIndex] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % emojiList.length);
      }, 800);
      return () => clearInterval(interval);
    }, []);
    return (
      <span
        className="text-2xl transition-all duration-300 ease-in-out"
        aria-label="Animated Emoji"
        role="img"
        style={{ marginLeft: "6px" }}
      >
        {emojiList[index]}
      </span>
    );
  }

  // Live search alumni (tanpa perlu tekan enter)
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    // Hanya search jika query tidak kosong
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    let isCancelled = false;
    async function fetchAlumni() {
      setSearchLoading(true);
      setSearchError("");
      setShowSearchDropdown(true);
      const token = getTokenFromSessionStorage();
      if (!token) {
        setSearchError("Token tidak ditemukan. Silakan login ulang.");
        setSearchLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          `https://tugasakhir-production-6c6c.up.railway.app/perusahaan/alumni?q=${encodeURIComponent(debouncedSearchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!isCancelled) {
          setSearchResults(res.data.data || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setSearchError(
            err?.response?.data?.message ||
              "Terjadi kesalahan saat mencari alumni."
          );
          setSearchResults([]);
        }
      } finally {
        if (!isCancelled) setSearchLoading(false);
      }
    }

    fetchAlumni();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  // Tampilkan dropdown search jika input diisi dan difokuskan
  const handleInputFocus = () => {
    if (searchResults.length > 0 || searchError) {
      setShowSearchDropdown(true);
    }
  };

  // Optional: tetap support submit pakai enter, tapi tidak wajib
  const handleSearchAlumni = (e) => {
    e.preventDefault();
    // Tidak perlu fetch lagi, karena sudah live search
    if (!searchQuery.trim()) {
      setShowSearchDropdown(false);
      setSearchResults([]);
      setSearchError("");
    } else {
      setShowSearchDropdown(true);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      {/* Logo */}
      <div className="absolute z-10 left-6 top-1/2 -translate-y-1/2 flex items-center">
        {/* Search icon di kiri logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <img
            alt="Logo"
            className="h-8 w-8 object-contain"
            style={{ display: "block" }}
          />
          <span className="font-bold text-lg text-blue-700 hidden sm:inline">AlumniConnect</span>
        </Link>
      </div>
      <div className="max-w-full px-4 relative right-20">
        <div className="flex justify-between h-16 items-center">
          {/* Navbar perusahaan khusus */}
          <div className="flex-1 flex justify-center relative left-28">
            <AnimatedEmoji />
            <ul className="flex space-x-10 items-center">
              <li>
                <Link href="/lowonganPerusahaanList" className="text-black font-medium text-sm hover:text-blue-600">
                  Lowongan Saya
                </Link>
              </li>
              <li>
                <Link href="/buatLowongan" className="text-black text-sm hover:text-blue-600">
                  Buat Lowongan
                </Link>
              </li>
              {/* Tambahkan button Forum */}
              <li>
                <Link href="/forumalumni" className="text-black text-sm hover:text-blue-600">
                  Forum
                </Link>
              </li>
            </ul>
          </div>
          {/* Profile & Search */}
          <div className="flex items-center">
            <div className="flex items-center relative right-10" ref={searchDropdownRef}>
              <form onSubmit={handleSearchAlumni} className="relative w-[400px]">
                <input
                  type="text"
                  placeholder="Cari alumni..."
                  className="border border-gray-300 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all w-full"
                  style={{ width: "400px" }}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchError("");
                    setShowSearchDropdown(true);
                  }}
                  onFocus={handleInputFocus}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2"
                  aria-label="Search"
                  disabled={searchLoading || !searchQuery.trim()}
                  tabIndex={-1}
                >
                  <IoSearchOutline className="text-2xl text-gray-500" />
                </button>
                {/* Dropdown hasil search */}
                {showSearchDropdown && (
                  <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">Mencari...</div>
                    ) : searchError ? (
                      <div className="px-4 py-3 text-red-600 text-sm">{searchError}</div>
                    ) : searchResults.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {searchResults.map((alumni) => (
                          <li key={alumni._id} className="flex items-center px-4 py-2 hover:bg-gray-50">
                            <img
                              src={
                                alumni.foto_profil
                                  ? alumni.foto_profil.startsWith("http")
                                    ? alumni.foto_profil
                                    : `https://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/${alumni.foto_profil}`
                                  : "/default-profile.png"
                              }
                              alt={alumni.name}
                              className="h-8 w-8 rounded-full object-cover mr-3 border"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-800 truncate">
                                {alumni.name}
                              </div>
                              <div className="text-gray-500 text-xs truncate">
                                {alumni.email}
                              </div>
                              {alumni.tahun_lulus && (
                                <div className="text-gray-400 text-xs">
                                  Lulus: {alumni.tahun_lulus}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      searchQuery.trim() !== "" && (
                        <div className="px-4 py-3 text-gray-500 text-sm">Tidak ada alumni ditemukan.</div>
                      )
                    )}
                  </div>
                )}
              </form>
              {/* Jadikan modal saja ketika icon IoMailOutline di klik */}

              <button
                type="button"
                className="cursor-pointer relative ml-2 flex items-center"
                onClick={() => setShowPesanModal(true)}
                aria-label="Pesan Perusahaan"
              >
                <IoMailOutline className="text-2xl text-gray-500 mr-3" aria-label="Mail" />
              </button>
              {showPesanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-white rounded-lg shadow-lg w-[1200px] h-[700px] relative flex flex-col">
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl z-10"
                      onClick={() => setShowPesanModal(false)}
                      aria-label="Tutup Modal"
                    >
                      &times;
                    </button>
                    <div className="flex-1 flex flex-col">
                      <PesanPerusahaanModal open={true} onClose={() => setShowPesanModal(false)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center cursor-pointer"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                {profileImage ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={profileImage}
                    alt="Profile"
                  />
                ) : (
                  <InitialsAvatar name={profileName} />
                )}
                <span className="ml-2 text-black font-semibold text-sm max-w-[120px] truncate">
                  {profileName || "Perusahaan"}
                </span>
                <svg
                  className={`ml-1 w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <FiSettings className="inline mr-2" />
                    Pengaturan Profil
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                    onClick={handleLogout}
                  >
                    <FiLogOut className="inline mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
