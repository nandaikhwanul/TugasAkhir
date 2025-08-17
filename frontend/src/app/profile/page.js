"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../navbar/page";
import SidebarProfile from "./sidebarProfile";
import AlumniPreview from "./alumniPreview";
import AccountSettings from "./alumni/accountSettings/page";
import Applicants from "./perusahaan/applicants/page";
import Notifikasi from "./perusahaan/notifikasi/page";
import ProfilPerusahaanPage from "./perusahaan/profilPerusahaan/page";
import { getTokenFromSessionStorage } from "../sessiontoken";

// Import perusahaanPreview dan AccountSettings secara dinamis
import dynamic from "next/dynamic";
const PerusahaanPreview = dynamic(() => import("./perusahaanPreview"), { ssr: false });
const PerusahaanAccountSettings = dynamic(
  () => import("./perusahaan/accountSettings/page"),
  { ssr: false }
);

// Fungsi untuk cek validitas token (JWT)
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Cek exp (dalam detik)
    if (payload.exp && Date.now() / 1000 < payload.exp) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Fungsi untuk mengambil role dari token JWT
function getRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch (e) {
    return null;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [activeContent, setActiveContent] = useState("profile");

  useEffect(() => {
    const token = getTokenFromSessionStorage();
    if (!isTokenValid(token)) {
      router.push("/login");
      return;
    }
    const userRole = getRoleFromToken(token);
    setRole(userRole);
  }, [router]);

  if (role === null) {
    return null;
  }

  const handleSidebarNavigate = (menuKey) => {
    setActiveContent(menuKey);
  };

  // Style untuk menghilangkan scroll x di seluruh halaman
  const noScrollXStyle = {
    overflowX: "hidden",
    backgroundColor: "#f3f4f6", // Tailwind bg-gray-100
  };

  if (role === "perusahaan") {
    let mainContent = null;
    if (activeContent === "accountSettings") {
      mainContent = <PerusahaanAccountSettings />;
    } else if (activeContent === "notifikasi") {
      mainContent = <Notifikasi />;
    } else if (activeContent === "profilPerusahaan") {
      mainContent = <ProfilPerusahaanPage />;
    } else if (activeContent === "applicants") {
      mainContent = <Applicants />;
    } else if (activeContent === "jobPosting") {
      mainContent = <JobPosting />;
    } else {
      mainContent = <PerusahaanPreview />;
    }

    return (
      <>
        <Navbar />
        <div
          className="flex min-h-screen w-screen"
          style={noScrollXStyle}
        >
          <SidebarProfile
            onMenuClick={handleSidebarNavigate}
            activeMenu={activeContent}
          />
          <div className="flex-1" style={noScrollXStyle}>
            {mainContent}
          </div>
        </div>
        <style jsx global>{`
          html, body, #__next {
            overflow-x: hidden !important;
            background-color: #f3f4f6 !important; /* Tailwind bg-gray-100 */
          }
        `}</style>
      </>
    );
  }

  // Untuk alumni
  let mainContent = null;
  if (activeContent === "accountSettings") {
    mainContent = <AccountSettings />;
  } else {
    mainContent = <AlumniPreview />;
  }

  return (
    <>
      <Navbar />
      <div
        className="flex min-h-screen w-screen"
        style={noScrollXStyle}
      >
        <SidebarProfile
          onMenuClick={handleSidebarNavigate}
          activeMenu={activeContent}
        />
        <div className="flex-1" style={noScrollXStyle}>
          {mainContent}
        </div>
      </div>
      <style jsx global>{`
        html, body, #__next {
          overflow-x: hidden !important;
          background-color: #f3f4f6 !important; /* Tailwind bg-gray-100 */
        }
      `}</style>
    </>
  );
}