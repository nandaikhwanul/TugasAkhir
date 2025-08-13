"use client";
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import SavedPage from "../saved/page";
import RekomendasiPage from "../rekomendasi/page";
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Helper for date formatting
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
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

// Filter options for dropdowns
const lokasiOptions = [
  "",
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
  "Medan",
  "Makassar",
  "Bali",
  "Lainnya",
];

const tipeKerjaOptions = [
  { label: "", value: "" },
  { label: "Full Time", value: "Full Time" },
  { label: "Part Time", value: "Part Time" },
  { label: "Internship", value: "Internship" },
  { label: "Freelance", value: "Freelance" },
  { label: "Remote", value: "Remote" },
];

const gajiRangeOptions = [
  { label: "Semua", min: "", max: "" },
  { label: "< 3jt", min: "", max: "3000000" },
  { label: "3jt - 5jt", min: "3000000", max: "5000000" },
  { label: "5jt - 10jt", min: "5000000", max: "10000000" },
  { label: "> 10jt", min: "10000000", max: "" },
];
const kualifikasiOptions = [
  "",
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "UI/UX",
  "SQL",
  "Golang",
  "PHP",
  "C++",
  "Lainnya",
];

const filterMenu = [
  { label: "Rekomendasi" },
  { label: "Semua Lowongan" },
  { label: "Disimpan" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const FILTER_KEY = "cariLowonganActiveFilter";

function ListLowonganCustomTampilan({ 
  lokasi, 
  tipe_kerja, 
  gaji_min, 
  gaji_max, 
  kualifikasi, 
  useFilterEndpoint, 
  filterEndpoint 
}) {
  const [loading, setLoading] = useState(false);
  const [lowongan, setLowongan] = useState([]);
  const [error, setError] = useState(null);

  function buildQuery() {
    const params = [];
    if (lokasi) params.push(`lokasi=${encodeURIComponent(lokasi)}`);
    if (tipe_kerja) params.push(`tipe_kerja=${encodeURIComponent(tipe_kerja)}`);
    if (gaji_min) params.push(`gaji_min=${encodeURIComponent(gaji_min)}`);
    if (gaji_max) params.push(`gaji_max=${encodeURIComponent(gaji_max)}`);
    if (kualifikasi) params.push(`kualifikasi=${encodeURIComponent(kualifikasi)}`);
    return params.length > 0 ? "?" + params.join("&") : "";
  }

  useEffect(() => {
    if (!useFilterEndpoint || !filterEndpoint) return;
    setLoading(true);
    setError(null);
    setLowongan([]);
    const url = filterEndpoint + buildQuery();
    fetch(url, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat data lowongan");
        const json = await res.json();
        setLowongan(Array.isArray(json.data) ? json.data : []);
      })
      .catch((err) => {
        setError(err.message || "Gagal memuat data");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [lokasi, tipe_kerja, gaji_min, gaji_max, kualifikasi, filterEndpoint, useFilterEndpoint]);

  // Untuk demo, asumsikan semua lowongan belum disimpan
  const filteredLowongan = lowongan;

  return (
    <div className="min-h-screen h-screen w-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="w-full font-sans rounded-b-lg flex flex-col flex-1 min-h-0">
          <div className="text-[20px] text-[#222] font-semibold mb-4 px-6 pt-6">
            Lowongan yang belum disimpan{" "}
            <span className="text-[#6c757d] font-normal">
              ({filteredLowongan.length} total)
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
              <div className="text-[#6c757d] text-[16px] px-6">Memuat lowongan...</div>
            )}
            {error && (
              <div className="text-[#e74c3c] text-[16px] px-6">{error}</div>
            )}
            {!loading && !error && filteredLowongan.length === 0 && (
              <div className="text-[#6c757d] text-[16px] px-6">
                Tidak ada lowongan yang tersedia.
              </div>
            )}
            {filteredLowongan.map((item) => (
              <div
                key={item._id}
                className="relative bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] flex px-6 py-5 mb-4 min-h-[120px] group transition hover:shadow-lg w-full"
              >
                {/* Bookmark Button */}
                <button
                  className={` absolute top-4 right-4 z-10 p-2 rounded-full transition bg-gray-100 text-gray-400 hover:bg-gray-200 `}
                  aria-label="Save lowongan"
                  title="Simpan lowongan"
                  tabIndex={0}
                  type="button"
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
                {/* Logo */}
                <div className="w-16 h-16 rounded-xl bg-[#eaf7e6] flex items-center justify-center mr-6 flex-shrink-0 overflow-hidden border border-[#e0e0e0]">
                  {item.perusahaan?.logo_perusahaan ? (
                    <img
                      src={item.perusahaan.logo_perusahaan}
                      alt={item.perusahaan?.nama_perusahaan || "Logo"}
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
                        {item.judul_pekerjaan || "-"}
                      </span>
                      <span className="text-[15px] text-[#27ae60] font-semibold mt-0.5 truncate">
                        {item.perusahaan?.nama_perusahaan || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
                        <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
                          <path d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 9 7 9s7-3.75 7-9c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 10 6a2.5 2.5 0 0 1 0 5.5z" fill="#6c757d"/>
                        </svg>
                        {item.lokasi || "-"}
                      </span>
                      <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
                        <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
                          <path d="M4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10zm6-8a8 8 0 1 0 0 16A8 8 0 0 0 10 2zm0 3a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="#6c757d"/>
                        </svg>
                        {item.tipe_kerja || "-"}
                      </span>
                    </div>
                  </div>
                  {/* Salary dan status */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                    <span className="flex items-center text-[15px] text-[#4fc3f7] font-bold">
                      <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
                        <path d="M10 18c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-14a6 6 0 1 1 0 12A6 6 0 0 1 10 4zm1 3v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H7a1 1 0 1 1 0-2h2V7a1 1 0 1 1 2 0z" fill="#4fc3f7"/>
                      </svg>
                      {item.gaji || "-"}
                    </span>
                    <span className={`flex items-center text-[15px] font-bold ${item.status === "open" ? "text-[#27ae60]" : "text-[#e74c3c]"}`}>
                      <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
                        {item.status === "open" ? (
                          <circle cx="10" cy="10" r="6" fill="#27ae60" />
                        ) : (
                          <circle cx="10" cy="10" r="6" fill="#e74c3c" />
                        )}
                      </svg>
                      {item.status === "open" ? "Open" : "Closed"}
                    </span>
                    <span className="flex items-center text-[15px] text-[#6c757d] font-medium">
                      <svg className="mr-1" width="16" height="16" fill="none" viewBox="0 0 20 20">
                        <path d="M3 3h14v2H3V3zm2 4h10v2H5V7zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z" fill="#6c757d"/>
                      </svg>
                      {item.kualifikasi || "-"}
                    </span>
                  </div>
                  {/* Info bawah: pelamar, batas pelamar, views, batas, waktu posting */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
                        <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.31 0-6 2.24-6 5v1h12v-1c0-2.76-2.69-5-6-5z" fill="#6c757d"/>
                      </svg>
                      {item.jumlah_pelamar ?? "-"} pelamar
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
                        <path d="M8 2a2 2 0 0 1 4 0v1h2a2 2 0 0 1 2 2v1H4V5a2 2 0 0 1 2-2h2V2zm8 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7h12zm-2 2H6v8h8V9z" fill="#6c757d"/>
                      </svg>
                      Batas pelamar: <span className="ml-1 font-semibold text-[#222]">{item.batas_pelamar ?? "-"}</span>
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
                        <path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10zm8-6a6 6 0 1 0 0 12A6 6 0 0 0 10 4zm0 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" fill="#6c757d"/>
                      </svg>
                      {item.traffic ?? 0} views
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
                        <path d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6zm0 2h8v12H6V4zm2 2v2h4V6H8z" fill="#6c757d"/>
                      </svg>
                      Batas: <span className="ml-1 font-semibold text-[#222]">{formatDate(item.batas_lamaran)}</span>
                    </span>
                    <span className="flex items-center text-[14px] text-[#6c757d] font-normal">
                      <svg className="mr-1" width="15" height="15" fill="none" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 10 4zm0 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" fill="#6c757d"/>
                      </svg>
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
                {/* Apply Button */}
                <div className="ml-6 flex flex-col items-end justify-between h-full min-w-[120px]">
                  <div className="mt-14 w-full flex justify-end">
                    <button
                      className={` bg-[#4fc3f7] text-white rounded-lg px-6 py-2.5 font-semibold text-[15px] shadow-[0_2px_8px_0_rgba(79,195,247,0.12)] mb-2 flex items-center justify-center transition ${item.status === "open" ? "opacity-100 cursor-pointer" : "opacity-50 pointer-events-none"} `}
                      aria-label="Apply"
                      disabled={item.status !== "open"}
                      title={item.status === "open" ? "Lamar pekerjaan ini" : "Lowongan sudah ditutup"}
                    >
                      Lamar
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="inline ml-2" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 5l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CariLowonganPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const [lokasi, setLokasi] = useState("");
  const [tipeKerja, setTipeKerja] = useState("");
  const [gajiMin, setGajiMin] = useState("");
  const [gajiMax, setGajiMax] = useState("");
  const [kualifikasi, setKualifikasi] = useState([]);

  const token = getTokenFromSessionStorage();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(FILTER_KEY);
      if (saved !== null && !isNaN(Number(saved))) {
        setActiveFilter(Number(saved));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FILTER_KEY, String(activeFilter));
    }
  }, [activeFilter]);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  function handleFilterChange(idx) {
    setActiveFilter(idx);
  }

  function handleGajiRangeChange(e) {
    const idx = e.target.value;
    if (idx === "") {
      setGajiMin("");
      setGajiMax("");
    } else {
      setGajiMin(gajiRangeOptions[idx].min);
      setGajiMax(gajiRangeOptions[idx].max);
    }
  }

  function handleKualifikasiChange(e) {
    const value = e.target.value;
    if (value === "") {
      setKualifikasi([]);
    } else if (kualifikasi.includes(value)) {
      setKualifikasi(kualifikasi.filter(k => k !== value));
    } else {
      setKualifikasi([...kualifikasi, value]);
    }
  }

  const filterProps = useMemo(() => ({
    lokasi,
    tipe_kerja: tipeKerja,
    gaji_min: gajiMin,
    gaji_max: gajiMax,
    kualifikasi: kualifikasi.length > 0 ? kualifikasi.join(",") : "",
    useFilterEndpoint: true,
    filterEndpoint: "https://tugasakhir-production-6c6c.up.railway.app/lowongan/filter",
  }), [lokasi, tipeKerja, gajiMin, gajiMax, kualifikasi]);

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-[#f4f7fa]">
      {/* Top Search Bar */}
      <form
        className="w-full bg-white border-b border-gray-200 py-4 px-4 md:px-12 flex flex-col md:flex-row items-stretch md:items-center gap-4"
        onSubmit={handleSearch}
      >
        <div className="flex-1 flex items-center bg-[#f4f7fa] rounded-md border border-gray-200 px-3 py-2">
          <FiSearch className="text-gray-400 text-lg mr-2" />
          <input
            type="text"
            placeholder="Pekerjaan apa yang anda inginkan ?"
            className="bg-transparent outline-none w-full text-sm text-black"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                handleSearch(e);
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Lokasi */}
          <div className="relative">
            <select
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8"
              value={lokasi}
              onChange={e => setLokasi(e.target.value)}
            >
              <option value="">Lokasi</option>
              {lokasiOptions.slice(1).map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Tipe Kerja */}
          <div className="relative">
            <select
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8"
              value={tipeKerja}
              onChange={e => setTipeKerja(e.target.value)}
            >
              <option value="">Tipe Kerja</option>
              {tipeKerjaOptions.slice(1).map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Salary Range */}
          <div className="relative">
            <select
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8"
              value={gajiRangeOptions.findIndex(
                opt => opt.min === gajiMin && opt.max === gajiMax
              )}
              onChange={handleGajiRangeChange}
            >
              {gajiRangeOptions.map((opt, idx) => (
                <option key={opt.label} value={idx === 0 ? "" : idx}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Kualifikasi (multi-select as checkboxes in dropdown) */}
          <div className="relative group">
            <button
              type="button"
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8 flex items-center min-w-[120px]"
              tabIndex={0}
            >
              {kualifikasi.length === 0
                ? "Kualifikasi"
                : kualifikasi.join(", ")}
              <FiChevronDown className="ml-2 text-gray-400 pointer-events-none" />
            </button>
            <div className="absolute z-10 left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg hidden group-focus-within:block group-hover:block">
              <div className="max-h-60 overflow-y-auto py-2 px-2">
                {kualifikasiOptions.slice(1).map(opt => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 px-2 py-1 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      value={opt}
                      checked={kualifikasi.includes(opt)}
                      onChange={handleKualifikasiChange}
                      className="accent-blue-600"
                    />
                    {opt}
                  </label>
                ))}
                <button
                  type="button"
                  className="text-xs text-blue-600 mt-2 ml-2"
                  onClick={() => setKualifikasi([])}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="ml-0 md:ml-3 bg-blue-600 hover:bg-blue-700 text-white px-7 py-2 rounded-md text-sm font-semibold shadow-sm transition"
        >
          Search
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="w-full bg-white border-b border-gray-200 px-4 md:px-12 pt-4">
        <div className="flex gap-2">
          {filterMenu.map((item, idx) => (
            <button
              key={item.label}
              type="button"
              className={classNames(
                "px-4 py-2 rounded-t-md text-sm font-semibold transition",
                activeFilter === idx
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              onClick={() => handleFilterChange(idx)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 min-h-[60vh]">
        <div className="w-full"></div>
        {activeFilter === 0 ? (
          <div className="max-w-6xl mx-auto py-8">
            <RekomendasiPage />
          </div>
        ) : activeFilter === 1 ? (
          <div className="mb-20 py-8">
            <ListLowonganCustomTampilan key={JSON.stringify(filterProps)} {...filterProps} />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto py-8">
            <SavedPage />
          </div>
        )}
      </div>
    </div>
  );
}
