"use client";

import ProfilDanSampul from "./profildansampul/page";
import PersonalInfo from "./personalInfo/page";
import AboutCard from "./about/page";
import PengalamanCard from "./pengalaman/page";
import UploadCV from "./CV/page";

export default function AlumniProfilePage() {
  return (
    <>
      {/* ProfilDanSampul full width */}
      <div className="w-full">
        <ProfilDanSampul />
      </div>

      {/* AboutCard di atas PersonalInfo, PersonalInfo full lebar */}
      <div className="w-full">
        <div className="w-full flex flex-col items-start relative left-8">
          <div className="w-full max-w-[92rem]">
            <AboutCard />
          </div>
        </div>
        
        {/* PersonalInfo full lebar hingga pojok kanan dan kiri */}
        <div className="w-full px-8 mt-0">
          <PersonalInfo />
        </div>
        
        {/*
          PERBAIKAN DIMULAI DI SINI:
          Bagian ini sekarang menggunakan flexbox untuk membagi dua container secara rata.
          Border hitam saya hapus untuk tampilan yang lebih bersih.
        */}
        <div className="w-full max-w-[1450px] mx-auto flex justify-center mt-8 px-4 md:px-8 lg:px-16 ">
          <div className="flex w-full gap-8">
            {/* Container untuk PengalamanCard */}
            <div className="w-full md:w-full h-auto">
              <PengalamanCard />
            </div>
            {/* Container untuk UploadCV */}
            <div className="w-full md:w-full h-auto">
              <UploadCV />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}