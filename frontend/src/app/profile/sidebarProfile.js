"use client";
import React, { useState, useEffect } from "react";
import { FaUserCircle, FaCog, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { getProfileImageUrl, removeTokenCookie } from "../aa";
import { getTokenFromSessionStorage } from "../sessiontoken";

// Menu links untuk alumni (tanpa href, karena tidak pakai Link)
const alumniMenuLinks = [
  { label: "Profile", key: "profile", icon: <FaUserCircle className="h-6 w-6" /> },
  { label: "Account settings", key: "accountSettings", icon: <FaCog className="h-6 w-6" /> },
];

// Fallback fetchProfileWithRole jika tidak diekspor dari ../aa
async function fetchProfileWithRole(token) {
  if (!token) return { profile: null, role: null };
  try {
    const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/profile/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return { profile: null, role: null };
    const data = await res.json();
    // data: { profile: {...}, role: "alumni" | "perusahaan" }
    return { profile: data.profile || null, role: data.role || null };
  } catch (e) {
    return { profile: null, role: null };
  }
}

export default function SidebarProfile({ activeMenu, onMenuClick }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      const token = getTokenFromSessionStorage();
      const { profile, role } = await fetchProfileWithRole(token);
      if (mounted) {
        setProfile(profile);
        setRole(role);
      }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  // Logout handler
  const handleLogout = () => {
    removeTokenCookie();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
    }
    router.push("/login");
  };

  // Show alumni avatar if available
  const avatarUrl =
    role === "alumni" && profile && profile.foto_profil
      ? getProfileImageUrl(profile.foto_profil)
      : null;

  return (
    <div className="fixed top-0 left-0 z-40 h-20 flex flex-col items-start justify-start">
      {/* Sidebar Container (stick to left, vertically centered content) */}
      <div className="relative flex flex-col items-center justify-between h-full min-h-[400px] w-[64px]">
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ease-in-out bg-white shadow-xl h-full flex flex-col items-center py-8 px-3 border border-gray-200 border-l-0
          ${open ? "w-56 opacity-100" : "w-0 opacity-0 pointer-events-none"}
          `}
          style={{
            minWidth: open ? "224px" : "0px",
            position: "absolute",
            left: 0,
            top: 60,
            height: "90vh",
            zIndex: 20,
            boxShadow: open ? "2px 0 16px 0 rgba(36,37,47,0.08)" : "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Profile Avatar (alumni only) */}
          {open && role === "alumni" && (
            <div className="flex flex-col items-center mb-6">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto Profil"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow"
                />
              ) : (
                <FaUserCircle className="w-16 h-16 text-gray-300" />
              )}
              <span className="mt-2 text-gray-700 font-semibold text-base text-center max-w-[180px] truncate">
                {profile?.nama_lengkap || "Alumni"}
              </span>
            </div>
          )}

          {/* Menu Items */}
          <ul className={`flex flex-col gap-3 mb-auto transition-all duration-300 ${open ? "opacity-100" : "opacity-0"}`}>
            {alumniMenuLinks.map((item) => {
              const isActive = activeMenu === item.key;
              return (
                <li
                  key={item.key}
                  className={`group flex items-center p-3 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "hover:bg-blue-50"
                  }`}
                  style={{ marginLeft: open ? 0 : "-16px" }}
                  onClick={() => {
                    if (onMenuClick) onMenuClick(item.key);
                  }}
                >
                  <span
                    className="flex items-center w-full"
                  >
                    <span
                      className={`mr-3 transition-all ${
                        isActive
                          ? "text-blue-600"
                          : "text-gray-500 group-hover:text-blue-600"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {open && (
                      <span
                        className={`transition-all ${
                          isActive
                            ? "text-blue-700 font-semibold"
                            : "text-gray-700 group-hover:text-blue-600 font-medium"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Logout at bottom */}
          <div className={`flex items-center justify-center mb-4 transition-all duration-300 ${open ? "opacity-100" : "opacity-0"}`}>
            <button
              className="p-3 rounded-lg hover:bg-red-50 transition-all flex items-center"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="h-7 w-7 text-gray-500 hover:text-red-600 transition-all" />
              {open && (
                <span className="ml-3 text-gray-700 hover:text-red-600 font-medium transition-all">Logout</span>
              )}
            </button>
          </div>
        </div>

        {/* Hamburger Button (stick to left edge, vertically centered) */}
        <button
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-md bg-white shadow-md border border-gray-200 flex items-center justify-center transition-all duration-200 focus:outline-none ${
            open ? "text-blue-600" : "text-gray-600"
          }`}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          style={{
            left: open ? "224px" : "0px",
            transition: "left 0.3s",
          }}
        >
          {open ? (
            // Close (X) icon
            <FaTimes className="h-7 w-7" />
          ) : (
            // Hamburger icon
            <FaBars className="h-7 w-7" />
          )}
        </button>
      </div>
    </div>
  );
}