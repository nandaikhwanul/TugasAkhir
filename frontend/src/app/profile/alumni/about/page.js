"use client";

import React, { useEffect, useState } from "react";
import { FaPencilAlt, FaUserCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

// Pesan motivasi jika deskripsi kosong
const EMPTY_ABOUT_MESSAGE = (
  <span className="italic text-gray-400 flex items-center gap-2">
    <FaUserCircle className="text-blue-200 text-2xl" />
    Ceritakan tentang dirimu di sini! Bagikan pengalaman, keahlian, atau kisah inspiratifmu agar alumni lain bisa lebih mengenalmu. Profil yang lengkap akan membantumu membangun koneksi dan peluang baru. Yuk, lengkapi bagian ini!
  </span>
);

export default function AboutCard() {
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ deskripsi: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  // Fetch alumni data
  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true);
      // In a real app, this should be replaced with a proper token retrieval
      const token = getTokenFromSessionStorage();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch alumni data");
        const data = await res.json();
        setAlumni(data);
        setForm({ deskripsi: data.deskripsi || "" });
      } catch (err) {
        console.error("Fetch Error:", err);
        setAlumni(null);
      }
      setLoading(false);
    }
    fetchAlumni();
  }, []);

  // Handle edit button for About section
  const handleEditAbout = () => {
    setEditMode(true);
    setEditingSection("about");
    setFormError("");
    setFormSuccess("");
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditMode(false);
    setEditingSection(null);
    setFormError("");
    setFormSuccess("");
    // Reset form to alumni data
    if (alumni) {
      setForm({ deskripsi: alumni.deskripsi || "" });
    }
  };

  // Handle input change for form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submit (About only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSaving(true);

    if (!form.deskripsi || form.deskripsi.trim() === "") {
      setFormError("Deskripsi tidak boleh kosong.");
      setSaving(false);
      return;
    }

    const token = getTokenFromSessionStorage();
    if (!token) {
      setFormError("Token tidak ditemukan.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deskripsi: form.deskripsi }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal update profil.");
      }
      const updatedAlumni = await res.json();
      setAlumni(prev => ({ ...prev, deskripsi: updatedAlumni.deskripsi }));
      setFormSuccess("Profil berhasil diperbarui!");
      setEditMode(false);
      setEditingSection(null);
    } catch (err) {
      setFormError(err.message || "Gagal update profil.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-gray-100 p-4 sm:p-8 flex items-center justify-center rounded-2xl shadow-lg min-h-[180px]">
        <span className="text-gray-500 flex items-center gap-2 text-base sm:text-lg">
          <FaSpinner className="animate-spin text-blue-400" />
          Memuat...
        </span>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="h-full bg-gradient-to-br from-red-50 to-gray-100 p-4 sm:p-8 flex items-center justify-center rounded-2xl shadow-lg min-h-[180px]">
        <span className="text-red-500 flex items-center gap-2 text-base sm:text-lg">
          <FaExclamationTriangle className="text-red-300" />
          Gagal memuat data alumni.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full sm:p-0 md:px-1 md:relative md:right-2">
      <div
        className="flex-1 bg-gradient-to-br from-blue-50 to-white shadow-lg p-4 sm:p-8 group relative w-full min-h-[260px] border border-blue-100"
        onMouseEnter={() => setHoveredSection("about")}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!editMode && (
            <button
              className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-400 hover:text-blue-600 transition"
              title="Edit About"
              type="button"
              onClick={handleEditAbout}
              disabled={editMode}
            >
              <FaPencilAlt className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <FaUserCircle className="text-blue-500 text-3xl sm:text-4xl" />
          <h4 className="text-2xl sm:text-3xl text-blue-900 font-bold tracking-tight">Tentang Saya</h4>
        </div>
        
        {formError && editingSection === "about" && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2 border border-red-100">
            <FaExclamationTriangle className="text-red-400" /> {formError}
          </div>
        )}
        
        {formSuccess && editingSection === "about" && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2 border border-green-100">
            <FaCheckCircle className="text-green-400" /> {formSuccess}
          </div>
        )}
        
        {!editMode || editingSection !== "about" ? (
          <p className="mt-4 text-gray-700 break-words whitespace-pre-line text-sm sm:text-base leading-relaxed">
            {alumni.deskripsi && alumni.deskripsi.trim()
              ? alumni.deskripsi
              : EMPTY_ABOUT_MESSAGE}
          </p>
        ) : (
          <form className="mt-4 text-gray-700 space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div className="flex flex-col w-full">
              <label className="font-semibold text-blue-900 flex items-center gap-2 mb-2 text-sm sm:text-base" htmlFor="deskripsi">
                Deskripsi
              </label>
              <textarea
                className="w-full border border-blue-200 focus:border-blue-400 rounded-lg px-4 py-3 bg-blue-50 focus:bg-white transition break-words whitespace-pre-line text-sm sm:text-base shadow-sm min-h-[150px] focus:ring-2 focus:ring-blue-200"
                id="deskripsi"
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleInputChange}
                rows={5}
                required
                placeholder="Tulis tentang dirimu di sini..."
                style={{ resize: "vertical" }}
              />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2 justify-end w-full">
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg shadow text-sm sm:text-base transition disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto font-medium"
                onClick={handleCancel}
                disabled={saving}
              >
                <FaTimesCircle /> Batal
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow text-sm sm:text-base transition disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto font-medium"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Simpan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
