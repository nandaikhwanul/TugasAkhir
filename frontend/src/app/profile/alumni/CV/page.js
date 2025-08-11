"use client";
import React, { useRef, useState, useEffect } from "react";
import { HiOutlineCloudArrowUp } from "react-icons/hi2";
import { HiOutlineDocumentArrowUp } from "react-icons/hi2";
import { HiOutlineTrash } from "react-icons/hi";

// Helper: get token from cookie (client-side)
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// Helper: get base API URL (for file serving)
const API_BASE_URL = "https://tugasakhir-production-6c6c.up.railway.app/";

export default function UploadCV() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState(null); // { fileUrl, fileName, ... }
  const [loadingCv, setLoadingCv] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  // Fetch CV on mount
  useEffect(() => {
    const fetchCV = async () => {
      setLoadingCv(true);
      const token = getTokenFromCookie();
      if (!token) {
        setLoadingCv(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/cv/", {
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
    };
    fetchCV();
  }, []);

  // Drag and drop handlers (for upload form)
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Hanya file PDF yang diperbolehkan.");
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        alert("Hanya file PDF yang diperbolehkan.");
      }
    }
  };

  const handleClick = () => {
    inputRef.current.click();
  };

  const handleRemove = () => {
    setFile(null);
  };

  // Upload CV
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Silakan pilih file CV (PDF) terlebih dahulu.");
      return;
    }
    const token = getTokenFromCookie();
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/cv/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type' sengaja tidak di-set agar browser mengatur boundary multipart
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Gagal mengupload CV.");
      }

      // After upload, fetch the new CV data
      const data = await res.json();
      if (data.cv && data.cv.fileUrl) {
        setCvData(data.cv);
      } else {
        setCvData(null);
      }
      setFile(null);
      alert("CV berhasil diupload!");
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat upload CV.");
    } finally {
      setUploading(false);
    }
  };

  // Delete CV
  const handleDeleteCV = async () => {
    if (!window.confirm("Yakin ingin menghapus CV?")) return;
    const token = getTokenFromCookie();
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/cv/", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Gagal menghapus CV.");
      }
      setCvData(null);
      alert("CV berhasil dihapus.");
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat menghapus CV.");
    } finally {
      setDeleting(false);
    }
  };

  // Show loading state
  if (loadingCv) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">Memuat CV...</div>
      </div>
    );
  }

  // If CV exists, show embed and delete button
  if (cvData && cvData.fileUrl) {
    // fileUrl could be "uploads\\cv\\xxx.pdf" or "uploads/cv/xxx.pdf"
    // Convert to URL for embed
    let fileUrl = cvData.fileUrl.replace(/\\/g, "/");
    if (!/^https?:\/\//.test(fileUrl)) {
      fileUrl = API_BASE_URL + fileUrl;
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative group w-full max-w-2xl aspect-[1/1.414] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white">
          <embed
            src={fileUrl}
            type="application/pdf"
            className="w-full h-[70vh] min-h-[400px] object-contain"
          />
          <button
            type="button"
            onClick={handleDeleteCV}
            disabled={deleting}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-red-100 text-red-600 rounded-full p-2 shadow-md border border-gray-200"
            title="Hapus CV"
          >
            <HiOutlineTrash className="w-6 h-6" />
          </button>
          {deleting && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <span className="text-gray-700 font-semibold">Menghapus...</span>
            </div>
          )}
        </div>
        <div className="mt-4 text-gray-700 text-sm">
          CV kamu sudah terupload{cvData.fileName ? <>: <span className="font-semibold">{cvData.fileName}</span></> : null}. Jika ingin mengganti, hapus CV terlebih dahulu.
        </div>
      </div>
    );
  }

  // If no CV, show upload form
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <form
        className="w-full max-w-md"
        onDragEnter={handleDrag}
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-6 py-12 transition-colors cursor-pointer ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-400 bg-white"
          }`}
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <HiOutlineCloudArrowUp className="h-14 w-14 text-blue-500 mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            {file
              ? "File CV terpilih:"
              : "Drag & drop file CV (PDF) di sini"}
          </p>
          <p className="text-gray-500 text-sm mb-2">
            atau klik untuk memilih file
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleChange}
          />
          {file && (
            <div className="flex flex-col items-center mt-2">
              <div className="flex items-center space-x-2">
                <HiOutlineDocumentArrowUp className="w-6 h-6 text-red-500" />
                <span className="text-gray-800 font-semibold">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="ml-2 text-xs text-red-500 hover:underline flex items-center"
                  disabled={uploading}
                >
                  <HiOutlineTrash className="inline w-4 h-4 mr-1" />
                  Hapus
                </button>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </span>
            </div>
          )}
        </div>
        <button
          type="submit"
          className={`mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors ${
            uploading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload CV"}
        </button>
      </form>
    </div>
  );
}
