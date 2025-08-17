/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";

// Helper tampil: format tanggal
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper tampil: waktu relatif
function timeAgo(dateStr) {
  if (!dateStr) return "-";
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(dateStr);
}

// Helper tampil: kualifikasi singkat
function getKualifikasiSingkat(item) {
  if (item.kualifikasi) {
    if (Array.isArray(item.kualifikasi) && item.kualifikasi.length > 0) {
      return item.kualifikasi[0];
    }
    if (typeof item.kualifikasi === "string" && item.kualifikasi.trim() !== "") {
      const firstSentence = item.kualifikasi.split(".")[0];
      if (firstSentence.length > 3) return firstSentence.trim();
      return item.kualifikasi.split(/\s+/).slice(0, 8).join(" ");
    }
  }
  if (item.deskripsi && typeof item.deskripsi === "string") {
    const lines = item.deskripsi.split(/[\n.]/);
    const keyWords = [
      "S1", "D3", "SMA", "SMK", "pengalaman", "tahun", "pria", "wanita", "maksimal", "minimal", "lulusan", "pendidikan"
    ];
    for (let line of lines) {
      for (let kw of keyWords) {
        if (line.toLowerCase().includes(kw.toLowerCase())) {
          return line.trim();
        }
      }
    }
    return item.deskripsi.split(/\s+/).slice(0, 8).join(" ") + "...";
  }
  return "-";
}

// HANYA TAMPILAN, props: filteredLowongan, search, filter, sort
export default function ListLowonganPageTampilanSaja({
  filteredLowongan = [],
  search = "",
  filter = {},
  sort = { field: "createdAt", order: "desc" },
}) {
  // Untuk tampilan dropdown sort
  const localSortOrder = sort && sort.order ? sort.order : "desc";
  const totalUnSaved = filteredLowongan.length;

  return (
    <div className="min-h-screen h-screen w-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="w-full font-sans rounded-b-lg flex flex-col flex-1 min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 pt-6 mb-4">
            <div className="text-[20px] text-[#222] font-semibold">
              {search && search.trim() !== "" ? (
                <>
                  Hasil pencarian untuk <span className="font-bold">"{search}"</span>{" "}
                  <span className="text-[#6c757d] font-normal">
                    ({filteredLowongan.length} dari {totalUnSaved})
                  </span>
                </>
              ) : (
                <>
                  Lowongan yang belum disimpan{" "}
                  <span className="text-[#6c757d] font-normal">
                    ({totalUnSaved} total)
                  </span>
                </>
              )}
            </div>
            {/* Dropdown sorting */}
            <div className="mt-3 sm:mt-0 flex items-center gap-2">
              <label htmlFor="sort-lowongan" className="text-[#444] text-[15px] font-medium mr-2">
                Urutkan:
              </label>
              <div className="relative">
                <select
                  id="sort-lowongan"
                  className="appearance-none border border-[#e0e0e0] rounded-lg py-1.5 pl-9 pr-6 text-[15px] text-[#222] bg-white focus:outline-none focus:ring-2 focus:ring-[#4fc3f7] transition"
                  value={localSortOrder}
                  style={{ minWidth: 120, cursor: "pointer" }}
                  readOnly
                >
                  <option value="desc">Terbaru</option>
                  <option value="asc">Terlama</option>
                </select>
                <span className="absolute left-2 top-1.5 text-[#4fc3f7] pointer-events-none">
                  {localSortOrder === "desc" ? (
                    <FaSortAmountDown size={18} />
                  ) : (
                    <FaSortAmountUp size={18} />
                  )}
                </span>
              </div>
            </div>
          </div>
          <div
            className="w-full flex-1 overflow-y-auto pb-4 px-0 md:mb-52 mb-[295px]"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            <style jsx global>{`
              .w-full.flex-1.overflow-y-auto.pb-4.px-0::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {filteredLowongan.length === 0 && (
              <div className="text-[#6c757d] text-[16px] px-6">
                {search && search.trim() !== ""
                  ? "Tidak ada lowongan yang cocok dengan pencarian."
                  : "Semua lowongan sudah disimpan atau belum ada lowongan tersedia."}
              </div>
            )}
            {filteredLowongan.map((item) => {
              return (
                <div
                  key={item._id ? String(item._id) : Math.random()}
                  className="relative bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] flex flex-col sm:flex-row px-6 py-5 mb-4 min-h-[120px] group transition hover:shadow-lg w-full"
                >
                  {/* Bookmark Button (dummy, tidak ada aksi) */}
                  <button
                    className="absolute top-4 right-4 z-10 p-2 rounded-full transition bg-gray-100 text-gray-400 hover:bg-gray-200"
                    aria-label="Save lowongan"
                    title="Simpan lowongan"
                    tabIndex={0}
                    type="button"
                    disabled
                  >
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
                  </button>
                  <div className="flex items-start mb-4 sm:mb-0 sm:mr-6 w-full sm:w-auto">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-xl bg-[#eaf7e6] flex items-center justify-center mr-4 flex-shrink-0 overflow-hidden border border-[#e0e0e0]">
                      {item.logo_perusahaan ? (
                        <img
                          src={
                            item.logo_perusahaan.startsWith("http")
                              ? item.logo_perusahaan
                              : `https://tugasakhir-production-6c6c.up.railway.app${item.logo_perusahaan}`
                          }
                          alt={item.nama_perusahaan || "Logo"}
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
                    <div className="flex-1 flex flex-col justify-start min-w-0">
                      <span className="text-[18px] font-bold text-[#222] truncate">
                        {item.nama_lowongan || "-"}
                      </span>
                      <span className="text-[15px] text-[#27ae60] font-semibold mt-0.5 truncate">
                        {item.nama_perusahaan || "-"}
                      </span>
                    </div>
                  </div>
                  {/* Info Tambahan */}
                  <div className="flex-1 flex flex-col justify-start gap-y-2 mt-4 sm:mt-0 sm:pl-6 sm:border-l sm:border-gray-200">
                    <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
                      <svg
                        className="mr-2 flex-shrink-0"
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
                        className="mr-2 flex-shrink-0"
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
                    <span className="flex items-center text-[15px] text-[#4fc3f7] font-bold">
                      <svg
                        className="mr-2 flex-shrink-0"
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
                        className="mr-2 flex-shrink-0"
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
                    <span className="flex items-center text-[15px] text-[#444] font-normal mt-2">
                        <svg
                          className="mr-2 flex-shrink-0"
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path d="M3 3h14v2H3V3zm2 4h10v2H5V7zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z" fill="#6c757d"/>
                        </svg>
                        <span className="truncate">
                          {getKualifikasiSingkat(item)}
                        </span>
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg
                        className="mr-2 flex-shrink-0"
                        width="15"
                        height="15"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M8 2a2 2 0 0 1 4 0v1h2a2 2 0 0 1 2 2v1H4V5a2 2 0 0 1 2-2h2V2zm8 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7h12zm-2 2H6v8h8V9z"
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
                        className="mr-2 flex-shrink-0"
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
                  {/* Apply Button */}
                  <div className="w-full sm:w-auto mt-6 sm:mt-0 sm:ml-6 flex items-end">
                    <Link
                      href={`/cariLowongan/detailLowongan?id=${item._id ? String(item._id) : ""}`}
                      className={`w-full bg-[#4fc3f7] text-white rounded-lg px-6 py-2.5 font-semibold text-[15px] shadow-[0_2px_8px_0_rgba(79,195,247,0.12)] flex items-center justify-center transition ${
                        item.status === "open"
                          ? "opacity-100 cursor-pointer"
                          : "opacity-50 pointer-events-none"
                      } `}
                      aria-label="Apply"
                      title={
                        item.status === "open"
                          ? "Lamar pekerjaan ini"
                          : "Lowongan sudah ditutup"
                      }
                      tabIndex={item.status === "open" ? 0 : -1}
                      style={item.status !== "open" ? { pointerEvents: "none" } : {}}
                    >
                      Lihat
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
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}