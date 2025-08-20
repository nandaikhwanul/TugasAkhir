"use client";

import React, { useEffect, useState } from "react";
import { FaUserCircle, FaExclamationTriangle } from "react-icons/fa";
import { getTokenFromSessionStorage } from "../../../sessiontoken";
import { useSearchParams } from "next/navigation";

// Pesan motivasi jika deskripsi kosong
const EMPTY_ABOUT_MESSAGE = (
  <span className="italic text-gray-400 flex items-center gap-2">
    <FaUserCircle className="text-blue-200 text-2xl" />
    Ceritakan tentang dirimu di sini! Bagikan pengalaman, keahlian, atau kisah inspiratifmu agar alumni lain bisa lebih mengenalmu. Profil yang lengkap akan membantumu membangun koneksi dan peluang baru. Yuk, lengkapi bagian ini!
  </span>
);

// Komponen pembungkus agar tidak error saat build/prerender (Next.js 13+)
function AboutCardInner() {
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const alumniId = searchParams.get("id");

  useEffect(() => {
    let ignore = false;
    async function fetchAlumni() {
      setLoading(true);
      setError("");
      const token = getTokenFromSessionStorage();
      if (!token) {
        if (!ignore) {
          setError("Token tidak ditemukan.");
          setLoading(false);
        }
        return;
      }
      if (!alumniId) {
        if (!ignore) {
          setError("ID alumni tidak ditemukan di URL.");
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(
          `https://tugasakhir-production-6c6c.up.railway.app/perusahaan/alumni/${alumniId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data alumni.");
        const data = await res.json();
        if (!ignore) setAlumni(data);
      } catch (err) {
        if (!ignore) {
          setAlumni(null);
          setError(err.message || "Gagal mengambil data alumni.");
        }
      }
      if (!ignore) setLoading(false);
    }
    fetchAlumni();
    return () => { ignore = true; };
  }, [alumniId]);

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-gray-100 p-8 flex items-center justify-center rounded-lg">
        <span className="text-gray-500 flex items-center gap-2">
          <FaUserCircle className="text-blue-200 text-2xl" />
          Loading...
        </span>
      </div>
    );
  }

  if (error || !alumni) {
    return (
      <div className="h-full bg-gradient-to-br from-red-50 to-gray-100 p-8 flex items-center justify-center rounded-lg">
        <span className="text-red-500 flex items-center gap-2">
          <FaExclamationTriangle className="text-red-300" />
          {error || "Failed to load alumni data."}
        </span>
      </div>
    );
  }

  return (
    <div
      className="
        flex flex-col w-full max-w-[91rem] h-full rounded-none
        sm:rounded-lg
        sm:p-4
        sm:shadow
        sm:bg-white
        sm:max-w-2xl
        sm:mx-auto
        sm:my-4
        md:max-w-[91rem] md:p-0 md:shadow-none md:bg-transparent md:mx-0 md:my-0
      "
      style={{
        minHeight: "200px",
      }}
    >
      <div
        className="
          flex-1
          bg-gradient-to-br from-blue-50 to-white
          rounded-t-none
          p-4
          sm:p-8
          relative
          w-full
        "
        style={{
          minHeight: "180px",
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <FaUserCircle className="text-blue-300 text-2xl sm:text-3xl" />
          <h4 className="text-lg sm:text-2xl text-blue-900 font-semibold tracking-tight">Tentang</h4>
        </div>
        <p className="mt-2 text-gray-700 break-words whitespace-pre-line break-all text-sm sm:text-base flex items-start gap-2">
          {alumni.deskripsi && alumni.deskripsi.trim() ? (
            <>
              <FaUserCircle className="text-blue-200 text-lg sm:text-xl mt-1" />
              <span>{alumni.deskripsi}</span>
            </>
          ) : (
            EMPTY_ABOUT_MESSAGE
          )}
        </p>
      </div>
    </div>
  );
}

// Export default dibungkus komponen client-only
export default function AboutCard() {
  // Hindari error saat build/prerender: pastikan komponen hanya render di client
  // (karena useSearchParams dan sessionStorage hanya ada di client)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    // Hindari error saat SSR/prerender
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-gray-100 p-8 flex items-center justify-center rounded-lg">
        <span className="text-gray-400 flex items-center gap-2">
          <FaUserCircle className="text-blue-200 text-2xl" />
          Memuat...
        </span>
      </div>
    );
  }
  return <AboutCardInner />;
}
