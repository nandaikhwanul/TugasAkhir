"use client"
import { useState } from "react";
import { motion } from "framer-motion";

// Fungsi logout: hapus token dari sessionStorage dan redirect ke /login
function handleLogout() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  }
}

// Komponen Hamburger (buka/tutup sidebar)
function HamburgerButton({ open, setOpen }) {
  return (
    <button
      className="fixed top-4 left-4 z-50 p-2 rounded-md text-blue-700 bg-white shadow md:hidden focus:outline-none"
      onClick={() => setOpen((prev) => !prev)}
      aria-label={open ? "Tutup sidebar" : "Buka sidebar"}
      type="button"
      style={{ transition: "background 0.2s" }}
    >
      {/* Hamburger animasi sederhana */}
      <span className="block w-6 h-0.5 bg-blue-700 mb-1 transition-all duration-300"
        style={{
          transform: open ? "rotate(45deg) translateY(7px)" : "none"
        }}
      />
      <span className="block w-6 h-0.5 bg-blue-700 mb-1 transition-all duration-300"
        style={{
          opacity: open ? 0 : 1
        }}
      />
      <span className="block w-6 h-0.5 bg-blue-700 transition-all duration-300"
        style={{
          transform: open ? "rotate(-45deg) translateY(-7px)" : "none"
        }}
      />
    </button>
  );
}

// Sidebar component with hamburger for open/close
function Sidebar({ open: openProp, setOpen: setOpenProp }) {
  // Agar bisa dipakai standalone maupun controlled dari parent
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setInternalOpen;

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <HamburgerButton open={open} setOpen={setOpen} />

      {/* Overlay untuk mobile */}
      <motion.div
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden ${
          open ? "block" : "hidden"
        }`}
        onClick={() => setOpen(false)}
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-700 to-blue-900 shadow-2xl z-50 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:shadow-none md:block`}
        style={{ minWidth: "16rem" }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-800">
          <span className="font-extrabold text-2xl text-white tracking-wide">SuperAdmin</span>
          <button
            className="p-2 rounded-md text-white hover:bg-blue-800 focus:outline-none md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            {/* Ikon Close */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Sidebar nav */}
        <nav className="flex flex-col gap-1 mt-8 px-2">
          {/* Tautan untuk "Create Admin" */}
          <a
            href="/superadmin"
            className="flex items-center gap-3 px-5 py-3 rounded-lg text-white hover:bg-blue-800 hover:text-white font-medium transition group"
            onClick={() => setOpen(false)}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-800 group-hover:bg-blue-900 transition">
              {/* User-plus icon */}
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="inline text-white">
                <circle cx="9" cy="8" r="4" />
                <path d="M17 21v-6m3 3h-6" />
                <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
              </svg>
            </span>
            <span className="text-base">Create Admin</span>
          </a>
          
          {/* Tautan untuk "Edit Admin" */}
          <a
            href="/superadmin/editAdmin"
            className="flex items-center gap-3 px-5 py-3 rounded-lg text-white hover:bg-blue-800 hover:text-white font-medium transition group"
            onClick={() => setOpen(false)}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-800 group-hover:bg-blue-900 transition">
              {/* User-edit icon */}
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="inline text-white">
                <circle cx="9" cy="8" r="4" />
                <path d="M2 21v-2a4 4 0 0 1 4-4h2" />
                <path d="M16.5 17.5l2 2m-2-2l3-3a1.414 1.414 0 0 0-2-2l-3 3" />
              </svg>
            </span>
            <span className="text-base">Edit Admin</span>
          </a>
          {/* Tombol Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-3 rounded-lg text-white hover:bg-red-700 hover:text-white font-medium transition group mt-4 bg-red-600"
            style={{ outline: "none", border: "none" }}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-700 group-hover:bg-red-800 transition">
              {/* Logout icon */}
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="inline text-white">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7" />
                <path d="M3 21V3" />
              </svg>
            </span>
            <span className="text-base">Logout</span>
          </button>
        </nav>
        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 w-full px-6 py-4 border-t border-blue-800 bg-blue-800">
          <span className="text-xs text-blue-200">© {new Date().getFullYear()} SuperAdmin Panel</span>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
