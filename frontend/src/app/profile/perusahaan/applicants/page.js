"use client";

import { useEffect, useState, useCallback } from "react";

// Helper: get initials from name
function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

// Helper: get token from cookie
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

function getNama(p) {
  return (
    p.nama ||
    (p.alumni && (p.alumni.nama || p.alumni.name)) ||
    "Tanpa Nama"
  );
}
function getEmail(p) {
  return (p.alumni && p.alumni.email) || "-";
}
function getNim(p) {
  return (p.alumni && p.alumni.nim) || "-";
}
function getJurusan(p) {
  return (p.alumni && p.alumni.program_studi) || "-";
}
function getJudulPekerjaan(p) {
  // Tambahkan pengecekan p.pekerjaan sesuai instruksi
  return (
    p.judul_pekerjaan ||
    p.judulPekerjaan ||
    p.pekerjaan ||
    (p.lowongan &&
      (p.lowongan.judul_pekerjaan ||
        p.lowongan.judulPekerjaan ||
        p.lowongan.title)) ||
    "-"
  );
}

export default function ApplicantsPage() {
  const [pelamar, setPelamar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch pelamar, with abort controller to avoid memory leak
  useEffect(() => {
    let ignore = false;
    const fetchPelamar = async () => {
      setLoading(true);
      setError("");
      setPelamar([]);
      const token = getTokenFromCookie();
      if (!token) {
        setError("Anda belum login.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pelamar/diterima-ditolak", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        let data;
        try {
          data = await res.json();
        } catch {
          data = {};
        }
        if (!res.ok) {
          const msg = data.message || data.msg || "Gagal mengambil data pelamar.";
          throw new Error(msg);
        }
        let pelamarArr = [];
        if (Array.isArray(data)) {
          pelamarArr = data;
        } else if (Array.isArray(data.pelamar)) {
          pelamarArr = data.pelamar;
        } else if (data && typeof data === "object" && Array.isArray(data.data)) {
          pelamarArr = data.data;
        }
        if (!ignore) setPelamar(pelamarArr);
      } catch (err) {
        if (!ignore) setError(err.message || "Terjadi kesalahan.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchPelamar();
    return () => {
      ignore = true;
    };
  }, []);

  // Fungsi filter search
  const filterBySearch = useCallback(
    (arr) => {
      if (!search.trim()) return arr;
      const q = search.trim().toLowerCase();
      return arr.filter((p) => {
        const nama =
          p.nama ||
          (p.alumni && (p.alumni.nama || p.alumni.name)) ||
          "";
        const email = (p.alumni && p.alumni.email) || "";
        const nim = (p.alumni && p.alumni.nim) || "";
        const jurusan = (p.alumni && p.alumni.program_studi) || "";
        // Tambahkan p.pekerjaan ke pencarian
        const judulPekerjaan =
          p.judul_pekerjaan ||
          p.judulPekerjaan ||
          p.pekerjaan ||
          (p.lowongan &&
            (p.lowongan.judul_pekerjaan ||
              p.lowongan.judulPekerjaan ||
              p.lowongan.title)) ||
          "";
        const combined = [nama, email, nim, jurusan, judulPekerjaan].join(" ").toLowerCase();
        return combined.includes(q);
      });
    },
    [search]
  );

  // Pisahkan pelamar diterima dan ditolak, lalu filter dengan search
  const pelamarDiterima = filterBySearch(pelamar.filter((p) => p.status === "diterima"));
  const pelamarDitolak = filterBySearch(pelamar.filter((p) => p.status === "ditolak"));

  // Komponen Card Pelamar
  function PelamarCard({ p, status }) {
    const nama = getNama(p);
    const email = getEmail(p);
    const nim = getNim(p);
    const jurusan = getJurusan(p);
    const judulPekerjaan = getJudulPekerjaan(p);

    const isDiterima = status === "diterima";
    return (
      <div
        className={`${
          isDiterima
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        } rounded-lg shadow border flex flex-col md:flex-row items-center md:items-start px-6 py-5 hover:shadow-lg transition`}
        style={{
          borderLeft: `4px solid ${isDiterima ? "#1db954" : "#e60023"}`,
        }}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#e0e0e0] text-2xl font-bold text-[#0a66c2] mr-0 md:mr-6 mb-3 md:mb-0">
          {getInitials(nama)}
        </div>
        {/* Info */}
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold text-[#1d2226]">{nama}</div>
              <div className="text-sm text-gray-600">{email}</div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full ${
                isDiterima
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              } text-xs font-semibold mt-2 md:mt-0`}
            >
              {isDiterima ? (
                <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              {isDiterima ? "Diterima" : "Ditolak"}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
            <div>
              <span className="font-medium text-gray-500">NIM:</span> {nim}
            </div>
            <div>
              <span className="font-medium text-gray-500">Jurusan:</span> {jurusan}
            </div>
            <div>
              <span className="font-medium text-gray-500">Pekerjaan:</span> {judulPekerjaan}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f3f2ef] flex flex-col items-center pt-8 px-2 applicants-content-ml"
    >
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-[#1d2226] text-center">
          Pelamar Diterima & Ditolak
        </h1>
        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Cari pelamar berdasarkan nama, email, NIM, jurusan, atau pekerjaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari pelamar"
          />
        </div>
        {loading && (
          <div className="mb-4 text-blue-600 font-semibold text-center">
            Memuat data pelamar...
          </div>
        )}
        {error && (
          <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>
        )}
        {!loading && pelamar.length === 0 && !error && (
          <div className="mb-4 text-gray-700 text-center">
            Belum ada pelamar yang diterima atau ditolak.
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Kolom Diterima */}
          <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 p-4">
            <h2 className="text-xl font-bold text-green-700 mb-4 text-center flex items-center justify-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Diterima
            </h2>
            {pelamarDiterima.length === 0 ? (
              <div className="text-gray-500 text-center">
                {search.trim()
                  ? "Tidak ada pelamar diterima yang cocok dengan pencarian."
                  : "Belum ada pelamar diterima."}
              </div>
            ) : (
              <div className="space-y-5">
                {pelamarDiterima.map((p, idx) => (
                  <PelamarCard key={p._id || idx} p={p} status="diterima" />
                ))}
              </div>
            )}
          </div>
          {/* Kolom Ditolak */}
          <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 p-4">
            <h2 className="text-xl font-bold text-red-700 mb-4 text-center flex items-center justify-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Ditolak
            </h2>
            {pelamarDitolak.length === 0 ? (
              <div className="text-gray-500 text-center">
                {search.trim()
                  ? "Tidak ada pelamar ditolak yang cocok dengan pencarian."
                  : "Belum ada pelamar ditolak."}
              </div>
            ) : (
              <div className="space-y-5">
                {pelamarDitolak.map((p, idx) => (
                  <PelamarCard key={p._id || idx} p={p} status="ditolak" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Spacer for sidebar on desktop */}
      <style jsx global>{`
        @media (min-width: 768px) {
          .applicants-content-ml {
            margin-left: 288px !important;
          }
        }
      `}</style>
    </div>
  );
}
