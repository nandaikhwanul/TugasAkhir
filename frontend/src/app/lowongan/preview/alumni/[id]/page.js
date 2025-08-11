"use client";
import { useEffect, useState } from "react";
import Navbar from "../../../../navbar/page";

// Helper: konversi plain text ke HTML (ganti \n dengan <br>)
function plainTextToHtml(str) {
  if (!str) return "";
  // Escape HTML entities
  const escape = (s) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  return escape(str).replace(/\n/g, "<br>");
}

// Ambil id dari URL
function getIdFromUrl() {
  if (typeof window === "undefined") return null;
  const pathParts = window.location.pathname.split("/");
  return pathParts[pathParts.length - 1];
}

export default function PreviewLowongan() {
  const [lowongan, setLowongan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [id, setId] = useState(null);
  const [lamarLoading, setLamarLoading] = useState(false);
  const [lamarSuccess, setLamarSuccess] = useState("");
  const [lamarError, setLamarError] = useState("");

  useEffect(() => {
    setId(getIdFromUrl());
  }, []);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    async function fetchLowongan() {
      setLoading(true);
      setError("");
      try {
        // Ambil token dari cookie
        let token = null;
        if (typeof document !== "undefined") {
          const cookies = document.cookie.split(";").map((c) => c.trim());
          for (const c of cookies) {
            if (c.startsWith("token=")) {
              token = decodeURIComponent(c.substring("token=".length));
              break;
            }
          }
        }
        if (!token) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(
          `https://tugasakhir-production-6c6c.up.railway.app/lowongan/preview/alumni/${id}`,
          { headers }
        );
        if (res.status === 401 || res.status === 403) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }
        if (!res.ok) {
          throw new Error("Gagal mengambil data lowongan");
        }
        const data = await res.json();
        if (!ignore) {
          setLowongan(data.preview);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Terjadi kesalahan");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchLowongan();
    return () => {
      ignore = true;
    };
  }, [id]);

  function formatDeskripsi(str) {
    if (!str) return "<i>Tidak ada deskripsi</i>";
    return plainTextToHtml(str);
  }

  function formatKualifikasi(str) {
    if (!str) return "<i>Tidak ada syarat</i>";
    if (/<[a-z][\s\S]*>/i.test(str)) {
      return str;
    }
    return plainTextToHtml(str);
  }

  // Fungsi untuk handle lamar
  async function handleLamar() {
    setLamarLoading(true);
    setLamarSuccess("");
    setLamarError("");
    try {
      // Ambil token dari cookie
      let token = null;
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";").map((c) => c.trim());
        for (const c of cookies) {
          if (c.startsWith("token=")) {
            token = decodeURIComponent(c.substring("token=".length));
            break;
          }
        }
      }
      if (!token) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pelamar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lowongan: id }),
      });
      if (res.status === 401 || res.status === 403) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        // Tampilkan pesan error dari backend jika ada
        throw new Error(data?.message || data?.msg || "Gagal melamar lowongan");
      }
      setLamarSuccess("Berhasil melamar lowongan!");
    } catch (err) {
      setLamarError(err.message || "Terjadi kesalahan saat melamar");
    } finally {
      setLamarLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="w-full flex justify-center items-center py-10">
          <span className="text-black">Memuat preview lowongan...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="w-full flex justify-center items-center py-10">
          <span className="text-black">{error}</span>
        </div>
      </>
    );
  }

  if (!lowongan) {
    return null;
  }

  return (
    <>
      <Navbar />
      <section className="max-w-2xl mx-auto my-8 bg-white rounded-lg shadow p-6 text-black">
        <h1 className="text-2xl font-bold mb-2 text-black">{lowongan.judul_pekerjaan || "Judul Lowongan"}</h1>
        <div className="mb-2 text-black">
          <span className="font-semibold text-black">Perusahaan:</span>{" "}
          {typeof lowongan.perusahaan === "string"
            ? lowongan.perusahaan
            : (lowongan.perusahaan && (lowongan.perusahaan.nama || lowongan.perusahaan.nama_perusahaan))
              ? (lowongan.perusahaan.nama || lowongan.perusahaan.nama_perusahaan)
              : "-"}
        </div>
        <div className="mb-2 text-black">
          <span className="font-semibold text-black">Lokasi:</span>{" "}
          {lowongan.lokasi || "-"}
        </div>
        <div className="mb-2 text-black">
          <span className="font-semibold text-black">Tipe Kerja:</span>{" "}
          {lowongan.tipe_kerja || "-"}
        </div>
        <div className="mb-2 text-black">
          <span className="font-semibold text-black">Gaji:</span>{" "}
          {lowongan.gaji || "-"}
        </div>
        <div className="mb-2 text-black">
          <span className="font-semibold text-black">Batas Lamaran:</span>{" "}
          {lowongan.batas_lamaran
            ? new Date(lowongan.batas_lamaran).toLocaleDateString("id-ID")
            : "-"}
        </div>
        <div className="mb-4 text-black">
          <span className="font-semibold text-black">Status:</span>{" "}
          {lowongan.status || "-"}
        </div>
        <div className="mb-4">
          <h2 className="font-semibold mb-1 text-black">Deskripsi Lowongan</h2>
          <div
            className="prose prose-sm max-w-none text-black"
            style={{ color: "black" }}
            dangerouslySetInnerHTML={{
              __html: formatDeskripsi(lowongan.deskripsi),
            }}
          />
        </div>
        <div className="mb-4">
          <h2 className="font-semibold mb-1 text-black">Syarat & Kualifikasi</h2>
          <div
            className="prose prose-sm max-w-none text-black"
            style={{ color: "black" }}
            dangerouslySetInnerHTML={{
              __html: formatKualifikasi(lowongan.kualifikasi),
            }}
          />
        </div>
        <div className="mb-4 flex flex-col items-start">
          <button
            onClick={handleLamar}
            disabled={lamarLoading}
            className={`bg-blue-600 text-white px-6 py-2 rounded font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {lamarLoading ? "Melamar..." : "Lamar Lowongan"}
          </button>
          {lamarSuccess && (
            <div className="mt-2 text-green-600 font-semibold">{lamarSuccess}</div>
          )}
          {lamarError && (
            <div className="mt-2 text-red-600 font-semibold">{lamarError}</div>
          )}
        </div>
      </section>
    </>
  );
}
