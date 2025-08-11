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
