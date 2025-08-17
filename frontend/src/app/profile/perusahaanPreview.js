import React, { useState, useEffect } from 'react';
// Import token getter from sessiontoken
import { getTokenFromSessionStorage } from '../sessiontoken';

// Import react-icons for website and social media
import {
  FaInstagram,
  FaLinkedin,
  FaFacebook,
  FaGlobe,
  FaTwitter,
  FaYoutube,
  FaWhatsapp,
  FaTelegramPlane,
  FaTiktok,
  FaDiscord,
  FaPinterest,
  FaGithub,
  FaEnvelope,
  FaLine,
  FaRedditAlien,
  FaSnapchatGhost,
  FaTwitch,
  FaWeibo,
  FaMedium,
  FaSlack,
  FaDribbble,
  FaVimeoV,
  FaTumblr,
  FaSoundcloud,
  FaSpotify,
  FaStackOverflow,
  FaTelegram,
} from 'react-icons/fa';

const API_BASE_URL = 'https://tugasakhir-production-6c6c.up.railway.app';

const FIELD_LIST = [
  'nama_perusahaan',
  'nama_brand',
  'jumlah_karyawan',
  'alamat',
  'bidang_perusahaan',
  'nomor_telp',
  'website',
  'deskripsi_perusahaan',
];

// Helper: resolve logo url
function getLogoUrl(logo_perusahaan) {
  if (!logo_perusahaan) return "";
  if (/^https?:\/\//.test(logo_perusahaan)) return logo_perusahaan;
  if (logo_perusahaan.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${logo_perusahaan}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${logo_perusahaan}`;
}

// Helper: resolve cover url
function getCoverUrl(foto_cover) {
  if (!foto_cover) return "";
  if (/^https?:\/\//.test(foto_cover)) return foto_cover;
  // Always treat as /uploads/perusahaan/ path
  if (foto_cover.startsWith("/uploads/")) {
    return `https://tugasakhir-production-6c6c.up.railway.app${foto_cover}`;
  }
  return `https://tugasakhir-production-6c6c.up.railway.app/uploads/perusahaan/${foto_cover}`;
}

// Socials config for react-icons
const SOCIALS = [
  {
    key: 'instagram',
    label: 'Instagram',
    color: 'bg-gradient-to-tr from-pink-500 to-yellow-400 text-white',
    icon: <FaInstagram className="w-5 h-5" />,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    color: 'bg-[#0077B5] text-white',
    icon: <FaLinkedin className="w-5 h-5" />,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    color: 'bg-[#1877F3] text-white',
    icon: <FaFacebook className="w-5 h-5" />,
  },
  {
    key: 'twitter',
    label: 'Twitter',
    color: 'bg-[#1DA1F2] text-white',
    icon: <FaTwitter className="w-5 h-5" />,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    color: 'bg-[#FF0000] text-white',
    icon: <FaYoutube className="w-5 h-5" />,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    color: 'bg-[#25D366] text-white',
    icon: <FaWhatsapp className="w-5 h-5" />,
  },
  {
    key: 'telegram',
    label: 'Telegram',
    color: 'bg-[#229ED9] text-white',
    icon: <FaTelegramPlane className="w-5 h-5" />,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    color: 'bg-[#010101] text-white',
    icon: <FaTiktok className="w-5 h-5" />,
  },
  {
    key: 'discord',
    label: 'Discord',
    color: 'bg-[#5865F2] text-white',
    icon: <FaDiscord className="w-5 h-5" />,
  },
  {
    key: 'pinterest',
    label: 'Pinterest',
    color: 'bg-[#E60023] text-white',
    icon: <FaPinterest className="w-5 h-5" />,
  },
  {
    key: 'github',
    label: 'GitHub',
    color: 'bg-[#333] text-white',
    icon: <FaGithub className="w-5 h-5" />,
  },
  {
    key: 'email',
    label: 'Email',
    color: 'bg-[#EA4335] text-white',
    icon: <FaEnvelope className="w-5 h-5" />,
  },
  {
    key: 'line',
    label: 'LINE',
    color: 'bg-[#00C300] text-white',
    icon: <FaLine className="w-5 h-5" />,
  },
  {
    key: 'reddit',
    label: 'Reddit',
    color: 'bg-[#FF4500] text-white',
    icon: <FaRedditAlien className="w-5 h-5" />,
  },
  {
    key: 'snapchat',
    label: 'Snapchat',
    color: 'bg-[#FFFC00] text-black',
    icon: <FaSnapchatGhost className="w-5 h-5" />,
  },
  {
    key: 'twitch',
    label: 'Twitch',
    color: 'bg-[#9146FF] text-white',
    icon: <FaTwitch className="w-5 h-5" />,
  },
  {
    key: 'weibo',
    label: 'Weibo',
    color: 'bg-[#E6162D] text-white',
    icon: <FaWeibo className="w-5 h-5" />,
  },
  {
    key: 'medium',
    label: 'Medium',
    color: 'bg-[#00ab6c] text-white',
    icon: <FaMedium className="w-5 h-5" />,
  },
  {
    key: 'slack',
    label: 'Slack',
    color: 'bg-[#4A154B] text-white',
    icon: <FaSlack className="w-5 h-5" />,
  },
  {
    key: 'dribbble',
    label: 'Dribbble',
    color: 'bg-[#EA4C89] text-white',
    icon: <FaDribbble className="w-5 h-5" />,
  },
  {
    key: 'vimeo',
    label: 'Vimeo',
    color: 'bg-[#1ab7ea] text-white',
    icon: <FaVimeoV className="w-5 h-5" />,
  },
  {
    key: 'tumblr',
    label: 'Tumblr',
    color: 'bg-[#36465D] text-white',
    icon: <FaTumblr className="w-5 h-5" />,
  },
  {
    key: 'soundcloud',
    label: 'SoundCloud',
    color: 'bg-[#FF5500] text-white',
    icon: <FaSoundcloud className="w-5 h-5" />,
  },
  {
    key: 'spotify',
    label: 'Spotify',
    color: 'bg-[#1DB954] text-white',
    icon: <FaSpotify className="w-5 h-5" />,
  },
  {
    key: 'stackoverflow',
    label: 'Stack Overflow',
    color: 'bg-[#F48024] text-white',
    icon: <FaStackOverflow className="w-5 h-5" />,
  },
  // Add more as needed
];

const PerusahaanPreview = () => {
  const [profile, setProfile] = useState({});
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getTokenFromSessionStorage();
        if (!token) throw new Error('Token tidak ditemukan.');

        const res = await fetch(`${API_BASE_URL}/perusahaan/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Gagal mengambil data profil.');

        const data = await res.json();
        setProfile(data);
        setFormData(data);
        setLogoPreview(getLogoUrl(data.logo_perusahaan));
        setCoverPreview(getCoverUrl(data.foto_cover));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file change
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else if (type === 'cover') {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Handle update
  const handleUpdate = async () => {
    setIsLoading(true);
    setError(null);

    if (!profile._id) {
      setError('ID profil tidak ditemukan. Gagal memperbarui.');
      setIsLoading(false);
      return;
    }

    try {
      const token = getTokenFromSessionStorage();
      if (!token) throw new Error('Token tidak ditemukan.');

      const form = new FormData();
      FIELD_LIST.forEach(field => {
        form.append(field, formData[field] || '');
      });
      if (logoFile) form.append('logo_perusahaan', logoFile);
      if (coverFile) form.append('foto_cover', coverFile);

      const res = await fetch(`${API_BASE_URL}/perusahaan/${profile._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gagal memperbarui profil: ${res.status} ${errText}`);
      }

      // Refresh the page after successful update
      window.location.reload();

      // The following code will not be reached after reload, but kept for clarity
      // const updated = await res.json();
      // setProfile(updated);
      // setFormData(updated);
      // setLogoPreview(getLogoUrl(updated.logo_perusahaan));
      // setCoverPreview(getCoverUrl(updated.foto_cover));
      // setLogoFile(null);
      // setCoverFile(null);
      // setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setFormData(profile);
    setLogoFile(null);
    setCoverFile(null);
    setLogoPreview(getLogoUrl(profile.logo_perusahaan));
    setCoverPreview(getCoverUrl(profile.foto_cover));
    setIsEditing(false);
  };

  if (isLoading && !profile.nama_perusahaan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
        <div className="text-xl text-gray-700">Memuat profil...</div>
      </div>
    );
  }

  // Extract media_sosial from profile (if available)
  const mediaSosial = profile.media_sosial || {};

  // Find all keys in mediaSosial that are not in SOCIALS, and show them as generic links
  const knownSocialKeys = SOCIALS.map(s => s.key);
  const extraSocials = Object.entries(mediaSosial)
    .filter(([key, value]) => value && !knownSocialKeys.includes(key));

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans antialiased text-gray-800 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white cursor-pointer transition-opacity opacity-0 hover:opacity-100 z-10">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={e => handleFileChange(e, 'cover')}
              />
              Pilih Foto Sampul
            </label>
          )}
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Foto Sampul Perusahaan"
              className="w-full h-full object-cover transition-transform duration-300 transform group-hover:scale-105"
              onError={e => e.target.src = 'https://placehold.co/1000x400/E5E7EB/4B5563?text=Foto+Sampul'}
            />
          )}
        </div>

        {/* Profile Content */}
        <div className="relative p-6 -mt-16 flex flex-col items-center">
          {/* Logo */}
          <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-300">
            {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white cursor-pointer transition-opacity opacity-0 hover:opacity-100 z-10">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'logo')}
                />
                Pilih Logo
              </label>
            )}
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo Perusahaan"
                className="w-full h-full object-contain"
                onError={e => e.target.src = 'https://placehold.co/128x128/D1D5DB/1F2937?text=Logo'}
              />
            )}
          </div>

          {error && <div className="mt-4 p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}

          {/* Profile Details */}
          <div className="mt-6 w-full space-y-4">
            {isEditing ? (
              <form onSubmit={e => { e.preventDefault(); handleUpdate(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Perusahaan</label>
                    <input
                      type="text"
                      name="nama_perusahaan"
                      value={formData.nama_perusahaan || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Brand</label>
                    <input
                      type="text"
                      name="nama_brand"
                      value={formData.nama_brand || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Jumlah Karyawan</label>
                    <input
                      type="number"
                      name="jumlah_karyawan"
                      value={formData.jumlah_karyawan || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Alamat</label>
                    <input
                      type="text"
                      name="alamat"
                      value={formData.alamat || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Bidang Perusahaan</label>
                    <input
                      type="text"
                      name="bidang_perusahaan"
                      value={formData.bidang_perusahaan || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nomor Telepon</label>
                    <input
                      type="tel"
                      name="nomor_telp"
                      value={formData.nomor_telp || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email Perusahaan</label>
                    <input
                      type="email"
                      name="email_perusahaan"
                      value={formData.email_perusahaan || ''}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2 border"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-600">Deskripsi Perusahaan</label>
                  <textarea
                    name="deskripsi_perusahaan"
                    value={formData.deskripsi_perusahaan || ''}
                    onChange={handleChange}
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  ></textarea>
                </div>
              </form>
            ) : (
              <div className="text-center md:text-left space-y-6">
                <h1 className="text-3xl font-bold text-indigo-700">{profile.nama_perusahaan}</h1>
                <p className="text-xl text-gray-500">{profile.nama_brand}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Jumlah Karyawan</span>
                    <span className="text-lg font-semibold text-gray-800">{profile.jumlah_karyawan || 'Tidak ada data'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Alamat</span>
                    <span className="text-lg font-semibold text-gray-800">{profile.alamat || 'Tidak ada data'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Bidang Perusahaan</span>
                    <span className="text-lg font-semibold text-gray-800">{profile.bidang_perusahaan || 'Tidak ada data'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Nomor Telepon</span>
                    <span className="text-lg font-semibold text-gray-800">{profile.nomor_telp || 'Tidak ada data'}</span>
                  </div>
                  {/* Email */}
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Email Perusahaan</span>
                    <span className="text-lg font-semibold text-gray-800">{profile.email_perusahaan || 'Tidak ada data'}</span>
                  </div>
                </div>
                {/* Website Container */}
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <span className="text-sm text-gray-500 mr-2">Website:</span>
                  {profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium shadow-sm transition-colors duration-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      style={{ textDecoration: 'none' }}
                      title="Website"
                    >
                      <FaGlobe className="w-5 h-5" />
                      <span className="hidden sm:inline">{profile.website}</span>
                      <span className="sm:hidden">Website</span>
                    </a>
                  ) : (
                    <span className="text-gray-500">Tidak ada data</span>
                  )}
                </div>
                {/* Media Sosial Container */}
                <div className="mt-2 flex flex-wrap gap-3 items-center">
                  <span className="text-sm text-gray-500 mr-2">Media Sosial:</span>
                  {SOCIALS.map(social => {
                    const url = mediaSosial && mediaSosial[social.key];
                    if (!url) return null;
                    return (
                      <a
                        key={social.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium shadow-sm transition-colors duration-200 ${social.color} hover:opacity-90`}
                        style={{ textDecoration: 'none' }}
                        title={social.label}
                      >
                        {social.icon}
                        <span className="hidden sm:inline">{social.label}</span>
                      </a>
                    );
                  })}
                  {/* Render extra/unrecognized social media as generic links */}
                  {extraSocials.map(([key, value]) => (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium shadow-sm transition-colors duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300"
                      style={{ textDecoration: 'none' }}
                      title={key.charAt(0).toUpperCase() + key.slice(1)}
                    >
                      <FaGlobe className="w-5 h-5" />
                      <span className="hidden sm:inline">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </a>
                  ))}
                  {/* If no social media at all */}
                  {(!mediaSosial || Object.values(mediaSosial).filter(Boolean).length === 0) && (
                    <span className="text-gray-500">Tidak ada media sosial</span>
                  )}
                </div>
                <div className="mt-6">
                  <span className="block text-sm text-gray-500">Deskripsi Perusahaan</span>
                  <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.deskripsi_perusahaan || 'Tidak ada data'}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Edit Profil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerusahaanPreview;
