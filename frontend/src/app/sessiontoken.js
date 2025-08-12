// middleware.js

import { NextResponse } from "next/server";

// Fungsi client-side: ambil token dari sessionStorage
export function getTokenFromSessionStorage() {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("token") || null;
  }
  return null;
}

// Middleware server-side: cek token dari cookie
export function middleware(req) {
  const token = req.cookies.get("token")?.value;

  // Kalau token tidak ada, redirect ke login dengan callbackUrl
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token ada, lanjutkan akses
  return NextResponse.next();
}

// Path yang dilindungi middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/user/:path*",
  ],
};
