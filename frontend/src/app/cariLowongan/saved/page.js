"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Helper: ambil token dari cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

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

// Helper: format waktu posting (misal: "2 hari lalu")
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

// Helper: resolve logo url
function getLogoUrl(logo) {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  return `ttps://tugasakhir-production-6c6c.up.railway.app${logo}`;
}

export default function SavedLowonganPage() {
  const [savedLowongan, setSavedLowongan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [unsaving, setUnsaving] = useState({});
  const router = useRouter();

  // Fetch saved lowongan
  const fetchSavedLowongan = async () => {
    setLoading(true);
    setErr("");
    try {
      const token = getTokenFromCookie();
      const res = await fetch(
        "ttps://tugasakhir-production-6c6c.up.railway.app/alumni/me/saved-lowongan",
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setSavedLowongan(data.savedLowongan || []);
    } catch (e) {
      setErr("Gagal memuat data lowongan yang disimpan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedLowongan();
  }, []);

  // Ambil nama perusahaan
  function getNamaPerusahaan(item) {
    if (item.nama_perusahaan) return item.nama_perusahaan;
    if (item.perusahaan && typeof item.perusahaan === "object" && item.perusahaan.nama_perusahaan)
      return item.perusahaan.nama_perusahaan;
    if (item.perusahaan_nama) return item.perusahaan_nama;
    if (typeof item.perusahaan === "string") return item.perusahaan;
    return "-";
  }

  // Ambil logo perusahaan
  function getLogo(item) {
    if (item.logo_perusahaan) return getLogoUrl(item.logo_perusahaan);
    if (item.perusahaan && typeof item.perusahaan === "object" && item.perusahaan.logo_perusahaan)
      return getLogoUrl(item.perusahaan.logo_perusahaan);
    return null;
  }

  // Fungsi unsave lowongan
  const handleUnsave = async (lowonganId) => {
    setUnsaving((prev) => ({ ...prev, [lowonganId]: true }));
    try {
      const token = getTokenFromCookie();
      const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/alumni/me/unsave-lowongan", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ lowonganId }),
      });
      if (!res.ok) throw new Error("Gagal unsave lowongan");
      // Setelah unsave, refresh daftar savedLowongan
      await fetchSavedLowongan();
    } catch (e) {
      alert("Gagal menghapus lowongan dari favorit.");
    } finally {
      setUnsaving((prev) => ({ ...prev, [lowonganId]: false }));
    }
  };

  return (
    <div className="w-full font-sans rounded-b-lg h-auto flex flex-col" style={{height: "100vh"}}>
      <div className="text-[20px] text-[#222] font-semibold mb-4 px-6 pt-6">
        Lowongan yang Disimpan{" "}
        <span className="text-[#6c757d] font-normal">
          ({loading ? "..." : savedLowongan.length} total)
        </span>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-12">Memuat data...</div>
      ) : err ? (
        <div className="text-center text-red-500 py-12">{err}</div>
      ) : savedLowongan.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          Belum ada lowongan yang disimpan.
        </div>
      ) : (
        <div
          className="w-full flex-1 overflow-y-auto pb-4 px-0"
          style={{
            minHeight: 0,
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE 10+
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {savedLowongan.map((item, idx) => {
            const namaPerusahaan = getNamaPerusahaan(item);
            const logoPerusahaan = getLogo(item);
            // isSaved selalu true karena ini halaman saved
            const isSaved = true;
            return (
              <div
                key={item._id || idx}
                className="relative bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] flex px-6 py-5 mb-4 min-h-[120px] group transition hover:shadow-lg w-full"
              >
                {/* Bookmark Button */}
                <button
                  className={` absolute top-4 right-4 z-10 p-2 rounded-full transition ${
                    isSaved
                      ? "bg-[#eaf7e6] text-[#27ae60]"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  aria-label={isSaved ? "Unsave lowongan" : "Save lowongan"}
                  title={isSaved ? "Hapus dari favorit" : "Simpan lowongan"}
                  tabIndex={0}
                  type="button"
                  disabled={unsaving[item._id]}
                  onClick={() => handleUnsave(item._id)}
                >
                  {isSaved ? (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="#27ae60"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M6 3.5A2.5 2.5 0 0 0 3.5 6v12.25a.75.75 0 0 0 1.175.624L11 15.21l6.325 3.664A.75.75 0 0 0 18.5 18.25V6A2.5 2.5 0 0 0 16 3.5H6Z" />
                    </svg>
                  ) : (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M6 3.5A2.5 2.5 0 0 0 3.5 6v12.25a.75.75 0 0 0 1.175.624L11 15.21l6.325 3.664A.75.75 0 0 0 18.5 18.25V6A2.5 2.5 0 0 0 16 3.5H6Z" />
                    </svg>
                  )}
                  {unsaving[item._id] && (
                    <span className="ml-2 text-xs text-gray-400 animate-pulse">...</span>
                  )}
                </button>
                {/* Logo */}
                <div className="w-16 h-16 rounded-xl bg-[#eaf7e6] flex items-center justify-center mr-6 flex-shrink-0 overflow-hidden border border-[#e0e0e0]">
                  {logoPerusahaan ? (
                    <img
                      src={logoPerusahaan}
                      alt={namaPerusahaan || "Logo"}
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
                        <circle
                          cx="16"
                          cy="16"
                          r="15"
                          stroke="#6fcf97"
                          strokeWidth="2"
                        />
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
                        {item.judul_pekerjaan || "-"}
                      </span>
                      <span className="text-[15px] text-[#27ae60] font-semibold mt-0.5 truncate">
                        {namaPerusahaan}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
                        <svg
                          className="mr-1"
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 9 7 9s7-3.75 7-9c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 10 6a2.5 2.5 0 0 1 0 5.5z"
                            fill="#6c757d"
                          />
                        </svg>
                        {item.lokasi || "-"}
                      </span>
                      <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
                        <svg
                          className="mr-1"
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10zm6-8a8 8 0 1 0 0 16A8 8 0 0 0 10 2zm0 3a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
                            fill="#6c757d"
                          />
                        </svg>
                        {item.tipe_kerja || "-"}
                      </span>
                    </div>
                  </div>
                  {/* Salary dan status */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                    <span className="flex items-center text-[15px] text-[#4fc3f7] font-bold">
                      <svg
                        className="mr-1"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M10 18c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-14a6 6 0 1 1 0 12A6 6 0 0 1 10 4zm1 3v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H7a1 1 0 1 1 0-2h2V7a1 1 0 1 1 2 0z"
                          fill="#4fc3f7"
                        />
                      </svg>
                      {item.gaji || "-"}
                    </span>
                    <span
                      className={`flex items-center text-[15px] font-bold ${
                        item.status === "open"
                          ? "text-[#27ae60]"
                          : "text-[#e74c3c]"
                      }`}
                    >
                      <svg
                        className="mr-1"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        {item.status === "open" ? (
                          <circle cx="10" cy="10" r="6" fill="#27ae60" />
                        ) : (
                          <circle cx="10" cy="10" r="6" fill="#e74c3c" />
                        )}
                      </svg>
                      {item.status === "open" ? "Open" : "Closed"}
                    </span>
                    <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
                      <svg
                        className="mr-1"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M3 3h14v2H3V3zm2 4h10v2H5V7zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z"
                          fill="#6c757d"
                        />
                      </svg>
                      {item.kualifikasi || "-"}
                    </span>
                  </div>
                  {/* Info bawah: pelamar, batas pelamar, views, batas, waktu posting */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg
                        className="mr-1"
                        width="15"
                        height="15"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.31 0-6 2.24-6 5v1h12v-1c0-2.76-2.69-5-6-5z"
                          fill="#6c757d"
                        />
                      </svg>
                      {item.jumlah_pelamar ?? "-"} pelamar
                    </span>
                    {/* batas_pelamar */}
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg
                        className="mr-1"
                        width="15"
                        height="15"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M12 2a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2h2zm-2 2V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1h-4zm-4 3v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"
                          fill="#6c757d"
                        />
                      </svg>
                      Batas pelamar:{" "}
                      <span className="ml-1 font-semibold text-[#222]">
                        {item.batas_pelamar ?? "-"}
                      </span>
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg
                        className="mr-1"
                        width="15"
                        height="15"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10zm8-6a6 6 0 1 0 0 12A6 6 0 0 0 10 4zm0 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                          fill="#6c757d"
                        />
                      </svg>
                      {item.traffic ?? 0} views
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg
                        className="mr-1"
                        width="15"
                        height="15"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6zm0 2h8v12H6V4zm2 2v2h4V6H8z"
                          fill="#6c757d"
                        />
                      </svg>
                      Batas:{" "}
                      <span className="ml-1 font-semibold text-[#222]">
                        {formatDate(item.batas_lamaran)}
                      </span>
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg
                        className="mr-1"
                        width="15"
                        height="15"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 10 4zm0 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                          fill="#6c757d"
                        />
                      </svg>
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
                {/* Apply/Detail Button */}
                <div className="ml-6 flex flex-col items-end justify-between h-full min-w-[120px]">
                  <div className="mt-14 w-full flex justify-end">
                    <button
                      className={`
                        bg-[#4fc3f7] text-white rounded-lg px-6 py-2.5 font-semibold text-[15px] shadow-[0_2px_8px_0_rgba(79,195,247,0.12)]
                        mb-2 flex items-center justify-center transition
                        ${item.status === "open" ? "opacity-100 cursor-pointer" : "opacity-50 pointer-events-none"}
                      `}
                      aria-label="Detail"
                      disabled={item.status !== "open"}
                      title={item.status === "open" ? "Lihat detail lowongan" : "Lowongan sudah ditutup"}
                      type="button"
                      onClick={() => {
                        router.push(`/cariLowongan/detailLowongan?id=${item._id}`);
                      }}
                    >
                      Detail
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
          })}
        </div>
      )}
    </div>
  );
}
