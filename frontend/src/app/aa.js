"use client";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

// Helper: get token from cookie
export function getTokenFromCookie(name = "token") {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Helper untuk resolve URL foto_profil alumni ke localhost:5000/uploads jika perlu
export function getProfileImageUrl(foto_profil) {
  if (!foto_profil) return "";
  if (/^https?:\/\//.test(foto_profil)) return foto_profil;
  if (foto_profil.startsWith("/uploads/")) {
    return `http://localhost:5000${foto_profil}`;
  }
  return `http://localhost:5000/uploads/alumni/${foto_profil}`;
}

// Helper untuk resolve URL logo_perusahaan ke localhost:5000/uploads jika perlu
export function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `http://localhost:5000${logo_perusahaan}`;
  }
  return `http://localhost:5000/uploads/perusahaan/${logo_perusahaan}`;
}

// Helper untuk menghapus cookie token (mengikuti code referensi)
export function removeTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie =
    "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
}

// Menu links untuk alumni
export const alumniMenuLinks = [
  { href: "/profile", label: "Profile", key: "profile" },
  { href: "/profile/alumni/accountSettings", label: "Account settings", key: "accountSettings" },
];

// Menu links untuk perusahaan (sesuai gambar)
export const perusahaanMenuLinks = [
  { href: "/profile/perusahaanPreview", label: "INFORMASI UTAMA", key: "perusahaanPreview" },
  { href: "/profile/perusahaan/accountSettings", label: "KEAMANAN AKUN", key: "accountSettings" },
  { href: "/profile/perusahaan/notifikasi", label: "NOTIFIKASI", key: "notifikasi" },
  { href: "/profile/perusahaan/profilPerusahaan", label: "PROFIL PERUSAHAAN", key: "profilPerusahaan" },
];

// Fungsi untuk fetch profile dan role (alumni/perusahaan)
export async function fetchProfileAndRole() {
  let profile = null;
  let role = null;
  let loading = true;
  try {
    const token = getTokenFromCookie("token");
    if (!token) {
      loading = false;
      return { profile: null, role: null, loading };
    }
    // Cek role dari endpoint alumni/me dan perusahaan/me
    // Cek perusahaan dulu, jika gagal baru cek alumni
    let res, data;
    try {
      res = await fetch("http://localhost:5000/perusahaan/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      res = { ok: false, status: 0 };
    }
    if (res.ok) {
      data = await res.json();
      profile = data;
      role = "perusahaan";
      loading = false;
      return { profile, role, loading };
    }
    try {
      res = await fetch("http://localhost:5000/alumni/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      res = { ok: false, status: 0 };
    }
    if (res.ok) {
      data = await res.json();
      profile = data;
      role = "alumni";
      loading = false;
      return { profile, role, loading };
    }
    loading = false;
    return { profile: null, role: null, loading };
  } catch (err) {
    loading = false;
    return { profile: null, role: null, loading };
  }
}

// Fungsi upload foto profil alumni
export async function uploadAlumniProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async function () {
      if (img.width !== img.height) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Gambar harus berbentuk kotak (rasio 1:1)"));
        return;
      }
      URL.revokeObjectURL(objectUrl);
      try {
        const token = getTokenFromCookie("token");
        if (!token) throw new Error("Token not found");
        const formData = new FormData();
        formData.append("foto_profil", file);
        const uploadRes = await fetch("http://localhost:5000/alumni/me/foto-profil", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.message || "Gagal upload foto profil");
        }
        resolve("Foto profil berhasil diupdate!");
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("File gambar tidak valid"));
    };
    img.src = objectUrl;
  });
}

// Fungsi upload logo perusahaan
export async function uploadPerusahaanLogo(file) {
  try {
    const token = getTokenFromCookie("token");
    if (!token) throw new Error("Token not found");
    let perusahaanId = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      perusahaanId = payload && (payload.perusahaanId || payload.id || payload._id);
    } catch (e) {
      throw new Error("Gagal membaca ID perusahaan dari token");
    }
    if (!perusahaanId) throw new Error("ID perusahaan tidak ditemukan di token");
    const formData = new FormData();
    formData.append("logo_perusahaan", file);
    const uploadRes = await fetch(`http://localhost:5000/perusahaan/${perusahaanId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.message || "Gagal upload logo perusahaan");
    }
    return "Logo perusahaan berhasil diupdate!";
  } catch (err) {
    throw err;
  }
}

// Fungsi logout
export function logout() {
  removeTokenCookie();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}