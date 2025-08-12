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
import { FaUserGraduate, FaBuilding, FaSuitcase, FaPodcast, FaVideo } from "react-icons/fa";
import { MdOutlineCastForEducation } from "react-icons/md";

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

// Dummy data, ganti dengan fetch API jika sudah ada backend
const dummyStats = {
  alumni: 1200,
  perusahaan: 85,
  lowongan: 320,
  pelatihan: 24,
  podcast: 12,
  alumniByYear: {
    "2019": 200,
    "2020": 250,
    "2021": 300,
    "2022": 250,
    "2023": 200,
  },
  alumniByJurusan: {
    "Teknik Informatika": 400,
    "Sistem Informasi": 350,
    "Manajemen": 250,
    "Akuntansi": 200,
  },
  lowonganByStatus: {
    "Terverifikasi": 210,
    "Menunggu": 80,
    "Ditolak": 30,
  },
  perusahaanByBidang: {
    "IT": 30,
    "Keuangan": 15,
    "Pendidikan": 10,
    "Manufaktur": 20,
    "Lainnya": 10,
  },
};

const cardData = [
  {
    title: "Total Alumni",
    value: dummyStats.alumni,
    icon: <FaUserGraduate className="text-3xl text-blue-600" />,
    color: "bg-blue-100",
  },
  {
    title: "Total Perusahaan",
    value: dummyStats.perusahaan,
    icon: <FaBuilding className="text-3xl text-green-600" />,
    color: "bg-green-100",
  },
  {
    title: "Total Lowongan",
    value: dummyStats.lowongan,
    icon: <FaSuitcase className="text-3xl text-yellow-600" />,
    color: "bg-yellow-100",
  },
  {
    title: "Video Pelatihan",
    value: dummyStats.pelatihan,
    icon: <MdOutlineCastForEducation className="text-3xl text-purple-600" />,
    color: "bg-purple-100",
  },
  {
    title: "Video Podcast",
    value: dummyStats.podcast,
    icon: <FaPodcast className="text-3xl text-pink-600" />,
    color: "bg-pink-100",
  },
];

export default function AdminDashboard() {
  // Jika ingin fetch data dari API, gunakan useEffect di sini

  // Data untuk grafik alumni per tahun (Line)
  const alumniYearData = {
    labels: Object.keys(dummyStats.alumniByYear),
    datasets: [
      {
        label: "Alumni",
        data: Object.values(dummyStats.alumniByYear),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#2563eb",
      },
    ],
  };

  // Data untuk alumni per jurusan (Pie)
  const alumniJurusanData = {
    labels: Object.keys(dummyStats.alumniByJurusan),
    datasets: [
      {
        data: Object.values(dummyStats.alumniByJurusan),
        backgroundColor: [
          "#2563eb",
          "#10b981",
          "#f59e42",
          "#f43f5e",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Data untuk lowongan berdasarkan status (Doughnut)
  const lowonganStatusData = {
    labels: Object.keys(dummyStats.lowonganByStatus),
    datasets: [
      {
        data: Object.values(dummyStats.lowonganByStatus),
        backgroundColor: [
          "#22d3ee",
          "#facc15",
          "#f87171",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Data untuk perusahaan berdasarkan bidang (Bar)
  const perusahaanBidangData = {
    labels: Object.keys(dummyStats.perusahaanByBidang),
    datasets: [
      {
        label: "Perusahaan",
        data: Object.values(dummyStats.perusahaanByBidang),
        backgroundColor: [
          "#6366f1",
          "#34d399",
          "#fbbf24",
          "#f472b6",
          "#a3e635",
        ],
        borderRadius: 8,
      },
    ],
  };

  // Ukuran grafik lebih kecil
  const chartHeight = 140; // sebelumnya 220

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 md:px-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Admin</h1>
      {/* Card Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        {cardData.map((card) => (
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
        ))}
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Alumni per Tahun */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-blue-700">Alumni per Tahun</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
            <Line
              data={alumniYearData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 50 } },
                },
                maintainAspectRatio: false,
              }}
              height={chartHeight}
            />
          </div>
        </div>
        {/* Alumni per Jurusan */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-green-700">Alumni per Jurusan</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lowongan berdasarkan Status */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-cyan-700">Status Lowongan</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
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
          </div>
        </div>
        {/* Perusahaan berdasarkan Bidang */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4 text-indigo-700">Perusahaan per Bidang</h2>
          <div style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}>
            <Bar
              data={perusahaanBidangData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 5 } },
                },
                maintainAspectRatio: false,
              }}
              height={chartHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
