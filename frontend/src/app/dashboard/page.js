"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AlumniDashboard from "./alumni";
import PerusahaanDashboard from "./perusahaan";
import AdminDashboard from "./admin";
import SuperAdminDashboard from "./superAdmin"; // import superadmin dashboard
import Loader from "../loading/loadingDesign";

import AdminNavbar from "../navbar/adminNavbar/page"; // importkan admin navbar
import Navbar from "../navbar/page"; // importkan navbar/page

// Helper: Ambil token dari cookie (client-side)
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith("token=")) {
      return decodeURIComponent(c.substring("token=".length));
    }
  }
  return null;
}

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const roleFetched = useRef(false);

  useEffect(() => {
    let didCancel = false;
    async function fetchRole() {
      try {
        const token = getTokenFromCookie();
        if (!token) {
          router.replace("/login");
          return;
        }
        // Cek superadmin dulu
        let res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/superadmin/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (res.ok) {
          if (!didCancel) {
            setRole("superadmin");
            roleFetched.current = true;
            setLoading(false); // langsung matikan loading
          }
          return;
        }
        res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (res.ok) {
          if (!didCancel) {
            setRole("alumni");
            roleFetched.current = true;
            setLoading(false); // langsung matikan loading
          }
          return;
        }
        res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (res.ok) {
          if (!didCancel) {
            setRole("perusahaan");
            roleFetched.current = true;
            setLoading(false); // langsung matikan loading
          }
          return;
        }
        res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/admin/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (res.ok) {
          if (!didCancel) {
            setRole("admin");
            roleFetched.current = true;
            setLoading(false); // langsung matikan loading
          }
          return;
        }
        router.replace("/login");
      } catch (err) {
        router.replace("/login");
      }
    }
    fetchRole();
    return () => {
      didCancel = true;
    };
  }, [router]);

  // Handler untuk Loader selesai (2 detik)
  // (Tidak dipakai lagi, loading dimatikan langsung setelah role didapat)
  const handleLoaderFinish = () => {
    if (role || roleFetched.current) {
      setLoading(false);
    }
  };

  // Loader as modal: overlay, blur, semi-transparent, dashboard tetap kelihatan di belakang
  return (
    <div className="relative">
      {/* Navbar always rendered */}
      <Navbar />
      {/* Dashboard content always rendered */}
      {role === "superadmin" && (
        <>
          <SuperAdminDashboard />
        </>
      )}
      {role === "alumni" && (
        <>
          <AlumniDashboard />
          <div className="my-8">
          </div>
          <div className="my-8">

          </div>
        </>
      )}
      {role === "perusahaan" && (
        <>
          <div className="my-8">
          </div>
          <PerusahaanDashboard />
        </>
      )}
      {role === "admin" && (
        <>
          <AdminNavbar />
          <AdminDashboard />
        </>
      )}

      {/* Modal Loader */}
      {loading && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center backdrop-blur-xs"
          style={{
            minHeight: "100vh",
            minWidth: "100vw",
          }}
        >
          {/* Loader tetap dipanggil, tapi onFinish tidak wajib untuk matikan loading */}
          <Loader onFinish={handleLoaderFinish} />
        </div>
      )}
    </div>
  );
}
