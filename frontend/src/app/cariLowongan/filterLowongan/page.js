"use client";
import { useState, useEffect } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import ListLowonganPage from "../listLowongan/page";
import SavedPage from "../saved/page";
import RekomendasiPage from "../rekomendasi/page";

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
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchInput, setSearchInput] = useState(""); // for controlled input

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
          <div className="relative">
            <select className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8">
              <option>Role</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8">
              <option>Location</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8">
              <option>Job Type</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none bg-[#f4f7fa] border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 pr-8">
              <option>Salary Range</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
            <ListLowonganPage search={search} fullWidth />
          </div>
        ) : (
          // Disimpan
          <SavedPage />
        )}
      </div>
    </div>
  );
}
