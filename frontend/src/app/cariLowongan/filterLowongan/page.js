// filterLowongan.jsx
"use client";
import { useState, useEffect } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import SavedPage from "../saved/page";
import RekomendasiPage from "../rekomendasi/page";
import ListLowonganPage from "../listLowongan/page"; // Nama impor yang benar
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

// Helper to flatten perusahaan fields
function flattenLowonganPerusahaanFields(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    // If already has nama_perusahaan and logo_perusahaan, just return as is
    if (
      typeof item.nama_perusahaan !== "undefined" &&
      typeof item.logo_perusahaan !== "undefined"
    ) {
      return item;
    }
    // If nested in perusahaan
    if (item.perusahaan && typeof item.perusahaan === "object") {
      return {
        ...item,
        nama_perusahaan: item.perusahaan.nama_perusahaan ?? "",
        logo_perusahaan: item.perusahaan.logo_perusahaan ?? "",
      };
    }
    // If fields are missing, just add empty string
    return {
      ...item,
      nama_perusahaan: item.nama_perusahaan ?? "",
      logo_perusahaan: item.logo_perusahaan ?? "",
    };
  });
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

  const [allLowongan, setAllLowongan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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

  // Perbaiki logika handleSearch
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
      const selectedOption = gajiRangeOptions[idx];
      setGajiMin(selectedOption.min);
      setGajiMax(selectedOption.max);
    }
  }

  function handleKualifikasiChange(e) {
    const value = e.target.value;
    if (value === "") {
      setKualifikasi([]);
    } else if (kualifikasi.includes(value)) {
      setKualifikasi(kualifikasi.filter((k) => k !== value));
    } else {
      setKualifikasi([...kualifikasi, value]);
    }
  }

  // Fetch all lowongan (unfiltered) regardless of the tab
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const url = `https://tugasakhir-production-6c6c.up.railway.app/lowongan`;
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data lowongan");
        return res.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data || [];
        setAllLowongan(flattenLowonganPerusahaanFields(arr));
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message || "Terjadi kesalahan");
        setAllLowongan([]);
        setLoading(false);
      });
  }, [token]);

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
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
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
              onChange={(e) => setLokasi(e.target.value)}
            >
              <option value="">Lokasi</option>
              {lokasiOptions.slice(1).map((opt) => (
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
              onChange={(e) => setTipeKerja(e.target.value)}
            >
              <option value="">Tipe Kerja</option>
              {tipeKerjaOptions.slice(1).map((opt) => (
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
              value={
                gajiRangeOptions.findIndex(
                  (opt) => opt.min === gajiMin && opt.max === gajiMax
                ) || ""
              }
              onChange={handleGajiRangeChange}
            >
              {gajiRangeOptions.map((opt, idx) => (
                <option key={opt.label} value={idx}>
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
                {kualifikasiOptions.slice(1).map((opt) => (
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
          <div className="max-w-6xl mx-auto py-8">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                Memuat lowongan...
              </div>
            ) : fetchError ? (
              <div className="text-center text-red-500 py-8">
                {fetchError}
              </div>
            ) : (
              <ListLowonganPage
                lowongan={allLowongan}
                filter={{
                  search,
                  lokasi,
                  tipeKerja,
                  gajiMin,
                  gajiMax,
                  kualifikasi,
                }}
              />
            )}
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