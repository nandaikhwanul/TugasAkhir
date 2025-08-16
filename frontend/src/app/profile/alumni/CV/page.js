"use client";
import React, { useRef, useState, useEffect } from "react";
import { HiOutlineCloudArrowUp } from "react-icons/hi2";
import { HiOutlineTrash } from "react-icons/hi";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

const API_BASE_URL = "https://tugasakhir-production-6c6c.up.railway.app/";

export default function UploadCV() {
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [loadingCv, setLoadingCv] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const commonCardStyles = "bg-white rounded-lg shadow-md p-8 h-full";

  useEffect(() => {
    const fetchCV = async () => {
      setLoadingCv(true);
      const token = getTokenFromSessionStorage();
      if (!token) {
        setLoadingCv(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/cv/", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setCvData(null);
        } else {
          const data = await res.json();
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

  // Upload CV (image) immediately after file is selected/dropped
  const uploadCV = async (file) => {
    if (!file) return;
    const token = getTokenFromSessionStorage();
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Gagal mengupload CV.");
      }
      const data = await res.json();
      if (data.cv && data.cv.fileUrl) {
        setCvData(data.cv);
      } else {
        setCvData(null);
      }
      alert("CV berhasil diupload!");
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat upload CV.");
    } finally {
      setUploading(false);
    }
  };

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
      if (droppedFile.type.startsWith("image/")) {
        uploadCV(droppedFile);
      } else {
        alert("Hanya file gambar (JPG, PNG, dsb) yang diperbolehkan.");
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith("image/")) {
        uploadCV(selectedFile);
      } else {
        alert("Hanya file gambar (JPG, PNG, dsb) yang diperbolehkan.");
      }
    }
  };

  const handleClick = () => {
    if (!uploading) inputRef.current.click();
  };

  const handleDeleteCV = async () => {
    if (!window.confirm("Yakin ingin menghapus CV?")) return;
    const token = getTokenFromSessionStorage();
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/cv/", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
      <div className={commonCardStyles}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-gray-500 text-lg">Memuat CV...</div>
        </div>
      </div>
    );
  }

  // Jika CV ada, tampilkan info dan tombol hapus
  if (cvData && cvData.fileUrl) {
    let fileUrl = cvData.fileUrl.replace(/\\/g, "/");
    if (!/^https?:\/\//.test(fileUrl)) {
      fileUrl = API_BASE_URL + fileUrl;
    }
    return (
      <div className={commonCardStyles}>
        <h4 className="text-xl text-black font-bold mb-4">Curriculum Vitae</h4>
        <div className="flex flex-col items-center justify-center">
          <div className="relative group w-full max-h-[500px] overflow-hidden rounded-lg shadow-lg border border-gray-200 bg-white flex items-center justify-center">
            <img
              src={fileUrl}
              alt="CV"
              className="w-auto max-h-[500px] object-contain"
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
            CV kamu sudah terupload{cvData.fileName ? <>: <span className="font-semibold">{cvData.fileName}</span></> : null}.
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Untuk mengganti, hapus CV terlebih dahulu.
          </div>
        </div>
      </div>
    );
  }

  // Jika tidak ada CV, tampilkan area upload (langsung upload tanpa tombol/pratinjau)
  return (
    <div className={commonCardStyles}>
      <h4 className="text-xl text-black font-bold mb-4">Upload CV</h4>
      <div className="flex flex-col items-center justify-center h-full">
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-6 py-12 transition-colors cursor-pointer ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-400 bg-white"
          }`}
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{ width: "100%" }}
        >
          <HiOutlineCloudArrowUp className="h-14 w-14 text-blue-500 mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            Drag & drop file CV (gambar) di sini
          </p>
          <p className="text-gray-500 text-sm mb-2">atau klik untuk memilih file</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
            disabled={uploading}
          />
          {uploading && (
            <div className="mt-4 text-blue-600 font-semibold">Uploading...</div>
          )}
        </div>
      </div>
    </div>
  );
}