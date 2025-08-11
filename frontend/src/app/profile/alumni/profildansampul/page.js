"use client";

import React, { useEffect, useState, useRef } from "react";
import { FaPencilAlt } from "react-icons/fa";

// Helper to get token from cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// Helper untuk resolve URL foto_profil alumni
function getFotoProfilUrl(foto_profil) {
  if (!foto_profil) return "";
  if (/^https?:\/\//.test(foto_profil)) return foto_profil;
  if (foto_profil.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${foto_profil}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/${foto_profil}`;
}

// Helper untuk resolve URL foto_sampul alumni
function getFotoSampulUrl(foto_sampul) {
  if (!foto_sampul) return "";
  if (/^https?:\/\//.test(foto_sampul)) return foto_sampul;
  if (foto_sampul.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${foto_sampul}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/sampul/${foto_sampul}`;
}

export default function AlumniPreview() {
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tahun_lulus: "",
    alamat: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Refs for file inputs
  const fileInputSampulRef = useRef(null);
  const fileInputProfilRef = useRef(null);

  // Fetch alumni data
  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true);
      const token = getTokenFromCookie();
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
        setForm({
          name: data.name || "",
          tahun_lulus: data.tahun_lulus || "",
          alamat: data.alamat || "",
        });
      } catch (err) {
        setAlumni(null);
      }
      setLoading(false);
    }
    fetchAlumni();
  }, []);

  // Handler for file input click
  const handleSampulClick = () => {
    if (fileInputSampulRef.current) {
      fileInputSampulRef.current.value = "";
      fileInputSampulRef.current.click();
    }
  };

  const handleProfilClick = () => {
    if (fileInputProfilRef.current) {
      fileInputProfilRef.current.value = "";
      fileInputProfilRef.current.click();
    }
  };

  // Handler for file change (upload logic)
  const handleSampulChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const token = getTokenFromCookie();
      if (!token) return;
      const formData = new FormData();
      formData.append("foto_sampul", file);
      try {
        setSaving(true);
        setFormError("");
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/foto-sampul", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to update cover photo");
        const updated = await res.json();
        setAlumni((prev) => ({ ...prev, foto_sampul: updated.foto_sampul }));
      } catch (err) {
        setFormError("Gagal update foto sampul.");
      }
      setSaving(false);
    }
  };

  const handleProfilChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const token = getTokenFromCookie();
      if (!token) return;
      const formData = new FormData();
      formData.append("foto_profil", file);
      try {
        setSaving(true);
        setFormError("");
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/foto-profil", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to update profile photo");
        const updated = await res.json();
        setAlumni((prev) => ({ ...prev, foto_profil: updated.foto_profil }));
      } catch (err) {
        setFormError("Gagal update foto profil.");
      }
      setSaving(false);
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

  // Handle edit button
  const handleEdit = () => {
    setEditMode(true);
    setFormError("");
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditMode(false);
    setFormError("");
    // Reset form to alumni data
    if (alumni) {
      setForm({
        name: alumni.name || "",
        tahun_lulus: alumni.tahun_lulus || "",
        alamat: alumni.alamat || "",
      });
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    // Validation
    if (!form.name || !form.tahun_lulus || !form.alamat) {
      setFormError("Semua field wajib diisi.");
      setSaving(false);
      return;
    }

    const token = getTokenFromCookie();
    if (!token) {
      setFormError("Token tidak ditemukan.");
      setSaving(false);
      return;
    }

    // Prepare payload
    const payload = {
      name: form.name,
      tahun_lulus: form.tahun_lulus,
      alamat: form.alamat,
    };

    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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
      <div className="h-full bg-gray-200 p-8 flex items-center justify-center">
        <span className="text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="h-full bg-gray-200 p-8 flex items-center justify-center">
        <span className="text-red-600">Failed to load alumni data.</span>
      </div>
    );
  }

  // Helper: break word utility for long text
  const breakWordClass = "break-words whitespace-pre-line";

  return (
    <div className="h-full bg-gray-100 p-8">
      <div className="bg-white rounded-lg shadow-xl pb-8">
        {/* Edit Button */}
        <div className="absolute right-12 mt-4 rounded">
          <button
            className="border border-gray-400 p-2 rounded text-black hover:text-black bg-gray-100 bg-opacity-10 hover:bg-opacity-20"
            title="Edit Profil"
            onClick={handleEdit}
            disabled={editMode}
          >
            <FaPencilAlt className="h-4 w-4" />
          </button>
        </div>
        {/* Foto Sampul dengan hover icon edit */}
        <div className="w-full h-[250px] relative group">
          <img
            src={
              getFotoSampulUrl(alumni.foto_sampul) ||
              "https://vojislavd.com/ta-template-demo/assets/img/profile-background.jpg"
            }
            className="w-full h-full object-cover rounded-tl-lg rounded-tr-lg"
            alt="Foto Sampul"
          />
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ pointerEvents: "auto" }}
            onClick={handleSampulClick}
            tabIndex={-1}
            disabled={saving}
          >
            <span className="backdrop-blur-sm bg-black/30 rounded-full p-3 flex items-center justify-center hover:bg-black/50 transition-colors">
              <FaPencilAlt className="text-white text-2xl" />
            </span>
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputSampulRef}
            className="hidden"
            onChange={handleSampulChange}
          />
        </div>
        <div className="flex flex-col items-center -mt-20 relative">
          {/* Foto Profil dengan hover icon edit */}
          <div className="relative group w-40 h-40 flex items-center justify-center">
            <img
              src={
                getFotoProfilUrl(alumni.foto_profil) ||
                "https://vojislavd.com/ta-template-demo/assets/img/profile.jpg"
              }
              className="w-40 h-40 border-4 border-white rounded-full object-cover"
              alt="Foto Profil"
            />
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ pointerEvents: "auto" }}
              onClick={handleProfilClick}
              tabIndex={-1}
              disabled={saving}
            >
              <span className="backdrop-blur-sm bg-black/30 rounded-full p-3 flex items-center justify-center hover:bg-black/50 transition-colors">
                <FaPencilAlt className="text-white text-2xl" />
              </span>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputProfilRef}
              className="hidden"
              onChange={handleProfilChange}
            />
          </div>
        </div>
        <div className="flex flex-col items-center mt-4">
          {!editMode ? (
            <>
              <p className="text-2xl font-bold text-black">{alumni.name}</p>
              <p className="text-black">{alumni.tahun_lulus}</p>
              <p className="text-black">{alumni.alamat}</p>
            </>
          ) : (
            <form className="mt-2 text-black space-y-3 w-full max-w-md" onSubmit={handleSubmit} autoComplete="off">
              {formError && (
                <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2 text-sm">{formError}</div>
              )}
              <div className="flex flex-col gap-1">
                <label className="font-bold" htmlFor="name">Nama:</label>
                <input
                  className={`border rounded px-2 py-1 ${breakWordClass} text-black`}
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold" htmlFor="tahun_lulus">Tahun Lulus:</label>
                <input
                  className={`border rounded px-2 py-1 ${breakWordClass} text-black`}
                  id="tahun_lulus"
                  name="tahun_lulus"
                  type="number"
                  value={form.tahun_lulus}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold" htmlFor="alamat">Alamat:</label>
                <input
                  className={`border rounded px-2 py-1 ${breakWordClass} text-black`}
                  id="alamat"
                  name="alamat"
                  value={form.alamat}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
