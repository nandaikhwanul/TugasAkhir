"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// Format date to "MMM YYYY"
function formatMonthYear(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

// Komponen pembungkus agar tidak error saat build/prerender (Next.js 13+)
function PengalamanCardInner() {
  // Ambil id alumni dari query string (?id=...)
  const searchParams = useSearchParams();
  const alumniId = searchParams.get("id");

  // Data alumni tidak diambil di sini, hanya pengalaman
  const [pengalaman, setPengalaman] = useState([]);
  const [loadingPengalaman, setLoadingPengalaman] = useState(true);

  // Helper: break word utility for long text
  const breakWordClass = "break-words whitespace-pre-line";

  useEffect(() => {
    let ignore = false;
    async function fetchPengalamanAlumni() {
      setLoadingPengalaman(true);
      if (!alumniId) {
        if (!ignore) {
          setPengalaman([]);
          setLoadingPengalaman(false);
        }
        return;
      }
      try {
        // Gunakan endpoint perusahaan (read-only, untuk perusahaan)
        const res = await fetch(
          `https://tugasakhir-production-6c6c.up.railway.app/pengalaman/perusahaan/${alumniId}`,
          {
            headers: {
              // Authorization: `Bearer ${getTokenFromSessionStorage()}`
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data pengalaman");
        const data = await res.json();
        if (!ignore) {
          if (Array.isArray(data.data)) {
            setPengalaman(data.data);
          } else if (data.data) {
            setPengalaman([data.data]);
          } else {
            setPengalaman([]);
          }
        }
      } catch (err) {
        if (!ignore) setPengalaman([]);
      }
      if (!ignore) setLoadingPengalaman(false);
    }
    fetchPengalamanAlumni();
    return () => { ignore = true; };
  }, [alumniId]);

  return (
    <div className="flex-1 bg-white rounded-lg shadow-xl mt-4 p-8 group relative
      sm:p-4 sm:mt-2 xs:p-2 xs:mt-2
      ">
      <h5 className="text-lg text-black font-semibold mb-2 sm:text-base xs:text-base">Pengalaman</h5>
      <div className="relative px-4 mt-4 sm:px-2 sm:mt-2 xs:px-1 xs:mt-2">
        <div className="absolute h-full border border-dashed border-opacity-20 border-secondary"></div>
        {/* Pengalaman items */}
        {loadingPengalaman ? (
          <div className="text-gray-500 text-base sm:text-sm xs:text-sm">Memuat pengalaman...</div>
        ) : pengalaman.length === 0 ? (
          <div className="text-gray-500 text-base sm:text-sm xs:text-sm">Belum ada pengalaman.</div>
        ) : (
          pengalaman.map((item, idx) => (
            <div
              className="flex items-start w-full my-6 -ml-1.5
                sm:flex-col sm:my-4 sm:-ml-0 xs:flex-col xs:my-3 xs:-ml-0"
              key={item._id || idx}
            >
              <div className="w-1/12 z-10 pt-2 sm:w-full sm:pt-0 xs:w-full xs:pt-0 flex sm:justify-center xs:justify-center">
                <div className="w-3.5 h-3.5 bg-blue-600 rounded-full sm:w-3 sm:h-3 xs:w-2.5 xs:h-2.5"></div>
              </div>
              <div className="w-11/12 sm:w-full xs:w-full sm:mt-2 xs:mt-2">
                <div className="flex items-center space-x-2 sm:flex-wrap sm:space-x-1 xs:flex-wrap xs:space-x-1">
                  <span className="font-bold text-black text-base sm:text-sm xs:text-sm">{item.posisi}</span>
                  <span className="text-black text-sm sm:text-xs xs:text-xs">di</span>
                  <span className="text-black text-base sm:text-sm xs:text-sm">{item.nama}</span>
                  {item.jenis && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded sm:ml-1 xs:ml-1">{item.jenis}</span>
                  )}
                </div>
                <div className="text-black text-sm sm:text-xs xs:text-xs">
                  {item.lokasi}
                </div>
                <div className="text-black text-sm sm:text-xs xs:text-xs">
                  {formatMonthYear(item.tanggal_mulai)} -{" "}
                  {item.masih_berjalan
                    ? "Sekarang"
                    : item.tanggal_selesai
                    ? formatMonthYear(item.tanggal_selesai)
                    : "-"}
                </div>
                {item.deskripsi && (
                  <div className={`text-black text-sm mt-1 ${breakWordClass} sm:text-xs xs:text-xs`}>{item.deskripsi}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Export default dibungkus komponen client-only
export default function PengalamanCard() {
  // Hindari error saat build/prerender: pastikan komponen hanya render di client
  // (karena useSearchParams hanya ada di client)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    // Hindari error saat SSR/prerender
    return (
      <div className="flex-1 bg-white rounded-lg shadow-xl mt-4 p-8 group relative
        sm:p-4 sm:mt-2 xs:p-2 xs:mt-2
      ">
        <h5 className="text-lg text-black font-semibold mb-2 sm:text-base xs:text-base">Pengalaman</h5>
        <div className="text-gray-400 text-base sm:text-sm xs:text-sm">Memuat...</div>
      </div>
    );
  }
  return <PengalamanCardInner />;
}
