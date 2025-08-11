"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Helper: Ambil pelamarId dan lowonganId dari query string (URL)
function getIdsFromQuery() {
  if (typeof window === "undefined") return { pelamarId: "", lowonganId: "" };
  const params = new URLSearchParams(window.location.search);
  const pelamarId = params.get("pelamarId") || "";
  const lowonganId = params.get("lowonganId") || "";
  return { pelamarId, lowonganId };
}

// Helper: fallback pelamarId dari path (untuk kompatibilitas lama)
function getPelamarIdFromPath() {
  if (typeof window === "undefined") return "";
  const path = window.location.pathname;
  const pelamarMatch = path.match(/pelamar\/([^\/]+)(?:\/)?$/i);
  if (pelamarMatch && pelamarMatch[1]) {
    return pelamarMatch[1];
  }
  const detailMatch = path.match(/detailPelamar\/([^\/]+)(?:\/)?$/i);
  if (detailMatch && detailMatch[1]) {
    return detailMatch[1];
  }
  const segments = path.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (/^[a-fA-F0-9]{24,}$/.test(last)) {
    return last;
  }
  return "";
}

// Helper: Ambil token dari cookie
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

// Helper: Ambil data alumni dari pelamar (bisa null)
function getAlumni(pelamar) {
  if (!pelamar) return null;
  if (pelamar.alumni) return pelamar.alumni;
  // fallback: jika pelamar sudah alumni langsung (untuk kompat lama)
  return pelamar;
}

// Helper: Resolve URL foto profil alumni
function getProfileImageUrl(foto_profil) {
  if (!foto_profil) return "";
  // Sudah URL absolut
  if (/^https?:\/\//i.test(foto_profil)) return foto_profil;
  // Asumsi path relatif dari backend
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/${foto_profil}`;
}

// Helper: Ambil inisial dari nama
function getInitials(name) {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() || "";
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function DetailPelamarPage({ open = true, onClose, pelamar: pelamarProp }) {
  // Support modal mode (dari prop) dan standalone page mode
  const [pelamar, setPelamar] = useState(pelamarProp || null);
  const [loading, setLoading] = useState(!pelamarProp);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Jika sudah ada pelamar dari prop (modal), tidak perlu fetch
    if (pelamarProp) {
      setPelamar(pelamarProp);
      setLoading(false);
      setError("");
      return;
    }

    let ignore = false;
    const fetchPelamar = async () => {
      setLoading(true);
      setError("");
      setPelamar(null);

      // Ambil dari query string
      let { pelamarId } = getIdsFromQuery();
      // Fallback ke path jika tidak ada di query
      if (!pelamarId) {
        pelamarId = getPelamarIdFromPath();
      }

      const token = getTokenFromCookie();

      if (!pelamarId) {
        setError("ID pelamar tidak ditemukan di URL (query string pelamarId).");
        setLoading(false);
        return;
      }
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(
          `https://tugasakhir-production-6c6c.up.railway.app/perusahaan/pelamar/${pelamarId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        if (!res.ok) {
          let data = {};
          try {
            data = await res.json();
          } catch (e) {}
          const msg = data.message || data.msg || "Gagal mengambil data pelamar.";
          if (
            res.status === 401 ||
            /token.*expired|token.*invalid|jwt.*expired|jwt.*invalid/i.test(msg)
          ) {
            router.push("/login");
            return;
          }
          throw new Error(msg);
        }
        const data = await res.json();
        if (!ignore) setPelamar(data.pelamar);
      } catch (err) {
        if (!ignore) setError(err.message || "Terjadi kesalahan.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchPelamar();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pelamarProp]);

  // Modal close handler (jika ada onClose)
  const handleClose = () => {
    if (onClose) onClose();
  };

  if (!open) return null;

  if (loading) {
    return (
      <div className="p-4">
        <p>Memuat data pelamar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>{error}</p>
        {onClose && (
          <button
            className="mt-4 px-4 py-2 bg-gray-200 rounded"
            onClick={handleClose}
          >
            Tutup
          </button>
        )}
      </div>
    );
  }

  if (!pelamar) {
    return (
      <div className="p-4">
        <p>Data pelamar tidak ditemukan.</p>
        {onClose && (
          <button
            className="mt-4 px-4 py-2 bg-gray-200 rounded"
            onClick={handleClose}
          >
            Tutup
          </button>
        )}
      </div>
    );
  }

  // Perbaikan: Ambil data alumni dari pelamar
  const alumni = getAlumni(pelamar);

  // Pakai getProfileImageUrl untuk resolve foto_profil
  const fotoProfilUrl = alumni && alumni.foto_profil ? getProfileImageUrl(alumni.foto_profil) : "";

  // Komponen avatar inisial fallback
  function InitialsAvatar({ name }) {
    const initials = getInitials(name);
    return (
      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2 text-3xl text-gray-500 select-none">
        {initials || "?"}
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto p-6 bg-white rounded shadow ${onClose ? "relative" : ""}`}>
      {onClose && (
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={handleClose}
          aria-label="Tutup"
        >
          &times;
        </button>
      )}
      <div className="flex flex-col items-center mb-6">
        {alumni && alumni.foto_profil && !imgError ? (
          <img
            src={fotoProfilUrl}
            alt="Foto Profil"
            className="w-24 h-24 rounded-full object-cover mb-2"
            onError={() => setImgError(true)}
            style={{ background: "#e5e7eb" }}
          />
        ) : (
          <InitialsAvatar name={alumni && (alumni.name || alumni.nama)} />
        )}
        <h2 className="text-xl font-semibold text-black">{alumni && (alumni.name || alumni.nama) ? (alumni.name || alumni.nama) : "-"}</h2>
        <p className="text-black">{alumni && alumni.email ? alumni.email : "-"}</p>
      </div>
      <div className="space-y-2">
        <div>
          <span className="font-medium">NIM:</span> <span className="text-black">{alumni && alumni.nim ? alumni.nim : "-"}</span>
        </div>
        <div>
          <span className="font-medium">No HP:</span> <span className="text-black">{alumni && alumni.nohp ? alumni.nohp : "-"}</span>
        </div>
        <div>
          <span className="font-medium">Alamat:</span> <span className="text-black">{alumni && alumni.alamat ? alumni.alamat : "-"}</span>
        </div>
        <div>
          <span className="font-medium">Program Studi:</span> <span className="text-black">{alumni && alumni.program_studi ? alumni.program_studi : "-"}</span>
        </div>
        <div>
          <span className="font-medium">Tahun Lulus:</span> <span className="text-black">{alumni && alumni.tahun_lulus ? alumni.tahun_lulus : "-"}</span>
        </div>
        <div>
          <span className="font-medium">Email:</span> <span className="text-black">{alumni && alumni.email ? alumni.email : "-"}</span>
        </div>
      </div>
    </div>
  );
}
