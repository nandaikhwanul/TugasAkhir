"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

// Ambil token dari cookie (client-side)
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split(";").map((c) => c.trim()) : [];
  for (const c of cookies) {
    if (c.startsWith("token=")) {
      return decodeURIComponent(c.substring("token=".length));
    }
  }
  return null;
}

// Helper untuk memastikan nama perusahaan berupa string
function getNamaPerusahaan(l) {
  if (!l) return "-";
  if (typeof l.nama_perusahaan === "string") return l.nama_perusahaan;
  if (l.nama_perusahaan && typeof l.nama_perusahaan === "object") {
    if (typeof l.nama_perusahaan.nama === "string") return l.nama_perusahaan.nama;
    if (typeof l.nama_perusahaan.nama_perusahaan === "string") return l.nama_perusahaan.nama_perusahaan;
    return "[Objek Perusahaan]";
  }
  if (typeof l.perusahaan === "string") return l.perusahaan;
  if (l.perusahaan && typeof l.perusahaan === "object") {
    if (typeof l.perusahaan.nama === "string") return l.perusahaan.nama;
    if (typeof l.perusahaan.nama_perusahaan === "string") return l.perusahaan.nama_perusahaan;
    return "[Objek Perusahaan]";
  }
  return "-";
}

// Helper untuk kategori (dummy, bisa diubah sesuai data asli)
function getKategori(l) {
  if (!l) return "Lainnya";
  return (
    l.kategori ||
    l.bidang ||
    l.industri ||
    l.sektor ||
    "Lainnya"
  );
}

// Helper: resolve logo url
function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan || typeof logo_perusahaan !== "string") return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `ttps://tugasakhir-production-6c6c.up.railway.app${logo_perusahaan}`;
  }
  return `ttps://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo_perusahaan}`;
}

// Helper untuk format gaji
function formatGaji(gaji) {
  if (!gaji) return "-";
  if (typeof gaji === "number") {
    return "Rp" + gaji.toLocaleString("id-ID");
  }
  if (typeof gaji === "string") {
    // Coba parse range, misal "3000000-5000000"
    if (/^\d+\s*-\s*\d+$/.test(gaji)) {
      const [min, max] = gaji.split("-").map((x) => parseInt(x.trim(), 10));
      if (!isNaN(min) && !isNaN(max)) {
        return `Rp${min.toLocaleString("id-ID")} - Rp${max.toLocaleString("id-ID")}`;
      }
    }
    // Coba parse satu angka
    const num = parseInt(gaji.replace(/[^\d]/g, ""), 10);
    if (!isNaN(num)) {
      return "Rp" + num.toLocaleString("id-ID");
    }
    return gaji;
  }
  return "-";
}

export default function LowonganList() {
  const [lowongan, setLowongan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchLowongan = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getTokenFromCookie();
        const res = await axios.get("ttps://tugasakhir-production-6c6c.up.railway.app/lowongan", {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });
        if (isMounted) {
          setLowongan(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Gagal mengambil data lowongan"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLowongan();
    return () => { isMounted = false; };
  }, []);

  // Filter hanya yang statusnya "open"
  const lowonganOpen = Array.isArray(lowongan)
    ? lowongan.filter(
        (l) =>
          l &&
          typeof l.status === "string" &&
          l.status.toLowerCase() === "open"
      )
    : [];

  // Helper to get logo_perusahaan from perusahaan field
  function extractLogoPerusahaan(l) {
    if (!l) return "";
    if (l.perusahaan && typeof l.perusahaan === "object" && l.perusahaan.logo_perusahaan) {
      return l.perusahaan.logo_perusahaan;
    }
    if (l.logo_perusahaan) return l.logo_perusahaan;
    if (l.logo) return l.logo;
    if (l.foto_perusahaan) return l.foto_perusahaan;
    return "";
  }

  return (
    <div className="flex items-center justify-center min-h-screen border-2 border-black">
      <div className="max-w-[800px] mx-auto w-full px-2">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Daftar Lowongan Pekerjaan</h1>
        </div>

        <div className="max-w-[600px] w-full mx-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Memuat lowongan...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : lowonganOpen.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Belum ada lowongan yang tersedia.</div>
          ) : (
            <div className="space-y-6">
              {lowonganOpen.map((l) => (
                <div
                  key={l._id || l.id}
                  className="bg-white border rounded-lg shadow p-5 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-4 mb-2">
                    {/* Logo perusahaan */}
                    <img
                      src={
                        (() => {
                          // Gunakan helper dari context jika perlu
                          const logo = extractLogoPerusahaan(l);
                          if (!logo) return "/no-company-logo.png";
                          if (/^https?:\/\//.test(logo)) return logo;
                          if (logo.startsWith("/uploads/")) return `ttps://tugasakhir-production-6c6c.up.railway.app${logo}`;
                          return `ttps://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo}`;
                        })()
                      }
                      alt="Logo Perusahaan"
                      className="w-14 h-14 rounded bg-gray-100 object-cover"
                    />
                    <div>
                      <div className="text-lg font-semibold text-gray-800">{l.judul_pekerjaan}</div>
                      <div className="text-gray-500 text-sm">{l.perusahaan?.nama_perusahaan || l.nama_perusahaan || "-"}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Lokasi: </span>
                      <span className="text-gray-800">{l.lokasi || "-"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tipe Kerja: </span>
                      <span className="text-gray-800">{l.tipe_kerja || "-"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Gaji: </span>
                      <span className="text-gray-800">{l.gaji || "-"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Batas Lamaran: </span>
                      <span className="text-gray-800">{l.batas_lamaran ? new Date(l.batas_lamaran).toLocaleDateString() : "-"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Batas Pelamar: </span>
                      <span className="text-gray-800">{l.batas_pelamar || "-"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Jumlah Pelamar: </span>
                      <span className="text-gray-800">{l.jumlah_pelamar ?? "-"}</span>
                    </div>
                  </div>
                  {/* Tombol detail/lamar bisa ditambahkan di sini */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}