"use client";
import React, { useEffect, useState } from "react";
import AlumniNavbar from "../navbar/alumniNavbar/page";
import { getTokenFromSessionStorage } from "../sessiontoken";

// Helper: format tanggal
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper: waktu relatif
function timeAgo(dateStr) {
  if (!dateStr) return "-";
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000); // in seconds
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(dateStr);
}

// Komponen Card Lamaran (tampilan mirip ListLowonganTampilanSaja)
function LamaranCard({ item }) {
  // Data lowongan bisa null jika sudah dihapus, handle gracefully
  const low = item.lowongan || {};
  const perusahaan = low.perusahaan || {};
  return (
    <div
      key={item._id}
      className="relative bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] flex px-6 py-5 mb-4 min-h-[120px] group transition hover:shadow-lg w-full"
    >
      {/* Status Lamaran */}
      <div className="absolute top-4 left-4 z-10">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold
            ${
              item.status === "diterima"
                ? "bg-green-100 text-green-700"
                : item.status === "ditolak"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }
          `}
        >
          {item.status === "diterima"
            ? "Diterima"
            : item.status === "ditolak"
            ? "Ditolak"
            : "Diproses"}
        </span>
      </div>
      {/* Logo */}
      <div className="w-16 h-16 rounded-xl bg-[#eaf7e6] flex items-center justify-center mr-6 flex-shrink-0 overflow-hidden border border-[#e0e0e0]">
        {perusahaan.logo_perusahaan ? (
          <img
            src={
              perusahaan.logo_perusahaan.startsWith("http")
                ? perusahaan.logo_perusahaan
                : `https://tugasakhir-production-6c6c.up.railway.app${perusahaan.logo_perusahaan}`
            }
            alt={perusahaan.nama_perusahaan || "Logo"}
            className="w-12 h-12 object-cover rounded-lg"
          />
        ) : (
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#eaf7e6" />
            <g>
              <path
                d="M16 10c-2.5 0-4.5 2-4.5 4.5S13.5 19 16 19s4.5-2 4.5-4.5S18.5 10 16 10zm0 7c-1.38 0-2.5-1.12-2.5-2.5S14.62 12 16 12s2.5 1.12 2.5 2.5S17.38 17 16 17z"
                fill="#6fcf97"
              />
              <circle cx="16" cy="16" r="15" stroke="#6fcf97" strokeWidth="2" />
            </g>
          </svg>
        )}
      </div>
      {/* Info Utama */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Judul dan perusahaan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[18px] font-bold text-[#222] truncate">
              {low.judul_pekerjaan || low.judul || "-"}
            </span>
            <span className="text-[15px] text-[#27ae60] font-semibold mt-0.5 truncate">
              {perusahaan.nama_perusahaan || perusahaan.nama || "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
              <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
                <path
                  d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 9 7 9s7-3.75 7-9c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 10 6a2.5 2.5 0 0 1 0 5.5z"
                  fill="#6c757d"
                />
              </svg>
              {low.lokasi || "-"}
            </span>
            <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
              <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
                <path
                  d="M4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10zm6-8a8 8 0 1 0 0 16A8 8 0 0 0 10 2zm0 3a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
                  fill="#6c757d"
                />
              </svg>
              {low.tipe_kerja || low.tipe || "-"}
            </span>
          </div>
        </div>
        {/* Salary dan status lowongan */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
          <span className="flex items-center text-[15px] text-[#4fc3f7] font-bold">
            <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
              <path
                d="M10 18c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-14a6 6 0 1 1 0 12A6 6 0 0 1 10 4zm1 3v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H7a1 1 0 1 1 0-2h2V7a1 1 0 1 1 2 0z"
                fill="#4fc3f7"
              />
            </svg>
            {low.gaji || "-"}
          </span>
          <span
            className={`flex items-center text-[15px] font-bold ${
              low.status === "open"
                ? "text-[#27ae60]"
                : low.status === "closed"
                ? "text-[#e74c3c]"
                : "text-[#6c757d]"
            }`}
          >
            <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
              {low.status === "open" ? (
                <circle cx="10" cy="10" r="6" fill="#27ae60" />
              ) : low.status === "closed" ? (
                <circle cx="10" cy="10" r="6" fill="#e74c3c" />
              ) : (
                <circle cx="10" cy="10" r="6" fill="#6c757d" />
              )}
            </svg>
            {low.status === "open"
              ? "Open"
              : low.status === "closed"
              ? "Closed"
              : "-"}
          </span>
          <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
            <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
              <path
                d="M3 3h14v2H3V3zm2 4h10v2H5V7zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z"
                fill="#6c757d"
              />
            </svg>
            {low.kualifikasi || "-"}
          </span>
        </div>
        {/* Info bawah: pelamar, batas pelamar, views, batas, waktu posting, waktu lamaran */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
          <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
            <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
              <path
                d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.31 0-6 2.24-6 5v1h12v-1c0-2.76-2.69-5-6-5z"
                fill="#6c757d"
              />
            </svg>
            {low.jumlah_pelamar ?? "-"} pelamar
          </span>
          <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
            <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
              <path
                d="M8 2a2 2 0 0 1 4 0v1h2a2 2 0 0 1 2 2v1H4V5a2 2 0 0 1 2-2h2V2zm8 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7h12zm-2 2H6v8h8V9z"
                fill="#6c757d"
              />
            </svg>
            Batas pelamar:{" "}
            <span className="ml-1 font-semibold text-[#222]">
              {low.batas_pelamar ?? "-"}
            </span>
          </span>
          <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
            <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
              <path
                d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10zm8-6a6 6 0 1 0 0 12A6 6 0 0 0 10 4zm0 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                fill="#6c757d"
              />
            </svg>
            {low.traffic ?? 0} views
          </span>
          <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
            <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
              <path
                d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6zm0 2h8v12H6V4zm2 2v2h4V6H8z"
                fill="#6c757d"
              />
            </svg>
            Batas:{" "}
            <span className="ml-1 font-semibold text-[#222]">
              {formatDate(low.batas_lamaran)}
            </span>
          </span>
          <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
            <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
              <path
                d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 10 4zm0 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                fill="#6c757d"
              />
            </svg>
            {low.createdAt ? timeAgo(low.createdAt) : "-"}
          </span>
          <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
            <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
              <path
                d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 10 4zm0 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                fill="#6c757d"
              />
            </svg>
            Dilamar:{" "}
            <span className="ml-1 font-semibold text-[#222]">
              {item.tanggal_lamaran ? formatDate(item.tanggal_lamaran) : "-"}
            </span>
          </span>
        </div>
      </div>
      {/* Tombol Apply: tidak aktif, hanya tampilan */}
      <div className="ml-6 flex flex-col items-end justify-between h-full min-w-[120px]">
        <div className="mt-14 w-full flex justify-end">
          <button
            className={`bg-[#4fc3f7] text-white rounded-lg px-6 py-2.5 font-semibold text-[15px] shadow-[0_2px_8px_0_rgba(79,195,247,0.12)] mb-2 flex items-center justify-center transition opacity-50 pointer-events-none`}
            aria-label="Apply"
            disabled
            title="Anda sudah melamar"
          >
            Sudah Dilamar
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="inline ml-2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 5l5 5-5 5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RiwayatLamaranAlumni() {
  const [lamaran, setLamaran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function fetchLamaran() {
      setLoading(true);
      setFetchError(null);
      try {
        const token = getTokenFromSessionStorage();
        if (!token) {
          setFetchError("Token tidak ditemukan. Silakan login ulang.");
          setLoading(false);
          return;
        }
        const res = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/pelamar/alumni/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          throw new Error("Gagal mengambil data lamaran");
        }
        const data = await res.json();
        // data.data: array lamaran, setiap lamaran punya properti lowongan
        setLamaran(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setFetchError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchLamaran();
  }, []);

  return (
    <>
      <AlumniNavbar />
      <div className="min-h-screen h-screen w-full flex flex-col bg-gray-100">
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="w-full font-sans rounded-b-lg flex flex-col flex-1 min-h-0">
            <div className="text-[20px] text-[#222] font-semibold mb-4 px-6 pt-6 text-center">
              Riwayat Lamaran Saya{" "}
              <span className="text-[#6c757d] font-normal">
                ({lamaran.length} total)
              </span>
            </div>
            <div
              className="w-full flex-1 overflow-y-auto pb-4 px-0 mb-52"
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
            >
              <style jsx global>{`
                .w-full.flex-1.overflow-y-auto.pb-4.px-0::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {loading && (
                <div className="text-center text-gray-500 py-10">
                  Memuat lamaran...
                </div>
              )}
              {fetchError && (
                <div className="text-center text-red-500 py-10">
                  {fetchError}
                </div>
              )}
              {!loading && !fetchError && lamaran.length === 0 && (
                <div className="text-[#6c757d] text-[16px] px-6">
                  Anda belum pernah melamar lowongan.
                </div>
              )}
              {!loading &&
                !fetchError &&
                lamaran.map((item) => (
                  <LamaranCard key={item._id} item={item} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
