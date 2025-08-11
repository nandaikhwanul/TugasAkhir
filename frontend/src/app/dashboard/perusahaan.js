import { useState, useEffect } from "react";
import PerusahaanStepper from "../stepperRegister/perusahaanStepper/page";
import PerusahaanDashboard from "./perusahaan/page";

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

export default function DashboardPerusahaan() {
  const [showModal, setShowModal] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerusahaan() {
      const token = getTokenFromCookie();
      if (!token) {
        setShowModal(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/perusahaan/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          setShowModal(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        // Cek field yang diminta
        const requiredFields = [
          "alamat",
          "bidang_perusahaan",
          "deskripsi_perusahaan",
          "jumlah_karyawan",
          "nama_brand",
          "nomor_telp",
          "website",
        ];
        // Field yang bertipe number
        const numberFields = ["jumlah_karyawan"];
        // Jika SEMUA ADA (tidak null/undefined/empty string untuk string, dan !== undefined/null untuk number), modal tidak tampil
        const allFilled = requiredFields.every((field) => {
          if (numberFields.includes(field)) {
            // Untuk number, cukup cek !== undefined && !== null
            return data[field] !== undefined && data[field] !== null;
          } else {
            // Untuk string, cek !== undefined && !== null && .trim() !== ""
            return (
              data[field] !== undefined &&
              data[field] !== null &&
              typeof data[field] === "string" &&
              data[field].trim() !== ""
            );
          }
        });
        setShowModal(!allFilled);
      } catch (e) {
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPerusahaan();
  }, []);

  // Jangan render apapun sampai loading selesai (opsional, bisa ganti dengan spinner)
  if (loading) return null;

  return (
    <>
      {/* Modal for PerusahaanStepper */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs"
        >
          <div className="relative bg-white rounded-xl shadow-lg max-w-xl w-full mx-4">
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowModal(false)}
              aria-label="Tutup"
              type="button"
            >
              ×
            </button>
            <PerusahaanStepper />
          </div>
        </div>
      )}
      <PerusahaanDashboard />
    </>
  );
}
