"use client";
import { useEffect, useState, useRef } from "react";
import { FiSettings, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { IoMailOutline } from "react-icons/io5";
import axios from "axios";
import Link from "next/link";
import PesanPerusahaanModal from "../../pesan/page";
import { useRouter } from "next/navigation";
import { getTokenFromSessionStorage } from "../../sessiontoken"; // pakeini buat dapat token

// Helper untuk resolve URL foto_profil alumni ke localhost:5000/uploads/alumni jika perlu
function getProfileImageUrl(foto_profil) {
  if (!foto_profil) return "";
  if (/^https?:\/\//.test(foto_profil)) return foto_profil;
  if (foto_profil.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${foto_profil}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/${foto_profil}`;
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

export default function AlumniNavbar() {
  const [profileImage, setProfileImage] = useState("");
  const [profileName, setProfileName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // State untuk modal pesan perusahaan
  const [showPesanModal, setShowPesanModal] = useState(false);

  // State untuk hamburger menu (mobile)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();

  // Fungsi untuk menghapus token dari sessionStorage
  function removeTokenSession() {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem("token");
    } catch (e) {}
  }

  // Ambil data alumni (foto profil & nama)
  useEffect(() => {
    // pakeini buat dapat token
    const token = getTokenFromSessionStorage();
    if (!token) {
      setProfileImage("");
      setProfileName("");
      return;
    }
    let payload = null;
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "alumni") {
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
        const res = await axios.get("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Jika foto_profil tidak ada atau kosong, setProfileImage("") supaya nanti pakai InitialsAvatar
        if (!res.data.foto_profil) {
          setProfileImage("");
        } else {
          setProfileImage(getProfileImageUrl(res.data.foto_profil));
        }
        setProfileName(res.data.name || "");
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

  // Close mobile menu jika resize ke md ke atas
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    removeTokenSession();
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
  const emojiList = ["🎓", "👨‍🎓", "👩‍🎓", "🌟", "🏆", "📚", "💼", "🚀"];
  // Komponen global AnimatedEmoji
  function AnimatedEmoji() {
    const [index, setIndex] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % emojiList.length);
      }, 800);
      return () => clearInterval(interval);
    }, []);
    // Hanya tampilkan emoji di desktop (md ke atas)
    return (
      <span
        className="text-2xl transition-all duration-300 ease-in-out ml-[6px] hidden md:inline"
        aria-label="Animated Emoji"
        role="img"
      >
        {emojiList[index]}
      </span>
    );
  }

  // Handler khusus untuk navigasi ke /cariLowongan dengan router.push
  const handleCariLowonganClick = (e) => {
    e.preventDefault();
    router.push("/cariLowongan");
    setMobileMenuOpen(false);
  };

  // Handler khusus untuk navigasi ke /forumAlumni dengan router.push
  const handleForumAlumniClick = (e) => {
    e.preventDefault();
    router.push("/forumAlumni");
    setMobileMenuOpen(false);
  };

  // Menu items (agar DRY)
  const menuItems = [
    {
      label: "Cari Lowongan",
      onClick: handleCariLowonganClick,
      type: "button",
    },
    {
      label: "Riwayat Lamaran",
      href: "/alumni/riwayat-lamaran",
      type: "link",
    },
    {
      label: "Event Alumni",
      href: "/alumni/event",
      type: "link",
    },
    {
      label: "Forum Alumni",
      onClick: handleForumAlumniClick,
      type: "button",
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      {/* Flex utama: logo + hamburger di kiri, menu desktop di tengah, pesan & profile di kanan */}
      <div className="flex items-center h-16 relative px-4 md:px-0 justify-between">
        {/* Kiri: Logo + Hamburger */}
        <div className="flex items-center">
          {/* Logo */}
          <div className="z-10 flex items-center" style={{ minWidth: 0 }}>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <img
                alt="Logo"
                className="h-8 w-8 object-contain"
                style={{ display: "block" }}
              />
              <span className="font-bold text-lg text-blue-700 hidden sm:inline">AlumniConnect</span>
            </Link>
          </div>
          {/* Hamburger icon (mobile only), langsung di kanan logo, jarak sedikit */}
          <button
            className="md:hidden ml-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? (
              <FiX className="w-6 h-6 text-gray-700" />
            ) : (
              <FiMenu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
        {/* Tengah: Desktop menu */}
        <div className="hidden md:flex items-center md:justify-center flex-1">
          <AnimatedEmoji />
          <ul className="flex space-x-10 items-center ml-2">
            {menuItems.map((item, idx) =>
              item.type === "link" ? (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-black font-medium text-sm hover:text-blue-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="text-black font-medium text-sm hover:text-blue-600 bg-transparent border-none outline-none cursor-pointer"
                    style={{ padding: 0, background: "none" }}
                  >
                    {item.label}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
        {/* Kanan: Profile & Pesan, mentok kanan */}
        <div className="flex items-center relative right-0 md:ml-0 md:right-10">
          <div className="flex items-center">
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
                <div className="bg-white rounded-lg shadow-lg w-[95vw] max-w-[1200px] h-[90vh] max-h-[700px] relative flex flex-col">
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
              {/* 
                Kalo profileImage kosong, tampilkan InitialsAvatar.
                Kalo profileImage ada, tampilkan img.
                (Sudah handled di useEffect di atas, jadi di sini cukup cek profileImage)
              */}
              {profileImage ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={profileImage}
                  alt="Profile"
                  onError={(e) => {
                    // Jika gambar gagal load, fallback ke InitialsAvatar
                    e.target.onerror = null;
                    setProfileImage("");
                  }}
                />
              ) : (
                <InitialsAvatar name={profileName} />
              )}
              <span className="ml-2 text-black font-semibold text-sm max-w-[120px] truncate">
                {profileName || "Alumni"}
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
              <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded shadow-lg z-50">
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
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow z-40 animate-fadeIn">
          <ul className="flex flex-col py-2 px-4 space-y-2">
            {menuItems.map((item, idx) =>
              item.type === "link" ? (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block w-full text-left text-black font-medium text-base py-2 px-2 rounded hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="block w-full text-left text-black font-medium text-base py-2 px-2 rounded hover:bg-blue-50 hover:text-blue-600 bg-transparent border-none outline-none cursor-pointer"
                    style={{ padding: 0, background: "none" }}
                  >
                    {item.label}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
