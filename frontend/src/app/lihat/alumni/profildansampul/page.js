"use client";

import React, { useEffect, useState } from "react";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

// Helper untuk resolve URL foto_profil alumni
function getFotoProfilUrl(foto_profil) {
  if (!foto_profil) return "";
  if (/^https?:\/\//.test(foto_profil)) return foto_profil;
  // Sudah /uploads/alumni/ atau /uploads/alumni/alumni-xxx.jpg
  if (foto_profil.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${foto_profil}`;
  }
  // Fallback: tambahkan prefix /uploads/alumni/
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/${foto_profil}`;
}

// Helper untuk resolve URL foto_sampul alumni
function getFotoSampulUrl(foto_sampul) {
  if (!foto_sampul) return "";
  if (/^https?:\/\//.test(foto_sampul)) return foto_sampul;
  // Sudah /uploads/alumni/sampul/ atau /uploads/xxx
  if (foto_sampul.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${foto_sampul}`;
  }
  // Fallback: tambahkan prefix /uploads/alumni/sampul/
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/alumni/sampul/${foto_sampul}`;
}

export default function AlumniPreview({ params }) {
  const alumni = params?.alumni;
  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true);

      try {
        const token = getTokenFromSessionStorage();

        const res = await fetch(
          `https://tugasakhir-production-6c6c.up.railway.app/perusahaan/alumni/${alumni}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch alumni data");

        const response = await res.json();
        // Ambil field foto_profil dan foto_sampul dari response (pastikan sesuai field backend)
        setAlumniData({
          foto_profil: response.foto_profil,
          foto_sampul: response.foto_sampul
        });
      } catch (err) {
        setAlumniData(null);
      }
      setLoading(false);
    }
    fetchAlumni();
  }, [alumni]);

  if (loading) {
    return (
      <div className="h-full bg-gray-200 p-8 flex items-center justify-center">
        <span className="text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!alumniData) {
    return (
      <div className="h-full bg-gray-200 p-8 flex items-center justify-center">
        <span className="text-red-600">Failed to load alumni data.</span>
      </div>
    );
  }

  const fotoSampulUrl = getFotoSampulUrl(alumniData.foto_sampul);
  const fotoProfilUrl = getFotoProfilUrl(alumniData.foto_profil);

  return (
    <div className="h-full bg-gray-100 p-8">
      <div className="bg-white rounded-lg shadow-xl pb-8">
        <div className="w-full h-[250px] relative">
          {fotoSampulUrl ? (
            <img
              src={fotoSampulUrl}
              className="w-full h-full object-cover rounded-tl-lg rounded-tr-lg"
              alt="Foto Sampul"
            />
          ) : (
            <div
              className="w-full h-full rounded-tl-lg rounded-tr-lg flex items-center justify-center bg-gray-200"
              style={{ minHeight: 250, height: 250 }}
            />
          )}
        </div>
        <div className="flex flex-col items-center -mt-20 relative">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {fotoProfilUrl ? (
              <img
                src={fotoProfilUrl}
                className="w-40 h-40 border-4 border-white rounded-full object-cover"
                alt="Foto Profil"
              />
            ) : (
              <div
                className="w-40 h-40 border-4 border-white rounded-full flex items-center justify-center bg-gray-200"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
