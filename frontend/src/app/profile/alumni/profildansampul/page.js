"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaPencilAlt, FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle, FaGraduationCap, FaMapMarkerAlt } from "react-icons/fa";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

// Helper untuk resolve URL foto_profil alumni
function getFotoProfilUrl(foto_profil) {
  if (foto_profil === undefined || foto_profil === null) return null;
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

// Helper untuk random background color
function getRandomBgColor() {
  const colors = [
    "bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200",
    "bg-gradient-to-r from-green-200 via-blue-200 to-purple-200",
    "bg-gradient-to-r from-yellow-200 via-pink-200 to-red-200",
    "bg-gradient-to-r from-blue-200 via-cyan-200 to-green-200",
    "bg-gradient-to-r from-orange-200 via-yellow-200 to-pink-200",
    "bg-gradient-to-r from-teal-200 via-lime-200 to-green-200",
    "bg-gradient-to-r from-fuchsia-200 via-pink-200 to-rose-200",
    "bg-gradient-to-r from-sky-200 via-blue-200 to-indigo-200",
    "bg-gradient-to-r from-amber-200 via-orange-200 to-red-200",
    "bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper untuk mengambil inisial dari nama
function getInitials(name) {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() || "";
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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
  const [formSuccess, setFormSuccess] = useState("");

  // Refs for file inputs
  const fileInputSampulRef = useRef(null);
  const fileInputProfilRef = useRef(null);

  // Simpan warna random untuk background sampul jika belum ada foto
  const [randomBgClass, setRandomBgClass] = useState("");

  // Simpan warna random untuk background profil jika belum ada foto_profil
  const [randomProfileBgClass, setRandomProfileBgClass] = useState("");

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
        setForm({
          name: data.name || "",
          tahun_lulus: data.tahun_lulus || "",
          alamat: data.alamat || "",
        });
        if (!data.foto_sampul) {
          setRandomBgClass(getRandomBgColor());
        }
        if (data.foto_profil === undefined || data.foto_profil === null) {
          setRandomProfileBgClass(getRandomBgColor());
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setAlumni(null);
      }
      setLoading(false);
    }
    fetchAlumni();
    // eslint-disable-next-line
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
      const token = getTokenFromSessionStorage();
      if (!token) {
        setFormError("Token tidak ditemukan.");
        return;
      }
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
        setRandomBgClass("");
        setFormSuccess("Foto sampul berhasil diperbarui!");
      } catch (err) {
        setFormError("Gagal update foto sampul.");
      }
      setSaving(false);
    }
  };

  const handleProfilChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setFormError("Token tidak ditemukan.");
        return;
      }
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
        setRandomProfileBgClass("");
        setFormSuccess("Foto profil berhasil diperbarui!");
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
    setFormSuccess("");
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditMode(false);
    setFormError("");
    setFormSuccess("");
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
    setFormSuccess("");
    setSaving(true);

    if (!form.name || !form.tahun_lulus || !form.alamat) {
      setFormError("Semua field wajib diisi.");
      setSaving(false);
      return;
    }

    const token = getTokenFromSessionStorage();
    if (!token) {
      setFormError("Token tidak ditemukan.");
      setSaving(false);
      return;
    }

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
      const updatedAlumni = await res.json();
      setAlumni(prev => ({ ...prev, ...updatedAlumni }));
      setFormSuccess("Data profil berhasil diperbarui!");
      setEditMode(false);
    } catch (err) {
      setFormError(err.message || "Gagal update profil.");
    }
    setSaving(false);
  };

  // Memastikan data alumni ada sebelum render
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 min-h-[400px] rounded-2xl shadow-md">
        <span className="text-gray-500 flex items-center gap-2 text-base sm:text-lg">
          <FaSpinner className="animate-spin text-blue-400" />
          Memuat...
        </span>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 min-h-[400px] rounded-2xl shadow-md">
        <span className="text-red-500 flex items-center gap-2 text-base sm:text-lg">
          <FaExclamationTriangle className="text-red-300" />
          Gagal memuat data alumni.
        </span>
      </div>
    );
  }

  const fotoSampulUrl = getFotoSampulUrl(alumni.foto_sampul);
  const fotoProfilUrl = getFotoProfilUrl(alumni.foto_profil);
  const showInitials = !fotoProfilUrl;
  const initials = getInitials(alumni.name);

  return (
    <div className="flex flex-col w-full px-4 sm:px-0 md:px-7">
      <div className="relative bg-white shadow-xl border border-gray-100 pb-8 overflow-hidden">
        {/* Tombol Edit untuk data profil */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          {!editMode && (
            <button
              className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-400 hover:text-blue-600 transition"
              title="Edit Profil"
              onClick={handleEdit}
              disabled={editMode}
            >
              <FaPencilAlt className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Bagian Foto Sampul */}
        <div className="w-full h-[150px] sm:h-[250px] relative group">
          {fotoSampulUrl ? (
            <img
              src={fotoSampulUrl}
              className="w-full h-full object-cover rounded-t-lg"
              alt="Foto Sampul"
            />
          ) : (
            <div
              className={`w-full h-full rounded-t-lg flex items-center justify-center ${randomBgClass}`}
              style={{ minHeight: 150 }}
            ></div>
          )}
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={handleSampulClick}
            disabled={saving}
          >
            <span className="backdrop-blur-sm bg-black/30 rounded-full p-3 flex items-center justify-center hover:bg-black/50 transition-colors">
              <FaPencilAlt className="text-white text-xl sm:text-2xl" />
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

        {/* Info Profil */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-start -mt-16 sm:-mt-20 relative px-4 sm:px-8">
            <div className="relative group w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center flex-shrink-0">
                {showInitials ? (
                <div
                    className={`w-32 h-32 sm:w-40 sm:h-40 border-4 border-white rounded-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-white select-none shadow-md ${randomProfileBgClass}`}
                    aria-label="Inisial Profil"
                >
                    {initials}
                </div>
                ) : (
                <img
                    src={fotoProfilUrl}
                    className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white rounded-full object-cover shadow-md"
                    alt="Foto Profil"
                />
                )}
                <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    onClick={handleProfilClick}
                    disabled={saving}
                >
                    <span className="backdrop-blur-sm bg-black/30 rounded-full p-3 flex items-center justify-center hover:bg-black/50 transition-colors">
                    <FaPencilAlt className="text-white text-xl sm:text-2xl" />
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

            {/* Bagian Nama, Tahun Lulus, dan Alamat */}
            <div className="mt-4 sm:mt-12 sm:ml-8 text-center sm:text-left">
                {!editMode ? (
                <>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900 tracking-tight">{alumni.name}</p>
                    <div className="mt-2 text-gray-700 space-y-1">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <FaGraduationCap className="text-blue-500" />
                        <p className="text-sm sm:text-base">{alumni.tahun_lulus}</p>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <FaMapMarkerAlt className="text-blue-500" />
                        <p className="text-sm sm:text-base break-words whitespace-pre-line text-center sm:text-left">{alumni.alamat}</p>
                        </div>
                    </div>
                </>
                ) : (
                <form className="mt-4 text-gray-700 space-y-4 w-full" onSubmit={handleSubmit} autoComplete="off">
                    {formError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                        <FaExclamationTriangle className="text-red-400" /> {formError}
                    </div>
                    )}
                    {formSuccess && (
                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-green-100">
                        <FaCheckCircle className="text-green-400" /> {formSuccess}
                    </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-blue-900 flex items-center gap-2" htmlFor="name">
                            Nama
                        </label>
                        <input
                            className="w-full border border-blue-200 focus:border-blue-400 rounded-lg px-4 py-3 bg-blue-50 focus:bg-white transition text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-blue-200"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-blue-900 flex items-center gap-2" htmlFor="tahun_lulus">
                            Tahun Lulus
                        </label>
                        <input
                            className="w-full border border-blue-200 focus:border-blue-400 rounded-lg px-4 py-3 bg-blue-50 focus:bg-white transition text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-blue-200"
                            id="tahun_lulus"
                            name="tahun_lulus"
                            type="number"
                            value={form.tahun_lulus}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-blue-900 flex items-center gap-2" htmlFor="alamat">
                            Alamat
                        </label>
                        <input
                            className="w-full border border-blue-200 focus:border-blue-400 rounded-lg px-4 py-3 bg-blue-50 focus:bg-white transition text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-blue-200"
                            id="alamat"
                            name="alamat"
                            value={form.alamat}
                            onChange={handleInputChange}
                            required
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
      </div>
    </div>
  );
}
