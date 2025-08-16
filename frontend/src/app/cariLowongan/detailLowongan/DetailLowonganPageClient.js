"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../navbar/page";
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Import ikon dari React Icons
import { FaBriefcase, FaDollarSign, FaCalendarAlt, FaUsers } from "react-icons/fa";

// Helper: format tanggal ke "Apr 14, 2024" (en-US)
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper: format gaji
function formatGaji(gaji) {
  if (!gaji) return "-";
  if (typeof gaji === "string") return gaji;
  if (typeof gaji === "number") return "Rp" + gaji.toLocaleString("id-ID");
  if (typeof gaji === "object" && gaji.min && gaji.max) {
    return `Rp${gaji.min.toLocaleString("id-ID")} - Rp${gaji.max.toLocaleString("id-ID")}`;
  }
  return "-";
}

// Helper: render fallback logo
const FallbackLogo = () => (
  <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gray-200">
    <FaBriefcase className="w-8 h-8 text-gray-500" />
  </div>
);

export default function DetailLowonganPageClient() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState("");
  const [applyError, setApplyError] = useState("");
  const searchParams = useSearchParams();

  const [batasPelamar, setBatasPelamar] = useState(null);
  const [jumlahPelamar, setJumlahPelamar] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      setErr("");
      try {
        const id = searchParams.get("id");
        if (!id) throw new Error("ID lowongan tidak ditemukan di URL");
        const token = getTokenFromSessionStorage();
        if (!token) throw new Error("Token tidak ditemukan");
        const res = await fetch(
          `https://tugasakhir-production-6c6c.up.railway.app/lowongan/preview/alumni/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil detail lowongan");
        const data = await res.json();
        if (!data.preview) throw new Error("Data preview tidak ditemukan");
        setJob(data.preview);

        setBatasPelamar(data.preview.batas_pelamar ?? null);
        setJumlahPelamar(data.preview.jumlah_pelamar ?? null);
        setCreatedAt(data.preview.createdAt ?? null);
      } catch (e) {
        setErr(e.message || "Gagal mengambil data");
        setJob(null);
        setBatasPelamar(null);
        setJumlahPelamar(null);
        setCreatedAt(null);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function parseKualifikasi(kualifikasi) {
    if (!kualifikasi) return [];
    if (Array.isArray(kualifikasi)) return kualifikasi;
    if (typeof kualifikasi === "string") {
      return kualifikasi
        .split(/\n|•/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return [];
  }

  async function handleApply() {
    setApplyLoading(true);
    setApplySuccess("");
    setApplyError("");
    try {
      const token = getTokenFromSessionStorage();
      if (!token) throw new Error("Token tidak ditemukan");
      if (!job || !job._id) throw new Error("ID lowongan tidak ditemukan");
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pelamar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lowongan: job._id }),
      });
      if (!res.ok) {
        let msg = "Gagal melamar lowongan";
        try {
          const data = await res.json();
          if (data && data.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }
      setApplySuccess("Berhasil melamar lowongan!");
    } catch (e) {
      setApplyError(e.message || "Gagal melamar lowongan");
    } finally {
      setApplyLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-full mx-auto py-16 px-6 text-center text-gray-700 font-semibold bg-gray-50">
          Memuat detail lowongan...
        </div>
      </>
    );
  }

  if (err) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto py-16 px-6 text-center text-red-600 font-semibold">
          {err}
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto py-16 px-6 text-center text-gray-600">
          Lowongan tidak ditemukan.
        </div>
      </>
    );
  }

  // Data untuk tampilan
  const judul = job.judul_pekerjaan || "-";
  const tipeKerja = job.tipe_kerja || "-";
  const deskripsi = job.deskripsi || "-";
  const kualifikasiList = parseKualifikasi(job.kualifikasi);
  const lokasi = job.lokasi || "-";
  const gaji = job.gaji ? formatGaji(job.gaji) : "-";
  const batasLamaran = job.batas_lamaran ? formatDate(job.batas_lamaran) : "-";

  // Perusahaan
  const perusahaan = job.perusahaan || {};
  const namaPerusahaan = perusahaan.nama_perusahaan || "-";
  const bidangPerusahaan = perusahaan.bidang_perusahaan || "-";
  const logoPerusahaan = perusahaan.logo_perusahaan || "";

  const isOpen = job.status === "open";

  const renderLogo = () => {
    if (logoPerusahaan) {
      const src = logoPerusahaan.startsWith("http")
        ? logoPerusahaan
        : `https://tugasakhir-production-6c6c.up.railway.app${logoPerusahaan}`;
      return (
        <img
          src={src}
          alt={namaPerusahaan}
          className="w-20 h-20 object-contain rounded-2xl bg-white border border-gray-200 p-2 shadow-sm"
        />
      );
    }
    return <FallbackLogo />;
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          {/* Header Lowongan */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
            {renderLogo()}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {judul}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <p className="font-medium">{namaPerusahaan}</p>
                <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                <p>{bidangPerusahaan}</p>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Posted: {formatDate(createdAt)}
              </div>
            </div>
            <div className="flex-shrink-0 mt-4 md:mt-0">
              <button
                onClick={isOpen ? handleApply : undefined}
                disabled={!isOpen || applyLoading}
                className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                  isOpen
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                {applyLoading ? "Melamar..." : isOpen ? "Lamar Sekarang" : "Tutup"}
              </button>
              {applySuccess && (
                <p className="mt-2 text-green-600 text-sm text-right">{applySuccess}</p>
              )}
              {applyError && (
                <p className="mt-2 text-red-600 text-sm text-right">{applyError}</p>
              )}
            </div>
          </div>

          {/* Konten & Sidebar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                  Deskripsi Pekerjaan
                </h2>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  <p>{deskripsi}</p>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                  Kualifikasi
                </h2>
                {kualifikasiList.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {kualifikasiList.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">- Tidak ada kualifikasi yang dicantumkan -</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-28 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <FaBriefcase className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipe Kerja</p>
                    <p className="font-semibold text-gray-800">{tipeKerja}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <FaDollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gaji</p>
                    <p className="font-semibold text-gray-800">{gaji}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <FaCalendarAlt className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Batas Lamaran</p>
                    <p className="font-semibold text-gray-800">{batasLamaran}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-50 p-3 rounded-xl">
                    <FaUsers className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pelamar</p>
                    <p className="font-semibold text-gray-800">
                      {jumlahPelamar !== null ? jumlahPelamar : "-"}
                      {batasPelamar !== null && <span> / {batasPelamar}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}