"use client";
import React, { useState, useEffect, useRef } from "react";
import LihatPesan from "./lihatPesan/page";
import KirimPesan from "./kirimPesan/page";
import { getTokenFromSessionStorage } from "../sessiontoken";

export default function SidebarPesan() {
  const [activeSidebar, setActiveSidebar] = useState("inbox");
  const [unreadCount, setUnreadCount] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pollingRef = useRef(null);

  // Ambil jumlah pesan belum dibaca, polling tiap 2 detik
  useEffect(() => {
    let stopped = false;
    async function fetchUnreadCount() {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setUnreadCount(null);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pesan-bebas/unread-count", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setUnreadCount(null);
          return;
        }
        const data = await res.json();
        setUnreadCount(typeof data.unread_count === "number" ? data.unread_count : 0);
      } catch (err) {
        setUnreadCount(null);
      }
    }
    // Initial fetch
    fetchUnreadCount();
    // Polling interval
    pollingRef.current = setInterval(() => {
      if (!stopped) fetchUnreadCount();
    }, 2000); // 2 detik polling, bukan 100ms
    // Cleanup
    return () => {
      stopped = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Konten dinamis berdasarkan sidebar yang aktif
  const renderContent = () => {
    switch (activeSidebar) {
      case "inbox":
        return <LihatPesan />;
      case "telegram":
        // Arahkan ke halaman kirim pesan (in-page, tanpa reload/route)
        return <KirimPesan />;
      default:
        return null;
    }
  };

  // Badge untuk jumlah pesan belum dibaca
  const renderUnreadBadge = () =>
    typeof unreadCount === "number" && unreadCount > 0 ? (
      <span
        className="absolute -top-2 -right-2 bg-red-600 h-6 min-w-[1.5rem] px-2 flex justify-center items-center text-white rounded-full text-sm font-bold"
        style={{ lineHeight: "1.25rem" }}
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    ) : null;

  // Hamburger button for mobile
  const HamburgerButton = (
    <button
      type="button"
      className="fixed top-4 left-4 z-30 flex flex-col justify-center items-center w-10 h-10 bg-white rounded-lg shadow-lg md:hidden"
      aria-label="Buka menu"
      onClick={() => setSidebarOpen(true)}
    >
      <span className="block w-6 h-0.5 bg-gray-800 mb-1 rounded"></span>
      <span className="block w-6 h-0.5 bg-gray-800 mb-1 rounded"></span>
      <span className="block w-6 h-0.5 bg-gray-800 rounded"></span>
    </button>
  );

  // Sidebar content
  const SidebarContent = (
    <>
      <div className="w-12 sm:w-16 mx-auto mt-8 sm:mt-12 mb-10 sm:mb-20 p-3 sm:p-4 bg-indigo-600 rounded-2xl text-white flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-8 h-8 sm:w-10 sm:h-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
            d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
          />
        </svg>
      </div>
      <nav className="relative flex flex-col py-2 sm:py-4 items-center">
        <button
          type="button"
          onClick={() => {
            setActiveSidebar("inbox");
            setSidebarOpen(false);
          }}
          className={`relative w-12 h-12 sm:w-16 sm:h-16 p-2 sm:p-4 rounded-2xl mb-3 sm:mb-4 flex items-center justify-center transition ${
            activeSidebar === "inbox"
              ? "bg-purple-100 text-purple-900"
              : "bg-gray-100 text-gray-400 hover:bg-purple-50"
          }`}
          style={{ minWidth: "48px", minHeight: "48px" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6 sm:w-8 sm:h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"
            />
          </svg>
          {renderUnreadBadge()}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSidebar("telegram");
            setSidebarOpen(false);
          }}
          className={`relative w-12 h-12 sm:w-16 sm:h-16 p-2 sm:p-4 rounded-2xl mb-3 sm:mb-4 flex items-center justify-center transition ${
            activeSidebar === "telegram"
              ? "bg-purple-100 text-purple-900"
              : "bg-gray-100 text-gray-400 hover:bg-purple-50"
          }`}
          style={{ minWidth: "48px", minHeight: "48px" }}
        >
          {/* Telegram paper plane icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-6 h-6 sm:w-8 sm:h-8 mx-auto"
            style={{ color: "#229ED9" }}
          >
            <path d="M21.426 2.594a1.5 1.5 0 0 0-1.59-.217L3.36 9.36a1.5 1.5 0 0 0 .13 2.8l4.77 1.67 2.02 6.13a1.5 1.5 0 0 0 2.7.23l2.13-3.44 4.13 3.04a1.5 1.5 0 0 0 2.36-1.01l1.5-14a1.5 1.5 0 0 0-.574-1.19zm-1.13 1.47l-1.5 14-4.13-3.04a1.5 1.5 0 0 0-2.09.41l-2.13 3.44-2.02-6.13a1.5 1.5 0 0 0-.97-.97l-4.77-1.67 16.41-6.08z"/>
          </svg>
          {/* Tidak perlu badge unread di telegram */}
        </button>
      </nav>
    </>
  );

  return (
    <div className="flex h-screen">
      {/* Hamburger for mobile */}
      {HamburgerButton}
      {/* Sidebar */}
      {/* Desktop sidebar */}
      <section
        className="hidden md:flex flex-col w-2/12 min-w-[70px] max-w-xs bg-white rounded-l-3xl fixed h-[700px] left-0 md:left-24 shadow-lg z-20 transition-all sm:w-1/5 xs:w-2/5 md:w-32"
        style={{ minWidth: "70px" }}
      >
        {SidebarContent}
      </section>
      {/* Mobile sidebar (drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <section
            className="flex flex-col w-64 max-w-full bg-white rounded-r-3xl h-full shadow-2xl z-50 transition-all animate-slide-in-left relative"
          >
            {/* Close button */}
            <button
              type="button"
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              aria-label="Tutup menu"
              onClick={() => setSidebarOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6 text-gray-700"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {SidebarContent}
          </section>
        </div>
      )}
      {/* Konten dinamis */}
      <main className="flex-1 ml-0 md:ml-[12.5vw]">
        {renderContent()}
      </main>
      <style jsx global>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
}
