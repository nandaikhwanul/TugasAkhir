"use client";
import React, { useState, useEffect } from "react";
import { FiMail } from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";

// Helper: get token from cookie
function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Custom Switch component
function Switch({ checked, onChange, color = "blue", label, disabled }) {
  return (
    <label className="flex items-center cursor-pointer gap-2">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
          disabled={disabled}
        />
        <div
          className={`
            w-11 h-6 rounded-full
            ${color === "blue" ? "bg-blue-200 peer-checked:bg-blue-600" : ""}
            ${color === "green" ? "bg-green-200 peer-checked:bg-green-600" : ""}
            transition-colors
            ${disabled ? "opacity-50" : ""}
          `}
        ></div>
        <div
          className={`
            absolute left-1 top-1 w-4 h-4 rounded-full bg-white
            peer-checked:translate-x-5 transition-transform
            shadow
            ${disabled ? "opacity-50" : ""}
          `}
        ></div>
      </div>
      {label && (
        <span
          className={`ml-2 text-sm font-medium ${
            color === "blue" ? "text-blue-700" : "text-green-700"
          } ${disabled ? "opacity-50" : ""}`}
        >
          {label}
        </span>
      )}
    </label>
  );
}

export default function NotifikasiPerusahaan() {
  const [loading, setLoading] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifWhatsapp, setNotifWhatsapp] = useState(false);
  const [notifEmailLamaran, setNotifEmailLamaran] = useState(false);
  const [notifWaLamaran, setNotifWaLamaran] = useState(false);
  const [notifWaLowongan, setNotifWaLowongan] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingWa, setSavingWa] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current notification settings
  useEffect(() => {
    async function fetchNotifSettings() {
      setLoading(true);
      setError("");
      setSuccess("");
      const token = getTokenFromCookie("token");
      if (!token) {
        setError("Tidak dapat mengambil token autentikasi.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/notifikasi", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Gagal mengambil pengaturan notifikasi.");
        const data = await res.json();
        setNotifEmail(!!data.notif_email);
        setNotifWhatsapp(!!data.notif_whatsapp);
        setNotifEmailLamaran(!!data.notif_email_lamaran);
        setNotifWaLamaran(!!data.notif_wa_lamaran);
        setNotifWaLowongan(!!data.notif_wa_lowongan);
      } catch (e) {
        setError(e.message || "Gagal mengambil pengaturan notifikasi.");
      }
      setLoading(false);
    }
    fetchNotifSettings();
  }, []);

  // Handle toggle for email main switch
  const handleEmailMainToggle = (e) => {
    setNotifEmail(e.target.checked);
    if (!e.target.checked) setNotifEmailLamaran(false);
  };
  // Handle toggle for WhatsApp main switch
  const handleWaMainToggle = (e) => {
    setNotifWhatsapp(e.target.checked);
    if (!e.target.checked) {
      setNotifWaLamaran(false);
      setNotifWaLowongan(false);
    }
  };

  // Save Email notification settings
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingEmail(true);
    const token = getTokenFromCookie("token");
    if (!token) {
      setError("Tidak dapat mengambil token autentikasi.");
      setSavingEmail(false);
      return;
    }
    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/notifikasi", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notif_email: notifEmail,
          notif_email_lamaran: notifEmailLamaran,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan pengaturan notifikasi email.");
      setSuccess("Pengaturan notifikasi email berhasil disimpan.");
    } catch (e) {
      setError(e.message || "Gagal menyimpan pengaturan notifikasi email.");
    }
    setSavingEmail(false);
  };

  // Save WhatsApp notification settings
  const handleSaveWa = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingWa(true);
    const token = getTokenFromCookie("token");
    if (!token) {
      setError("Tidak dapat mengambil token autentikasi.");
      setSavingWa(false);
      return;
    }
    try {
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/notifikasi", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notif_whatsapp: notifWhatsapp,
          notif_wa_lamaran: notifWaLamaran,
          notif_wa_lowongan: notifWaLowongan,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan pengaturan notifikasi WhatsApp.");
      setSuccess("Pengaturan notifikasi WhatsApp berhasil disimpan.");
    } catch (e) {
      setError(e.message || "Gagal menyimpan pengaturan notifikasi WhatsApp.");
    }
    setSavingWa(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow relative top-20">
      <h1 className="text-2xl font-bold mb-1">Notifikasi</h1>
      <p className="mb-6 text-gray-600">
        Pilih tipe notifikasi apa saja yang ingin Anda terima.
      </p>
      {loading ? (
        <div className="text-center text-gray-500">Memuat pengaturan...</div>
      ) : (
        <div className="space-y-8">
          {/* Email Notification */}
          <form
            className="border-b pb-8 mb-4"
            onSubmit={handleSaveEmail}
            autoComplete="off"
          >
            <div className="flex items-center gap-3 mb-1">
              <FiMail className="text-2xl text-gray-700" />
              <label htmlFor="notif-email-main" className="font-semibold text-lg flex items-center gap-2">
                Notifikasi Email
              </label>
            </div>
            <div className="flex items-center gap-4 ml-8 mb-4">
              <Switch
                checked={notifEmail}
                onChange={handleEmailMainToggle}
                color="blue"
                label="Aktifkan Email"
                disabled={savingEmail}
              />
            </div>
            <div className="text-gray-600 text-sm mb-4 ml-8">
              Terima notifikasi ke email Anda.
            </div>
            <div className="flex items-center gap-4 ml-8 mb-4">
              <Switch
                checked={notifEmailLamaran}
                onChange={e => setNotifEmailLamaran(e.target.checked)}
                color="blue"
                label="Info Lamaran"
                disabled={!notifEmail || savingEmail}
              />
            </div>
            <div className="flex items-center gap-4 ml-8">
              <button
                type="submit"
                className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition ${
                  savingEmail ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={savingEmail}
              >
                {savingEmail ? "Menyimpan..." : "Simpan Email"}
              </button>
            </div>
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-sm mt-2">{success}</div>
            )}
          </form>
          {/* WhatsApp Notification */}
          <form
            className="pb-4"
            onSubmit={handleSaveWa}
            autoComplete="off"
          >
            <div className="flex items-center gap-3 mb-1">
              <IoLogoWhatsapp className="text-2xl text-green-600" />
              <label htmlFor="notif-wa-main" className="font-semibold text-lg flex items-center gap-2">
                Notifikasi WhatsApp
              </label>
            </div>
            <div className="flex items-center gap-4 ml-8 mb-4">
              <Switch
                checked={notifWhatsapp}
                onChange={handleWaMainToggle}
                color="green"
                label="Aktifkan WhatsApp"
                disabled={savingWa}
              />
            </div>
            <div className="text-gray-600 text-sm mb-4 ml-8">
              Terima notifikasi ke WhatsApp Anda.
            </div>
            <div className="flex flex-col gap-2 ml-8 mb-4">
              <Switch
                checked={notifWaLamaran}
                onChange={e => setNotifWaLamaran(e.target.checked)}
                color="green"
                label="Info Lamaran"
                disabled={!notifWhatsapp || savingWa}
              />
              <Switch
                checked={notifWaLowongan}
                onChange={e => setNotifWaLowongan(e.target.checked)}
                color="green"
                label="Info Lowongan"
                disabled={!notifWhatsapp || savingWa}
              />
            </div>
            <div className="flex items-center gap-4 ml-8">
              <button
                type="submit"
                className={`px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition ${
                  savingWa ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={savingWa}
              >
                {savingWa ? "Menyimpan..." : "Simpan WhatsApp"}
              </button>
            </div>
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-sm mt-2">{success}</div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
