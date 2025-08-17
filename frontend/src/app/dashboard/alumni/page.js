"use client";
import { useState, useEffect } from "react";
import {
  FaSuitcase,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import Image from "next/image";
import { getTokenFromSessionStorage } from "@/app/sessiontoken";
import RekomendasiLowongan from "./rekomendasiLowongan/page";
import PelatihanDanPodcast from "./pelatihanDanPodcast/page";

// Helper untuk resolve URL logo_perusahaan ke localhost:5000/uploads jika perlu
function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${logo_perusahaan}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo_perusahaan}`;
}

export default function AlumniDashboardPage() {
  // State untuk statistik lamaran alumni
  const [statistik, setStatistik] = useState({
    diterima: 0,
    ditolak: 0,
    pending: 0,
    dilamar: 0,
  });
  const [loadingStat, setLoadingStat] = useState(true);
  const [errorStat, setErrorStat] = useState(null);

  // State untuk data user (bukan hanya nama)
  // Inisialisasi dengan null untuk menandakan data belum dimuat
  const [userData, setUserData] = useState(null);
  const [loadingNama, setLoadingNama] = useState(true);

  // Fetch statistik
  useEffect(() => {
    async function fetchStatistik() {
      setLoadingStat(true);
      setErrorStat(null);
      try {
        const token = getTokenFromSessionStorage();
        if (!token) {
          setErrorStat("Token tidak ditemukan.");
          setLoadingStat(false);
          return;
        }
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pelamar/statistik/alumni", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Gagal mengambil statistik");
        }
        const json = await res.json();
        if (json && json.data) {
          setStatistik({
            diterima: json.data.diterima ?? 0,
            ditolak: json.data.ditolak ?? 0,
            pending: json.data.pending ?? 0,
            dilamar: json.data.dilamar ?? 0,
          });
        } else {
          setErrorStat("Data tidak ditemukan");
        }
      } catch (err) {
        setErrorStat("Gagal mengambil statistik");
      } finally {
        setLoadingStat(false);
      }
    }
    fetchStatistik();
  }, []);

  // Fetch data user (nama)
  useEffect(() => {
    async function fetchNamaUser() {
      setLoadingNama(true);
      try {
        const token = getTokenFromSessionStorage();
        if (!token) {
          setUserData(null);
          setLoadingNama(false);
          return;
        }
        // Ambil data user dari endpoint alumni/me
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setUserData(null);
          setLoadingNama(false);
          return;
        }
        const json = await res.json();
        // Log untuk debug
        console.log("DEBUG alumni/me json:", json);

        // Perbaikan di sini: Ambil data langsung dari respons JSON, bukan dari json.data
        if (json) {
          setUserData(json); // <-- Perubahan di sini
        } else {
          setUserData(null);
        }
      } catch (err) {
        setUserData(null);
        console.error("DEBUG alumni/me error:", err);
      } finally {
        setLoadingNama(false);
      }
    }
    fetchNamaUser();
  }, []);

  // Ambil nama user dari userData
  const namaUser = userData?.name || "";

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-0 w-full min-w-0">
      <div className="w-full min-w-0 mx-0 space-y-8 px-0">
        {/* Header */}
        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 px-2 sm:px-4 md:px-8 w-full min-w-0 relative">
          {/* Bagian kiri: Hi, nama user ... */}
          <div className="flex-1 flex flex-col min-w-0 mt-4 md:mt-0">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
              Hi,{" "}
              {loadingNama ? (
                <span className="text-gray-400">...</span>
              ) : namaUser ? (
                <span>{namaUser.split(" ")[0]}</span>
              ) : (
                <span className="text-gray-400">User</span>
              )}{" "}
              <span className="text-xl xs:text-2xl">👋</span>
            </h1>
            <p className="text-gray-500 mt-1 text-base sm:text-lg">
              Selamat datang kembali! Semangat mencari peluang baru 🚀
            </p>
            <p className="mt-1 text-sm sm:text-base">
              Gabung bersama generasi pencari kerja masa kini! <b>Upload CV-mu sekarang</b> dan tingkatkan peluangmu. Biar perusahaan yang menemukan kamu!
            </p>
          </div>
          {/* Bagian tengah: Vector Image */}
          <div className="flex justify-center md:justify-center w-full md:w-auto">
            <div className="w-[120px] sm:w-[180px] md:w-[200px] lg:w-[320px] xl:w-[400px] drop-shadow-2xl mx-auto md:mx-0">
              <Image
                src="/vector-dashboard.png"
                alt="Dashboard Vector"
                width={200}
                height={400}
                style={{ objectFit: "contain", width: "100%", height: "auto", opacity: "50%" }}
                priority
              />
            </div>
          </div>
          {/* Statistik */}
          <div className="flex flex-row flex-wrap md:flex-nowrap items-center bg-white rounded-lg shadow px-3 xs:px-4 sm:px-6 py-3 gap-3 xs:gap-4 sm:gap-6 w-full md:w-auto md:static md:absolute md:top-5 md:right-0 z-10 min-w-0 mt-4 md:mt-0">
            {loadingStat ? (
              <div className="text-gray-400 text-sm">Memuat statistik...</div>
            ) : errorStat ? (
              <div className="text-red-500 text-sm">{errorStat}</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <FaSuitcase className="text-gray-400" />
                  <span className="text-gray-700 font-semibold">Lamaran</span>
                  <span className="ml-1 text-blue-600 font-bold">{statistik.dilamar}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  <span className="text-gray-700 font-semibold">Diterima</span>
                  <span className="ml-1 text-green-600 font-bold">{statistik.diterima}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaTimesCircle className="text-red-400" />
                  <span className="text-gray-700 font-semibold">Ditolak</span>
                  <span className="ml-1 text-red-500 font-bold">{statistik.ditolak}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaHourglassHalf className="text-yellow-400" />
                  <span className="text-gray-700 font-semibold">Pending</span>
                  <span className="ml-1 text-yellow-500 font-bold">{statistik.pending}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rekomendasi Lowongan */}
        <div className="w-full min-w-0 mb-2">
          <RekomendasiLowongan />
        </div>

        {/* Pelatihan dan Podcast */}
        <div className="w-full min-w-0">
          <PelatihanDanPodcast />
        </div>
      </div>
      <style jsx global>{`
        @media (min-width: 768px) {
          .font-poppins > div {
            max-width: 100vw !important;
            width: 100vw !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
        /* Custom scrollbar for horizontal scroll */
        .flex::-webkit-scrollbar,
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .flex::-webkit-scrollbar-thumb,
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        /* Hide scrollbar only for video horizontal scroll */
        .hide-scrollbar {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          height: 0 !important;
        }
      `}</style>
    </div>
  );
}