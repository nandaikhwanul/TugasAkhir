"use client";

import React, { useRef, useState } from "react";
import AdminNavbar from "@/app/navbar/adminNavbar/page";
import {
  FaUserPlus,
  FaFileExcel,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { getTokenFromSessionStorage } from "../../sessiontoken";

export default function TambahAlumniPage() {
  const [nim, setNim] = useState("");
  const [file, setFile] = useState(null);

  const [loadingNim, setLoadingNim] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const [successNim, setSuccessNim] = useState("");
  const [errorNim, setErrorNim] = useState("");

  const [successFile, setSuccessFile] = useState("");
  const [errorFile, setErrorFile] = useState("");

  // Ref for file input
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setNim(e.target.value);
    setErrorNim("");
    setSuccessNim("");
  };

  // XLS handler: langsung upload ke DB saat file dipilih
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setErrorFile("");
    setSuccessFile("");
    if (!selectedFile) return;

    setLoadingFile(true);
    const token = getTokenFromSessionStorage();
    if (!token) {
      setErrorFile("Token tidak ditemukan. Silakan login ulang.");
      setLoadingFile(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/tambah-alumni/tambah-nim-xls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal import file.");
      }
      setSuccessFile("Berhasil import file: " + selectedFile.name);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setErrorFile(err.message || "Gagal import file.");
    }
    setLoadingFile(false);
  };

  const handleFileButtonClick = (e) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmitNim = async (e) => {
    e.preventDefault();
    setErrorNim("");
    setSuccessNim("");
    if (!nim) {
      setErrorNim("Masukkan NIM alumni terlebih dahulu.");
      return;
    }
    setLoadingNim(true);
    const token = getTokenFromSessionStorage();
    if (!token) {
      setErrorNim("Token tidak ditemukan. Silakan login ulang.");
      setLoadingNim(false);
      return;
    }
    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/tambah-alumni/tambah-nim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nim }),
      });
      if (!res.ok) {
        // Ambil pesan error spesifik dari backend jika NIM sudah ada
        let errMsg = "Gagal menambah alumni.Nim sudah didaftarkan!";
        try {
          const errData = await res.json();
          if (errData && errData.message) {
            errMsg = errData.message;
          }
        } catch {
          // ignore JSON parse error, pakai default
        }
        setErrorNim(errMsg);
        setLoadingNim(false);
        return;
      }
      setSuccessNim("Berhasil menambah alumni dengan NIM: " + nim);
      setNim("");
    } catch (err) {
      setErrorNim(err.message || "Gagal menambah alumni.");
    }
    setLoadingNim(false);
  };

  // XLS BUTTON DITARUH DI LUAR CONTAINER
  return (
    <div className="flex h-auto bg-gradient-to-br from-blue-50 via-slate-50 to-green-50">
      <AdminNavbar />

      {/* XLS BUTTON OUTSIDE MAIN CONTAINER */}
      <div className="fixed top-8 right-8 z-40">
        <button
          type="button"
          onClick={handleFileButtonClick}
          disabled={loadingFile}
          className={`flex flex-col items-center justify-center border-2 border-green-300 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-lg ${
            loadingFile ? "opacity-60 cursor-not-allowed" : ""
          }`}
          style={{ minWidth: 90, minHeight: 90 }}
        >
          <FaFileExcel className="text-4xl text-green-600 mb-2" />
          <span className="text-xs font-semibold text-green-700">Pilih File XLS/XLSX</span>
        </button>
        <input
          type="file"
          id="file"
          name="file"
          accept=".xls,.xlsx"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={loadingFile}
        />
        <div className="mt-2 min-h-[24px]">
          {loadingFile && (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <FaSpinner className="animate-spin" /> Mengupload...
            </div>
          )}
          {errorFile && (
            <div className="flex items-center gap-2 bg-red-100/80 text-red-700 px-3 py-2 rounded text-xs border border-red-200 animate-shake">
              <FaExclamationTriangle className="text-red-400" /> {errorFile}
            </div>
          )}
          {successFile && (
            <div className="flex items-center gap-2 bg-green-100/80 text-green-800 px-3 py-2 rounded text-xs border border-green-200 animate-fade-in">
              <FaCheckCircle className="text-green-500" /> {successFile}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <FaFileExcel className="text-green-400" /> Format: <span className="font-semibold">.xls</span> / <span className="font-semibold">.xlsx</span>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-16 bg-white/90 p-8 rounded-2xl shadow-2xl flex-1 border border-blue-100 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-blue-100 text-blue-700 rounded-full p-3 shadow-sm animate-bounce-slow">
            <FaUserPlus className="text-2xl" />
          </span>
          <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-sm">
            Tambah Alumni
          </h2>
        </div>
        {/* Form untuk tambah satu alumni (NIM) */}
        <form
          onSubmit={handleSubmitNim}
          className="space-y-4 mb-10 bg-gradient-to-r from-blue-50/80 to-green-50/80 p-6 rounded-xl shadow transition-all duration-300 hover:shadow-lg"
        >
          <div>
            <label
              htmlFor="nim"
              className="block text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2"
            >
              <FaUserPlus className="text-blue-400" />
              Tambah Satu Alumni (NIM)
            </label>
            <input
              type="text"
              id="nim"
              name="nim"
              value={nim}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white/80 transition-all duration-200 text-black"
              placeholder="Masukkan NIM alumni"
              disabled={loadingNim}
            />
          </div>
          {errorNim && (
            <div className="flex items-center gap-2 bg-red-100/80 text-red-700 px-3 py-2 rounded text-sm mb-2 border border-red-200 animate-shake">
              <FaExclamationTriangle className="text-red-400" /> {errorNim}
            </div>
          )}
          {successNim && (
            <div className="flex items-center gap-2 bg-green-100/80 text-green-800 px-3 py-2 rounded text-sm mb-2 border border-green-200 animate-fade-in">
              <FaCheckCircle className="text-green-500" /> {successNim}
            </div>
          )}
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg shadow font-semibold transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-300 ${
              loadingNim ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={loadingNim}
          >
            {loadingNim ? (
              <>
                <FaSpinner className="animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <FaUserPlus /> Tambah Alumni
              </>
            )}
          </button>
        </form>
        {/* XLS BUTTON DAN STATUS SUDAH DIPINDAH KE ATAS, TIDAK ADA FORM XLS DI SINI */}
      </div>
    </div>
  );
}
