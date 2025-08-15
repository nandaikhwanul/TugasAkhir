"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

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

// Komponen utama yang fetch dan tampilkan CV
function LihatCVAlumniInner() {
  const searchParams = useSearchParams();
  const alumniId = searchParams.get("id");
  const [cvData, setCvData] = useState(null); // { fileUrl, fileName, ... }
  const [loadingCv, setLoadingCv] = useState(true);

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
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-full max-w-2xl aspect-[1/1.414] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white">
        <embed
          src={fileUrl}
          type="application/pdf"
          className="w-full h-[70vh] min-h-[400px] object-contain"
        />
      </div>
      <div className="mt-4 text-gray-700 text-sm">
        CV Alumni{cvData.fileName ? <>: <span className="font-semibold">{cvData.fileName}</span></> : null}
      </div>
    </div>
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
