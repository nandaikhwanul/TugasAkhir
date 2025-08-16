import { useState, useEffect } from "react";
import PerusahaanStepper from "../stepperRegister/perusahaanStepper/page";
import PerusahaanDashboard from "./perusahaan/page";
import { getTokenFromSessionStorage } from "../sessiontoken"; // Ambil token dari sessiontoken.js

export default function DashboardPerusahaan() {
  const [showModal, setShowModal] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerusahaan() {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setShowModal(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
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

        // Field yang WAJIB dicek (dari instruksi)
        const requiredFields = [
          "email_perusahaan",
          "alamat",
          "bidang_perusahaan",
          "deskripsi_perusahaan",
          "jumlah_karyawan",
          "nama_brand",
          "nomor_telp",
          "website",
        ];

        // Cek: jika ADA field di atas yang null atau undefined, tampilkan modal. Jika SEMUA field sudah terisi, JANGAN tampilkan modal.
        const adaYangNullOrUndef = requiredFields.some((field) => data[field] === null || data[field] === undefined);

        setShowModal(adaYangNullOrUndef);
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
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs "
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
