import React, { Suspense } from "react";
import DetailLowonganPageClient from "./DetailLowonganPageClient";

export default function DetailLowonganPage() {
  return (
    <Suspense fallback={
      <div className="max-w-full mx-auto py-16 px-6 text-center text-black font-semibold bg-gray-100 ">
        Memuat detail lowongan...
      </div>
    }>
      <DetailLowonganPageClient />
    </Suspense>
  );
}
