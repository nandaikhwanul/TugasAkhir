"use client";
import React, { useEffect, useState } from "react";
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

// Import sessiontoken untuk mengambil token dari session storage
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Register Chart.js components
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
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// Inline SVG Icons to avoid external dependencies
const LuUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const LuFolderCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const LuBarChart2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);
const LuClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

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

import CardRekomendasi from "./cardRekomendasi/page";

// Komponen Dashboard Perusahaan
export default function App() {
  const [jumlahPelamar, setJumlahPelamar] = useState({
    jumlah: null,
    pertumbuhan: null,
    loading: true,
    error: null,
  });

  // Ubah: trafficLowongan akan diisi dari endpoint API GET /lowongan/6887ae184587ec05bb5fac4a/traffic
  const [trafficLowongan, setTrafficLowongan] = useState({
    total_kemarin: null,
    total_sebelumnya: null,
    pertambahan: null,
    persentase: null,
    loading: true,
    error: null,
  });

  // Ubah: lowonganAktif akan diisi dari endpoint API GET /lowongan/me/count/active
  const [lowonganAktif, setLowonganAktif] = useState({
    jumlah: null,
    sejakMingguLalu: null,
    loading: true,
    error: null,
  });

  // Ubah: lowonganPending akan diisi dari endpoint API GET /lowongan/me/count/pending
  const [lowonganPending, setLowonganPending] = useState({
    jumlah: null,
    loading: true,
    error: null,
  });

  // Ubah: applicantRatio akan diisi dari endpoint API GET /pelamar/count/diterima-ditolak
  const [applicantRatio, setApplicantRatio] = useState({
    diterima: null,
    ditolak: null,
    loading: true,
    error: null,
  });

  // Grafik pelamar per bulan per tahun
  const [grafikPelamar, setGrafikPelamar] = useState({
    data: [],
    loading: true,
    error: null,
  });

  const [tahunList, setTahunList] = useState([]);
  const [tahunDipilih, setTahunDipilih] = useState(null);

  // Fungsi fetchData untuk API call dengan token dari sessiontoken.js
  const fetchData = async (url, setState, fieldName) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const token = getTokenFromSessionStorage();
      if (!token) throw new Error("Token tidak ditemukan");

      let response, data;
      if (fieldName === "jumlah pelamar") {
        response = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/lowongan/pelamar/count",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Gagal mengambil data jumlah pelamar");
        data = await response.json();
        setState({
          jumlah: data.jumlah_pelamar,
          pertumbuhan: data.pertumbuhan,
          loading: false,
          error: null,
        });
        return;
      }

      // Ubah: Untuk traffic lowongan, gunakan endpoint API GET /lowongan/6887ae184587ec05bb5fac4a/traffic
      if (fieldName === "traffic lowongan") {
        response = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/lowongan/6887ae184587ec05bb5fac4a/traffic",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Gagal mengambil data traffic lowongan");
        data = await response.json();
        // Data API: { total_traffic_hari_ini, total_traffic_kemarin, pertambahan_traffic, persentase_pertambahan }
        setState({
          total_kemarin: data.total_traffic_kemarin,
          total_sebelumnya: data.total_traffic_hari_ini, // hari ini sebagai pembanding jika ingin, tapi tetap pakai kemarin untuk value utama
          pertambahan: data.pertambahan_traffic,
          persentase: data.persentase_pertambahan,
          loading: false,
          error: null,
        });
        return;
      }

      // Ubah: Untuk lowongan aktif, gunakan endpoint API GET /lowongan/me/count/active
      if (fieldName === "lowongan aktif") {
        response = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/lowongan/me/count/active",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Gagal mengambil data lowongan aktif");
        data = await response.json();
        // Data API: { jumlah_lowongan_aktif: number, jumlah_lowongan_aktif_sejak_minggu_lalu: number }
        setState({
          jumlah: data.jumlah_lowongan_aktif,
          sejakMingguLalu: data.jumlah_lowongan_aktif_sejak_minggu_lalu,
          loading: false,
          error: null,
        });
        return;
      }

      // Ubah: Untuk lowongan pending, gunakan endpoint API GET /lowongan/me/count/pending
      if (fieldName === "lowongan pending") {
        response = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/lowongan/me/count/pending",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Gagal mengambil data lowongan pending");
        data = await response.json();
        // Data API: { jumlah_pending: number }
        setState({
          jumlah: data.jumlah_pending,
          loading: false,
          error: null,
        });
        return;
      }

      // Ubah: Untuk rasio pelamar, gunakan endpoint API GET /pelamar/count/diterima-ditolak
      if (fieldName === "rasio pelamar") {
        response = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/pelamar/count/diterima-ditolak",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Gagal mengambil data rasio pelamar");
        data = await response.json();
        // Data API: { jumlah_pelamar_diterima: number, jumlah_pelamar_ditolak: number }
        setState({
          diterima: data.jumlah_pelamar_diterima,
          ditolak: data.jumlah_pelamar_ditolak,
          loading: false,
          error: null,
        });
        return;
      }

      // Untuk grafik pelamar per bulan per tahun, gunakan endpoint API GET /pelamar/grafik/per-bulan-tahun
      if (fieldName === "grafik pelamar") {
        // Gunakan endpoint dan token sesuai instruksi
        response = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/pelamar/grafik/per-bulan-tahun",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Gunakan token dari session storage (bukan hardcoded)
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Gagal mengambil data grafik pelamar");
        data = await response.json();
        setState({
          data: Array.isArray(data.data) ? data.data : [],
          loading: false,
          error: null,
        });
        return;
      }

      // Untuk field lain, tetap gunakan mock (atau bisa diubah ke API asli jika sudah tersedia)
      // Simulasi delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setState({ loading: false, error: null });
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: err.message || "Terjadi kesalahan" }));
    }
  };

  useEffect(() => {
    // Panggil fetchData untuk jumlah pelamar (API asli)
    fetchData(
      "https://tugasakhir-production-6c6c.up.railway.app/lowongan/pelamar/count",
      setJumlahPelamar,
      "jumlah pelamar"
    );
    // Ubah: fetchData untuk traffic lowongan (API asli)
    fetchData(
      "https://tugasakhir-production-6c6c.up.railway.app/lowongan/6887ae184587ec05bb5fac4a/traffic",
      setTrafficLowongan,
      "traffic lowongan"
    );
    // Ubah: fetchData untuk lowongan aktif (API asli)
    fetchData(
      "https://tugasakhir-production-6c6c.up.railway.app/lowongan/me/count/active",
      setLowonganAktif,
      "lowongan aktif"
    );
    // Ubah: fetchData untuk lowongan pending (API asli)
    fetchData(
      "https://tugasakhir-production-6c6c.up.railway.app/lowongan/me/count/pending",
      setLowonganPending,
      "lowongan pending"
    );
    // Ubah: fetchData untuk rasio pelamar (diterima/ditolak) dari endpoint API
    fetchData(
      "https://tugasakhir-production-6c6c.up.railway.app/pelamar/count/diterima-ditolak",
      setApplicantRatio,
      "rasio pelamar"
    );
    // GUNAKAN ENDPOINT GRAFIK PELAMAR YANG BENAR
    fetchData(
      "https://tugasakhir-production-6c6c.up.railway.app/pelamar/grafik/per-bulan-tahun",
      setGrafikPelamar,
      "grafik pelamar"
    );
  }, []);

  useEffect(() => {
    if (!grafikPelamar.loading && !grafikPelamar.error) {
      const tahunSet = new Set((grafikPelamar.data || []).map((d) => d.tahun));
      const tahunArr = Array.from(tahunSet).sort((a, b) => b - a);
      setTahunList(tahunArr);
      setTahunDipilih((prev) => prev ?? tahunArr[0]);
    }
  }, [grafikPelamar]);

  const stats = [
    {
      label: "Jumlah Pelamar",
      value: jumlahPelamar.loading
        ? "..."
        : jumlahPelamar.error
        ? "-"
        : (jumlahPelamar.jumlah ?? "-").toLocaleString("id-ID"),
      change: jumlahPelamar.loading
        ? "..."
        : jumlahPelamar.error
        ? "-"
        : typeof jumlahPelamar.pertumbuhan?.jumlah === "number"
        ? (jumlahPelamar.pertumbuhan.jumlah > 0
            ? `+${jumlahPelamar.pertumbuhan.jumlah}`
            : jumlahPelamar.pertumbuhan.jumlah)
        : "-",
      changeLabel: jumlahPelamar.pertumbuhan?.keterangan || "Periode sebelumnya",
      icon: <LuUsers />,
      color: "text-red-500",
      changeColor:
        jumlahPelamar.pertumbuhan?.jumlah > 0
          ? "text-green-500"
          : jumlahPelamar.pertumbuhan?.jumlah < 0
          ? "text-red-500"
          : "text-gray-400",
      error: jumlahPelamar.error,
    },
    {
      label: "Jumlah Lowongan Aktif",
      value: lowonganAktif.loading
        ? "..."
        : lowonganAktif.error
        ? "-"
        : (lowonganAktif.jumlah ?? "-").toLocaleString("id-ID"),
      change: lowonganAktif.loading
        ? "..."
        : lowonganAktif.error
        ? "-"
        : typeof lowonganAktif.sejakMingguLalu === "number"
        ? (lowonganAktif.sejakMingguLalu > 0
            ? `+${lowonganAktif.sejakMingguLalu}`
            : lowonganAktif.sejakMingguLalu)
        : "-",
      changeLabel: "Sejak minggu lalu",
      icon: <LuFolderCheck />,
      color: "text-blue-500",
      changeColor:
        lowonganAktif.sejakMingguLalu > 0
          ? "text-green-500"
          : lowonganAktif.sejakMingguLalu < 0
          ? "text-red-500"
          : "text-gray-400",
      error: lowonganAktif.error,
    },
    {
      label: "Traffic ke Halaman Lowongan",
      value: trafficLowongan.loading
        ? "..."
        : trafficLowongan.error
        ? "-"
        : (trafficLowongan.total_kemarin ?? "-").toLocaleString("id-ID"),
      change: trafficLowongan.loading
        ? "..."
        : trafficLowongan.error
        ? "-"
        : typeof trafficLowongan.pertambahan === "number"
        ? (trafficLowongan.pertambahan > 0
            ? `+${trafficLowongan.pertambahan}`
            : trafficLowongan.pertambahan)
        : "-",
      changeLabel: "Dibanding hari sebelumnya",
      icon: <LuBarChart2 />,
      color: "text-purple-500",
      changeColor:
        trafficLowongan.pertambahan > 0
          ? "text-green-500"
          : trafficLowongan.pertambahan < 0
          ? "text-red-500"
          : "text-gray-400",
      error: trafficLowongan.error,
    },
    {
      label: "Lowongan Belum Diverifikasi",
      value: lowonganPending.loading
        ? "..."
        : lowonganPending.error
        ? "-"
        : (lowonganPending.jumlah ?? "-").toLocaleString("id-ID"),
      change: "-",
      changeLabel: "",
      icon: <LuClock />,
      color: "text-green-500",
      changeColor: "text-gray-400",
      error: lowonganPending.error,
    },
  ];

  // Data donut chart diisi dari applicantRatio (API GET /pelamar/count/diterima-ditolak)
  const doughnutData = {
    labels: ["Diterima", "Ditolak"],
    datasets: [
      {
        data: [
          applicantRatio.loading || applicantRatio.diterima == null
            ? 0
            : applicantRatio.diterima,
          applicantRatio.loading || applicantRatio.ditolak == null
            ? 0
            : applicantRatio.ditolak,
        ],
        backgroundColor: ["#00C897", "#F44336"],
        borderWidth: 0,
      },
    ],
  };

  // Grafik pelamar per bulan per tahun
  let lineDataPelamar = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: "Jumlah Pelamar",
        data: Array(12).fill(0),
        fill: true,
        backgroundColor: "rgba(76, 175, 80, 0.15)",
        borderColor: "#4caf50",
        pointBackgroundColor: "#4caf50",
        pointBorderColor: "#fff",
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  if (!grafikPelamar.loading && !grafikPelamar.error && tahunDipilih) {
    const dataTahun = (grafikPelamar.data || []).filter(
      (d) => d.tahun === tahunDipilih
    );
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
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          borderColor: "#4caf50",
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
    <div className="min-h-screen bg-gray-100 py-7 px-4 w-full overflow-y-hidden font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <FadeIn duration={1000} delay={100}>
          <h1
            className="mb-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-800"
            style={{ fontFamily: `'Inter', sans-serif` }}
          >
            Dashboard Perusahaan
          </h1>
        </FadeIn>
        <FadeIn duration={1100} delay={350}>
          <p
            className="mb-10 text-base md:text-lg font-medium text-gray-500"
            style={{ fontFamily: `'Inter', sans-serif`, maxWidth: 600 }}
          >
            Temukan insight menarik, pantau performa, dan kelola aktivitas perusahaan Anda dengan mudah.
          </p>
        </FadeIn>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <FadeIn key={index} duration={900} delay={300 + index * 100}>
              <div
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100 transition-transform duration-300 hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm font-semibold">
                    {stat.label}
                  </span>
                  <div
                    className={`p-2 rounded-full ${
                      stat.color.replace("text-", "bg-") + " bg-opacity-10"
                    }`}
                  >
                    {stat.icon}
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-gray-900">
                  {stat.value}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={stat.changeColor}>{stat.change}</span>
                  <span className="text-gray-400">{stat.changeLabel}</span>
                </div>
                {stat.error && (
                  <div className="text-xs text-red-500 mt-1">{stat.error}</div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Grafik Pelamar per Bulan */}
          <FadeIn duration={900} delay={600} className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Grafik Pelamar per Bulan
                </h3>
                {grafikPelamar.loading ? (
                  <span className="text-sm text-gray-400">Memuat...</span>
                ) : grafikPelamar.error ? (
                  <span className="text-sm text-red-500">
                    {grafikPelamar.error}
                  </span>
                ) : (
                  <select
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={tahunDipilih || ""}
                    onChange={(e) => setTahunDipilih(Number(e.target.value))}
                    disabled={grafikPelamar.loading || tahunList.length === 0}
                  >
                    {tahunList.map((tahun) => (
                      <option key={tahun} value={tahun}>
                        {tahun}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex-grow min-h-[300px]">
                <Line
                  data={lineDataPelamar}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return `${
                              context.dataset.label
                            }: ${context.parsed.y.toLocaleString("id-ID")}`;
                          },
                        },
                      },
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        grid: { color: "#E5E7EB" },
                        ticks: { color: "#6B7280" },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </FadeIn>

          {/* Rasio Pelamar Diterima vs Ditolak */}
          <FadeIn duration={900} delay={700}>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col h-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Rasio Pelamar Diterima vs Ditolak
              </h3>
              <div className="flex-grow flex flex-col justify-center items-center gap-6">
                <div className="w-40 h-40 flex-shrink-0">
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
                <div className="w-full space-y-3">
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
                      <div
                        key={label}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ background: color }}
                          ></span>
                          <span className="text-gray-700 font-medium">
                            {label}
                          </span>
                        </div>
                        <span className="font-bold text-gray-800">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                  {applicantRatio.error && (
                    <div className="text-xs text-red-500 mt-1">
                      {applicantRatio.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Bagian Rekomendasi */}
        <FadeIn duration={900} delay={800}>
          <div className="mt-10">
            <CardRekomendasi />
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
