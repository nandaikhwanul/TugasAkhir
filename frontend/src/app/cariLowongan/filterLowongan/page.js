"use client";
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import ListLowonganPage from "../listLowongan/page";
import SavedPage from "../saved/page";
import RekomendasiPage from "../rekomendasi/page";
import { getTokenFromSessionStorage } from "../../sessiontoken";

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

// Value harus persis dengan backend (case sensitive, spasi, dsb)
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

// Key for localStorage
const FILTER_KEY = "cariLowonganActiveFilter";

export default function CariLowonganPage() {
  // State filter
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchInput, setSearchInput] = useState(""); // for controlled input

  // Filter states
  const [lokasi, setLokasi] = useState("");
  const [tipeKerja, setTipeKerja] = useState("");
  const [gajiMin, setGajiMin] = useState("");
  const [gajiMax, setGajiMax] = useState("");
  const [kualifikasi, setKualifikasi] = useState([]); // array of string

  // Ambil token dari sessionStorage (bisa digunakan jika perlu)
  const token = getTokenFromSessionStorage();

  // On mount, restore activeFilter from localStorage if exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(FILTER_KEY);
      if (saved !== null && !isNaN(Number(saved))) {
        setActiveFilter(Number(saved));
      }
    }
  }, []);

  // Save activeFilter to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FILTER_KEY, String(activeFilter));
    }
  }, [activeFilter]);

  // Search on enter or button click
  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  function handleFilterChange(idx) {
    setActiveFilter(idx);
  }

  // Handle salary range change
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

  // Handle kualifikasi multi-select
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

  // Gabungkan semua filter ke dalam satu objek agar mudah dipakai sebagai dependency
  // Untuk endpoint /lowongan/filter, gunakan parameter query sesuai backend
  // Endpoint: GET https://tugasakhir-production-6c6c.up.railway.app/lowongan/filter?lokasi=Jakarta&tipe_kerja=Full%20Time&gaji_min=5000000&gaji_max=10000000&kualifikasi=JavaScript,React
  const filterProps = useMemo(() => ({
    // search param intentionally omitted, only use backend params
    lokasi,
    tipe_kerja: tipeKerja,
    gaji_min: gajiMin,
    gaji_max: gajiMax,
    kualifikasi: kualifikasi.length > 0 ? kualifikasi.join(",") : "",
    fullWidth: true,
    useFilterEndpoint: true, // agar ListLowonganPage pakai endpoint filter
    filterEndpoint: "https://tugasakhir-production-6c6c.up.railway.app/lowongan/filter",
  }), [lokasi, tipeKerja, gajiMin, gajiMax, kualifikasi]);

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Top Search Bar */}
      <form
        className="w-full bg-white border-b border-gray-200 py-4 px-12 flex items-center gap-4"
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
        <div className="flex gap-3">
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
          className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-7 py-2 rounded-md text-sm font-semibold shadow-sm transition"
        >
          Search
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="w-full bg-white border-b border-gray-200 px-12 pt-4">
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
      <div className="w-full">
        {/* Header */}
        <div className="w-full"></div>
        {/* Conditional rendering based on activeFilter */}
        {activeFilter === 0 ? (
          // Rekomendasi
          <RekomendasiPage />
        ) : activeFilter === 1 ? (
          // Semua Lowongan
          <div className="mb-20 h-screen">
            {/* ListLowonganPage akan otomatis pakai endpoint /lowongan/filter jika useFilterEndpoint true dan filterEndpoint diberikan */}
            <ListLowonganPage key={JSON.stringify(filterProps)} {...filterProps} />
          </div>
        ) : (
          // Disimpan
          <SavedPage />
        )}
      </div>
    </div>
  );
}
