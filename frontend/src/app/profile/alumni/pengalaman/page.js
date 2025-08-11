"use client";

import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";

// Helper to get token from cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// Format date to "MMM YYYY"
function formatMonthYear(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default function PengalamanCard() {
  // Pengalaman (Experience) state
  const [pengalaman, setPengalaman] = useState([]);
  const [loadingPengalaman, setLoadingPengalaman] = useState(true);
  const [showAddPengalaman, setShowAddPengalaman] = useState(false);
  const [pengalamanForm, setPengalamanForm] = useState({
    jenis: "kerja",
    nama: "",
    posisi: "",
    lokasi: "",
    deskripsi: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    masih_berjalan: false,
  });
  const [pengalamanError, setPengalamanError] = useState("");
  const [pengalamanSaving, setPengalamanSaving] = useState(false);

  // Fetch pengalaman (experience) from API
  useEffect(() => {
    async function fetchPengalaman() {
      setLoadingPengalaman(true);
      const token = getTokenFromCookie();
      if (!token) {
        setPengalaman([]);
        setLoadingPengalaman(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pengalaman/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil pengalaman");
        const data = await res.json();
        setPengalaman(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setPengalaman([]);
      }
      setLoadingPengalaman(false);
    }
    fetchPengalaman();
  }, []);

  // Handle pengalaman form change
  const handlePengalamanFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPengalamanForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // If masih_berjalan checked, clear tanggal_selesai
    if (name === "masih_berjalan" && checked) {
      setPengalamanForm((prev) => ({
        ...prev,
        tanggal_selesai: "",
      }));
    }
  };

  // Handle add pengalaman submit
  const handlePengalamanSubmit = async (e) => {
    e.preventDefault();
    setPengalamanError("");
    setPengalamanSaving(true);

    // Validation
    if (
      !pengalamanForm.jenis ||
      !pengalamanForm.nama ||
      !pengalamanForm.posisi ||
      !pengalamanForm.lokasi ||
      !pengalamanForm.tanggal_mulai
    ) {
      setPengalamanError("Semua field wajib diisi (kecuali tanggal selesai jika masih berjalan).");
      setPengalamanSaving(false);
      return;
    }
    if (!pengalamanForm.masuk_berjalan && !pengalamanForm.tanggal_selesai && !pengalamanForm.masih_berjalan) {
      // tanggal_selesai boleh kosong jika masih_berjalan true
      setPengalamanError("Tanggal selesai wajib diisi jika tidak masih berjalan.");
      setPengalamanSaving(false);
      return;
    }

    const token = getTokenFromCookie();
    if (!token) {
      setPengalamanError("Token tidak ditemukan.");
      setPengalamanSaving(false);
      return;
    }

    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pengalaman", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...pengalamanForm,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menambah pengalaman.");
      }
      // Success, refetch pengalaman
      setShowAddPengalaman(false);
      setPengalamanForm({
        jenis: "kerja",
        nama: "",
        posisi: "",
        lokasi: "",
        deskripsi: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        masih_berjalan: false,
      });
      // Refetch pengalaman
      setLoadingPengalaman(true);
      const pengalamanRes = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pengalaman/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (pengalamanRes.ok) {
        const data = await pengalamanRes.json();
        setPengalaman(Array.isArray(data.data) ? data.data : []);
      }
      setLoadingPengalaman(false);
    } catch (err) {
      setPengalamanError(err.message || "Gagal menambah pengalaman.");
      setPengalamanSaving(false);
    }
  };

  // Helper: break word utility for long text
  const breakWordClass = "break-words whitespace-pre-line";

  return (
    <div
      className="flex-1 bg-white rounded-lg shadow-xl mt-4 p-8 group relative"
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
        {/* Add pengalaman button */}
        <button
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white hover:text-white transition"
          title="Tambah Pengalaman"
          tabIndex={-1}
          type="button"
          onClick={() => setShowAddPengalaman((v) => !v)}
          disabled={pengalamanSaving}
        >
          <FaPlus className="h-4 w-4" />
        </button>
      </div>
      <h4 className="text-xl text-black font-bold">Pengalaman</h4>
      {/* Add pengalaman form */}
      {showAddPengalaman && (
        <form className="mt-4 mb-4 text-black space-y-3" onSubmit={handlePengalamanSubmit} autoComplete="off">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-bold w-32" htmlFor="jenis">Jenis:</label>
            <select
              className="flex-1 border rounded px-2 py-1"
              id="jenis"
              name="jenis"
              value={pengalamanForm.jenis}
              onChange={handlePengalamanFormChange}
              required
            >
              <option value="kerja">Kerja</option>
              <option value="magang">Magang</option>
              <option value="organisasi">Organisasi</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-bold w-32" htmlFor="nama">Nama Instansi:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="nama"
              name="nama"
              value={pengalamanForm.nama}
              onChange={handlePengalamanFormChange}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-bold w-32" htmlFor="posisi">Posisi:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="posisi"
              name="posisi"
              value={pengalamanForm.posisi}
              onChange={handlePengalamanFormChange}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-bold w-32" htmlFor="lokasi">Lokasi:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="lokasi"
              name="lokasi"
              value={pengalamanForm.lokasi}
              onChange={handlePengalamanFormChange}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-bold w-32" htmlFor="tanggal_mulai">Tanggal Mulai:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="tanggal_mulai"
              name="tanggal_mulai"
              type="date"
              value={pengalamanForm.tanggal_mulai}
              onChange={handlePengalamanFormChange}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="font-bold w-32" htmlFor="tanggal_selesai">Tanggal Selesai:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="tanggal_selesai"
              name="tanggal_selesai"
              type="date"
              value={pengalamanForm.tanggal_selesai}
              onChange={handlePengalamanFormChange}
              disabled={pengalamanForm.masih_berjalan}
            />
            <label className="flex items-center ml-2">
              <input
                type="checkbox"
                name="masih_berjalan"
                checked={pengalamanForm.masih_berjalan}
                onChange={handlePengalamanFormChange}
                className="mr-1"
              />
              Masih berjalan
            </label>
          </div>
          <div className="flex flex-col md:flex-row md:items-start gap-2">
            <label className="font-bold w-32" htmlFor="deskripsi">Deskripsi:</label>
            <textarea
              className={`flex-1 border rounded px-2 py-1 ${breakWordClass}`}
              id="deskripsi"
              name="deskripsi"
              value={pengalamanForm.deskripsi}
              onChange={handlePengalamanFormChange}
              rows={2}
            />
          </div>
          {pengalamanError && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">{pengalamanError}</div>
          )}
          <div className="flex items-center space-x-2 mt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              disabled={pengalamanSaving}
            >
              {pengalamanSaving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
              onClick={() => {
                setShowAddPengalaman(false);
                setPengalamanError("");
                setPengalamanForm({
                  jenis: "kerja",
                  nama: "",
                  posisi: "",
                  lokasi: "",
                  deskripsi: "",
                  tanggal_mulai: "",
                  tanggal_selesai: "",
                  masih_berjalan: false,
                });
              }}
              disabled={pengalamanSaving}
            >
              Batal
            </button>
          </div>
        </form>
      )}
      <div className="relative px-4 mt-4">
        <div className="absolute h-full border border-dashed border-opacity-20 border-secondary"></div>
        {/* Pengalaman items */}
        {loadingPengalaman ? (
          <div className="text-gray-500">Memuat pengalaman...</div>
        ) : pengalaman.length === 0 ? (
          <div className="text-gray-500">Belum ada pengalaman.</div>
        ) : (
          pengalaman.map((item, idx) => (
            <div className="flex items-start w-full my-6 -ml-1.5" key={item._id || idx}>
              <div className="w-1/12 z-10 pt-2">
                <div className="w-3.5 h-3.5 bg-blue-600 rounded-full"></div>
              </div>
              <div className="w-11/12">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-black text-base">{item.posisi}</span>
                  <span className="text-black text-sm">di</span>
                  <span className="text-black text-base">{item.nama}</span>
                  {item.jenis && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{item.jenis}</span>
                  )}
                </div>
                <div className="text-black text-sm">
                  {item.lokasi}
                </div>
                <div className="text-black text-sm">
                  {formatMonthYear(item.tanggal_mulai)} -{" "}
                  {item.masih_berjalan
                    ? "Sekarang"
                    : item.tanggal_selesai
                    ? formatMonthYear(item.tanggal_selesai)
                    : "-"}
                </div>
                {item.deskripsi && (
                  <div className={`text-black text-sm mt-1 ${breakWordClass}`}>{item.deskripsi}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
