// Persistent Login Middleware Next.js App Router (app/middleware.js) untuk handle token pakai next/headers

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Catatan: Middleware hanya berjalan di server. Untuk mengatasi masalah state React yang hilang saat reload/tab baru,
// pastikan di client-side (React), token SELALU diambil dari cookie setiap render/page load (misal via getTokenFromCookie di useEffect).
// Middleware ini hanya memastikan proteksi route di sisi server.

// Fungsi untuk set token ke cookie (server-side, Next.js App Router) dengan persistent (30 menit)
export function setTokenToCookie(token, options = {}) {
  if (!token) throw new Error("Token harus diberikan");
  const defaultOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30, // 30 menit
    ...options,
  };
  cookies().set("token", token, defaultOptions);
}

// Ambil token dari cookie (server-side, Next.js App Router)
export function getTokenFromCookie() {
  return cookies().get("token")?.value || null;
}

// Fungsi baru: redirect user ke dashboard jika ada token, ke login jika tidak ada
export function redirectBasedOnToken(request) {
  const token = cookies().get("token")?.value;
  if (token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Middleware Next.js untuk proteksi route (Persistent Login)
export function middleware(request) {
  const token = cookies().get("token")?.value;
  // Jika tidak ada token, redirect ke /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Jika ada token, lanjutkan request
  return NextResponse.next();
}

// === PENTING UNTUK CLIENT-SIDE (React) ===
// Di komponen React (misal dashboard/page.js), JANGAN simpan token di state saja.
// Selalu ambil token dari cookie setiap render/page load (misal pakai getTokenFromCookie di useEffect).
// Dengan begitu, status login tetap terjaga walau reload/tab baru, karena cookie bersifat persistent.
