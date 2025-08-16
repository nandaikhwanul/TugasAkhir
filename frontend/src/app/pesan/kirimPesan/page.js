"use client";
import React, { useState } from "react";
import { FaUserGraduate, FaBuilding, FaUserShield } from "react-icons/fa";

export default function KirimPesan() {
  const [activeTab, setActiveTab] = useState("alumni");
  const [pesan, setPesan] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logika pengiriman pesan ke backend
    // Anda bisa menggunakan data activeTab, searchQuery, dan pesan di sini
    alert(`Pesan terkirim ke ${activeTab} dengan pesan: ${pesan}`);
    
    // Reset form setelah dikirim
    setPesan("");
    setSearchQuery("");
  };

  const renderPlaceholder = () => {
    switch (activeTab) {
      case "alumni":
        return "Cari nama alumni...";
      case "perusahaan":
        return "Cari nama perusahaan...";
      case "admin":
        return "Cari nama admin...";
      default:
        return "Cari nama...";
    }
  };

  return (
    <main className="flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Kirim Pesan
        </h2>

        {/* --- Tab Selector --- */}
        <div className="flex justify-around mb-6 border-b-2 border-gray-200">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center py-3 text-lg font-semibold transition-colors duration-300 ${
              activeTab === "alumni"
                ? "text-purple-600 border-b-4 border-purple-600"
                : "text-gray-500 hover:text-purple-500"
            }`}
            onClick={() => setActiveTab("alumni")}
          >
            <FaUserGraduate className="mr-2" />
            Alumni
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center py-3 text-lg font-semibold transition-colors duration-300 ${
              activeTab === "perusahaan"
                ? "text-purple-600 border-b-4 border-purple-600"
                : "text-gray-500 hover:text-purple-500"
            }`}
            onClick={() => setActiveTab("perusahaan")}
          >
            <FaBuilding className="mr-2" />
            Perusahaan
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center py-3 text-lg font-semibold transition-colors duration-300 ${
              activeTab === "admin"
                ? "text-purple-600 border-b-4 border-purple-600"
                : "text-gray-500 hover:text-purple-500"
            }`}
            onClick={() => setActiveTab("admin")}
          >
            <FaUserShield className="mr-2" />
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* --- Input Pencarian --- */}
          <div className="mb-6">
            <label
              htmlFor="search"
              className="block text-gray-700 font-medium mb-2"
            >
              Penerima Pesan
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={renderPlaceholder()}
              required
            />
          </div>

          {/* --- Area Pesan --- */}
          <div className="mb-6">
            <label
              htmlFor="pesan"
              className="block text-gray-700 font-medium mb-2"
            >
              Isi Pesan
            </label>
            <textarea
              id="pesan"
              name="pesan"
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-40 resize-none"
              placeholder="Tulis pesan Anda di sini..."
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-900 transition-colors duration-300 shadow-md"
          >
            Kirim Pesan
          </button>
        </form>
      </div>
    </main>
  );
}