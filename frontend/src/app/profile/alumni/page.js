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
        <div className="w-full flex flex-col items-start">
          <div className="w-full md:pl-9 md:pr-5 pl-4">
            <AboutCard />
          </div>
        </div>
        
        {/* PersonalInfo full lebar hingga pojok kanan dan kiri */}
        <div className="w-full px-4 sm:px-4 md:px-7 mt-0">
          <PersonalInfo />
        </div>
        
        {/* Responsive flexbox: stack on mobile, side by side on md+ */}
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