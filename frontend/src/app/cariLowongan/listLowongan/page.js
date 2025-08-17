/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { getTokenFromSessionStorage } from "../../sessiontoken";
import Link from "next/link";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";

// Helper untuk flatten field perusahaan ke top-level
function flattenLowonganPerusahaanFields(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (item && item.perusahaan) {
      return {
        ...item,
        nama_perusahaan: item.perusahaan.nama_perusahaan || item.nama_perusahaan,
        logo_perusahaan: item.perusahaan.logo_perusahaan || item.logo_perusahaan,
      };
    }
    return item;
  });
}

// Helper untuk format tanggal ke format lokal Indonesia
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper untuk waktu relatif
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

// Helper untuk mengambil 1 baris kualifikasi (string)
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

/**
 * Komponen ListLowonganPage menerima prop:
 * - filteredLowongan: array hasil filter dari parent (jika ada)
 * - search: string pencarian (optional, untuk tampilan judul)
 * - filter: object filter (search, lokasi, tipeKerja, gajiMin, gajiMax)
 * - sort: { field: string, order: "asc"|"desc" } (opsional)
 * * Jika filteredLowongan tidak diberikan, maka komponen akan fetch data sendiri (backward compatible).
 * Filtering dan sorting dilakukan di dalam komponen hanya dengan memfilter dan mengurutkan array, tanpa memodifikasi objek di dalamnya.
 * Data SELALU di-flatten sebelum sorting/filtering agar field nama_perusahaan dan logo_perusahaan tetap ada.
 */
export default function ListLowonganPageTampilanSaja({
  filteredLowongan: filteredLowonganProp,
  search: searchProp,
  filter = {},
  sort: sortProp = null, // { field: string, order: "asc"|"desc" }
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(filteredLowonganProp ? false : true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({}); // { [lowonganId]: boolean }
  const [userId, setUserId] = useState(null); // user id alumni

  // Local sort state for dropdown
  const [localSort, setLocalSort] = useState(
    sortProp && sortProp.field === "createdAt"
      ? sortProp
      : { field: "createdAt", order: "desc" }
  );

  // Ambil userId alumni (bukan savedLowonganIds)
  useEffect(() => {
    const token = getTokenFromSessionStorage();
    if (!token) {
      setUserId(null);
      return;
    }
    fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data user.");
        return res.json();
      })
      .then((result) => {
        // result._id adalah id user alumni
        if (result && result._id) {
          setUserId(String(result._id));
        } else {
          setUserId(null);
        }
      })
      .catch(() => {
        setUserId(null);
      });
  }, []);

  // Jika tidak ada prop filteredLowongan, fetch data sendiri (backward compatible)
  useEffect(() => {
    if (filteredLowonganProp) {
      setLoading(false);
      setError(null);
      setData([]); // Data internal tidak dipakai
      return;
    }

    const token = getTokenFromSessionStorage();

    if (!token) {
      setError("Token tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("https://tugasakhir-production-6c6c.up.railway.app/lowongan", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then((res) => {
        if (res.status === 403) {
          throw new Error("Akses ditolak. Hanya alumni yang dapat melihat lowongan.");
        }
        if (!res.ok) {
          throw new Error("Gagal mengambil data lowongan.");
        }
        return res.json();
      })
      .then((result) => {
        let arr;
        if (Array.isArray(result)) {
          arr = result;
        } else {
          arr = result.data || [];
        }
        // FLATTEN sebelum sorting/filtering
        setData(flattenLowonganPerusahaanFields(arr));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message || "Terjadi kesalahan saat mengambil data.");
        setLoading(false);
      });
  }, [filteredLowonganProp]);

  // Gunakan prop filteredLowongan jika ada, jika tidak pakai data internal
  // PASTIKAN flattenLowonganPerusahaanFields dipakai sebelum render/sorting/filtering
  const baseLowongan = filteredLowonganProp
    ? flattenLowonganPerusahaanFields(filteredLowonganProp)
    : data;

  // Exclude lowongan yang sudah di-save user (cek savedBy)
  const baseLowonganUnSaved = baseLowongan.filter((item) => {
    if (!userId) return true; // Jika userId belum didapat, tampilkan semua (atau bisa [] jika ingin strict)
    // item.savedBy bisa array of string atau object (id)
    if (!Array.isArray(item.savedBy)) return true;
    // Cek apakah userId ada di savedBy
    return !item.savedBy.some((saved) => {
      if (typeof saved === "string") return saved === userId;
      if (saved && saved._id) return String(saved._id) === userId;
      return false;
    });
  });

  // Sorting function
  function getSortedLowongan(arr, sortObj) {
    if (!sortObj || !sortObj.field) return arr;
    // Copy array agar tidak mutate
    const sorted = [...arr];
    sorted.sort((a, b) => {
      const { field, order } = sortObj;
      let valA = a[field];
      let valB = b[field];

      // Handle null/undefined
      if (valA == null && valB == null) return 0;
      if (valA == null) return order === "asc" ? 1 : -1;
      if (valB == null) return order === "asc" ? -1 : 1;

      // Numeric sort for gaji, jumlah_pelamar, traffic, batas_pelamar
      if (
        ["gaji", "jumlah_pelamar", "traffic", "batas_pelamar"].includes(field)
      ) {
        // gaji bisa string "Rp 5.000.000 - Rp 7.000.000" atau angka
        const parseGaji = (g) => {
          if (typeof g === "number") return g;
          if (typeof g === "string") {
            const match = g.replace(/\./g, "").match(/(\d+)/g);
            if (match && match.length > 0) {
              return parseInt(match[0], 10);
            }
          }
          return 0;
        };
        valA = parseGaji(valA);
        valB = parseGaji(valB);
        return order === "asc" ? valA - valB : valB - valA;
      }

      // Date sort for createdAt, batas_lamaran
      if (["createdAt", "batas_lamaran"].includes(field)) {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return order === "asc" ? dateA - dateB : dateB - dateA;
      }

      // String sort (case-insensitive)
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  // Filtering hanya memfilter array, tidak memodifikasi objek di dalamnya
  function applyFilter(arr, filterObj) {
    if (!filterObj) return arr;
    let result = arr;

    // Search (nama_lowongan, nama_perusahaan, lokasi)
    if (typeof filterObj.search === "string" && filterObj.search.trim() !== "") {
      const q = filterObj.search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          (item.nama_lowongan && item.nama_lowongan.toLowerCase().includes(q)) ||
          (item.nama_perusahaan && item.nama_perusahaan.toLowerCase().includes(q)) ||
          (item.lokasi && item.lokasi.toLowerCase().includes(q))
      );
    }

    // Lokasi
    if (typeof filterObj.lokasi === "string" && filterObj.lokasi.trim() !== "") {
      const lokasiQ = filterObj.lokasi.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.lokasi && item.lokasi.toLowerCase().includes(lokasiQ)
      );
    }

    // Tipe Kerja
    if (typeof filterObj.tipeKerja === "string" && filterObj.tipeKerja.trim() !== "") {
      const tipeQ = filterObj.tipeKerja.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.tipe_kerja && item.tipe_kerja.toLowerCase().includes(tipeQ)
      );
    }

    // Gaji Min
    if (typeof filterObj.gajiMin === "number" && !isNaN(filterObj.gajiMin)) {
      result = result.filter((item) => {
        // item.gaji bisa string "Rp 5.000.000 - Rp 7.000.000" atau angka
        if (typeof item.gaji === "number") return item.gaji >= filterObj.gajiMin;
        if (typeof item.gaji === "string") {
          // Ambil angka terendah dari string
          const match = item.gaji.replace(/\./g, "").match(/(\d+)/g);
          if (match && match.length > 0) {
            const gajiNum = parseInt(match[0], 10);
            return gajiNum >= filterObj.gajiMin;
          }
        }
        return false;
      });
    }

    // Gaji Max
    if (typeof filterObj.gajiMax === "number" && !isNaN(filterObj.gajiMax)) {
      result = result.filter((item) => {
        if (typeof item.gaji === "number") return item.gaji <= filterObj.gajiMax;
        if (typeof item.gaji === "string") {
          // Ambil angka tertinggi dari string
          const match = item.gaji.replace(/\./g, "").match(/(\d+)/g);
          if (match && match.length > 0) {
            const gajiNum = parseInt(match[match.length - 1], 10);
            return gajiNum <= filterObj.gajiMax;
          }
        }
        return false;
      });
    }

    // Tidak ada filter kualifikasi di sini

    return result;
  }

  // 1. FLATTEN dulu (sudah dilakukan di baseLowongan)
  // 2. EXCLUDE yang sudah di-save (berdasarkan savedBy)
  // 3. FILTER
  // 4. SORT
  const filteredLowongan = getSortedLowongan(
    applyFilter(baseLowonganUnSaved, filter),
    localSort
  );

  const search = searchProp ?? (filter && filter.search ? filter.search : "");
  const totalUnSaved = baseLowonganUnSaved.length;

  // Handler untuk tombol save
  const handleSave = async (lowonganId) => {
    setSaving((prev) => ({ ...prev, [lowonganId]: true }));
    try {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setError("Token tidak ditemukan. Silakan login kembali.");
        setSaving((prev) => ({ ...prev, [lowonganId]: false }));
        return;
      }

      const response = await fetch(
        "https://tugasakhir-production-6c6c.up.railway.app/alumni/me/toggle-save-lowongan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lowonganId }),
        }
      );

      if (!response.ok) {
        const resJson = await response.json().catch(() => ({}));
        throw new Error(
          resJson?.message ||
          "Gagal menyimpan lowongan. Silakan coba lagi."
        );
      }

      // Jika data internal, hapus dari list internal
      if (!filteredLowonganProp) {
        setData((prev) => prev.filter((item) => String(item._id) !== String(lowonganId)));
      }
      // Tidak perlu update savedLowonganIds, cukup rely pada savedBy di data lowongan
      // Jika filteredLowongan dari parent, parent yang harus update list (tidak dihapus di sini)
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menyimpan lowongan.");
    } finally {
      setSaving((prev) => ({ ...prev, [lowonganId]: false }));
    }
  };

  // Dropdown handler
  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === "desc") {
      setLocalSort({ field: "createdAt", order: "desc" });
    } else {
      setLocalSort({ field: "createdAt", order: "asc" });
    }
  };

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
                  Semua Lowongan Yang Tersedia Untuk Anda{" "}
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
                  value={localSort.order}
                  onChange={handleSortChange}
                  style={{ minWidth: 120, cursor: "pointer" }}
                >
                  <option value="desc">Terbaru</option>
                  <option value="asc">Terlama</option>
                </select>
                <span className="absolute left-2 top-1.5 text-[#4fc3f7] pointer-events-none">
                  {localSort.order === "desc" ? (
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
              const isSaved = false; // Untuk tampilan saja
              return (
                <div
                  key={item._id ? String(item._id) : Math.random()}
                  className="relative bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] flex flex-col sm:flex-row px-6 py-5 mb-4 min-h-[120px] group transition hover:shadow-lg w-full"
                >
                  {/* Bookmark Button */}
                  <button
                    className={`absolute top-4 right-4 z-10 p-2 rounded-full transition bg-gray-100 text-gray-400 hover:bg-gray-200 ${
                      saving[item._id] ? "opacity-60 pointer-events-none" : ""
                    }`}
                    aria-label="Save lowongan"
                    title="Simpan lowongan"
                    tabIndex={0}
                    type="button"
                    onClick={() => handleSave(item._id)}
                    disabled={saving[item._id]}
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
                    {saving[item._id] && (
                      <span className="ml-2 text-xs text-gray-400">Menyimpan...</span>
                    )}
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