"use client";
import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getTokenFromSessionStorage } from "../../../sessiontoken";
import { HiOutlineXMark, HiOutlinePlus, HiOutlineMinus, HiOutlineArrowPath } from "react-icons/hi2";

// Helper: get base API URL (for file serving)
const API_BASE_URL = "https://tugasakhir-production-6c6c.up.railway.app";

// Helper: get CV file URL from file path (handles local/remote, slashes, etc)
function getCVFileUrl(filePath) {
  if (!filePath) return "";
  let normalized = filePath.replace(/\\/g, "/");
  // If already absolute URL, return as is
  if (/^https?:\/\//.test(normalized)) return normalized;
  // If path starts with /uploads/, use base url + path
  if (normalized.startsWith("/uploads/")) {
    return `${API_BASE_URL}${normalized}`;
  }
  // If path starts with uploads/, add slash and base url
  if (normalized.startsWith("uploads/")) {
    return `${API_BASE_URL}/${normalized}`;
  }
  // If path starts with /, treat as relative to base
  if (normalized.startsWith("/")) {
    return `${API_BASE_URL}${normalized}`;
  }
  // Otherwise, assume it's a file in uploads/cv/
  return `${API_BASE_URL}/uploads/cv/${normalized}`;
}

// Komponen utama yang fetch dan tampilkan CV (sebagai gambar)
function LihatCVAlumniInner() {
  const searchParams = useSearchParams();
  const alumniId = searchParams.get("id");
  const [cvData, setCvData] = useState(null); // { fileUrl, fileName, ... }
  const [loadingCv, setLoadingCv] = useState(true);
  
  // State untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State dan Ref untuk zoom dan pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef(null);

  useEffect(() => {
    async function fetchCV() {
      setLoadingCv(true);
      const token = getTokenFromSessionStorage();
      if (!token || !alumniId) {
        setLoadingCv(false);
        setCvData(null);
        return;
      }
      try {
        // GET /cv/alumni/:id
        const res = await fetch(`${API_BASE_URL}/cv/alumni/${alumniId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setCvData(null);
        } else {
          const data = await res.json();
          // API returns { message, cv: { fileUrl, fileName, ... } }
          if (data.cv && data.cv.fileUrl) {
            setCvData(data.cv);
          } else {
            setCvData(null);
          }
        }
      } catch (err) {
        setCvData(null);
      } finally {
        setLoadingCv(false);
      }
    }
    fetchCV();
  }, [alumniId]);

  // Fungsi untuk membuka/menutup modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset zoom dan pan saat modal ditutup
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  // Fungsi untuk mengelola zoom
  const handleZoom = (direction) => {
    setZoom((prevZoom) => {
      const newZoom = direction === "in" ? prevZoom * 1.2 : prevZoom / 1.2;
      return Math.min(Math.max(newZoom, 0.5), 3); // Batasi zoom dari 0.5x hingga 3x
    });
  };

  // Fungsi untuk mengelola pan (drag)
  const handlePanStart = (e) => {
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
    panRef.current = {
      x: pan.x,
      y: pan.y
    };
  };

  const handlePanMove = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({
      x: panRef.current.x + dx,
      y: panRef.current.y + dy,
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };
  
  // Reset zoom dan pan
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  // Efek untuk mengelola event mouse global saat pan
  useEffect(() => {
    if (isPanning) {
      window.addEventListener("mousemove", handlePanMove);
      window.addEventListener("mouseup", handlePanEnd);
    } else {
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanEnd);
    };
  }, [isPanning]);


  if (loadingCv) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">Memuat CV...</div>
      </div>
    );
  }

  if (!cvData || !cvData.fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">CV belum tersedia.</div>
      </div>
    );
  }

  // Use helper to get the correct file URL
  const fileUrl = getCVFileUrl(cvData.fileUrl);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-2">
        {/* CV Card dengan header di dalamnya */}
        <div className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white flex flex-col items-center justify-center min-h-[400px]">
          {/* Header yang menarik */}
          <div className="w-full">
            <div className="bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600 rounded-t-xl px-8 py-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute left-0 top-0 w-24 h-24 bg-blue-300 opacity-20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-sky-200 opacity-20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3"></div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow mb-2 tracking-tight text-center">
                Curriculum Vitae Alumni
              </h1>
              <p className="text-white/90 text-base md:text-lg font-medium text-center">
                Lihat dokumen CV alumni yang telah diunggah.
              </p>
            </div>
          </div>
          {/* Gambar CV yang bisa diklik */}
          <div className="w-full flex items-center justify-center py-6 px-4">
            <img
              src={fileUrl}
              alt="CV Alumni"
              className="w-auto max-h-[60vh] object-contain mx-auto cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              onClick={openModal}
            />
          </div>
        </div>
        <div className="mt-4 text-gray-700 text-sm">
          CV Alumni{cvData.fileName ? <>: <span className="font-semibold">{cvData.fileName}</span></> : null}
        </div>
      </div>

      {/* MODAL UNTUK TAMPILAN FULLSCREEN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full h-full max-w-7xl max-h-screen">
            {/* Tombol Close */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-800/60 hover:bg-gray-800/80 text-white rounded-full transition-colors"
              aria-label="Tutup"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            {/* Tombol Kontrol Zoom dan Pan */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2 bg-gray-800/60 rounded-full p-2 backdrop-blur-sm">
              <button
                onClick={() => handleZoom("in")}
                className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
                title="Zoom In"
              >
                <HiOutlinePlus className="w-6 h-6" />
              </button>
              <button
                onClick={resetView}
                className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
                title="Reset View"
              >
                <HiOutlineArrowPath className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleZoom("out")}
                className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
                title="Zoom Out"
              >
                <HiOutlineMinus className="w-6 h-6" />
              </button>
            </div>
            
            {/* Container gambar yang bisa di-zoom dan di-pan */}
            <div
              className="w-full h-full overflow-hidden"
              onMouseDown={handlePanStart}
              onMouseUp={handlePanEnd}
              onMouseLeave={handlePanEnd}
              style={{ cursor: isPanning ? "grabbing" : "grab" }}
            >
              <img
                ref={imageRef}
                src={fileUrl}
                alt="CV Alumni"
                className="w-full h-full object-contain mx-auto transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export default dibungkus Suspense
export default function LihatCVAlumni() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">Memuat CV...</div>
      </div>
    }>
      <LihatCVAlumniInner />
    </Suspense>
  );
}
