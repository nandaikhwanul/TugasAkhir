"use client";
import { useState } from "react";
import axios from "axios";

export default function SearchAlumniPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ambil token dari cookie (client-side)
  function getTokenFromCookie() {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("token=")) {
        return decodeURIComponent(c.substring("token=".length));
      }
    }
    return null;
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    const token = getTokenFromCookie();
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }
    try {
      // Gunakan endpoint yang diberikan dan token dari cookie
      const res = await axios.get(
        `https://tugasakhir-production-6c6c.up.railway.app/perusahaan/alumni?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResults(res.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Terjadi kesalahan saat mencari alumni."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Cari Alumni</h1>
      <form onSubmit={handleSearch} className="flex mb-6">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none"
          placeholder="Masukkan nama alumni..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-r hover:bg-blue-700 transition"
          disabled={loading || !query.trim()}
        >
          {loading ? "Mencari..." : "Cari"}
        </button>
      </form>
      {error && (
        <div className="mb-4 text-red-600 font-medium">{error}</div>
      )}
      <div>
        {results.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {results.map((alumni) => (
              <li key={alumni._id} className="py-4 flex items-center">
                <img
                  src={
                    alumni.foto_profil
                      ? alumni.foto_profil.startsWith("http")
                        ? alumni.foto_profil
                        : `https://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/${alumni.foto_profil}`
                      : "/default-profile.png"
                  }
                  alt={alumni.nama_lengkap}
                  className="h-12 w-12 rounded-full object-cover mr-4 border"
                />
                <div>
                  <div className="font-semibold text-lg text-gray-800">
                    {alumni.nama_lengkap}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {alumni.email}
                  </div>
                  {alumni.tahun_lulus && (
                    <div className="text-gray-400 text-xs">
                      Lulus: {alumni.tahun_lulus}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          !loading &&
          query.trim() !== "" && (
            <div className="text-gray-500">Tidak ada alumni ditemukan.</div>
          )
        )}
      </div>
    </div>
  );
}
