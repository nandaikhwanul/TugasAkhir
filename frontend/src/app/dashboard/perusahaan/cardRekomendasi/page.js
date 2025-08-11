"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Helper untuk foto profil
function getFotoProfilUrl(foto_profil) {
  if (!foto_profil) return null;
  // Jika sudah url lengkap
  if (
    typeof foto_profil === "string" &&
    (foto_profil.startsWith("http://") || foto_profil.startsWith("https://"))
  ) {
    return foto_profil;
  }
  // Jika path sudah diawali /uploads/, langsung return dengan base url
  if (
    typeof foto_profil === "string" &&
    foto_profil.startsWith("/uploads/")
  ) {
    return `http://localhost:5000${foto_profil}`;
  }
  // Asumsi path hanya nama file
  return `http://localhost:5000/uploads/foto_profil/${foto_profil}`;
}

// Helper untuk foto sampul
function getFotoSampulUrl(foto_sampul) {
  if (!foto_sampul) return null;
  if (
    typeof foto_sampul === "string" &&
    (foto_sampul.startsWith("http://") || foto_sampul.startsWith("https://"))
  ) {
    return foto_sampul;
  }
  if (
    typeof foto_sampul === "string" &&
    foto_sampul.startsWith("/uploads/")
  ) {
    return `http://localhost:5000${foto_sampul}`;
  }
  return `http://localhost:5000/uploads/foto_sampul/${foto_sampul}`;
}

// Helper to get token from cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// Framer Motion variants for card
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + i * 0.12,
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// Array warna untuk skill badge
const skillColors = [
  "bg-[#4f8cff] text-white",
  "bg-[#34d399] text-white",
  "bg-[#f59e42] text-white",
  "bg-[#f43f5e] text-white",
  "bg-[#6366f1] text-white",
  "bg-[#fbbf24] text-white",
  "bg-[#10b981] text-white",
  "bg-[#a78bfa] text-white",
  "bg-[#f472b6] text-white",
  "bg-[#60a5fa] text-white",
];

// Maksimal skill yang ditampilkan
const MAX_SKILL_BADGES = 5;

export default function CardRekomendasi() {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true);
      setFetchError(null);
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setFetchError("Token tidak ditemukan.");
          setLoading(false);
          return;
        }
        const res = await fetch("http://localhost:5000/perusahaan/alumni-pelamar", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Gagal mengambil data alumni.");
        }
        const data = await res.json();
        // Pastikan data array
        setAlumniList(Array.isArray(data) ? data : []);
      } catch (err) {
        setFetchError(err.message || "Gagal mengambil data alumni.");
      }
      setLoading(false);
    }
    fetchAlumni();
  }, []);

  return (
    <div
      className="px-0 py-12 bg-gray-100 min-h-screen w-full max-w-full overflow-x-hidden"
      style={{
        position: "relative",
        fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 px-8"
      >
        <div className="flex flex-col md:flex-row md:items-end gap-2">
          <span
            className="text-[2.2rem] font-extrabold leading-none"
            style={{
              color: "#4f8cff",
              fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
              letterSpacing: "-1px",
            }}
          >
            Rekomendasi Alumni Terbaik
          </span>
        </div>
        {/* Filter button (optional, bisa dihilangkan jika tidak perlu) */}
        <div className="flex items-center gap-4 md:mt-0">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#222] text-sm font-medium shadow-sm hover:bg-gray-50"
            style={{ fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif" }}
            disabled
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
              <rect x="3" y="7" width="14" height="2" rx="1" fill="#222" />
              <rect x="6" y="11" width="8" height="2" rx="1" fill="#222" />
            </svg>
            Filter
          </button>
        </div>
      </motion.div>
      <div
        className="mb-8 px-8"
        style={{
          fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
        }}
      >
        <span className="text-base text-[#6b7280] font-medium">
          Berikut adalah alumni yang paling sesuai dengan kebutuhan perusahaan Anda.
        </span>
      </div>
      {/* Cards */}
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="flex gap-8 px-8 flex-wrap">
          {loading ? (
            <div className="w-full flex justify-center items-center py-16">
              <span className="text-gray-500 text-lg">Loading...</span>
            </div>
          ) : fetchError ? (
            <div className="w-full flex justify-center items-center py-16">
              <span className="text-red-500 text-lg">{fetchError}</span>
            </div>
          ) : alumniList.length === 0 ? (
            <div className="w-full flex justify-center items-center py-16">
              <span className="text-gray-500 text-lg">Belum ada alumni pelamar.</span>
            </div>
          ) : (
            alumniList.map((alumni, idx) => {
              // Truncate skills jika lebih dari MAX_SKILL_BADGES
              let displayedSkills = [];
              let sisaSkill = 0;
              if (Array.isArray(alumni.skill) && alumni.skill.length > 0) {
                displayedSkills = alumni.skill.slice(0, MAX_SKILL_BADGES);
                sisaSkill = alumni.skill.length - MAX_SKILL_BADGES;
              }
              // Gunakan helper untuk foto profil dan sampul
              const fotoProfilUrl = getFotoProfilUrl(alumni.foto_profil) || "https://ui-avatars.com/api/?name=" + encodeURIComponent(alumni.name || "Alumni");
              const fotoSampulUrl = getFotoSampulUrl(alumni.foto_sampul);

              return (
                <motion.div
                  key={alumni.nim || idx}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ amount: 0.2 }}
                  variants={cardVariants}
                  className="bg-white rounded-2xl shadow-sm border border-[#e3e8f0] w-full sm:w-[340px] p-0 flex flex-col gap-4 relative"
                  style={{
                    fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
                    maxWidth: 340,
                    flex: "1 1 300px",
                  }}
                >
                  {/* Dots menu */}
                  <button className="absolute top-5 right-5 text-[#BDBDBD] hover:text-[#4f8cff] z-20">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                  </button>
                  {/* Banner foto_sampul */}
                  <div
                    className="w-full h-24 rounded-t-2xl bg-gray-200 relative"
                    style={{
                      backgroundImage: fotoSampulUrl ? `url('${fotoSampulUrl}')` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* Empty div for banner */}
                  </div>
                  {/* Avatar Overlap */}
                  <div className="w-full flex justify-center relative" style={{ marginTop: "-2.5rem" }}>
                    <div className="relative z-10">
                      <img
                        src={fotoProfilUrl}
                        alt={alumni.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                        style={{
                          background: "#f3f4f6",
                        }}
                      />
                    </div>
                  </div>
                  {/* Card Content */}
                  <div className="px-7 pb-7 pt-2 flex flex-col gap-4">
                    {/* Name & Program Studi */}
                    <div className="text-center">
                      <div
                        className="font-bold text-[#222] text-xl leading-tight"
                        style={{ fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif" }}
                      >
                        {alumni.name}
                      </div>
                      <div className="text-sm text-[#4f8cff] font-medium mt-1" style={{ fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif" }}>
                        {alumni.program_studi}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex flex-col gap-2 text-xs text-[#8A92A6] font-medium mt-2"
                      style={{ fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif" }}>
                      <div className="flex justify-between">
                        <div>
                          <div className="mb-1 text-[#8A92A6]">Tahun Lulus</div>
                          <div className="text-[#222] font-semibold">
                            {alumni.tahun_lulus || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-[#8A92A6]">Email</div>
                          <div className="text-[#222] font-semibold break-all">
                            {alumni.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <div className="mb-1 text-[#8A92A6]">Telepon</div>
                          <div className="text-[#222] font-semibold">
                            {alumni.nohp || "-"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[#8A92A6]">Alamat</div>
                        <div className="text-[#222] font-semibold break-words">
                          {alumni.alamat || "-"}
                        </div>
                      </div>
                    </div>
                    {/* Skills */}
                    <div
                      className="mt-2 flex flex-wrap gap-2"
                      style={{ fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif" }}
                    >
                      {/* 
                        Skill di endpoint ini tidak ada, 
                        jika ada field alumni.skill (array), render, 
                        jika tidak, tampilkan badge default.
                        Jika skill banyak, di-truncate dan tampilkan "+N" badge.
                      */}
                      {Array.isArray(alumni.skill) && alumni.skill.length > 0 ? (
                        <>
                          {displayedSkills.map((skill, i) => (
                            <span
                              key={i}
                              className={
                                "inline-block text-xs font-semibold px-3 py-1 rounded-full " +
                                skillColors[i % skillColors.length]
                              }
                              style={{
                                fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {sisaSkill > 0 && (
                            <span
                              className="inline-block bg-[#e5e7eb] text-[#4f8cff] text-xs font-semibold px-3 py-1 rounded-full"
                              style={{
                                fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
                                letterSpacing: "0.2px",
                              }}
                            >
                              +{sisaSkill} skill
                            </span>
                          )}
                        </>
                      ) : (
                        <span
                          className="inline-block bg-[#e5e7eb] text-[#4f8cff] text-xs font-semibold px-3 py-1 rounded-full"
                          style={{
                            fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
                            letterSpacing: "0.2px",
                          }}
                        >
                          Belum ada skill
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
