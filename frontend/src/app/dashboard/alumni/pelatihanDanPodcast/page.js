"use client";
import { useState, useRef, useEffect } from "react";
import {
  FaVideo,
  FaPodcast,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { getTokenFromSessionStorage } from "@/app/sessiontoken";

// Fungsi untuk mengubah URL video/podcast menjadi embed (khusus YouTube, Vimeo, Spotify, dst)
function getEmbedUrl(url) {
  if (!url) return "";
  // YouTube: https://www.youtube.com/watch?v=xxxx atau https://youtu.be/xxxx
  if (url.match(/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/)) {
    const id = url.split("v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.match(/^https?:\/\/youtu\.be\//)) {
    const id = url.split("youtu.be/")[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  // YouTube Shorts
  if (url.match(/^https?:\/\/(www\.)?youtube\.com\/shorts\//)) {
    const id = url.split("/shorts/")[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  // Vimeo: https://vimeo.com/xxxx
  if (url.match(/^https?:\/\/(www\.)?vimeo\.com\//)) {
    const id = url.split("vimeo.com/")[1].split(/[?&]/)[0];
    return `https://player.vimeo.com/video/${id}`;
  }
  // Spotify Podcast: https://open.spotify.com/episode/xxxx atau https://open.spotify.com/show/xxxx
  if (url.match(/^https?:\/\/open\.spotify\.com\/(episode|show)\//)) {
    // Spotify embed: https://open.spotify.com/embed/episode/xxxx
    return url.replace(
      /^https:\/\/open\.spotify\.com\/(episode|show)\//,
      "https://open.spotify.com/embed/$1/"
    );
  }
  // Google Podcast: https://podcasts.google.com/feed/xxxx/episode/xxxx
  if (url.match(/^https?:\/\/podcasts\.google\.com\//)) {
    // Google Podcasts embed is not officially supported, fallback to link
    return url;
  }
  // Anchor.fm: https://anchor.fm/xxxx/episodes/xxxx
  if (url.match(/^https?:\/\/anchor\.fm\/.+\/episodes\//)) {
    // Try to convert to embed
    // Example: https://anchor.fm/xxxx/episodes/xxxx -> https://anchor.fm/xxxx/embed/episodes/xxxx
    return url.replace("/episodes/", "/embed/episodes/");
  }
  // Sudah embed atau bukan YouTube/Vimeo/Spotify/Anchor
  return url;
}

// Komponen horizontal scroll untuk media dengan tombol panah dan tombol View All
function MediaHorizontalScroll({ items, isVideo, loading }) {
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
      {loading ? (
        <div className="flex justify-center items-center py-12 text-gray-400">Memuat data...</div>
      ) : !items.length ? (
        <div className="flex justify-center items-center py-12 text-gray-400">Tidak ada data ditemukan.</div>
      ) : !showAll ? (
        <>
          <div className="w-full min-w-0">
            <div
              className="flex gap-4 pb-2 w-full min-w-0 overflow-x-auto hide-scrollbar"
              style={{ minHeight: 220 }}
              ref={scrollRef}
            >
              {items.map((item, idx) => (
                <div
                  key={item._id || item.contentUrl || idx}
                  className="min-w-[80vw] xs:min-w-[260px] sm:min-w-[320px] max-w-[95vw] sm:max-w-xs bg-gray-50 border border-gray-200 rounded-lg shadow hover:shadow-lg transition flex flex-col flex-shrink-0"
                  style={{
                    width: "100%",
                  }}
                >
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                    <iframe
                      src={getEmbedUrl(item.contentUrl)}
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
                    <div className="text-gray-500 text-sm flex-1">{item.deskripsi || "-"}</div>
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
          {items.map((item, idx) => (
            <div
              key={item._id || item.contentUrl || idx}
              className="bg-gray-50 border border-gray-200 rounded-lg shadow hover:shadow-lg transition flex flex-col"
            >
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                <iframe
                  src={getEmbedUrl(item.contentUrl)}
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
                <div className="text-gray-500 text-sm flex-1">{item.deskripsi || "-"}</div>
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

  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data dari endpoint (GET method)
  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      try {
        const token = getTokenFromSessionStorage();
        const res = await fetch(
          "https://tugasakhir-production-6c6c.up.railway.app/pelatihandanpodcast",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal memuat data pelatihan dan podcast");
        const data = await res.json();
        // Perbaikan: ambil data dari data.data, bukan langsung dari data
        if (!ignore) setMediaData(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        if (!ignore) setMediaData([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, []);

  // Filter data sesuai tab
  const videoList = mediaData.filter(
    (item) => item.contentType === "training_video"
  );
  const podcastList = mediaData.filter(
    (item) => item.contentType === "podcast"
  );

  return (
    <div className="h-auto bg-gray-100 py-4 px-0 w-full min-w-0">
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
                  loading={loading}
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
