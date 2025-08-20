"use client";

import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaBirthdayCake,
  FaGraduationCap,
  FaPhoneAlt,
  FaEnvelope,
  FaBook,
  // FaIdCard, // nim tidak dipakai
} from "react-icons/fa";

// NOTE: useSearchParams and sessionStorage are client-only, so we must ensure this component only renders on client
import { useSearchParams } from "next/navigation";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

// Format date to "DD MMM, YYYY"
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Client-only wrapper to avoid Next.js prerender error
function PersonalInfoCardInner() {
  const searchParams = useSearchParams();
  const alumniId = searchParams.get("id");

  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch alumni data for perusahaan (read-only)
  useEffect(() => {
    let ignore = false;
    async function fetchAlumni() {
      setLoading(true);
      const token = getTokenFromSessionStorage();
      if (!token || !alumniId) {
        if (!ignore) {
          setLoading(false);
          setAlumni(null);
        }
        return;
      }
      try {
        const res = await fetch(
          `https://tugasakhir-production-6c6c.up.railway.app/perusahaan/alumni/${alumniId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data alumni");
        const data = await res.json();
        // console.log("DEBUG alumni data:", data); // debug data pake console.log

        // Use the data object directly, fallback to null if not present
        if (!ignore) setAlumni(data || null);
      } catch (err) {
        if (!ignore) setAlumni(null);
      }
      if (!ignore) setLoading(false);
    }
    fetchAlumni();
    return () => { ignore = true; };
  }, [alumniId]);

  if (loading) {
    return (
      <div className="h-full bg-gray-100 p-8 flex items-center justify-center">
        <span className="text-gray-500 flex items-center gap-2">
          <FaUser className="inline-block text-blue-500" /> Loading...
        </span>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="h-full bg-gray-100 p-8 flex items-center justify-center">
        <span className="text-red-500 flex items-center gap-2">
          <FaUser className="inline-block text-red-500" /> Failed to load alumni data.
        </span>
      </div>
    );
  }

  // Helper: break word utility for long text
  const breakWordClass = "break-words whitespace-pre-line";

  // Helper: icon for each field
  const fieldIcons = {
    name: <FaUser className="text-blue-500 mr-2" />,
    // nim: <FaIdCard className="text-purple-500 mr-2" />, // nim tidak dipakai
    tanggal_lahir: <FaBirthdayCake className="text-pink-400 mr-2" />,
    tahun_lulus: <FaGraduationCap className="text-green-500 mr-2" />,
    nohp: <FaPhoneAlt className="text-emerald-500 mr-2" />,
    email: <FaEnvelope className="text-orange-500 mr-2" />,
    program_studi: <FaBook className="text-indigo-500 mr-2" />,
    alamat: <FaBook className="text-indigo-400 mr-2" />,
  };

  // Helper: render skill badges, limit to 10 skills
  function renderSkills(skills) {
    if (!skills || !Array.isArray(skills) || skills.length === 0) return null;
    const limitedSkills = skills.slice(0, 10);
    return (
      <div className="flex flex-wrap gap-2 justify-end items-start">
        {limitedSkills.map((skill, idx) => (
          <span
            key={idx}
            className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200"
          >
            {skill}
          </span>
        ))}
        {skills.length > 10 && (
          <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full border border-gray-300">
            +{skills.length - 10} more
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="h-full p-0 flex items-start justify-center w-full">
      <div className="w-full max-w-none bg-white rounded-b-lg p-8 relative
        sm:p-4 sm:rounded-b-md
        ">
        <div
          className="
            flex flex-row gap-8 items-start
            sm:flex-col sm:gap-4
          "
        >
          {/* Label Personal Info di kiri */}
          <div
            className="
              flex flex-col items-start justify-start min-w-[180px] mr-8
              sm:min-w-0 sm:mr-0 sm:mb-2
            "
          >
            <h4 className="text-2xl text-gray-800 font-semibold mb-6 flex items-center gap-2
              sm:text-xl sm:mb-3
            ">
              <FaUser className="text-blue-300" /> Personal Info
            </h4>
          </div>
          {/* Info List */}
          <ul className="mt-2 text-gray-700 space-y-2 flex-1
            sm:mt-0
          ">
            <li className="flex items-center gap-2 py-1
              sm:flex-col sm:items-start sm:gap-1
            ">
              {fieldIcons.name}
              <span className="font-medium w-36 sm:w-auto">Name</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass} sm:w-full`}>{alumni.name || "-"}</span>
            </li>
            {/* NIM dihilangkan sesuai instruksi */}
            <li className="flex items-center gap-2 py-1
              sm:flex-col sm:items-start sm:gap-1
            ">
              {fieldIcons.tanggal_lahir}
              <span className="font-medium w-36 sm:w-auto">Birthday</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass} sm:w-full`}>{formatDate(alumni.tanggal_lahir)}</span>
            </li>
            <li className="flex items-center gap-2 py-1
              sm:flex-col sm:items-start sm:gap-1
            ">
              {fieldIcons.tahun_lulus}
              <span className="font-medium w-36 sm:w-auto">Graduation Year</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass} sm:w-full`}>{alumni.tahun_lulus || "-"}</span>
            </li>
            <li className="flex items-center gap-2 py-1
              sm:flex-col sm:items-start sm:gap-1
            ">
              {fieldIcons.nohp}
              <span className="font-medium w-36 sm:w-auto">Mobile</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass} sm:w-full`}>{alumni.nohp || "-"}</span>
            </li>
            <li className="flex items-center gap-2 py-1
              sm:flex-col sm:items-start sm:gap-1
            ">
              {fieldIcons.email}
              <span className="font-medium w-36 sm:w-auto">Email</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass} sm:w-full`}>{alumni.email || "-"}</span>
            </li>
            <li className="flex items-center gap-2 py-1
              sm:flex-col sm:items-start sm:gap-1
            ">
              {fieldIcons.program_studi}
              <span className="font-medium w-36 sm:w-auto">Program Studi</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass} sm:w-full`}>{alumni.program_studi || "-"}</span>
            </li>
            <li className="flex items-center gap-2 py-1
              sm:flex-col sm:items-start sm:gap-1
            ">
              {fieldIcons.alamat}
              <span className="font-medium w-36 sm:w-auto">Alamat</span>
              <span className={`flex-1 text-gray-700 ${breakWordClass} sm:w-full`}>{alumni.alamat || "-"}</span>
            </li>
          </ul>
          {/* Right: Skill badges */}
          <div className="flex flex-col items-end min-w-[120px]
            sm:items-start sm:min-w-0 sm:mt-4
          ">
            {renderSkills(alumni.skill)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export default dibungkus client-only mounting (to avoid SSR/prerender error)
export default function PersonalInfoCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    // Hindari error saat SSR/prerender
    return (
      <div className="h-full bg-gray-100 p-8 flex items-center justify-center">
        <span className="text-gray-400 flex items-center gap-2">
          <FaUser className="inline-block text-blue-200" /> Memuat...
        </span>
      </div>
    );
  }
  return <PersonalInfoCardInner />;
}
