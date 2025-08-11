"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../navbar/page";
import TokenKadaluarsaRedirect from "../tokenKadaluarsa";
import {
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoHelpCircle,
} from "react-icons/io5";
import NeuButtonBar from "./bar/page";

// Helper: Ambil token dari cookie (client-side)
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

// Ionicons ICONS
const SortAZIcon = ({ className = "" }) => (
  <span className={className} title="A-Z">
    <IoArrowDownOutline className="w-5 h-5" />
  </span>
);
const SortZAIcon = ({ className = "" }) => (
  <span className={className} title="Z-A">
    <IoArrowUpOutline className="w-5 h-5" />
  </span>
);
const AktifIcon = ({ className = "" }) => (
  <span className={className} title="Aktif">
    <IoCheckmarkCircle className="w-5 h-5 text-green-500" />
  </span>
);
const TutupIcon = ({ className = "" }) => (
  <span className={className} title="Tutup">
    <IoCloseCircle className="w-5 h-5 text-red-500" />
  </span>
);
const UnverifiedIcon = ({ className = "" }) => (
  <span className={className} title="Unverified">
    <IoHelpCircle className="w-5 h-5 text-yellow-400" />
  </span>
);

// LinkedIn-style Job Card
function LinkedInJobCard({ job, onPelamarClick }) {
  // Status label logic
  let statusLabel = "-";
  let statusClass = "bg-gray-200 text-gray-600";
  let StatusIcon = null;
  if (job.status === "open") {
    statusLabel = "Aktif";
    statusClass = "bg-green-500 text-white";
    StatusIcon = AktifIcon;
  } else if (job.status === "closed") {
    statusLabel = "Tutup";
    statusClass = "bg-red-500 text-white";
    StatusIcon = TutupIcon;
  } else if (job.status === "pending_verification") {
    statusLabel = "Pending";
    statusClass = "bg-yellow-400 text-white";
    StatusIcon = UnverifiedIcon;
  } else if (job.status === "rejected") {
    statusLabel = "Ditolak";
    statusClass = "bg-red-700 text-white";
    StatusIcon = null;
  } else if (job.status) {
    statusLabel = job.status;
    statusClass = "bg-gray-200 text-gray-600";
    StatusIcon = null;
  }

  // Ambil jumlah pelamar dari job.jumlah_pelamar jika ada, fallback ke 0
  const jumlahPelamar = typeof job.jumlah_pelamar === "number"
    ? job.jumlah_pelamar
    : Array.isArray(job.pelamar)
      ? job.pelamar.length
      : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition flex flex-col md:flex-row p-6 gap-4 max-w-2xl w-full break-words mb-6">
      {/* Logo Perusahaan Placeholder */}
      <div className="flex-shrink-0 flex items-start">
        <div className="h-14 w-14 rounded-lg bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
          <span role="img" aria-label="Company">🏢</span>
        </div>
      </div>
      {/* Job Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center gap-2 min-w-0">
            <h2
              className="text-lg md:text-xl font-semibold text-blue-900 hover:underline cursor-pointer truncate max-w-[20rem] md:max-w-[28rem]"
              title={job.judul_pekerjaan}
            >
              {job.judul_pekerjaan || "Tanpa Judul"}
            </h2>
            <span
              className={`ml-2 px-4 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 text-center ${statusClass}`}
              style={
                statusLabel === "Ditolak"
                  ? {
                      minWidth: 90,
                      justifyContent: "center",
                      alignItems: "center",
                      display: "flex",
                      paddingLeft: "1.5rem",
                      paddingRight: "1.5rem",
                    }
                  : {}
              }
            >
              {StatusIcon && <StatusIcon className="w-4 h-4" />}
              <span
                className={
                  statusLabel === "Ditolak"
                    ? "w-full text-center relative"
                    : "w-full relative right-[10px]"
                }
                style={statusLabel === "Ditolak" ? { right: 0 } : {}}
              >
                {statusLabel}
              </span>
            </span>
          </div>
          <div
            className="text-gray-700 text-sm mt-1 mb-2 line-clamp-2 break-words"
            title={job.deskripsi}
          >
            {job.deskripsi || "-"}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <div className="break-all">
              <span className="font-medium">ID:</span> {job._id}
            </div>
            <div>
              <span className="font-medium">Dibuat:</span> {job.createdAt ? new Date(job.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
            </div>
            {job.lokasi && (
              <div>
                <span className="font-medium">Lokasi:</span> {job.lokasi}
              </div>
            )}
            {job.tipe_kerja && (
              <div>
                <span className="font-medium">Tipe:</span> {job.tipe_kerja}
              </div>
            )}
            {job.gaji && (
              <div>
                <span className="font-medium">Gaji:</span> {job.gaji}
              </div>
            )}
            {job.batas_lamaran && (
              <div>
                <span className="font-medium">Deadline:</span> {new Date(job.batas_lamaran).toLocaleDateString("id-ID")}
              </div>
            )}
            {/* Tambahan: Batas Pelamar */}
            {typeof job.batas_pelamar !== "undefined" && job.batas_pelamar !== null && job.batas_pelamar !== "" && (
              <div>
                <span className="font-medium">Batas Pelamar:</span> {job.batas_pelamar}
              </div>
            )}
            {/* Tambahan: Jumlah Pelamar */}
            <div>
              <span className="font-medium">Jumlah Pelamar:</span> {jumlahPelamar}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
            onClick={onPelamarClick}
          >
            Lihat Pelamar
          </button>
          {/* Tombol edit/hapus bisa ditambahkan di sini */}
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  {
    key: "az",
    label: "A-Z",
    icon: SortAZIcon,
    tooltip: "Judul A-Z",
  },
  {
    key: "za",
    label: "Z-A",
    icon: SortZAIcon,
    tooltip: "Judul Z-A",
  },
  {
    key: "aktif",
    label: "Aktif",
    icon: AktifIcon,
    tooltip: "Status Aktif",
  },
  {
    key: "tutup",
    label: "Tutup",
    icon: TutupIcon,
    tooltip: "Status Tutup",
  },
  {
    key: "unverified",
    label: "Pending",
    icon: UnverifiedIcon,
    tooltip: "Status Unverified",
  },
];

function sortLowongan(lowongan, sortKey) {
  if (!Array.isArray(lowongan)) return [];
  let arr = [...lowongan];
  switch (sortKey) {
    case "az":
      arr.sort((a, b) =>
        (a.judul_pekerjaan || "").localeCompare(b.judul_pekerjaan || "", "id", { sensitivity: "base" })
      );
      break;
    case "za":
      arr.sort((a, b) =>
        (b.judul_pekerjaan || "").localeCompare(a.judul_pekerjaan || "", "id", { sensitivity: "base" })
      );
      break;
    case "aktif":
      arr = arr.filter((l) => l.status === "open");
      break;
    case "tutup":
      arr = arr.filter((l) => l.status === "close");
      break;
    case "unverified":
      arr = arr.filter((l) => l.status === "pending_verification");
      break;
    default:
      break;
  }
  return arr;
}

export default function LowonganPerusahaanListPage() {
  const [loading, setLoading] = useState(false);
  const [lowongan, setLowongan] = useState([]);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("az");
  const router = useRouter();

  useEffect(() => {
    const fetchLowongan = async () => {
      setLoading(true);
      setError("");
      const token = getTokenFromCookie();
      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/lowongan/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || data.msg || "Gagal mengambil data lowongan.");
        }
        const data = await res.json();
        setLowongan(Array.isArray(data.lowongan) ? data.lowongan : []);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };

    fetchLowongan();
  }, []);

  // Memoize sorted/filtered lowongan
  const displayedLowongan = useMemo(() => sortLowongan(lowongan, sortKey), [lowongan, sortKey]);

  return (
    <div className="min-h-screen bg-gray-100 px-2">
      <TokenKadaluarsaRedirect />
      <Navbar />
      <div className="max-w-7xl mx-auto relative top-20">
      <NeuButtonBar />
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Lowongan Anda</h1>
        <p className="text-gray-600 mb-6">Daftar lowongan pekerjaan yang telah Anda posting.</p>
        {/* Sorting Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <span className="text-sm text-gray-700 mr-2">Urutkan/Filter:</span>
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = sortKey === opt.key;
            return (
              <button
                key={opt.key}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition
                  ${isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"}
                `}
                title={opt.tooltip}
                onClick={() => setSortKey(opt.key)}
                type="button"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
        {loading && (
          <div className="mb-4 text-blue-600 font-semibold">Memuat data lowongan...</div>
        )}
        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
        {!loading && displayedLowongan.length === 0 && !error && (
          <div className="mb-4 text-gray-700 bg-white border border-gray-200 rounded-lg p-6 text-center">
            <span className="text-4xl block mb-2">🚀✨🎉</span>
            <span>
              {lowongan.length === 0
                ? "Oops! Anda belum membuat lowongan nih 😲. Yuk, buat lowongan pekerjaan pertamamu sekarang dan temukan kandidat terbaik untuk perusahaanmu! 🌟"
                : "Tidak ada lowongan yang cocok dengan filter/urutan ini."}
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {displayedLowongan.map((l) => (
            <LinkedInJobCard
              key={l._id}
              job={l}
              onPelamarClick={() => router.push(`/PelamarList?id=${l._id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
