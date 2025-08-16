"use client";
import { useState, useRef } from "react";
import {
  FaVideo,
  FaPodcast,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

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
    url: "https://open.spotify.com/embed/episode/1B8Q2Q2Q2Q2Q2Q2Q2Q2Q?utm_source=generator",
    type: "podcast",
    desc: "Motivasi dan tips karir di era digital.",
  },
  {
    id: 3,
    title: "Soft Skill Penting di Dunia Kerja",
    url: "https://open.spotify.com/embed/episode/3B8Q2Q2Q2Q2Q2Q2Q2Q?utm_source=generator",
    type: "podcast",
    desc: "Soft skill yang wajib dimiliki.",
  },
  {
    id: 4,
    title: "Membangun Karir dari Nol",
    url: "https://open.spotify.com/embed/episode/4B8Q2Q2Q2Q2Q2Q2Q2Q?utm_source=generator",
    type: "podcast",
    desc: "Tips membangun karir dari awal.",
  },
];

// Komponen horizontal scroll untuk media dengan tombol panah dan tombol View All
function MediaHorizontalScroll({ items, isVideo }) {
  const scrollRef = useRef(null);
  const [showAll, setShowAll] = useState(false);

  // Scroll by 320px (card width + gap) per click
  const scrollByAmount = 320 + 16; // min-w-[320px] + gap

  const handleScroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -scrollByAmount : scrollByAmount,
        behavior: "smooth",
      });
    }
  };

  // Untuk video dan podcast, gunakan overflow-x-auto pada container scrollable, scrollbar hidden, dan bar judul
  const isPodcast = !isVideo;

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between flex-wrap">
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
          className="text-sm font-semibold px-3 py-1 rounded transition bg-gray-100 hover:bg-gray-200 text-blue-600 mt-2 sm:mt-0"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Kembali" : "View All"}
        </button>
      </div>
      {!showAll ? (
        <>
          <div className="w-full min-w-0">
            <div
              className="flex gap-4 pb-2 w-full min-w-0 overflow-x-auto hide-scrollbar"
              style={{ minHeight: 220 }}
              ref={scrollRef}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="min-w-[80vw] xs:min-w-[260px] sm:min-w-[320px] max-w-[95vw] sm:max-w-xs bg-gray-50 border border-gray-200 rounded-lg shadow hover:shadow-lg transition flex flex-col flex-shrink-0"
                  style={{
                    width: "100%",
                  }}
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
                  <div className="p-4 flex-1 flex flex-col min-w-0">
                    <div className="font-semibold text-gray-800 text-base mb-1 truncate">{item.title}</div>
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
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full min-w-0 mt-2">
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
              <div className="p-4 flex-1 flex flex-col min-w-0">
                <div className="font-semibold text-gray-800 text-base mb-1 truncate">{item.title}</div>
                <div className="text-gray-500 text-sm flex-1">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PelatihanDanPodcastPage() {
  // Dua tab: video atau podcast
  const [sidebarTab, setSidebarTab] = useState("video"); // "video" or "podcast"
  const isVideo = sidebarTab === "video";

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-0 w-full min-w-0">
      <div className="w-full min-w-0 mx-0 space-y-8 px-0">
        {/* Media: Video & Podcast */}
        <div className="w-full min-w-0">
          {/* Kata-kata menarik di atas container pelatihan & podcast */}
          <div
            className="w-full min-w-0 mb-6 px-2 xs:px-4 sm:px-6 py-3 xs:py-4 sm:py-5 flex items-center justify-center text-center"
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
                Temukan inspirasi dan upgrade skill-mu! <b>Tonton video pelatihan</b> atau <b>dengarkan podcast</b> pilihan kami, dan jadilah alumni yang siap bersaing di dunia kerja!
              </span>
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-2 xs:gap-4 w-full min-w-0">
            {/* Sidebar */}
            <div className="w-full md:w-56 border-r border-gray-100 p-2 xs:p-3 sm:p-5 flex flex-row md:flex-col gap-2 xs:gap-4 bg-gray-50 md:bg-gray-50 md:gap-4 md:border-r min-w-0">
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
            <div className="flex-1 p-1 xs:p-2 sm:p-4 min-w-0 flex flex-col items-start justify-center min-h-[180px] xs:min-h-[220px] sm:min-h-[320px] bg-white rounded-lg shadow w-full">
              <div className="w-full min-w-0">
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
