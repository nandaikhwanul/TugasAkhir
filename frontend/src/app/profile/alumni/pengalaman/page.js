"use client";

import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

function formatMonthYear(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default function PengalamanCard() {
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
  const [deletingId, setDeletingId] = useState(null);

  // Fetch pengalaman
  const fetchPengalaman = async () => {
    setLoadingPengalaman(true);
    const token = getTokenFromSessionStorage();
    if (!token) {
      setPengalaman([]);
      setLoadingPengalaman(false);
      return;
    }
    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pengalaman/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil pengalaman");
      const data = await res.json();
      setPengalaman(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setPengalaman([]);
    }
    setLoadingPengalaman(false);
  };

  useEffect(() => {
    fetchPengalaman();
    // eslint-disable-next-line
  }, []);

  const handlePengalamanFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPengalamanForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "masih_berjalan" && checked) {
      setPengalamanForm((prev) => ({ ...prev, tanggal_selesai: "" }));
    }
  };

  const handlePengalamanSubmit = async (e) => {
    e.preventDefault();
    setPengalamanError("");
    setPengalamanSaving(true);
    if (!pengalamanForm.jenis || !pengalamanForm.nama || !pengalamanForm.posisi || !pengalamanForm.lokasi || !pengalamanForm.tanggal_mulai) {
      setPengalamanError("Semua field wajib diisi (kecuali tanggal selesai jika masih berjalan).");
      setPengalamanSaving(false);
      return;
    }
    if (!pengalamanForm.masih_berjalan && !pengalamanForm.tanggal_selesai) {
      setPengalamanError("Tanggal selesai wajib diisi jika tidak masih berjalan.");
      setPengalamanSaving(false);
      return;
    }
    const token = getTokenFromSessionStorage();
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
        body: JSON.stringify({ ...pengalamanForm }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menambah pengalaman.");
      }
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
      await fetchPengalaman();
    } catch (err) {
      setPengalamanError(err.message || "Gagal menambah pengalaman.");
      setPengalamanSaving(false);
    }
    setPengalamanSaving(false);
  };

  // Handler untuk hapus pengalaman
  const handleDeletePengalaman = async (id) => {
    if (!window.confirm("Yakin ingin menghapus pengalaman ini?")) return;
    setDeletingId(id);
    setPengalamanError("");
    const token = getTokenFromSessionStorage();
    if (!token) {
      setPengalamanError("Token tidak ditemukan.");
      setDeletingId(null);
      return;
    }
    try {
      const res = await fetch(
        `https://tugasakhir-production-6c6c.up.railway.app/pengalaman/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus pengalaman.");
      }
      await fetchPengalaman();
    } catch (err) {
      setPengalamanError(err.message || "Gagal menghapus pengalaman.");
    }
    setDeletingId(null);
  };

  const breakWordClass = "break-words whitespace-pre-line";

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8 group relative h-full w-full max-w-3xl mx-auto">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
        <button
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white hover:text-white transition"
          title="Tambah Pengalaman"
          type="button"
          onClick={() => setShowAddPengalaman((v) => !v)}
          disabled={pengalamanSaving}
        >
          <FaPlus className="h-4 w-4" />
        </button>
      </div>
      <h4 className="text-lg sm:text-xl text-black font-bold">Pengalaman</h4>
      {showAddPengalaman && (
        <form className="mt-4 mb-4 text-black space-y-3" onSubmit={handlePengalamanSubmit} autoComplete="off">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="font-bold w-full sm:w-32" htmlFor="jenis">Jenis:</label>
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="font-bold w-full sm:w-32" htmlFor="nama">Nama Instansi:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="nama"
              name="nama"
              value={pengalamanForm.nama}
              onChange={handlePengalamanFormChange}
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="font-bold w-full sm:w-32" htmlFor="posisi">Posisi:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="posisi"
              name="posisi"
              value={pengalamanForm.posisi}
              onChange={handlePengalamanFormChange}
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="font-bold w-full sm:w-32" htmlFor="lokasi">Lokasi:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="lokasi"
              name="lokasi"
              value={pengalamanForm.lokasi}
              onChange={handlePengalamanFormChange}
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="font-bold w-full sm:w-32" htmlFor="tanggal_mulai">Tanggal Mulai:</label>
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="font-bold w-full sm:w-32" htmlFor="tanggal_selesai">Tanggal Selesai:</label>
            <input
              className="flex-1 border rounded px-2 py-1"
              id="tanggal_selesai"
              name="tanggal_selesai"
              type="date"
              value={pengalamanForm.tanggal_selesai}
              onChange={handlePengalamanFormChange}
              disabled={pengalamanForm.masih_berjalan}
            />
            <label className="flex items-center ml-0 sm:ml-2">
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
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            <label className="font-bold w-full sm:w-32" htmlFor="deskripsi">Deskripsi:</label>
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full sm:w-auto"
              disabled={pengalamanSaving}
            >
              {pengalamanSaving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm w-full sm:w-auto"
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
      <div className="relative px-0 sm:px-4 mt-4">
        <div className="absolute left-2 sm:left-4 h-full border border-dashed border-opacity-20 border-secondary"></div>
        {loadingPengalaman ? (
          <div className="text-gray-500">Memuat pengalaman...</div>
        ) : pengalaman.length === 0 ? (
          <div className="text-gray-500">Belum ada pengalaman.</div>
        ) : (
          pengalaman.map((item, idx) => (
            <div
              className="flex flex-row items-start w-full my-6 -ml-0 sm:-ml-1.5 group"
              key={item._id || idx}
            >
              <div className="w-6 sm:w-1/12 z-10 pt-2 flex-shrink-0 flex justify-center">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-blue-600 rounded-full"></div>
              </div>
              <div className="w-full sm:w-11/12 relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <span className="font-bold text-black text-base">{item.posisi}</span>
                  <span className="text-black text-sm hidden sm:inline">di</span>
                  <span className="text-black text-base">{item.nama}</span>
                  {item.jenis && (
                    <span className="mt-1 sm:mt-0 sm:ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded w-fit">
                      {item.jenis}
                    </span>
                  )}
                  {/* Tombol hapus */}
                  <button
                    type="button"
                    title="Hapus pengalaman"
                    className="ml-auto sm:ml-2 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    style={{ transition: "opacity 0.2s" }}
                    onClick={() => handleDeletePengalaman(item._id)}
                    disabled={deletingId === item._id}
                  >
                    {deletingId === item._id ? (
                      <span className="text-xs px-2">Menghapus...</span>
                    ) : (
                      <FaTrash className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="text-black text-sm">{item.lokasi}</div>
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
        {pengalamanError && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm mt-2">{pengalamanError}</div>
        )}
      </div>
    </div>
  );
}