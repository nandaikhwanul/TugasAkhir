"use client";

import dynamic from "next/dynamic";
import Navbar from "../../navbar/page";
import { useRouter } from "next/navigation";

// Import komponen lain secara dinamis agar tidak error saat build/prerender
const PersonalInfo = dynamic(() => import("./personalInfo/page"), { ssr: false });
const AboutCard = dynamic(() => import("./about/page"), { ssr: false });
const PengalamanCard = dynamic(() => import("./pengalaman/page"), { ssr: false });
const UploadCV = dynamic(() => import("./CV/page"), { ssr: false });

export default function AlumniProfilePage() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      <div className="w-full overflow-x-hidden bg-gray-100 min-h-screen ">
        {/* Tombol Back */}
        <div className="w-full px-8 pt-6 mb-10">
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
        <div className="md:w-full px-8 mt-0 w-[31rem]">
          <PersonalInfo />
        </div>
        {/* Pengalaman dan UploadCV: berdampingan di desktop, bertumpuk di mobile */}
        <div className="w-full flex justify-center items-start mt-8">
          <div className="w-full max-w-[1600px] flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 mb-4 px-7 flex justify-center">
              <div className="w-full max-w-[700px]">
                <PengalamanCard />
              </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="w-full max-w-[700px]">
                {/* UploadCV di-load hanya di client-side via dynamic import */}
                <UploadCV />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
