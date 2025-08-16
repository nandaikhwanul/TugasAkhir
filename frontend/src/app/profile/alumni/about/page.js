"use client";

import React, { useEffect, useState } from "react";
import { FaPencilAlt, FaUserCircle, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
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

    if (!form.deskripsi) {
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
      // Refresh page after save
      window.location.reload();
      return;
    } catch (err) {
      setFormError(err.message || "Gagal update profil.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-gray-100 p-8 flex items-center justify-center rounded-lg">
        <span className="text-gray-500 flex items-center gap-2">
          <FaUserCircle className="text-blue-200 text-2xl" />
          Loading...
        </span>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="h-full bg-gradient-to-br from-red-50 to-gray-100 p-8 flex items-center justify-center rounded-lg">
        <span className="text-red-500 flex items-center gap-2">
          <FaExclamationTriangle className="text-red-300" />
          Failed to load alumni data.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* About Card with hover pencil */}
      <div
        className="flex-1 bg-gradient-to-br from-blue-50 to-white rounded-t-lg p-8 group relative w-full "
        onMouseEnter={() => setHoveredSection("about")}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!editMode && (
            <button
              className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-400 hover:text-blue-600 transition"
              title="Edit About"
              tabIndex={-1}
              type="button"
              onClick={handleEditAbout}
              disabled={editMode}
            >
              <FaPencilAlt className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mb-2">
          <FaUserCircle className="text-blue-300 text-3xl" />
          <h4 className="text-2xl text-blue-900 font-semibold tracking-tight">Tentang Saya</h4>
        </div>
        {/* Show error/success only for about edit */}
        {formError && editingSection === "about" && (
          <div className="bg-red-50 text-red-600 px-3 py-2 rounded mb-2 text-sm flex items-center gap-2 border border-red-100">
            <FaExclamationTriangle className="text-red-400" /> {formError}
          </div>
        )}
        {formSuccess && editingSection === "about" && (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded mb-2 text-sm flex items-center gap-2 border border-green-100">
            <FaCheckCircle className="text-green-400" /> {formSuccess}
          </div>
        )}
        {!editMode || editingSection !== "about" ? (
          <p className="mt-2 text-gray-700 break-words whitespace-pre-line break-all text-base flex items-start gap-2">
            {alumni.deskripsi && alumni.deskripsi.trim()
              ? (
                <>
                  <FaUserCircle className="text-blue-200 text-xl mt-1" />
                  <span>{alumni.deskripsi}</span>
                </>
              )
              : EMPTY_ABOUT_MESSAGE}
          </p>
        ) : (
          <form className="mt-4 text-gray-700 space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div className="flex flex-col sm:flex-row items-start gap-2">
              <label className="font-semibold w-32 pt-1 text-blue-900 flex items-center gap-2" htmlFor="deskripsi">
                <FaUserCircle className="text-blue-200" />
                Deskripsi:
              </label>
              <textarea
                className="flex-1 border border-blue-100 focus:border-blue-300 rounded px-3 py-2 bg-blue-50 focus:bg-white transition break-words whitespace-pre-line break-all text-base shadow-sm"
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
            <div className="flex items-center space-x-2 mt-2 justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded shadow text-sm transition disabled:opacity-60"
                disabled={saving}
              >
                <FaCheckCircle className="text-white" />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded shadow text-sm transition"
                onClick={handleCancel}
                disabled={saving}
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
