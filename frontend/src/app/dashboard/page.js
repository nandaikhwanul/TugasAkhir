"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AlumniDashboard from "./alumni";
import PerusahaanDashboard from "./perusahaan";
import AdminDashboard from "./admin";
import SuperAdminDashboard from "./superAdmin";
import Loader from "../loading/loadingDesign";

import AdminNavbar from "../navbar/adminNavbar/page";
import Navbar from "../navbar/page";

import { getTokenFromSessionStorage } from "../sessiontoken";

// Helper: decode JWT (tanpa verifikasi, hanya decode payload base64)
function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getTokenFromSessionStorage();

    if (!token) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    const decoded = decodeJwtPayload(token);

    if (!decoded) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    let userRole = decoded.role;
    if (!userRole && decoded.user && decoded.user.role) {
      userRole = decoded.user.role;
    }
    setRole(userRole || null);

    setLoading(false);
  }, [router]);

  return (
    <div className="relative">
      <Navbar />
      {role === "superadmin" && (
        <>
          <SuperAdminDashboard />
        </>
      )}
      {role === "alumni" && (
        <>
          <AlumniDashboard />
          <div className="my-8"></div>
          <div className="my-8"></div>
        </>
      )}
      {role === "perusahaan" && (
        <>
          <div className="my-8"></div>
          <PerusahaanDashboard />
        </>
      )}
      {role === "admin" && (
        <>
          <AdminNavbar />
          <AdminDashboard />
        </>
      )}

      {loading && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center backdrop-blur-xs"
          style={{
            minHeight: "100vh",
            minWidth: "100vw",
          }}
        >
          <Loader />
        </div>
      )}
    </div>
  );
}
