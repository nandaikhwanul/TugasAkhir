import { useState, useRef } from "react";
import {
  FaSuitcase,
  FaCheckCircle,
  FaTimesCircle,
  FaFire,
  FaVideo,
  FaPodcast,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaRegClock,
  FaBuilding,
} from "react-icons/fa";
import { MdWorkOutline } from "react-icons/md";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Helper untuk resolve URL logo_perusahaan ke localhost:5000/uploads jika perlu
function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `http://localhost:5000${logo_perusahaan}`;
  }
  return `http://localhost:5000/uploads/perusahaan/${logo_perusahaan}`;
}

// Dummy data for videos and podcasts
const videoList = [
  {
    id: 1,
    title: "Cara Membuat CV Menarik",
    url: "https://www.youtube.com/embed/1hHMwLxN6EM",
    type: "video",
    desc: "Tips membuat CV yang menarik untuk HRD.",
  },
  {
    id: 2,
    title: "Teknik Interview Kerja",
    url: "https://www.youtube.com/embed/2vjPBrBU-TM",
    type: "video",
    desc: "Strategi sukses interview kerja.",
  },
  {
    id: 3,
    title: "Membangun Personal Branding",
    url: "https://www.youtube.com/embed/3fumBcKC6RE",
    type: "video",
    desc: "Cara membangun personal branding di dunia kerja.",
  },
  {
    id: 4,
    title: "Tips Networking Efektif",
    url: "https://www.youtube.com/embed/4qT7d3eQ6b8",
    type: "video",
    desc: "Networking yang efektif untuk karir.",
  },
  {
    id: 5,
    title: "Mengelola Stress Kerja",
    url: "https://www.youtube.com/embed/5qap5aO4i9A",
    type: "video",
    desc: "Cara mengelola stress di tempat kerja.",
  },
];

const podcastList = [
  {
    id: 1,
    title: "Kisah Sukses Alumni: Nanda",
    url: "https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5?utm_source=generator",
    type: "podcast",
    desc: "Dengarkan kisah inspiratif alumni.",
  },
  {
    id: 2,
    title: "Motivasi Karir di Era Digital",
    url: "https://open.spotify.com/embed/episode/1B8Q2Q2Q2Q2Q2Q2Q2Q2Q2Q?utm_source=generator",
    type: "podcast",
    desc: "Motivasi dan tips karir di era digital.",
  },
  {
    id: 3,
    title: "Soft Skill Penting di Dunia Kerja",
    url: "https://open.spotify.com/embed/episode/3B8Q2Q2Q2Q2Q2Q2Q2Q2Q?utm_source=generator",
    type: "podcast",
    desc: "Soft skill yang wajib dimiliki.",
  },
  {
    id: 4,
    title: "Membangun Karir dari Nol",
    url: "https://open.spotify.com/embed/episode/4B8Q2Q2Q2Q2Q2Q2Q2Q2Q?utm_source=generator",
    type: "podcast",
    desc: "Tips membangun karir dari awal.",
  },
];

// Komponen horizontal scroll untuk media dengan tombol panah dan tombol View All
function MediaHorizontalScroll({ items, isVideo }) {
  const scrollRef = useRef(null);
  const [showAll, setShowAll] = useState(false);

  // Scroll by 340px (card width + gap) per click
  const scrollByAmount = 340 + 24; // min-w-[320px] + padding/gap

  const handleScroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -scrollByAmount : scrollByAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full max-w-full">
      <div className="mb-4 flex items-center gap-2 justify-between flex-wrap">
        <div className="flex items-center gap-2">
          {isVideo ? (
            <>
              <FaVideo className="text-pink-400" />
              <span className="font-semibold text-lg text-gray-800">
                Pelatihan
              </span>
            </>
          ) : (
            <>
              <FaPodcast className="text-yellow-400" />
              <span className="font-semibold text-lg text-gray-800">
                Podcast Inspiratif
              </span>
            </>
          )}
        </div>
        <button
          className="text-sm font-semibold px-3 py-1 rounded transition bg-gray-100 hover:bg-gray-200 text-blue-600 mt-2 md:mt-0"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Kembali" : "View All"}
        </button>
      </div>
      {!showAll ? (
        <>
          <div className="w-full max-w-full">
            <div
              className="flex gap-4 sm:gap-6 pb-2 w-full max-w-full overflow-x-auto hide-scrollbar"
              style={{ minHeight: 240 }}
              ref={scrollRef}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="min-w-[220px] sm:min-w-[260px] md:min-w-[320px] max-w-xs bg-gray-50 border border-gray-200 rounded-lg shadow hover:shadow-lg transition flex flex-col flex-shrink-0"
                >
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                    <iframe
                      src={item.url}
                      title={item.title}
                      allow={
                        isVideo
                          ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          : "autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      }
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="font-semibold text-gray-800 text-base mb-1">{item.title}</div>
                    <div className="text-gray-500 text-sm flex-1">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Tombol slider di tengah bawah, berdampingan */}
          <div className="flex justify-center mt-4">
            <div className="flex gap-3">
              <button
                aria-label="Scroll left"
                className="bg-white/80 hover:bg-white shadow rounded-full p-2 transition disabled:opacity-40"
                onClick={() => handleScroll("left")}
                tabIndex={0}
                type="button"
              >
                <FaChevronLeft className="text-gray-500" />
              </button>
              <button
                aria-label="Scroll right"
                className="bg-white/80 hover:bg-white shadow rounded-full p-2 transition disabled:opacity-40"
                onClick={() => handleScroll("right")}
                tabIndex={0}
                type="button"
              >
                <FaChevronRight className="text-gray-500" />
              </button>
            </div>
          </div>
        </>
      ) : (
        // Tampilan grid/list semua item
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full mt-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 border border-gray-200 rounded-lg shadow hover:shadow-lg transition flex flex-col"
            >
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                <iframe
                  src={item.url}
                  title={item.title}
                  allow={
                    isVideo
                      ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      : "autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  }
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-semibold text-gray-800 text-base mb-1">{item.title}</div>
                <div className="text-gray-500 text-sm flex-1">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Komponen Card Lowongan
function LowonganCard({ lowongan }) {
  const router = useRouter();

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

  return (
    <div className="flex-1 flex flex-col border border-gray-200 rounded-lg px-4 py-3 hover:shadow transition bg-white min-w-[220px] sm:min-w-[260px] max-w-full">
      <div className="flex items-center gap-2 mb-2">
        {logoPerusahaan ? (
          <img
            src={logoPerusahaan}
            alt={namaPerusahaan}
            className="w-8 h-8 object-contain rounded bg-white border border-gray-200"
            style={{ minWidth: 32, minHeight: 32 }}
          />
        ) : (
          <FaBuilding className="text-blue-400" />
        )}
        <span className="font-bold text-gray-700 text-base truncate">
          {namaPerusahaan}
        </span>
      </div>
      <div className="font-semibold text-gray-800 text-lg mb-1 truncate">
        {lowongan.judul_pekerjaan}
      </div>
      <div className="text-gray-500 text-sm mb-2 line-clamp-2">{lowongan.deskripsi}</div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
          <FaMapMarkerAlt className="text-gray-400" />
          {lowongan.lokasi}
        </span>
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
          <MdWorkOutline className="text-gray-400" />
          {lowongan.tipe_kerja}
        </span>
        {lowongan.gaji && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
            <FaMoneyBillWave className="text-green-400" />
            {lowongan.gaji}
          </span>
        )}
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
          <FaRegClock className="text-gray-400" />
          {batasLamaran}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-gray-400">
          Pelamar: {lowongan.jumlah_pelamar ?? 0}/{lowongan.batas_pelamar ?? "-"}
        </span>
        <button
          className="bg-blue-100 text-blue-700 font-semibold px-4 py-1.5 rounded hover:bg-blue-200 transition text-sm"
          onClick={() => router.push(`/cariLowongan/detailLowongan?id=${lowongan._id}`)}
        >
          Detail
        </button>
      </div>
    </div>
  );
}

// Tampilan statis (tanpa fungsi alumni)
export default function AdminDashboardPage() {
  // Hanya state untuk tab video/podcast
  const [sidebarTab, setSidebarTab] = useState("video");
  const isVideo = sidebarTab === "video";

  // Dummy statistik
  const statistik = {
    diterima: 0,
    ditolak: 0,
    dilamar: 0,
  };

  // Dummy rekomendasi lowongan
  const rekomendasiLowongan = [
    {
      _id: "1",
      judul_pekerjaan: "Frontend Developer",
      deskripsi: "Bergabunglah dengan tim kami sebagai Frontend Developer.",
      nama_perusahaan: "PT Maju Mundur",
      logo_perusahaan: "",
      lokasi: "Jakarta",
      tipe_kerja: "Full Time",
      gaji: "Rp7.000.000 - Rp10.000.000",
      batas_lamaran: "2024-12-31",
      jumlah_pelamar: 12,
      batas_pelamar: 30,
    },
    {
      _id: "2",
      judul_pekerjaan: "UI/UX Designer",
      deskripsi: "Kami mencari UI/UX Designer kreatif.",
      nama_perusahaan: "CV Kreatif Digital",
      logo_perusahaan: "",
      lokasi: "Bandung",
      tipe_kerja: "Remote",
      gaji: "Rp6.000.000 - Rp8.000.000",
      batas_lamaran: "2024-11-15",
      jumlah_pelamar: 5,
      batas_pelamar: 20,
    },
    {
      _id: "3",
      judul_pekerjaan: "Backend Engineer",
      deskripsi: "Backend Engineer untuk pengembangan API.",
      nama_perusahaan: "TechnoHub",
      logo_perusahaan: "",
      lokasi: "Surabaya",
      tipe_kerja: "Full Time",
      gaji: "Rp8.000.000 - Rp12.000.000",
      batas_lamaran: "2024-10-20",
      jumlah_pelamar: 8,
      batas_pelamar: 25,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-0 w-full max-w-full">
      <div className="w-full max-w-full mx-0 space-y-8 px-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 md:px-8 w-full max-w-full">
          {/* Bagian kiri: Hi, Nanda ... */}
          <div className="flex-1 flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
              Hi, Nanda <span className="text-2xl">👋</span>
            </h1>
            <p className="text-gray-500 mt-1 text-base sm:text-lg">
              Selamat datang kembali! Semangat mencari peluang baru 🚀
            </p>
          </div>
          {/* Bagian tengah: Vector Image */}
          <div className="hidden md:flex flex-shrink-0 items-start justify-center w-[200px] lg:w-[320px] xl:w-[400px] drop-shadow-2xl">
            <Image
              src="/vector-dashboard.png"
              alt="Dashboard Vector"
              width={200}
              height={400}
              style={{ objectFit: "contain", width: "100%", height: "auto" }}
              priority
            />
          </div>
          {/* Statistik */}
          <div className="flex flex-wrap items-center bg-white rounded-lg shadow px-4 sm:px-6 py-3 gap-4 sm:gap-6 min-w-[220px] sm:min-w-[320px] w-full md:w-auto">
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
            </>
          </div>
        </div>

        {/* Rekomendasi Lowongan */}
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full max-w-full">
          <div className="flex items-center mb-4">
            <FaFire className="text-orange-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              Rekomendasi Lowongan untuk Kamu
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-full">
            {rekomendasiLowongan.map((lowongan, idx) => (
              <LowonganCard key={lowongan._id || idx} lowongan={lowongan} />
            ))}
          </div>
        </div>

        {/* Media: Video & Podcast */}
        <div className="w-full max-w-full">
          {/* Kata-kata menarik di atas container pelatihan & podcast */}
          <div
            className="w-full max-w-full mb-6 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-center text-center"
            style={{
              background: "linear-gradient(90deg, #2563eb 0%, #f43f5e 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.05rem",
              letterSpacing: "0.01em",
              boxShadow: "0 4px 24px 0 rgba(36, 37, 47, 0.08)",
            }}
          >
            <span className="flex items-center gap-2 justify-center">
              <FaVideo className="text-white drop-shadow" size={22} />
              <span>
                Tingkatkan skill dan wawasanmu lewat pelatihan & podcast inspiratif! 🚀
              </span>
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-full">
            {/* Sidebar */}
            <div className="w-full md:w-56 border-r border-gray-100 p-3 sm:p-5 flex flex-row md:flex-col gap-2 sm:gap-4 bg-gray-50 md:bg-gray-50 md:gap-4 md:border-r max-w-full">
              <button
                className={`flex items-center gap-2 w-full px-3 py-2 rounded font-semibold text-left transition ${
                  sidebarTab === "video"
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setSidebarTab("video")}
              >
                <FaVideo className="text-pink-400" />
                Pelatihan
              </button>
              <button
                className={`flex items-center gap-2 w-full px-3 py-2 rounded font-semibold text-left transition ${
                  sidebarTab === "podcast"
                    ? "bg-yellow-100 text-yellow-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setSidebarTab("podcast")}
              >
                <FaPodcast className="text-yellow-400" />
                Podcast Inspiratif
              </button>
            </div>
            {/* Konten kanan */}
            <div className="flex-1 p-2 sm:p-4 max-w-full flex flex-col items-start justify-center min-h-[220px] sm:min-h-[320px] bg-white rounded-lg shadow w-full sm:w-10">
              <div className="w-full max-w-full">
                <MediaHorizontalScroll
                  items={isVideo ? videoList : podcastList}
                  isVideo={isVideo}
                />
              </div>
            </div>
          </div>
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
