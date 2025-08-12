"use client";
import { useEffect, useState } from "react";
import AlumniNavbar from "./alumniNavbar/page";
import PerusahaanNavbar from "./perusahaanNavbar/page";
import AdminNavbar from "./adminNavbar/page";
import SuperAdminSidebar from "./superAdminSidebar.js/page";
import { getTokenFromSessionStorage } from "../sessiontoken";

function getRoleFromToken() {
  const token = getTokenFromSessionStorage();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch (e) {
    return null;
  }
}

export default function NavbarPage() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);

  if (role === "alumni") {
    return (
      <div className="mb-20">
        <AlumniNavbar />
      </div>
    );
  }
  if (role === "perusahaan") {
    return (
      <div className="mb-20">
        <PerusahaanNavbar />
      </div>
    );
  }
  if (role === "admin") {
    return (
      <div className="mb-20">
        <AdminNavbar />
      </div>
    );
  }
  if (role === "superadmin") {
    return (
      <SuperAdminSidebar />
    );
  }
  return null;
}
