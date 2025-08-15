"use client";


import PersonalInfo from "./personalInfo/page";
import AboutCard from "./about/page";
import PengalamanCard from "./pengalaman/page";
import UploadCV from "./CV/page";
import Navbar from "../../navbar/page";
import { useRouter } from "next/navigation";

export default function AlumniProfilePage() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      <div className="w-full overflow-x-hidden bg-gray-100 min-h-screen">
        {/* Tombol Back */}
        <div className="w-full px-8 pt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors bg-white rounded px-4 py-2 shadow border border-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali
          </button>
        </div>
        {/* AboutCard di atas PersonalInfo, PersonalInfo full lebar */}
        <div className="w-full flex flex-col items-start relative left-8">
          <div className="w-full max-w-[92rem]">
            <AboutCard />
          </div>
        </div>
        {/* PersonalInfo full lebar hingga pojok kanan dan kiri */}
        <div className="w-full px-8 mt-0">
          <PersonalInfo />
        </div>
        {/* Bagi 1/2 1/2 antara Pengalaman dan UploadCV */}
        <div className="w-full flex justify-center items-start mt-8">
          <div className="w-full max-w-[1200px] flex gap-8">
            <div className="w-1/2">
              <PengalamanCard />
            </div>
            <div className="w-1/2">
              <UploadCV />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
