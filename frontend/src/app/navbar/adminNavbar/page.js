"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Sidebar khusus untuk role admin, check role dari cookie

const adminSidebarItems = [
  { name: "Dashboard", link: "/dashboard", icon: "🏠" },
  { name: "Setting Alumni", link: "/admin/settingAlumni", icon: "🎓" },
  { name: "Setting Perusahaan", link: "/admin/settingPerusahaan", icon: "🏢" },
  { name: "Verifikasi Lowongan", link: "/admin/verifikasiLowongan", icon: "✅" },
  { name: "Bot Pesan", link: "/admin/botPesan", icon: "🤖" },
  { name: "Profil", link: "/profile", icon: "👤" },
  { name: "Tambah Alumni", link: "/admin/tambahAlumni", icon: "👤" },
  // Logout akan dipisah, jangan masukkan di sini
];

// Dummy foto profile admin (bisa diganti dengan foto dari API/user context)
const ADMIN_PROFILE_PHOTO =
  "https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff&size=128";

// Helper: Ambil token dari cookie (client-side)
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith("token=")) {
      return decodeURIComponent(c.substring("token=".length));
    }
  }
  return null;
}

// Fungsi untuk menghapus cookie token (logout)
function removeTokenCookie() {
  if (typeof document !== "undefined") {
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
  }
}

export default function AdminSidebar() {
  const router = useRouter();
  const [activePath, setActivePath] = useState("");
  const [isAdmin, setIsAdmin] = useState(null); // null: loading, false: not admin, true: admin
  const [adminUsername, setAdminUsername] = useState(""); // username admin

  useEffect(() => {
    // Cek role admin dari cookie dan endpoint, ambil username admin
    async function checkAdminRole() {
      const token = getTokenFromCookie();
      if (!token) {
        setIsAdmin(false);
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/admin/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(true);
          setAdminUsername(data.username || "Admin");
        } else {
          setIsAdmin(false);
          setAdminUsername("");
          router.replace("/login");
        }
      } catch (err) {
        setIsAdmin(false);
        setAdminUsername("");
        router.replace("/login");
      }
    }

    checkAdminRole();

    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname);
    }
  }, [router]);

  const handleNav = (link) => {
    router.push(link);
    setActivePath(link);
  };

  // Fungsi logout
  const handleLogout = async () => {
    // Jika ada endpoint logout di backend, bisa dipanggil di sini
    // await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/logout", { method: "POST", credentials: "include" });
    removeTokenCookie();
    setIsAdmin(false);
    setAdminUsername("");
    router.replace("/login");
  };

  // Tombol logout dipisah
  const logoutItem = { name: "Logout", link: "/logout", icon: "🚪" };

  if (isAdmin === null) {
    // Loading state
    return (
      <aside
        className="h-screen w-56 bg-gray-900 text-white flex flex-col fixed top-0 left-0 shadow-lg z-30 items-center justify-center"
        style={{ minWidth: 220 }}
      >
        <div className="text-gray-400 text-sm">Loading...</div>
      </aside>
    );
  }

  if (!isAdmin) {
    // Not admin, don't render sidebar
    return null;
  }

  return (
    <aside
      className="h-screen w-56 bg-gray-900 text-white flex flex-col fixed top-0 left-0 shadow-lg z-30"
      style={{
        minWidth: 220,
        overflowY: "auto",
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE 10+
      }}
      // Hide scrollbar for Chrome, Safari and Opera
      // eslint-disable-next-line react/no-unknown-property
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      <style jsx global>{`
        .admin-sidebar-hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .admin-sidebar-hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      {/* Foto profile admin */}
      <div className="flex flex-col items-center py-8 border-b border-gray-800">
        <img
          src={ADMIN_PROFILE_PHOTO}
          alt="Admin Profile"
          className="w-20 h-20 rounded-full border-4 border-blue-700 object-cover mb-3 shadow"
        />
        <div className="font-bold text-xl mt-1">Admin Panel</div>
        <div className="text-xs text-gray-400 mt-1">
          {adminUsername ? adminUsername : "admin@domain.com"}
        </div>
      </div>
      <nav className="flex-1 admin-sidebar-hide-scrollbar" style={{ overflowY: "auto" }}>
        <ul className="mt-6 space-y-2 px-2">
          {adminSidebarItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => handleNav(item.link)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition text-left font-medium cursor-pointer ${
                  activePath === item.link
                    ? "bg-blue-700 text-white"
                    : "hover:bg-gray-800"
                }`}
                style={{ outline: "none", border: "none", background: "none", cursor: "pointer" }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {/* Tombol logout dipisah di bawah, tidak kena scroll */}
      <div className="px-2 w-full">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition text-left font-medium mb-2 cursor-pointer ${
            activePath === logoutItem.link
              ? "bg-blue-700 text-white"
              : "hover:bg-gray-800"
          }`}
          style={{ outline: "none", border: "none", background: "none", cursor: "pointer" }}
        >
          <span className="text-lg">{logoutItem.icon}</span>
          <span>{logoutItem.name}</span>
        </button>
      </div>
      <div className="py-4 text-xs text-gray-400 text-center border-t border-gray-800">
        &copy; {new Date().getFullYear()} Admin Only
      </div>
    </aside>
  );
}
