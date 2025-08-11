"use client";
import React, { useEffect, useState } from "react";
import CardRekomendasi from "./cardRekomendasi/page";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

// Komponen animasi fade-in
function FadeIn({ children, duration = 900, delay = 0, className = "" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);
  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity ${duration}ms cubic-bezier(0.4,0,0.2,1), transform ${duration}ms cubic-bezier(0.4,0,0.2,1)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// Helper untuk ambil token dari cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Komponen Dashboard Perusahaan
export default function PerusahaanDashboardPage() {
  // State untuk jumlah pelamar (dinamis)
  const [jumlahPelamar, setJumlahPelamar] = useState({
    jumlah: null,
    pertumbuhan: null,
    loading: true,
    error: null,
  });

  // State untuk traffic lowongan (dinamis)
  const [trafficLowongan, setTrafficLowongan] = useState({
    total_kemarin: null,
    total_sebelumnya: null,
    pertambahan: null,
    persentase: null,
    loading: true,
    error: null,
  });

  // State untuk jumlah lowongan aktif (dinamis)
  const [lowonganAktif, setLowonganAktif] = useState({
    jumlah: null,
    sejakMingguLalu: null,
    loading: true,
    error: null,
  });

  // State untuk jumlah lowongan pending (dinamis)
  const [lowonganPending, setLowonganPending] = useState({
    jumlah: null,
    change: null,
    loading: true,
    error: null,
  });

  // State untuk kartu statistik lain (hanya untuk lowongan pending sekarang)
  const [otherStats, setOtherStats] = useState([
    {
      label: "Lowongan Belum Diverifikasi",
      value: "...",
      change: "...",
      changeLabel: "Sejak minggu lalu",
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#f3f6fd" />
          <path d="M12 7v5l3 3" stroke="#00c897" strokeWidth="2" fill="none" />
        </svg>
      ),
      color: "text-[#00c897]",
      bg: "bg-white",
      changeColor: "text-green-500",
      isTrafficYesterday: false,
    },
  ]);

  // State untuk data rasio pelamar diterima/ditolak (dinamis)
  const [applicantRatio, setApplicantRatio] = useState({
    diterima: null,
    ditolak: null,
    loading: true,
    error: null,
  });

  // State untuk grafik pelamar per bulan per tahun
  const [grafikPelamar, setGrafikPelamar] = useState({
    data: [],
    loading: true,
    error: null,
  });
  const [tahunList, setTahunList] = useState([]);
  const [tahunDipilih, setTahunDipilih] = useState(null);

  // Fetch jumlah pelamar
  useEffect(() => {
    let ignore = false;
    async function fetchJumlahPelamar() {
      setJumlahPelamar((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const token = getTokenFromCookie();
        if (!token) throw new Error("Token tidak ditemukan");
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/lowongan/pelamar/count", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil data jumlah pelamar");
        const data = await res.json();
        if (!ignore) {
          setJumlahPelamar({
            jumlah: data.jumlah_pelamar,
            pertumbuhan: data.pertumbuhan,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!ignore) {
          setJumlahPelamar({
            jumlah: null,
            pertumbuhan: null,
            loading: false,
            error: err.message || "Terjadi kesalahan",
          });
        }
      }
    }
    fetchJumlahPelamar();
    return () => { ignore = true; };
  }, []);

  // Fetch traffic lowongan
  useEffect(() => {
    let ignore = false;
    async function fetchTrafficLowongan() {
      setTrafficLowongan((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const token = getTokenFromCookie();
        if (!token) throw new Error("Token tidak ditemukan");
        // Ganti ID lowongan sesuai kebutuhan, di sini hardcode sesuai instruksi
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/lowongan/6887ae184587ec05bb5fac4a/traffic", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil data traffic lowongan");
        const data = await res.json();
        if (!ignore) {
          setTrafficLowongan({
            total_kemarin: data.total_traffic_kemarin,
            total_sebelumnya: data.total_traffic_sebelumnya,
            pertambahan: data.pertambahan_traffic_kemarin,
            persentase: data.persentase_pertambahan_kemarin,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!ignore) {
          setTrafficLowongan({
            total_kemarin: null,
            total_sebelumnya: null,
            pertambahan: null,
            persentase: null,
            loading: false,
            error: err.message || "Terjadi kesalahan",
          });
        }
      }
    }
    fetchTrafficLowongan();
    return () => { ignore = true; };
  }, []);

  // Fetch jumlah lowongan aktif milik perusahaan
  useEffect(() => {
    let ignore = false;
    async function fetchLowonganAktif() {
      setLowonganAktif((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const token = getTokenFromCookie();
        if (!token) throw new Error("Token tidak ditemukan");
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/lowongan/me/count/active", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil data jumlah lowongan aktif");
        const data = await res.json();
        if (!ignore) {
          setLowonganAktif({
            jumlah: data.jumlah_lowongan_aktif,
            sejakMingguLalu: data.jumlah_lowongan_aktif_sejak_minggu_lalu,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!ignore) {
          setLowonganAktif({
            jumlah: null,
            sejakMingguLalu: null,
            loading: false,
            error: err.message || "Terjadi kesalahan",
          });
        }
      }
    }
    fetchLowonganAktif();
    return () => { ignore = true; };
  }, []);

  // Fetch jumlah lowongan pending milik perusahaan
  useEffect(() => {
    let ignore = false;
    async function fetchLowonganPending() {
      setLowonganPending((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const token = getTokenFromCookie();
        if (!token) throw new Error("Token tidak ditemukan");
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/lowongan/me/count/pending", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil data lowongan pending");
        const data = await res.json();
        if (!ignore) {
          setLowonganPending({
            jumlah: data.jumlah_pending,
            change: data.perubahan_sejak_minggu_lalu, // jika ada, jika tidak bisa null
            loading: false,
            error: null,
          });
          setOtherStats([
            {
              label: "Lowongan Belum Diverifikasi",
              value: (data.jumlah_pending ?? "-").toLocaleString("id-ID"),
              change:
                typeof data.perubahan_sejak_minggu_lalu === "number"
                  ? (data.perubahan_sejak_minggu_lalu > 0
                      ? `+${data.perubahan_sejak_minggu_lalu}`
                      : data.perubahan_sejak_minggu_lalu)
                  : "-",
              changeLabel: "Sejak minggu lalu",
              icon: (
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#f3f6fd" />
                  <path d="M12 7v5l3 3" stroke="#00c897" strokeWidth="2" fill="none" />
                </svg>
              ),
              color: "text-[#00c897]",
              bg: "bg-white",
              changeColor:
                typeof data.perubahan_sejak_minggu_lalu === "number"
                  ? data.perubahan_sejak_minggu_lalu > 0
                    ? "text-green-500"
                    : data.perubahan_sejak_minggu_lalu < 0
                    ? "text-red-500"
                    : "text-gray-400"
                  : "text-gray-400",
              isTrafficYesterday: false,
            },
          ]);
        }
      } catch (err) {
        if (!ignore) {
          setLowonganPending({
            jumlah: null,
            change: null,
            loading: false,
            error: err.message || "Terjadi kesalahan",
          });
          setOtherStats([
            {
              label: "Lowongan Belum Diverifikasi",
              value: "-",
              change: "-",
              changeLabel: "Sejak minggu lalu",
              icon: (
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#f3f6fd" />
                  <path d="M12 7v5l3 3" stroke="#00c897" strokeWidth="2" fill="none" />
                </svg>
              ),
              color: "text-[#00c897]",
              bg: "bg-white",
              changeColor: "text-gray-400",
              isTrafficYesterday: false,
            },
          ]);
        }
      }
    }
    fetchLowonganPending();
    return () => { ignore = true; };
  }, []);

  // Fetch rasio pelamar diterima/ditolak (untuk diagram donat)
  useEffect(() => {
    let ignore = false;
    async function fetchApplicantRatio() {
      setApplicantRatio((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const token = getTokenFromCookie();
        if (!token) throw new Error("Token tidak ditemukan");
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/pelamar/count/diterima-ditolak", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil data rasio pelamar diterima/ditolak");
        const data = await res.json();
        if (!ignore) {
          setApplicantRatio({
            diterima: typeof data.jumlah_pelamar_diterima === "number" ? data.jumlah_pelamar_diterima : 0,
            ditolak: typeof data.jumlah_pelamar_ditolak === "number" ? data.jumlah_pelamar_ditolak : 0,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!ignore) {
          setApplicantRatio({
            diterima: null,
            ditolak: null,
            loading: false,
            error: err.message || "Terjadi kesalahan",
          });
        }
      }
    }
    fetchApplicantRatio();
    return () => { ignore = true; };
  }, []);

  // Fetch grafik pelamar per bulan per tahun
  useEffect(() => {
    let ignore = false;
    async function fetchGrafikPelamar() {
      setGrafikPelamar({ data: [], loading: true, error: null });
      try {
        const token = getTokenFromCookie();
        if (!token) throw new Error("Token tidak ditemukan");
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/pelamar/grafik/per-bulan-tahun", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil data grafik pelamar per bulan per tahun");
        const result = await res.json();
        if (!ignore) {
          // Ambil semua tahun unik dari data
          const tahunSet = new Set((result.data || []).map((d) => d.tahun));
          const tahunArr = Array.from(tahunSet).sort((a, b) => b - a); // descending
          setTahunList(tahunArr);
          // Default tahun: terbaru
          setTahunDipilih((prev) => prev ?? tahunArr[0]);
          setGrafikPelamar({
            data: result.data || [],
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!ignore) {
          setGrafikPelamar({
            data: [],
            loading: false,
            error: err.message || "Terjadi kesalahan",
          });
        }
      }
    }
    fetchGrafikPelamar();
    return () => { ignore = true; };
  }, []);

  // Data untuk Doughnut Chart (Rasio Pelamar Diterima vs Ditolak) - dinamis
  const doughnutData = {
    labels: ["Diterima", "Ditolak"],
    datasets: [
      {
        data: [
          applicantRatio.loading || applicantRatio.diterima == null ? 0 : applicantRatio.diterima,
          applicantRatio.loading || applicantRatio.ditolak == null ? 0 : applicantRatio.ditolak,
        ],
        backgroundColor: ["#00C897", "#F44336"],
        borderWidth: 0,
      },
    ],
  };

  // Kartu statistik pertama: Jumlah Pelamar (dinamis)
  const statJumlahPelamar = {
    label: "Jumlah Pelamar",
    value:
      jumlahPelamar.loading
        ? "..."
        : jumlahPelamar.error
        ? "-"
        : (jumlahPelamar.jumlah ?? "-").toLocaleString("id-ID"),
    change:
      jumlahPelamar.loading
        ? "..."
        : jumlahPelamar.error
        ? "-"
        : jumlahPelamar.pertumbuhan && typeof jumlahPelamar.pertumbuhan.jumlah === "number"
        ? (jumlahPelamar.pertumbuhan.jumlah > 0
            ? `+${jumlahPelamar.pertumbuhan.jumlah}`
            : jumlahPelamar.pertumbuhan.jumlah)
        : "-",
    changeLabel:
      jumlahPelamar.loading || jumlahPelamar.error
        ? ""
        : jumlahPelamar.pertumbuhan && jumlahPelamar.pertumbuhan.keterangan
        ? jumlahPelamar.pertumbuhan.keterangan
        : "Periode sebelumnya",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#f3f6fd" />
        <path d="M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#ff7c6b"/>
      </svg>
    ),
    color: "text-[#ff7c6b]",
    bg: "bg-white",
    changeColor:
      jumlahPelamar.loading || jumlahPelamar.error
        ? "text-gray-400"
        : jumlahPelamar.pertumbuhan && typeof jumlahPelamar.pertumbuhan.jumlah === "number"
        ? jumlahPelamar.pertumbuhan.jumlah > 0
          ? "text-green-500"
          : jumlahPelamar.pertumbuhan.jumlah < 0
          ? "text-red-500"
          : "text-gray-400"
        : "text-gray-400",
  };

  // Kartu statistik jumlah lowongan aktif (dinamis)
  const statLowonganAktif = {
    label: "Jumlah Lowongan Aktif",
    value:
      lowonganAktif.loading
        ? "..."
        : lowonganAktif.error
        ? "-"
        : (lowonganAktif.jumlah ?? "-").toLocaleString("id-ID"),
    change:
      lowonganAktif.loading
        ? "..."
        : lowonganAktif.error
        ? "-"
        : typeof lowonganAktif.sejakMingguLalu === "number"
        ? (lowonganAktif.sejakMingguLalu > 0
            ? `+${lowonganAktif.sejakMingguLalu}`
            : lowonganAktif.sejakMingguLalu)
        : "-",
    changeLabel:
      lowonganAktif.loading || lowonganAktif.error
        ? ""
        : "Sejak minggu lalu",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#f3f6fd" />
        <path d="M7 13l3 3 7-7" stroke="#4f8cff" strokeWidth="2" fill="none" />
      </svg>
    ),
    color: "text-[#4f8cff]",
    bg: "bg-white",
    changeColor:
      lowonganAktif.loading || lowonganAktif.error
        ? "text-gray-400"
        : typeof lowonganAktif.sejakMingguLalu === "number"
        ? lowonganAktif.sejakMingguLalu > 0
          ? "text-green-500"
          : lowonganAktif.sejakMingguLalu < 0
          ? "text-red-500"
          : "text-gray-400"
        : "text-gray-400",
    error: lowonganAktif.error,
  };

  // Kartu statistik traffic lowongan (hanya kemarin)
  const statTrafficLowonganKemarin = {
    label: "Traffic ke Halaman Lowongan",
    value:
      trafficLowongan.loading
        ? "..."
        : trafficLowongan.error
        ? "-"
        : (trafficLowongan.total_kemarin ?? "-").toLocaleString("id-ID"),
    change:
      trafficLowongan.loading
        ? "..."
        : trafficLowongan.error
        ? "-"
        : typeof trafficLowongan.pertambahan === "number"
        ? (trafficLowongan.pertambahan > 0
            ? `+${trafficLowongan.pertambahan}`
            : trafficLowongan.pertambahan)
        : "-",
    changeLabel:
      trafficLowongan.loading || trafficLowongan.error
        ? ""
        : "Dibanding hari sebelumnya",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#f3f6fd" />
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#a259ff"/>
      </svg>
    ),
    color: "text-[#a259ff]",
    bg: "bg-white",
    changeColor:
      trafficLowongan.loading || trafficLowongan.error
        ? "text-gray-400"
        : typeof trafficLowongan.pertambahan === "number"
        ? trafficLowongan.pertambahan > 0
          ? "text-green-500"
          : trafficLowongan.pertambahan < 0
          ? "text-red-500"
          : "text-gray-400"
        : "text-gray-400",
  };

  // Data grafik pelamar per bulan per tahun (untuk Line/Area Chart)
  let lineDataPelamar = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: "Jumlah Pelamar",
        data: Array(12).fill(0),
        fill: true,
        backgroundColor: "rgba(76, 175, 80, 0.15)", // hijau muda transparan
        borderColor: "#4caf50", // hijau lembut
        pointBackgroundColor: "#4caf50",
        pointBorderColor: "#fff",
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  if (!grafikPelamar.loading && !grafikPelamar.error && tahunDipilih) {
    // Filter data untuk tahun yang dipilih
    const dataTahun = grafikPelamar.data.filter((d) => d.tahun === tahunDipilih);
    // Buat array 12 bulan, isi dengan jumlah dari data, default 0
    const dataBulan = Array(12).fill(0);
    dataTahun.forEach((d) => {
      if (d.bulan >= 1 && d.bulan <= 12) {
        dataBulan[d.bulan - 1] = d.jumlah;
      }
    });
    lineDataPelamar = {
      labels: MONTH_LABELS,
      datasets: [
        {
          label: "Jumlah Pelamar",
          data: dataBulan,
          fill: true,
          backgroundColor: "rgba(76, 175, 80, 0.15)", // hijau muda transparan
          borderColor: "#4caf50", // hijau lembut
          pointBackgroundColor: "#4caf50",
          pointBorderColor: "#fff",
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  return (
    <div className="min-h-screen bg-gray-100 py-7 px-4 w-full overflow-y-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeIn duration={1000} delay={100}>
          <h1
            className="mb-2 text-3xl md:text-4xl font-extrabold tracking-tight"
            style={{
              fontFamily: `'Poppins', 'Segoe UI', 'Arial', sans-serif`,
              background: "linear-gradient(90deg, #4f8cff 0%, #a259ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textFillColor: "transparent",
              letterSpacing: "0.01em",
              lineHeight: 1.15,
              textShadow: "0 2px 16px #a259ff22",
            }}
          >
            Selamat Datang di Portal Perusahaan!
          </h1>
        </FadeIn>
        <FadeIn duration={1100} delay={350}>
          <p
            className="mb-8 text-base md:text-lg font-medium"
            style={{
              color: "#4f4f4f",
              fontFamily: `'Poppins', 'Segoe UI', 'Arial', sans-serif`,
              maxWidth: 520,
            }}
          >
            Temukan insight menarik, pantau performa, dan kelola aktivitas perusahaan Anda dengan mudah. Semangat berinovasi dan berkembang bersama kami!
          </p>
        </FadeIn>
        {/* Kartu Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {/* Kartu Jumlah Pelamar (dinamis) */}
          <div
            className={`rounded-xl shadow-sm p-5 flex flex-col gap-2 ${statJumlahPelamar.bg} border border-gray-100`}
          >
            <div className="flex items-center gap-3">
              <div>{statJumlahPelamar.icon}</div>
              <div className="text-xs font-semibold text-gray-500">{statJumlahPelamar.label}</div>
            </div>
            <div className="text-2xl font-bold mt-2 mb-1 flex items-end gap-2">
              <span className={statJumlahPelamar.color}>{statJumlahPelamar.value}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={statJumlahPelamar.changeColor}>{statJumlahPelamar.change}</span>
              <span className="text-gray-400">{statJumlahPelamar.changeLabel}</span>
            </div>
            {jumlahPelamar.error && (
              <div className="text-xs text-red-500 mt-1">{jumlahPelamar.error}</div>
            )}
          </div>
          {/* Kartu Jumlah Lowongan Aktif (dinamis) */}
          <div
            className={`rounded-xl shadow-sm p-5 flex flex-col gap-2 ${statLowonganAktif.bg} border border-gray-100`}
          >
            <div className="flex items-center gap-3">
              <div>{statLowonganAktif.icon}</div>
              <div className="text-xs font-semibold text-gray-500">{statLowonganAktif.label}</div>
            </div>
            <div className="text-2xl font-bold mt-2 mb-1 flex items-end gap-2">
              <span className={statLowonganAktif.color}>{statLowonganAktif.value}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={statLowonganAktif.changeColor}>{statLowonganAktif.change}</span>
              <span className="text-gray-400">{statLowonganAktif.changeLabel}</span>
            </div>
            {statLowonganAktif.error && (
              <div className="text-xs text-red-500 mt-1">{statLowonganAktif.error}</div>
            )}
          </div>
          {/* Kartu Traffic ke Halaman Lowongan (Kemarin) */}
          <div
            className={`rounded-xl shadow-sm p-5 flex flex-col gap-2 ${statTrafficLowonganKemarin.bg} border border-gray-100`}
          >
            <div className="flex items-center gap-3">
              <div>{statTrafficLowonganKemarin.icon}</div>
              <div className="text-xs font-semibold text-gray-500">{statTrafficLowonganKemarin.label}</div>
            </div>
            <div className="text-2xl font-bold mt-2 mb-1 flex items-end gap-2">
              <span className={statTrafficLowonganKemarin.color}>{statTrafficLowonganKemarin.value}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={statTrafficLowonganKemarin.changeColor}>
                {statTrafficLowonganKemarin.change}
                {typeof trafficLowongan.persentase === "number" && !trafficLowongan.loading && !trafficLowongan.error
                  ? ` (${trafficLowongan.persentase > 0 ? "+" : ""}${trafficLowongan.persentase}%)`
                  : ""}
              </span>
              <span className="text-gray-400">{statTrafficLowonganKemarin.changeLabel}</span>
            </div>
            {trafficLowongan.error && (
              <div className="text-xs text-red-500 mt-1">{trafficLowongan.error}</div>
            )}
          </div>
          {/* Kartu statistik lain (Lowongan Belum Diverifikasi) */}
          {otherStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl shadow-sm p-5 flex flex-col gap-2 ${stat.bg} border border-gray-100`}
            >
              <div className="flex items-center gap-3">
                <div>{stat.icon}</div>
                <div className="text-xs font-semibold text-gray-500">{stat.label}</div>
              </div>
              <div className="text-2xl font-bold mt-2 mb-1 flex items-end gap-2">
                <span className={stat.color}>{stat.value}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={stat.changeColor}>{stat.change}</span>
                <span className="text-gray-400">{stat.changeLabel}</span>
              </div>
              {lowonganPending.error && (
                <div className="text-xs text-red-500 mt-1">{lowonganPending.error}</div>
              )}
            </div>
          ))}
        </div>
        {/* Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Rasio Pelamar Diterima vs Ditolak */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full">
              <div className="font-semibold text-gray-800 mb-4 text-sm">Rasio Pelamar Diterima vs Ditolak</div>
              <div className="flex flex-col gap-2">
                {["Diterima", "Ditolak"].map((label, idx) => {
                  const value = applicantRatio.loading
                    ? "..."
                    : applicantRatio.error
                    ? "-"
                    : idx === 0
                    ? (applicantRatio.diterima ?? 0)
                    : (applicantRatio.ditolak ?? 0);
                  const color = idx === 0 ? "#00C897" : "#F44336";
                  return (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: color }}
                      ></span>
                      <span className="text-gray-700">{label}</span>
                      <span className="ml-auto font-semibold text-gray-700">
                        {applicantRatio.loading
                          ? "..."
                          : applicantRatio.error
                          ? "-"
                          : value}
                      </span>
                    </div>
                  );
                })}
                {applicantRatio.error && (
                  <div className="text-xs text-red-500 mt-1">{applicantRatio.error}</div>
                )}
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center w-full">
              <div className="w-32 h-32">
                <Doughnut
                  data={doughnutData}
                  options={{
                    cutout: "70%",
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          {/* Grafik Pelamar per Bulan (pindah ke sini, ganti Statistik Profil Perusahaan) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mx-auto w-full" style={{ maxWidth: 480 }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <div className="font-semibold text-gray-800 text-sm text-center w-full md:w-auto">Grafik Pelamar per Bulan</div>
              <div className="flex justify-center w-full md:w-auto">
                {grafikPelamar.loading ? (
                  <span className="text-xs text-black">Memuat tahun...</span>
                ) : grafikPelamar.error ? (
                  <span className="text-xs text-red-500">{grafikPelamar.error}</span>
                ) : (
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none text-black"
                    value={tahunDipilih || ""}
                    onChange={e => setTahunDipilih(Number(e.target.value))}
                    disabled={grafikPelamar.loading || tahunList.length === 0}
                    style={{ minWidth: 80 }}
                  >
                    {tahunList.map((tahun) => (
                      <option key={tahun} value={tahun}>{tahun}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="w-full h-64">
              <Line
                data={lineDataPelamar}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: function (context) {
                          return `${context.dataset.label}: ${context.parsed.y.toLocaleString("id-ID")}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: "#8A92A6", font: { size: 12 } },
                    },
                    y: {
                      grid: { color: "#F1F1F1" },
                      ticks: { color: "#8A92A6", font: { size: 12 } },
                      beginAtZero: true,
                      // max: 300, // optionally, you can set max dynamically
                    },
                  },
                  elements: {
                    line: {
                      borderWidth: 3,
                    },
                    point: {
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
        {/* Bagian Kartu Rekomendasi */}
        <div className="mt-10 w-full flex justify-start">
          <div className="w-full max-w-full px-0">
            <CardRekomendasi />
          </div>
        </div>
      </div>
    </div>
  );
}
