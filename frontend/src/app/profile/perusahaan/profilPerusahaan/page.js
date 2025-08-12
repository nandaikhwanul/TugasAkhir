"use client";
import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import {
  IoLogoLinkedin,
  IoLogoInstagram,
  IoLogoFacebook,
  IoLogoTwitter,
  IoLogoTiktok,
  IoLogoYoutube,
  IoLogoWhatsapp,
  IoPaperPlane,
  IoGlobeOutline,
} from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import komponen/folder Foto
import FotoPerusahaanPage from "../foto/page";

// Pakai helper dari sessiontoken
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Helper: get perusahaan id from token (JWT)
function getPerusahaanIdFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || null;
  } catch (e) {
    return null;
  }
}

// Helper: resolve logo url
function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${logo_perusahaan}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo_perusahaan}`;
}

// Social options with Ionicons and base URLs
const SOCIAL_OPTIONS = [
  {
    label: "LinkedIn",
    key: "linkedin",
    icon: <IoLogoLinkedin className="inline mr-1 text-blue-700" />,
    baseUrl: "https://linkedin.com/company/",
    placeholder: "nama-perusahaan",
  },
  {
    label: "Instagram",
    key: "instagram",
    icon: <IoLogoInstagram className="inline mr-1 text-pink-500" />,
    baseUrl: "https://instagram.com/",
    placeholder: "username",
  },
  {
    label: "Facebook",
    key: "facebook",
    icon: <IoLogoFacebook className="inline mr-1 text-blue-600" />,
    baseUrl: "https://facebook.com/",
    placeholder: "username",
  },
  {
    label: "Twitter (X)",
    key: "twitter",
    icon: <IoLogoTwitter className="inline mr-1 text-black" />,
    baseUrl: "https://twitter.com/",
    placeholder: "username",
  },
  {
    label: "TikTok",
    key: "tiktok",
    icon: <IoLogoTiktok className="inline mr-1 text-black" />,
    baseUrl: "https://tiktok.com/@",
    placeholder: "username",
  },
  {
    label: "YouTube",
    key: "youtube",
    icon: <IoLogoYoutube className="inline mr-1 text-red-600" />,
    baseUrl: "https://youtube.com/",
    placeholder: "channel/ID atau @username",
  },
  {
    label: "WhatsApp Business",
    key: "whatsapp",
    icon: <IoLogoWhatsapp className="inline mr-1 text-green-600" />,
    baseUrl: "https://wa.me/",
    placeholder: "nomor (cth: 6281234567890)",
  },
  {
    label: "Telegram Channel",
    key: "telegram",
    icon: <IoPaperPlane className="inline mr-1 text-blue-400" />,
    baseUrl: "https://t.me/",
    placeholder: "username",
  },
  {
    label: "Website",
    key: "website",
    icon: <IoGlobeOutline className="inline mr-1 text-gray-600" />,
    baseUrl: "https://",
    placeholder: "yourcompany.com",
  },
  {
    label: "Lainnya (custom)",
    key: "custom",
    icon: null,
    baseUrl: "https://",
    placeholder: "custom-url.com",
  },
];

export default function ProfilPerusahaanPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State untuk media sosial: { website: "...", instagram: "...", ... }
  const [media, setMedia] = useState({});
  const [addMediaOpen, setAddMediaOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState("");
  const [mediaValue, setMediaValue] = useState("");
  const [customKey, setCustomKey] = useState(""); // Untuk custom key

  // Fetch perusahaan profile
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const token = getTokenFromSessionStorage();
      if (!token) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);

          // Inisialisasi media sosial dari data
          // website: string, media_sosial: { instagram: "...", linkedin: "...", ... }
          let initialMedia = {};
          if (data.website) {
            initialMedia.website = data.website;
          }
          if (data.media_sosial && typeof data.media_sosial === "object") {
            Object.entries(data.media_sosial).forEach(([key, value]) => {
              if (value) initialMedia[key] = value;
            });
          }
          setMedia(initialMedia);
        } else {
          setProfile(null);
        }
      } catch (e) {
        setProfile(null);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // Handler tambah media sosial
  function handleAddMedia() {
    if (!selectedMedia) return;
    let key = selectedMedia;
    let baseUrl = "";
    if (selectedMedia === "custom") {
      if (!customKey.trim()) return;
      key = customKey.trim().toLowerCase();
      // validasi key custom (tidak boleh sama dengan yang sudah ada)
      if (media[key]) {
        toast.error("Media sosial custom dengan nama tersebut sudah ada.");
        return;
      }
      baseUrl = "https://";
    } else {
      const opt = SOCIAL_OPTIONS.find((o) => o.key === selectedMedia);
      baseUrl = opt?.baseUrl || "https://";
    }
    if (!mediaValue) {
      toast.error("Silakan isi username atau url media sosial.");
      return;
    }
    if (media[key]) {
      toast.error("Media sosial tersebut sudah ditambahkan.");
      return; // Cek duplikat
    }

    // Simpan hanya bagian yang diisi user (tanpa baseUrl) di state
    setMedia((prev) => ({
      ...prev,
      [key]: mediaValue,
    }));
    setSelectedMedia("");
    setMediaValue("");
    setCustomKey("");
    setAddMediaOpen(false);
    toast.success("Media sosial berhasil ditambahkan.");
  }

  // Handler hapus media sosial
  function handleRemoveMedia(type) {
    setMedia((prev) => {
      const copy = { ...prev };
      delete copy[type];
      return copy;
    });
    toast.info("Media sosial dihapus.");
  }

  // Handler simpan perubahan (PATCH ke backend)
  async function handleSave() {
    const token = getTokenFromSessionStorage();
    if (!token) {
      toast.error("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    const perusahaanId = getPerusahaanIdFromToken(token);
    if (!perusahaanId) {
      toast.error("Gagal mendapatkan ID perusahaan dari token.");
      return;
    }
    // website: string, media_sosial: { ... }
    // Pisahkan website dari media sosial lain
    const { website, ...mediaSosial } = media;
    try {
      const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/perusahaan/${perusahaanId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          website: website || "",
          media_sosial: mediaSosial,
        }),
      });
      if (res.ok) {
        toast.success("Media sosial berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan media sosial.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    }
  }

  if (loading) {
    return (
      <>
        <ToastContainer />
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <ToastContainer />
        <div className="p-8 text-center text-red-500">
          Gagal memuat profil perusahaan.
        </div>
      </>
    );
  }

  // Untuk menampilkan label media sosial
  function getLabel(key) {
    const opt = SOCIAL_OPTIONS.find((o) => o.key === key);
    if (opt) return (
      <span className="flex items-center gap-1">
        {opt.icon}
        {opt.label}
      </span>
    );
    // Capitalize custom key
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  // Untuk menampilkan url lengkap (dengan baseUrl) di tampilan
  function getFullUrl(key, value) {
    const opt = SOCIAL_OPTIONS.find((o) => o.key === key);
    if (key === "custom" || !opt) {
      // Untuk custom, value sudah url penuh
      return value.startsWith("http") ? value : "https://" + value;
    }
    // Website: jika value sudah ada http, tampilkan apa adanya
    if (key === "website") {
      return value.startsWith("http") ? value : "https://" + value;
    }
    // Lainnya: baseUrl + value
    return (opt.baseUrl || "https://") + value;
  }

  return (
    <>
      <ToastContainer />
      <div className="w-full px-0 sm:px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 rounded-lg relative top-20">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={getLogoUrl(profile.logo_perusahaan)}
            alt="Logo Perusahaan"
            className="w-14 h-14 rounded bg-gray-100 object-cover"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-500">{profile.nama_perusahaan}</h2>
            <div className="text-gray-500 text-sm">{profile.email_perusahaan}</div>
          </div>
        </div>
        {/* Container Media Sosial */}
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-gray-500">Media Sosial & Website</label>
          <div className="space-y-2">
            {Object.keys(media).length === 0 && (
              <div className="text-gray-400 text-sm">Belum ada media sosial.</div>
            )}
            {Object.entries(media).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                <span className="font-medium w-36 text-gray-700">{getLabel(key)}</span>
                <a
                  href={getFullUrl(key, value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all flex-1 text-sm"
                >
                  {getFullUrl(key, value)}
                </a>
                <button
                  className="p-1 text-red-500 hover:bg-red-100 rounded transition"
                  onClick={() => handleRemoveMedia(key)}
                  title="Hapus"
                  type="button"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
          {/* Tombol tambah media */}
          <div className="mt-3">
            {!addMediaOpen ? (
              <button
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm transition"
                onClick={() => setAddMediaOpen(true)}
                type="button"
              >
                <FiPlus /> Tambah Media Sosial / Website
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <select
                  className="border rounded px-2 py-1 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={selectedMedia}
                  onChange={(e) => {
                    setSelectedMedia(e.target.value);
                    setCustomKey("");
                    setMediaValue("");
                  }}
                >
                  <option value="">Pilih media</option>
                  {SOCIAL_OPTIONS.filter(
                    (opt) => !media[opt.key] || opt.key === "custom"
                  ).map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {selectedMedia === "custom" && (
                  <input
                    className="border rounded px-2 py-1 flex-1 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="text"
                    placeholder="Nama media (misal: tiktok)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                )}
                {/* Input field: show baseUrl as prefix, user only types username/slug */}
                <div className="flex flex-1 min-w-0">
                  <span className="inline-flex items-center px-2 border border-r-0 rounded-l bg-gray-100 text-gray-500 text-sm select-none">
                    {(() => {
                      if (!selectedMedia) return "";
                      if (selectedMedia === "custom") return "https://";
                      const opt = SOCIAL_OPTIONS.find((o) => o.key === selectedMedia);
                      return opt?.baseUrl || "https://";
                    })()}
                  </span>
                  <input
                    className="border rounded-r px-2 py-1 flex-1 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="text"
                    placeholder={
                      selectedMedia === "custom"
                        ? "custom-url.com"
                        : SOCIAL_OPTIONS.find((o) => o.key === selectedMedia)?.placeholder ||
                          "username"
                    }
                    value={mediaValue}
                    onChange={(e) => setMediaValue(e.target.value)}
                    style={{ minWidth: 0 }}
                  />
                </div>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={handleAddMedia}
                  type="button"
                >
                  Simpan
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                  onClick={() => {
                    setAddMediaOpen(false);
                    setSelectedMedia("");
                    setMediaValue("");
                    setCustomKey("");
                  }}
                  type="button"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
          <div className="mt-6">
            <button
              className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              onClick={handleSave}
              type="button"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
        {/* Folder/komponen Foto diletakkan di bawah/diluar container media sosial */}
        <FotoPerusahaanPage profile={profile} />
        {/* TODO: Tambahkan field lain sesuai kebutuhan profil perusahaan */}
        {/* TODO: Validasi custom media sosial agar tidak duplikat dan format url */}
      </div>
    </>
  );
}
