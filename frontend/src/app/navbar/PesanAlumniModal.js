import React, { useEffect, useState } from "react";
import { IoMailOutline } from "react-icons/io5"; // Ionicons mail-outline

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

export default function PesanAlumniModal({ open, onClose }) {
  const [pesanList, setPesanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  // Untuk animasi: handle show/hide dengan delay
  useEffect(() => {
    if (open) {
      setShow(true);
    } else {
      // Delay agar animasi keluar sempat jalan
      const timeout = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchPesan = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setError("Token tidak ditemukan. Silakan login ulang.");
          setLoading(false);
          return;
        }
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pesan/alumni/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Gagal mengambil pesan.");
        }
        const data = await res.json();
        setPesanList(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError(err?.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };
    fetchPesan();
  }, [open]);

  if (!show) return null;

  // Animasi: fade-in & scale modal, fade backdrop
  // Tailwind: transition, duration-200, ease-out, opacity, scale
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
         bg-opacity-40 backdrop-blur-xs
        transition-opacity duration-200
        ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      style={{ transitionProperty: "opacity, background-color" }}
    >
      <div
        className={`
          bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative
          transform transition-all duration-200
          ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
        style={{ transitionProperty: "opacity, transform" }}
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Tutup"
          type="button"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <IoMailOutline className="inline-block text-blue-500 text-2xl" />
          Pesan untuk Anda
        </h2>
        {loading && <div>Memuat pesan...</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {!loading && !error && pesanList.length === 0 && (
          <div>Tidak ada pesan.</div>
        )}
        {/* Tambahkan scroll pada daftar pesan */}
        <div className="max-h-96 overflow-y-auto">
          <ul className="space-y-4">
            {pesanList.map((pesan, idx) => {
              // Ambil nama_perusahaan dan role dari pengirim jika ada
              let namaPerusahaan = "";
              let rolePengirim = "";
              if (
                pesan &&
                pesan.pengirim &&
                typeof pesan.pengirim === "object"
              ) {
                if (pesan.pengirim.nama_perusahaan) {
                  namaPerusahaan = pesan.pengirim.nama_perusahaan;
                }
                if (pesan.pengirim.role) {
                  rolePengirim = pesan.pengirim.role;
                }
              }
              return (
                <li
                  key={pesan._id || idx}
                  className="border rounded p-3 bg-gray-50"
                >
                  <div className="font-semibold text-gray-800 mb-1 flex items-center gap-1">
                    <IoMailOutline className="inline-block text-blue-400 mr-1" />
                    {pesan.judul || "Pesan"}
                    {namaPerusahaan && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        dari <span className="font-semibold">{namaPerusahaan}</span>
                        {rolePengirim && (
                          <span className="ml-1 text-gray-400 font-normal">
                            ({rolePengirim})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-700 whitespace-pre-line">
                    {pesan.isi || pesan.pesan || "-"}
                  </div>
                  {pesan.createdAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(pesan.createdAt).toLocaleString("id-ID")}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
