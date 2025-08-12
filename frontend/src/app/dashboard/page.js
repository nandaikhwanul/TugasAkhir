"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AlumniDashboard from "./alumni";
import PerusahaanDashboard from "./perusahaan";
import AdminDashboard from "./admin";
import SuperAdminDashboard from "./superAdmin";
import Loader from "../loading/loadingDesign";

import AdminNavbar from "../navbar/adminNavbar/page";
import Navbar from "../navbar/page";

// Helper: Ambil token dari sessionStorage/localStorage (seperti di login)
function getTokenFromStorage() {
  if (typeof window === "undefined") {
    console.log("[DEBUG] window is undefined (not in browser)");
    return null;
  }
  // Cek sessionStorage dulu, lalu localStorage
  const token =
    window.sessionStorage.getItem("token") ||
    window.localStorage.getItem("tokenFromHeader");
  if (token) {
    console.log("[DEBUG] Found token in sessionStorage/localStorage:", token);
    return token;
  }
  // Fallback: cek cookie (untuk backward compatibility)
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("token=")) {
        const tokenFromCookie = decodeURIComponent(c.substring("token=".length));
        console.log("[DEBUG] Found token in cookie:", tokenFromCookie);
        return tokenFromCookie;
      }
    }
    console.log("[DEBUG] Token not found in cookie. document.cookie:", document.cookie);
  }
  return null;
}

// Helper: Ambil token dari header Set-Cookie (jika ada)
function getTokenFromSetCookieHeader(setCookieHeader) {
  if (!setCookieHeader) return null;
  // setCookieHeader bisa string atau array
  const cookiesArr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const cookieStr of cookiesArr) {
    // cari token=...;
    const match = cookieStr.match(/token=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headerToken, setHeaderToken] = useState(null); // token dari header setelah login
  const router = useRouter();
  const roleFetched = useRef(false);

  useEffect(() => {
    let didCancel = false;
    async function fetchRole() {
      try {
        // Ambil token dari sessionStorage/localStorage (seperti login)
        let token = getTokenFromStorage();
        console.log("[DEBUG] Token to be used in fetch:", token);

        if (!token) {
          console.warn("[DEBUG] No token found, redirecting to /login");
          setLoading(false);
          router.replace("/login");
          return;
        }

        // Cek superadmin dulu
        let res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/superadmin/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        // Cek jika response header mengandung Set-Cookie: token=...
        const setCookieHeader = res.headers.get("set-cookie");
        if (setCookieHeader) {
          const tokenFromHeader = getTokenFromSetCookieHeader(setCookieHeader);
          if (tokenFromHeader) {
            setHeaderToken(tokenFromHeader);
            // Simpan ke sessionStorage/localStorage agar bisa diakses di client
            if (typeof window !== "undefined") {
              try {
                window.sessionStorage.setItem("tokenFromHeader", tokenFromHeader);
                window.localStorage.setItem("tokenFromHeader", tokenFromHeader);
              } catch (e) {}
            }
            token = tokenFromHeader;
          }
        }

        console.log("[DEBUG] superadmin/me status:", res.status);
        if (res.ok) {
          if (!didCancel) {
            setRole("superadmin");
            roleFetched.current = true;
            setLoading(false);
          }
          return;
        }
        res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/alumni/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        // Cek Set-Cookie di response alumni
        const setCookieHeaderAlumni = res.headers.get("set-cookie");
        if (setCookieHeaderAlumni) {
          const tokenFromHeader = getTokenFromSetCookieHeader(setCookieHeaderAlumni);
          if (tokenFromHeader) {
            setHeaderToken(tokenFromHeader);
            if (typeof window !== "undefined") {
              try {
                window.sessionStorage.setItem("tokenFromHeader", tokenFromHeader);
                window.localStorage.setItem("tokenFromHeader", tokenFromHeader);
              } catch (e) {}
            }
            token = tokenFromHeader;
          }
        }
        console.log("[DEBUG] alumni/me status:", res.status);
        if (res.ok) {
          if (!didCancel) {
            setRole("alumni");
            roleFetched.current = true;
            setLoading(false);
          }
          return;
        }
        res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        // Cek Set-Cookie di response perusahaan
        const setCookieHeaderPerusahaan = res.headers.get("set-cookie");
        if (setCookieHeaderPerusahaan) {
          const tokenFromHeader = getTokenFromSetCookieHeader(setCookieHeaderPerusahaan);
          if (tokenFromHeader) {
            setHeaderToken(tokenFromHeader);
            if (typeof window !== "undefined") {
              try {
                window.sessionStorage.setItem("tokenFromHeader", tokenFromHeader);
                window.localStorage.setItem("tokenFromHeader", tokenFromHeader);
              } catch (e) {}
            }
            token = tokenFromHeader;
          }
        }
        console.log("[DEBUG] perusahaan/me status:", res.status);
        if (res.ok) {
          if (!didCancel) {
            setRole("perusahaan");
            roleFetched.current = true;
            setLoading(false);
          }
          return;
        }
        res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/admin/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        // Cek Set-Cookie di response admin
        const setCookieHeaderAdmin = res.headers.get("set-cookie");
        if (setCookieHeaderAdmin) {
          const tokenFromHeader = getTokenFromSetCookieHeader(setCookieHeaderAdmin);
          if (tokenFromHeader) {
            setHeaderToken(tokenFromHeader);
            if (typeof window !== "undefined") {
              try {
                window.sessionStorage.setItem("tokenFromHeader", tokenFromHeader);
                window.localStorage.setItem("tokenFromHeader", tokenFromHeader);
              } catch (e) {}
            }
            token = tokenFromHeader;
          }
        }
        console.log("[DEBUG] admin/me status:", res.status);
        if (res.ok) {
          if (!didCancel) {
            setRole("admin");
            roleFetched.current = true;
            setLoading(false);
          }
          return;
        }
        // Jika tidak ada role yang cocok, redirect ke login
        console.warn("[DEBUG] Token is present but no valid role found, redirecting to /login");
        setLoading(false);
        router.replace("/login");
      } catch (err) {
        console.log("[DEBUG] Error in fetchRole:", err);
        setLoading(false);
        router.replace("/login");
      }
    }
    fetchRole();
    return () => {
      didCancel = true;
    };
  }, [router]);

  const handleLoaderFinish = () => {
    if (role || roleFetched.current) {
      setLoading(false);
    }
  };

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
          <Loader onFinish={handleLoaderFinish} />
        </div>
      )}
    </div>
  );
}
