"use client";
import React, { useEffect, useState } from "react";
import {
  Bar,
  Pie,
  Line,
  Doughnut,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { FaUserGraduate, FaBuilding, FaSuitcase } from "react-icons/fa";
import { getTokenFromSessionStorage } from "@/app/sessiontoken";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

const LOWONGAN_STATUS_LABELS = [
  { key: "open", label: "Dibuka", color: "#22d3ee" },
  { key: "pending_verification", label: "Menunggu Verifikasi", color: "#facc15" },
  { key: "rejected", label: "Ditolak", color: "#f87171" },
  { key: "closed", label: "Ditutup", color: "#a3a3a3" },
];

// Warna untuk bar chart perusahaan per bidang
const PERUSAHAAN_BIDANG_COLORS = [
  "#6366f1",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a3e635",
  "#f59e42",
  "#f43f5e",
  "#10b981",
  "#f472b6",
  "#f87171",
];

export default function AdminDashboard() {
  // State untuk statistik utama
  const [stats, setStats] = useState({
    totalAlumni: 0,
    totalPerusahaan: 0,
    totalLowongan: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk alumni per tahun (line chart)
  const [alumniYearData, setAlumniYearData] = useState({
    labels: [],
    datasets: [
      {
        label: "Alumni",
        data: [],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#2563eb",
      },
    ],
  });
  const [loadingAlumniYear, setLoadingAlumniYear] = useState(true);
  const [errorAlumniYear, setErrorAlumniYear] = useState("");

  // State untuk alumni per jurusan (pie chart)
  const [alumniJurusanData, setAlumniJurusanData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "#2563eb",
          "#10b981",
          "#f59e42",
          "#f43f5e",
          "#a3e635",
          "#f472b6",
          "#6366f1",
          "#fbbf24",
          "#34d399",
          "#f87171",
        ],
        borderWidth: 1,
      },
    ],
  });
  const [loadingAlumniJurusan, setLoadingAlumniJurusan] = useState(true);
  const [errorAlumniJurusan, setErrorAlumniJurusan] = useState("");

  // State untuk lowongan berdasarkan status (doughnut chart)
  const [lowonganStatusData, setLowonganStatusData] = useState({
    labels: LOWONGAN_STATUS_LABELS.map((s) => s.label),
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: LOWONGAN_STATUS_LABELS.map((s) => s.color),
        borderWidth: 1,
      },
    ],
  });
  const [loadingLowonganStatus, setLoadingLowonganStatus] = useState(true);
  const [errorLowonganStatus, setErrorLowonganStatus] = useState("");

  // State untuk perusahaan per bidang (bar chart)
  const [perusahaanBidangData, setPerusahaanBidangData] = useState({
    labels: [],
    datasets: [
      {
        label: "Perusahaan",
        data: [],
        backgroundColor: [],
        borderRadius: 8,
      },
    ],
  });
  const [loadingPerusahaanBidang, setLoadingPerusahaanBidang] = useState(true);
  const [errorPerusahaanBidang, setErrorPerusahaanBidang] = useState("");

  // Fetch statistik utama dari API
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError("");
      try {
        const token = getTokenFromSessionStorage();
        const res = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/admin/dashboard/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil statistik utama");
        const data = await res.json();
        setStats({
          totalAlumni: data.totalAlumni ?? 0,
          totalPerusahaan: data.totalPerusahaan ?? 0,
          totalLowongan: data.totalLowongan ?? 0,
        });
      } catch (err) {
        setError("Gagal memuat statistik utama");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Fetch alumni per tahun (line chart) dari endpoint baru
  useEffect(() => {
    async function fetchAlumniPerTahun() {
      setLoadingAlumniYear(true);
      setErrorAlumniYear("");
      try {
        const token = getTokenFromSessionStorage();
        const res = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/admin/dashboard/alumni-per-tahun",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data alumni per tahun");
        const data = await res.json();
        // data: [{ tahun: 2022, count: 1 }, ...]
        // Urutkan tahun ascending
        const sorted = [...data].sort((a, b) => a.tahun - b.tahun);
        setAlumniYearData({
          labels: sorted.map((item) => item.tahun.toString()),
          datasets: [
            {
              label: "Alumni",
              data: sorted.map((item) => item.count),
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,0.2)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#2563eb",
            },
          ],
        });
      } catch (err) {
        setErrorAlumniYear("Gagal memuat data alumni per tahun");
        setAlumniYearData({
          labels: [],
          datasets: [
            {
              label: "Alumni",
              data: [],
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,0.2)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#2563eb",
            },
          ],
        });
      } finally {
        setLoadingAlumniYear(false);
      }
    }
    fetchAlumniPerTahun();
  }, []);

  // Fetch alumni per jurusan (pie chart) dari endpoint baru
  useEffect(() => {
    async function fetchAlumniPerJurusan() {
      setLoadingAlumniJurusan(true);
      setErrorAlumniJurusan("");
      try {
        const token = getTokenFromSessionStorage();
        const res = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/admin/dashboard/alumni-per-jurusan",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data alumni per jurusan");
        const data = await res.json();
        // data: [{ program_studi: "...", count: ... }, ...]
        setAlumniJurusanData({
          labels: data.map((item) => item.program_studi),
          datasets: [
            {
              data: data.map((item) => item.count),
              backgroundColor: [
                "#2563eb",
                "#10b981",
                "#f59e42",
                "#f43f5e",
                "#a3e635",
                "#f472b6",
                "#6366f1",
                "#fbbf24",
                "#34d399",
                "#f87171",
              ],
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        setErrorAlumniJurusan("Gagal memuat data alumni per jurusan");
        setAlumniJurusanData({
          labels: [],
          datasets: [
            {
              data: [],
              backgroundColor: [
                "#2563eb",
                "#10b981",
                "#f59e42",
                "#f43f5e",
                "#a3e635",
                "#f472b6",
                "#6366f1",
                "#fbbf24",
                "#34d399",
                "#f87171",
              ],
              borderWidth: 1,
            },
          ],
        });
      } finally {
        setLoadingAlumniJurusan(false);
      }
    }
    fetchAlumniPerJurusan();
  }, []);

  // Fetch lowongan berdasarkan status (doughnut chart) dari endpoint baru
  useEffect(() => {
    async function fetchLowonganStatus() {
      setLoadingLowonganStatus(true);
      setErrorLowonganStatus("");
      try {
        const token = getTokenFromSessionStorage();
        const res = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/admin/dashboard/lowongan-status",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data status lowongan");
        const data = await res.json();
        // data: [{ status: "...", count: ... }, ...]
        // Map ke urutan label yang diinginkan
        const statusMap = {};
        data.forEach((item) => {
          statusMap[item.status] = item.count;
        });
        const chartLabels = LOWONGAN_STATUS_LABELS.map((s) => s.label);
        const chartData = LOWONGAN_STATUS_LABELS.map((s) => statusMap[s.key] ?? 0);
        setLowonganStatusData({
          labels: chartLabels,
          datasets: [
            {
              data: chartData,
              backgroundColor: LOWONGAN_STATUS_LABELS.map((s) => s.color),
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        setErrorLowonganStatus("Gagal memuat data status lowongan");
        setLowonganStatusData({
          labels: LOWONGAN_STATUS_LABELS.map((s) => s.label),
          datasets: [
            {
              data: [0, 0, 0, 0],
              backgroundColor: LOWONGAN_STATUS_LABELS.map((s) => s.color),
              borderWidth: 1,
            },
          ],
        });
      } finally {
        setLoadingLowonganStatus(false);
      }
    }
    fetchLowonganStatus();
  }, []);

  // Fetch perusahaan per bidang (bar chart) dari endpoint baru
  useEffect(() => {
    async function fetchPerusahaanPerBidang() {
      setLoadingPerusahaanBidang(true);
      setErrorPerusahaanBidang("");
      try {
        const token = getTokenFromSessionStorage();
        const res = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/admin/dashboard/perusahaan-per-bidang",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data perusahaan per bidang");
        const data = await res.json();
        // data: [{ bidang: "...", count: ... }, ...]
        // Jika bidang null, tampilkan "Tidak diketahui"
        const labels = data.map((item) => item.bidang ?? "Tidak diketahui");
        const values = data.map((item) => item.count);
        setPerusahaanBidangData({
          labels,
          datasets: [
            {
              label: "Perusahaan",
              data: values,
              backgroundColor: labels.map(
                (_, idx) => PERUSAHAAN_BIDANG_COLORS[idx % PERUSAHAAN_BIDANG_COLORS.length]
              ),
              borderRadius: 8,
            },
          ],
        });
      } catch (err) {
        setErrorPerusahaanBidang("Gagal memuat data perusahaan per bidang");
        setPerusahaanBidangData({
          labels: [],
          datasets: [
            {
              label: "Perusahaan",
              data: [],
              backgroundColor: [],
              borderRadius: 8,
            },
          ],
        });
      } finally {
        setLoadingPerusahaanBidang(false);
      }
    }
    fetchPerusahaanPerBidang();
  }, []);

  // Ukuran grafik lebih kecil
  const chartHeight = 140; // sebelumnya 220

  // Card statistik utama (hanya 3: alumni, perusahaan, lowongan)
  const cardData = [
    {
      title: "Total Alumni",
      value: stats.totalAlumni,
      icon: <FaUserGraduate className="text-3xl text-blue-600" />,
      color: "bg-blue-100",
    },
    {
      title: "Total Perusahaan",
      value: stats.totalPerusahaan,
      icon: <FaBuilding className="text-3xl text-green-600" />,
      color: "bg-green-100",
    },
    {
      title: "Total Lowongan",
      value: stats.totalLowongan,
      icon: <FaSuitcase className="text-3xl text-yellow-600" />,
      color: "bg-yellow-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 md:px-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Admin</h1>
      {/* Card Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-6 mb-10">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl shadow flex items-center p-5 bg-gray-200 animate-pulse h-[90px]"
              >
                <div className="mr-4 w-10 h-10 bg-gray-300 rounded-full" />
                <div>
                  <div className="text-2xl font-bold text-gray-400 mb-1">...</div>
                  <div className="text-gray-400 text-sm">Loading</div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="col-span-3 text-red-500 text-center py-6">{error}</div>
        ) : (
          cardData.map((card) => (
            <div
              key={card.title}
              className={`rounded-xl shadow flex items-center p-5 ${card.color}`}
            >
              <div className="mr-4">{card.icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{card.value}</div>
                <div className="text-gray-500 text-sm">{card.title}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Alumni per Tahun */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-700">Alumni per Tahun Lulus</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
            {loadingAlumniYear ? (
              <div className="flex items-center justify-center h-[140px] text-gray-400">Memuat grafik...</div>
            ) : errorAlumniYear ? (
              <div className="flex items-center justify-center h-[140px] text-red-500">{errorAlumniYear}</div>
            ) : (
              <Line
                data={alumniYearData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                  maintainAspectRatio: false,
                }}
                height={chartHeight}
              />
            )}
          </div>
        </div>
        {/* Alumni per Jurusan */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-green-700">Alumni per Prodi</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
            {loadingAlumniJurusan ? (
              <div className="flex items-center justify-center h-[140px] text-gray-400">Memuat grafik...</div>
            ) : errorAlumniJurusan ? (
              <div className="flex items-center justify-center h-[140px] text-red-500">{errorAlumniJurusan}</div>
            ) : (
              <Pie
                data={alumniJurusanData}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                  },
                  maintainAspectRatio: false,
                }}
                height={chartHeight}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lowongan berdasarkan Status */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-cyan-700">Status Lowongan</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
            {loadingLowonganStatus ? (
              <div className="flex items-center justify-center h-[140px] text-gray-400">Memuat grafik...</div>
            ) : errorLowonganStatus ? (
              <div className="flex items-center justify-center h-[140px] text-red-500">{errorLowonganStatus}</div>
            ) : (
              <Doughnut
                data={lowonganStatusData}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                  },
                  maintainAspectRatio: false,
                }}
                height={chartHeight}
              />
            )}
          </div>
        </div>
        {/* Perusahaan berdasarkan Bidang */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-indigo-700">Perusahaan per Bidang</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
            {loadingPerusahaanBidang ? (
              <div className="flex items-center justify-center h-[140px] text-gray-400">Memuat grafik...</div>
            ) : errorPerusahaanBidang ? (
              <div className="flex items-center justify-center h-[140px] text-red-500">{errorPerusahaanBidang}</div>
            ) : (
              <Bar
                data={perusahaanBidangData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                  maintainAspectRatio: false,
                }}
                height={chartHeight}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
