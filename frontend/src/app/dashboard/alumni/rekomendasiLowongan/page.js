"use client";
import { useState, useEffect } from "react";
import {
  FaFire,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaRegClock,
  FaBuilding,
} from "react-icons/fa";
import { MdWorkOutline } from "react-icons/md";
import { useRouter } from "next/navigation";
import { getTokenFromSessionStorage } from "@/app/sessiontoken";

// Helper untuk resolve URL logo_perusahaan ke localhost:5000/uploads jika perlu
function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${logo_perusahaan}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo_perusahaan}`;
}

// Komponen Card Lowongan dengan desain yang diperbarui
function LowonganCard({ lowongan }) {
  const router = useRouter();
  const [showAllKualifikasi, setShowAllKualifikasi] = useState(false);

  // Format tanggal batas lamaran
  let batasLamaran = "-";
  if (lowongan.batas_lamaran) {
    const date = new Date(lowongan.batas_lamaran);
    batasLamaran = date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Ambil nama perusahaan yang benar
  let namaPerusahaan = "-";
  if (lowongan.nama_perusahaan) {
    namaPerusahaan = lowongan.nama_perusahaan;
  } else if (lowongan.perusahaan && typeof lowongan.perusahaan === "object" && lowongan.perusahaan.nama_perusahaan) {
    namaPerusahaan = lowongan.perusahaan.nama_perusahaan;
  } else if (lowongan.perusahaan_nama) {
    namaPerusahaan = lowongan.perusahaan_nama;
  } else if (typeof lowongan.perusahaan === "string") {
    namaPerusahaan = lowongan.perusahaan;
  }

  // Ambil logo perusahaan jika ada, lalu resolve dengan getLogoUrl
  let logoPerusahaan = null;
  if (lowongan.logo_perusahaan) {
    logoPerusahaan = getLogoUrl(lowongan.logo_perusahaan);
  } else if (lowongan.perusahaan && typeof lowongan.perusahaan === "object" && lowongan.perusahaan.logo_perusahaan) {
    logoPerusahaan = getLogoUrl(lowongan.perusahaan.logo_perusahaan);
  }

  // Ambil kualifikasi, bisa berupa string atau array
  let kualifikasi = [];
  if (Array.isArray(lowongan.kualifikasi)) {
    kualifikasi = lowongan.kualifikasi;
  } else if (typeof lowongan.kualifikasi === "string") {
    // Pisahkan berdasarkan baris atau koma
    if (lowongan.kualifikasi.includes("\n")) {
      kualifikasi = lowongan.kualifikasi.split("\n").map(s => s.trim()).filter(Boolean);
    } else if (lowongan.kualifikasi.includes(",")) {
      kualifikasi = lowongan.kualifikasi.split(",").map(s => s.trim()).filter(Boolean);
    } else if (lowongan.kualifikasi.trim() !== "") {
      kualifikasi = [lowongan.kualifikasi.trim()];
    }
  }

  // Tampilkan hanya 1 baris kualifikasi, dan tombol untuk lihat semua jika lebih dari 1
  const showKualifikasi = showAllKualifikasi ? kualifikasi : kualifikasi.slice(0, 1);

  return (
    <div
      className="flex flex-col border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={() => router.push(`/cariLowongan/detailLowongan?id=${lowongan._id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-xl truncate mb-1">
            {lowongan.judul_pekerjaan}
          </h3>
          <div className="flex items-center gap-2 min-w-0">
            {logoPerusahaan ? (
              <img
                src={logoPerusahaan}
                alt={namaPerusahaan}
                className="w-10 h-10 object-contain rounded-full border border-gray-200 bg-white"
              />
            ) : (
              <FaBuilding className="text-gray-400 w-10 h-10 p-2 rounded-full bg-gray-100" />
            )}
            <span className="font-semibold text-gray-600 text-sm truncate">
              {namaPerusahaan}
            </span>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-4">
        <span className="font-semibold text-gray-700 block mb-1">Kualifikasi:</span>
        {kualifikasi.length > 0 ? (
          <>
            <ul className="list-disc list-inside space-y-1">
              {showKualifikasi.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            {kualifikasi.length > 1 && !showAllKualifikasi && (
              <button
                className="mt-2 text-blue-600 hover:underline text-xs"
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setShowAllKualifikasi(true);
                }}
              >
                Lihat semua
              </button>
            )}
            {kualifikasi.length > 1 && showAllKualifikasi && (
              <button
                className="mt-2 text-blue-600 hover:underline text-xs"
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setShowAllKualifikasi(false);
                }}
              >
                Sembunyikan
              </button>
            )}
          </>
        ) : (
          <span className="italic text-gray-400">Tidak ada kualifikasi yang ditampilkan.</span>
        )}
      </div>
      <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-blue-500" />
          <span className="truncate">{lowongan.lokasi}</span>
        </span>
        <span className="flex items-center gap-2">
          <MdWorkOutline className="text-purple-500" />
          <span className="truncate">{lowongan.tipe_kerja}</span>
        </span>
        {lowongan.gaji && (
          <span className="flex items-center gap-2">
            <FaMoneyBillWave className="text-green-500" />
            <span className="truncate">{lowongan.gaji}</span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <FaRegClock className="text-red-500" />
          <span className="text-xs font-medium text-gray-500">
            Batas Lamaran: <span className="font-bold text-red-500">{batasLamaran}</span>
          </span>
        </div>
        <div className="text-xs text-gray-400 font-medium">
          Pelamar: <span className="font-bold text-gray-600">{lowongan.jumlah_pelamar ?? 0}</span>/{lowongan.batas_pelamar ?? "-"}
        </div>
      </div>
    </div>
  );
}

export default function RekomendasiLowonganPage() {
  // State untuk rekomendasi lowongan
  const [rekomendasiLowongan, setRekomendasiLowongan] = useState([]);
  const [loadingRekom, setLoadingRekom] = useState(true);
  const [errorRekom, setErrorRekom] = useState(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchRekomendasiLowongan() {
      setLoadingRekom(true);
      setErrorRekom(null);
      try {
        const token = getTokenFromSessionStorage();
        if (!token) {
          setErrorRekom("Token tidak ditemukan.");
          setLoadingRekom(false);
          return;
        }
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pelamar/rekomendasi-lowongan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          throw new Error("Gagal mengambil rekomendasi lowongan");
        }
        const json = await res.json();
        if (json && Array.isArray(json.rekomendasi)) {
          setRekomendasiLowongan(json.rekomendasi);
        } else {
          setErrorRekom("Data rekomendasi tidak ditemukan");
        }
      } catch (err) {
        setErrorRekom("Gagal mengambil rekomendasi lowongan");
      } finally {
        setLoadingRekom(false);
      }
    }
    fetchRekomendasiLowongan();
  }, []);

  // Tampilkan hanya 8 card saja
  const rekomendasiDelapan = rekomendasiLowongan.slice(0, 8);

  return (
    <div className="bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 w-full h-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <FaFire className="text-orange-500 text-2xl mr-3" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Rekomendasi Lowongan untukmu
          </h2>
        </div>
        {loadingRekom ? (
          <div className="text-gray-500 text-center py-10">Memuat rekomendasi lowongan...</div>
        ) : errorRekom ? (
          <div className="text-red-500 text-center py-10">{errorRekom}</div>
        ) : rekomendasiDelapan.length === 0 ? (
          <div className="text-gray-500 text-center py-10">Belum ada rekomendasi lowongan untukmu saat ini.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {rekomendasiDelapan.map((lowongan, idx) => (
                <LowonganCard key={lowongan._id || idx} lowongan={lowongan} />
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold text-sm"
                onClick={() => router.push("/cariLowongan")}
                type="button"
              >
                Lihat Semua
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}