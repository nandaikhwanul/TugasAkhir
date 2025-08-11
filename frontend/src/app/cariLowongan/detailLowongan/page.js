"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../navbar/page";

// Helper: ambil token dari cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

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

export default function DetailLowonganPage() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState("");
  const [applyError, setApplyError] = useState("");
  const searchParams = useSearchParams();

  // State untuk batas_pelamar, jumlah_pelamar, createdAt
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
        const token = getTokenFromCookie();
        if (!token) throw new Error("Token tidak ditemukan");
        const res = await fetch(
          `http://localhost:5000/lowongan/preview/alumni/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil detail lowongan");
        const data = await res.json();
        if (!data.preview) throw new Error("Data preview tidak ditemukan");
        setJob(data.preview);

        // Ambil batas_pelamar, jumlah_pelamar, createdAt jika ada
        setBatasPelamar(
          typeof data.preview.batas_pelamar !== "undefined"
            ? data.preview.batas_pelamar
            : null
        );
        setJumlahPelamar(
          typeof data.preview.jumlah_pelamar !== "undefined"
            ? data.preview.jumlah_pelamar
            : null
        );
        setCreatedAt(
          typeof data.preview.createdAt !== "undefined"
            ? data.preview.createdAt
            : null
        );
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

  // Helper: parsing kualifikasi ke array
  function parseKualifikasi(kualifikasi) {
    if (!kualifikasi) return [];
    if (Array.isArray(kualifikasi)) return kualifikasi;
    if (typeof kualifikasi === "string") {
      // Pisahkan berdasarkan baris atau bullet
      return kualifikasi
        .split(/\n|•/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return [];
  }

  // Handler untuk tombol lamar
  async function handleApply() {
    setApplyLoading(true);
    setApplySuccess("");
    setApplyError("");
    try {
      const token = getTokenFromCookie();
      if (!token) throw new Error("Token tidak ditemukan");
      if (!job || !job._id) throw new Error("ID lowongan tidak ditemukan");
      const res = await fetch("http://localhost:5000/pelamar", {
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
        <div className="max-w-full mx-auto py-16 px-6 text-center text-black font-semibold bg-gray-100 ">
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

  // Tombol apply: disabled jika status !== "open"
  const isOpen = job.status === "open";

  // Logo Perusahaan: fallback jika tidak ada logo
  function renderLogo() {
    if (logoPerusahaan) {
      const src = logoPerusahaan.startsWith("http")
        ? logoPerusahaan
        : `http://localhost:5000${logoPerusahaan}`;
      return (
        <img
          src={src}
          alt={namaPerusahaan}
          className="w-16 h-16 object-cover rounded-xl bg-[#eaf7e6] border border-[#e5e7eb]"
        />
      );
    }
    // fallback SVG
    return (
      <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-[#eaf7e6] border border-[#e5e7eb]">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#eaf7e6" />
          <g>
            <path d="M16 10c-2.5 0-4.5 2-4.5 4.5S13.5 19 16 19s4.5-2 4.5-4.5S18.5 10 16 10zm0 7c-1.38 0-2.5-1.12-2.5-2.5S14.62 12 16 12s2.5 1.12 2.5 2.5S17.38 17 16 17z" fill="#6fcf97"/>
            <circle cx="16" cy="16" r="15" stroke="#6fcf97" strokeWidth="2"/>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-100 min-h-screen">
        {/* Perusahaan Info */}
        <div className="max-w-4xl mx-auto flex flex-row items-center gap-5 mt-16 mb-6 px-6 relative g-gray-100">
          <div>{renderLogo()}</div>
          <div>
            <div className="text-[18px] font-bold text-[#222] mb-1">{namaPerusahaan}</div>
            <div className="text-[14px] text-[#6c757d] font-medium">{bidangPerusahaan}</div>
            {/* Tanggal dibuat */}
            {createdAt && (
              <div className="text-[12px] text-[#888] font-normal mt-1">
                Posted: {formatDate(createdAt)}
              </div>
            )}
          </div>
        </div>
        <div className="w-full h-auto mx-auto flex flex-row gap-0 max-w-4xl bg-gray-100 p-10 rounded-xl">
          {/* Sidebar kiri */}
          <div className="w-[240px] min-w-[200px] max-w-[260px] bg-white border border-[#e5e7eb] rounded-lg px-6 py-7 mr-8 shadow-none" style={{height: "fit-content"}}>
            <div className="mb-6">
              <div className="text-[12px] text-[#888] font-semibold mb-1" style={{letterSpacing: "0.01em"}}>Location</div>
              <div className="text-[14px] text-[#222] font-normal">{lokasi}</div>
            </div>
            <div className="mb-6">
              <div className="text-[12px] text-[#888] font-semibold mb-1" style={{letterSpacing: "0.01em"}}>Salary Range</div>
              <div className="text-[14px] text-[#222] font-normal">{gaji}</div>
            </div>
            <div className="mb-6">
              <div className="text-[12px] text-[#888] font-semibold mb-1" style={{letterSpacing: "0.01em"}}>Application Deadline</div>
              <div className="text-[14px] text-[#222] font-normal">{batasLamaran}</div>
            </div>
            <div className="mb-6">
              <div className="text-[12px] text-[#888] font-semibold mb-1" style={{letterSpacing: "0.01em"}}>Applicants</div>
              <div className="text-[14px] text-[#222] font-normal">
                {jumlahPelamar !== null ? jumlahPelamar : "-"}
                {batasPelamar !== null && (
                  <span>
                    {" "}
                    / {batasPelamar}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Konten utama */}
          <div className="flex-1 bg-white border border-[#e5e7eb] rounded-lg shadow-none px-10 py-10 relative">
            {/* Judul */}
            <h1 className="text-[20px] font-bold text-[#222] mb-1" style={{lineHeight: "1.2"}}>{judul}</h1>
            {/* Full-Time */}
            <div className="text-[13px] text-[#888] font-normal mb-5" style={{marginTop: "-2px"}}>{tipeKerja}</div>
            {/* Requirements */}
            <div className="mb-6">
              <div className="font-bold text-[15px] text-[#222] mb-1">Requirements</div>
              <ul className="list-disc pl-5 text-[15px] text-[#222] leading-[1.6]">
                {kualifikasiList.length > 0 ? (
                  kualifikasiList.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            {/* Description */}
            <div className="mb-6">
              <div className="font-bold text-[15px] text-[#222] mb-1">Description</div>
              <div className="text-[15px] text-[#222] leading-[1.6]">
                {deskripsi}
              </div>
            </div>
            {/* Tombol apply */}
            <div className="flex flex-col items-end mt-10">
              {applySuccess && (
                <div className="mb-2 text-green-600 text-sm font-semibold">{applySuccess}</div>
              )}
              {applyError && (
                <div className="mb-2 text-red-600 text-sm font-semibold">{applyError}</div>
              )}
              <button
                className="bg-[#181f2b] hover:bg-[#232b3a] text-white text-[13px] font-semibold rounded-[6px] px-6 py-2 min-w-[140px] transition-all duration-150 shadow-none"
                style={{boxShadow: "none"}}
                disabled={!isOpen || applyLoading}
                onClick={isOpen ? handleApply : undefined}
              >
                {applyLoading
                  ? "Melamar..."
                  : isOpen
                  ? "Apply Now"
                  : "Closed"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
