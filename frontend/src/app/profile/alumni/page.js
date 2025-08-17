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
        <div className="w-full flex flex-col items-start relative left-0 sm:left-8">
          <div className="w-full max-w-[92rem] px-4 md:px-10 md:max-w-[200rem] md:relative md:right-10">
            <AboutCard />
          </div>
        </div>
        
        {/* PersonalInfo full lebar hingga pojok kanan dan kiri */}
        <div className="w-full px-4 sm:px-4 md:px-7 mt-0">
          <PersonalInfo />
        </div>
        
        {/* Responsive flexbox: stack on mobile, side by side on md+ */}
        <div className="w-full max-w-[1450px] mx-auto flex justify-center mt-8 px-2 sm:px-4 md:px-8 lg:px-16">
          <div className="flex flex-col md:flex-row w-full gap-6 md:gap-8">
            {/* Container untuk PengalamanCard */}
            <div className="w-full md:w-1/2 h-auto mb-6 md:mb-0 px-2 md:px-0 md:mb-10">
              <PengalamanCard />
            </div>
            {/* Container untuk UploadCV */}
            <div className="w-full md:w-1/2 h-auto px-2 md:px-0">
              <UploadCV />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}