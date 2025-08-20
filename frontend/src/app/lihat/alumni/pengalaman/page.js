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
    <div className="flex-1 bg-white rounded-lg shadow-xl mt-4 p-8 group relative">
      <h5 className="text-lg text-black font-semibold mb-2">Pengalaman</h5>
      <div className="relative px-4 mt-4">
        <div className="absolute h-full border border-dashed border-opacity-20 border-secondary"></div>
        {/* Pengalaman items */}
        {loadingPengalaman ? (
          <div className="text-gray-500">Memuat pengalaman...</div>
        ) : pengalaman.length === 0 ? (
          <div className="text-gray-500">Belum ada pengalaman.</div>
        ) : (
          pengalaman.map((item, idx) => (
            <div className="flex items-start w-full my-6 -ml-1.5" key={item._id || idx}>
              <div className="w-1/12 z-10 pt-2">
                <div className="w-3.5 h-3.5 bg-blue-600 rounded-full"></div>
              </div>
              <div className="w-11/12">
                {/* Responsive: nama di bawah posisi pada mobile, di samping pada md+ */}
                <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-black text-base">{item.posisi}</span>
                    <span className="text-black text-sm md:inline hidden">di</span>
                    <span className="text-black text-base md:inline hidden">{item.nama}</span>
                    {item.jenis && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{item.jenis}</span>
                    )}
                  </div>
                  {/* Nama perusahaan di bawah posisi pada mobile */}
                  <div className="flex items-center space-x-2 md:hidden mt-1">
                    <span className="text-black text-sm">di</span>
                    <span className="text-black text-base">{item.nama}</span>
                  </div>
                </div>
                <div className="text-black text-sm">
                  {item.lokasi}
                </div>
                <div className="text-black text-sm">
                  {formatMonthYear(item.tanggal_mulai)} -{" "}
                  {item.masih_berjalan
                    ? "Sekarang"
                    : item.tanggal_selesai
                    ? formatMonthYear(item.tanggal_selesai)
                    : "-"}
                </div>
                {item.deskripsi && (
                  <div className={`text-black text-sm mt-1 ${breakWordClass}`}>{item.deskripsi}</div>
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
      <div className="flex-1 bg-white rounded-lg shadow-xl mt-4 p-8 group relative">
        <h5 className="text-lg text-black font-semibold mb-2">Pengalaman</h5>
        <div className="text-gray-400">Memuat...</div>
      </div>
    );
  }
  return <PengalamanCardInner />;
}
