// filterLowongan.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import { HiMenu } from "react-icons/hi";
import SavedPage from "../saved/page";
import RekomendasiPage from "../rekomendasi/page";
import ListLowonganPage from "../listLowongan/page";
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
    if (
      typeof item.nama_perusahaan !== "undefined" &&
      typeof item.logo_perusahaan !== "undefined"
    ) {
      return item;
    }
    if (item.perusahaan && typeof item.perusahaan === "object") {
      return {
        ...item,
        nama_perusahaan: item.perusahaan.nama_perusahaan ?? "",
        logo_perusahaan: item.perusahaan.logo_perusahaan ?? "",
      };
    }
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

  // For responsive kualifikasi dropdown
  const [showKualifikasi, setShowKualifikasi] = useState(false);
  const kualifikasiRef = useRef(null);

  // For responsive filter modal
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // For responsive filter tab dropdown
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        kualifikasiRef.current &&
        !kualifikasiRef.current.contains(event.target)
      ) {
        setShowKualifikasi(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    }
    if (showKualifikasi || showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showKualifikasi, showFilterDropdown]);

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
    setShowMobileFilter(false); // close filter modal on mobile after search
  }

  function handleFilterChange(idx) {
    setActiveFilter(idx);
    setShowFilterDropdown(false);
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

  // Filter form content (for reuse in desktop and mobile modal)
  function FilterFormContent({ isMobile = false, onClose }) {
    return (
      <>
        <div className={isMobile ? "flex flex-col gap-4" : "flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto"}>
          {/* Lokasi */}
          <div className="relative w-full sm:w-auto">
            <select
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8 w-full sm:w-auto"
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
          <div className="relative w-full sm:w-auto">
            <select
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8 w-full sm:w-auto"
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
          <div className="relative w-full sm:w-auto">
            <select
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8 w-full sm:w-auto"
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
          <div className="relative w-full sm:w-auto" ref={kualifikasiRef}>
            <button
              type="button"
              className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8 flex items-center min-w-[120px] w-full sm:w-auto"
              tabIndex={0}
              onClick={() => setShowKualifikasi((v) => !v)}
            >
              {kualifikasi.length === 0
                ? "Kualifikasi"
                : kualifikasi.join(", ")}
              <FiChevronDown className="ml-2 text-gray-400 pointer-events-none" />
            </button>
            {/* Responsive dropdown: absolute on desktop, fixed full on mobile */}
            <div
              className={classNames(
                "z-20",
                showKualifikasi ? "" : "hidden"
              )}
            >
              {/* Desktop */}
              <div className="hidden sm:block absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
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
              {/* Mobile */}
              <div className="sm:hidden fixed inset-0 backdrop-blur-xs flex items-end z-30">
                <div className="w-full bg-white rounded-t-lg shadow-lg max-h-[70vh] overflow-y-auto py-4 px-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-base">Kualifikasi</span>
                    <button
                      type="button"
                      className="text-gray-500 text-lg"
                      onClick={() => setShowKualifikasi(false)}
                    >
                      &times;
                    </button>
                  </div>
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
                  <div className="flex justify-between mt-4">
                    <button
                      type="button"
                      className="text-xs text-blue-600"
                      onClick={() => setKualifikasi([])}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="text-xs text-blue-600"
                      onClick={() => setShowKualifikasi(false)}
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isMobile && (
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"
              onClick={onClose}
            >
              Tutup
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition"
            >
              Terapkan
            </button>
          </div>
        )}
      </>
    );
  }

  // Helper to get current filter label
  function getActiveFilterLabel() {
    return filterMenu[activeFilter]?.label || "";
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-[#f4f7fa]">
      {/* Top Search Bar */}
      <form
        className="w-full bg-white border-b border-gray-200 py-4 px-2 sm:px-4 md:px-8 lg:px-12 flex flex-col gap-4 md:flex-row md:items-center"
        onSubmit={handleSearch}
      >
        <div className="flex-1 flex items-center bg-[#f4f7fa] rounded-md border border-gray-200 px-3 py-2 min-w-0">
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
        {/* Hamburger for mobile */}
        <div className="flex sm:hidden w-full">
          <button
            type="button"
            className="flex items-center justify-center w-full bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500"
            onClick={() => setShowMobileFilter(true)}
          >
            <HiMenu className="text-xl mr-2" />
            Filter
          </button>
        </div>
        {/* Filter options for desktop */}
        <div className="hidden sm:flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
          <FilterFormContent />
        </div>
        <button
          type="submit"
          className="w-full md:w-auto ml-0 md:ml-3 bg-blue-600 hover:bg-blue-700 text-white px-7 py-2 rounded-md text-sm font-semibold shadow-sm transition"
        >
          Search
        </button>
      </form>

      {/* Mobile Filter Modal */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-40 flex items-end sm:hidden">
          <div
            className="absolute inset-0 backdrop-blur-xs"
            onClick={() => setShowMobileFilter(false)}
          ></div>
          <form
            className="relative w-full bg-white rounded-t-lg shadow-lg max-h-[90vh] overflow-y-auto py-6 px-4 z-50"
            onSubmit={handleSearch}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg">Filter Lowongan</span>
              <button
                type="button"
                className="text-gray-500 text-2xl"
                onClick={() => setShowMobileFilter(false)}
              >
                &times;
              </button>
            </div>
            <FilterFormContent isMobile={true} onClose={() => setShowMobileFilter(false)} />
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="w-full bg-white border-b border-gray-200 px-2 sm:px-4 md:px-8 lg:px-12 pt-4">
        {/* Desktop Tabs */}
        <div className="hidden sm:flex gap-1 sm:gap-2 flex-wrap">
          {filterMenu.map((item, idx) => (
            <button
              key={item.label}
              type="button"
              className={classNames(
                "px-3 sm:px-4 py-2 rounded-t-md text-sm font-semibold transition",
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
        {/* Mobile Dropdown */}
        <div className="flex sm:hidden relative w-full">
          <button
            type="button"
            className={classNames(
              "w-full flex items-center justify-between px-3 py-2 rounded-t-md text-sm font-semibold border border-gray-200 bg-gray-100 text-gray-700",
              "focus:outline-none"
            )}
            onClick={() => setShowFilterDropdown((v) => !v)}
            ref={filterDropdownRef}
          >
            <span>{getActiveFilterLabel()}</span>
            <FiChevronDown className={classNames("ml-2 transition-transform", showFilterDropdown ? "rotate-180" : "")} />
          </button>
          {showFilterDropdown && (
            <div
              className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30"
              ref={filterDropdownRef}
            >
              {filterMenu.map((item, idx) => (
                <button
                  key={item.label}
                  type="button"
                  className={classNames(
                    "w-full text-left px-4 py-2 text-sm font-semibold transition",
                    activeFilter === idx
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => handleFilterChange(idx)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 min-h-[60vh]">
        <div className="w-full"></div>
        {activeFilter === 0 ? (
          <div className="max-w-full md:max-w-6xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
            <RekomendasiPage />
          </div>
        ) : activeFilter === 1 ? (
          <div className="max-w-full md:max-w-6xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
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
          <div className="max-w-full md:max-w-6xl mx-auto py-4 sm:py-8 mb-32 md:mb-96 h-10 -mt-2 px-2 sm:px-4">
            <SavedPage />
          </div>
        )}
      </div>
    </div>
  );
}