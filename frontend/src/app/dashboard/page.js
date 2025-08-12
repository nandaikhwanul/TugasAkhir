"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AlumniDashboard from "./alumni";
import PerusahaanDashboard from "./perusahaan";
import AdminDashboard from "./admin";
import SuperAdminDashboard from "./superAdmin";
import Loader from "../loading/loadingDesign";

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let didCancel = false;

    async function fetchRole() {
      const roles = ["superadmin", "admin", "alumni", "perusahaan"];

      for (const roleName of roles) {
        try {
          const res = await fetch(
            `https://tugasakhir-production-6c6c.up.railway.app/${roleName}/me`,
            {
              method: "GET",
              credentials: "include", // Penting agar cookie token dikirim otomatis
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (res.ok) {
            if (!didCancel) {
              setRole(roleName);
              setLoading(false);
            }
            return; // stop cek role lain
          }
        } catch (err) {
          console.error(`Error checking role ${roleName}:`, err);
          // jangan stop looping, coba cek role lain
        }
      }

      // Kalau tidak ada role valid, redirect ke login
      if (!didCancel) {
        setLoading(false);
        router.replace("/login");
      }
    }

    fetchRole();

    return () => {
      didCancel = true;
    };
  }, [router]);

  if (loading) {
    return <Loader />;
  }

  // Render dashboard sesuai role
  switch (role) {
    case "superadmin":
      return <SuperAdminDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "alumni":
      return <AlumniDashboard />;
    case "perusahaan":
      return <PerusahaanDashboard />;
    default:
      // Kalau role tidak dikenali, redirect ke login
      router.replace("/login");
      return null;
  }
}
