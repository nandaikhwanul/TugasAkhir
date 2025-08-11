"use client";
import { Suspense } from "react";
import NavbarPage from "../navbar/page";

// Suspense fallback UI
function LoadingPelamarList() {
  return (
    <div className="min-h-screen bg-[#f3f2ef] py-8 px-2 flex flex-col items-center">
      <NavbarPage />
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-[#1d2226] text-center">Daftar Pelamar</h1>
        <div className="mb-4 text-blue-600 font-semibold text-center">Memuat data pelamar...</div>
      </div>
    </div>
  );
}

// Suspended PelamarListPage (sudah dipindah ke file lain)
function PelamarListPageSuspended() {
  // Suspensi, tidak ada isi di sini.
  return null;
}

export default function PelamarListPage() {
  return (
    <Suspense fallback={<LoadingPelamarList />}>
      <PelamarListPageSuspended />
    </Suspense>
  );
}