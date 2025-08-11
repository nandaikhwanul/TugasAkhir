"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { IoArrowDownOutline, IoArrowUpOutline, IoCheckmarkCircle, IoCloseCircle, IoHelpCircle, IoPencil, IoTrash } from "react-icons/io5";
import Navbar from "../../navbar/page";
import TokenKadaluarsaRedirect from "../../tokenKadaluarsa";
import NeuButtonBar from "../../lowonganPerusahaanList/bar/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Custom Confirm Dialog using react-toastify
function useToastConfirm() {
  const confirmPromiseRef = useRef();

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      // Only allow one confirm at a time
      if (confirmPromiseRef.current) {
        resolve(false);
        return;
      }
      let toastId = null;
      const ConfirmContent = () => (
        <div>
          <div className="font-semibold mb-2">{message}</div>
          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              onClick={() => {
                toast.dismiss(toastId);
                resolve(true);
                confirmPromiseRef.current = null;
              }}
            >
              Ya
            </button>
            <button
              className="px-4 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
              onClick={() => {
                toast.dismiss(toastId);
                resolve(false);
                confirmPromiseRef.current = null;
              }}
            >
              Batal
            </button>
          </div>
        </div>
      );
      toastId = toast.info(<ConfirmContent />, {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        position: "top-center",
        toastId: "edit-confirm-toast",
      });
      confirmPromiseRef.current = resolve;
    });
  };

  // Dismiss confirm if unmounted
  useEffect(() => {
    return () => {
      if (confirmPromiseRef.current) {
        confirmPromiseRef.current(false);
        confirmPromiseRef.current = null;
      }
    };
  }, []);

  return showConfirm;
}

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

// Ionicons ICONS
const SortAZIcon = ({ className = "" }) => (
  <span className={className} title="A-Z">
    <IoArrowDownOutline className="w-5 h-5" />
  </span>
);
const SortZAIcon = ({ className = "" }) => (
  <span className={className} title="Z-A">
    <IoArrowUpOutline className="w-5 h-5" />
  </span>
);
const AktifIcon = ({ className = "" }) => (
  <span className={className} title="Aktif">
    <IoCheckmarkCircle className="w-5 h-5 text-green-500" />
  </span>
);
const TutupIcon = ({ className = "" }) => (
  <span className={className} title="Tutup">
    <IoCloseCircle className="w-5 h-5 text-red-500" />
  </span>
);
const UnverifiedIcon = ({ className = "" }) => (
  <span className={className} title="Unverified">
    <IoHelpCircle className="w-5 h-5 text-yellow-400" />
  </span>
);

// Modal Edit Lowongan
function EditLowonganModal({ open, onClosed, job, onSave, saving }) {
  const [form, setForm] = useState({
    judul_pekerjaan: "",
    deskripsi: "",
    kualifikasi: "",
    lokasi: "",
    tipe_kerja: "",
    gaji: "",
    batas_lamaran: "",
    batas_pelamar: "",
  });

  // Untuk lokasi Indonesia
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");

  // Custom confirm hook
  const toastConfirm = useToastConfirm();

  // Fetch provinces on mount
  useEffect(() => {
    if (!open) return;
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        setProvinces([]);
      }
    };
    fetchProvinces();
  }, [open]);

  // Fetch cities when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      setSelectedCityId("");
      return;
    }
    const fetchCities = async () => {
      try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`);
        const data = await res.json();
        setCities(data);
      } catch (err) {
        setCities([]);
      }
    };
    fetchCities();
  }, [selectedProvinceId]);

  // Set form and lokasi dropdowns when job changes
  useEffect(() => {
    if (job) {
      setForm({
        judul_pekerjaan: job.judul_pekerjaan || "",
        deskripsi: job.deskripsi || "",
        kualifikasi: job.kualifikasi || "",
        lokasi: job.lokasi || "",
        tipe_kerja: job.tipe_kerja || "",
        gaji: job.gaji || "",
        batas_lamaran: job.batas_lamaran
          ? new Date(job.batas_lamaran).toISOString().slice(0, 16)
          : "",
        batas_pelamar:
          typeof job.batas_pelamar !== "undefined" && job.batas_pelamar !== null
            ? job.batas_pelamar
            : "",
      });

      // Otomatis set provinsi & kota jika lokasi sudah ada
      if (job.lokasi) {
        // Lokasi format: "Kota/Kabupaten, Provinsi"
        const [cityName, provinceName] = job.lokasi.split(",").map((s) => s.trim());
        // Cari id provinsi
        if (provinceName && provinces.length > 0) {
          const prov = provinces.find((p) => p.name.toLowerCase() === provinceName.toLowerCase());
          if (prov) {
            setSelectedProvinceId(prov.id);
            // Setelah cities terload, set kota
            setTimeout(() => {
              if (cityName && cities.length > 0) {
                const city = cities.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
                if (city) setSelectedCityId(city.id);
              }
            }, 500);
          }
        }
      } else {
        setSelectedProvinceId("");
        setSelectedCityId("");
      }
    }
    // eslint-disable-next-line
  }, [job, open, provinces.length]);

  // Update form.lokasi when city/province changes
  useEffect(() => {
    if (!selectedProvinceId || !selectedCityId) return;
    const prov = provinces.find((p) => p.id === selectedProvinceId);
    const city = cities.find((c) => c.id === selectedCityId);
    if (prov && city) {
      setForm((prev) => ({
        ...prev,
        lokasi: `${city.name}, ${prov.name}`,
      }));
    }
    // eslint-disable-next-line
  }, [selectedProvinceId, selectedCityId, provinces, cities]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handler untuk provinsi/kota
  const handleProvinceChange = (e) => {
    setSelectedProvinceId(e.target.value);
    setSelectedCityId("");
    setForm((prev) => ({ ...prev, lokasi: "" }));
  };
  const handleCityChange = (e) => {
    setSelectedCityId(e.target.value);
    const prov = provinces.find((p) => p.id === selectedProvinceId);
    const city = cities.find((c) => c.id === e.target.value);
    if (prov && city) {
      setForm((prev) => ({
        ...prev,
        lokasi: `${city.name}, ${prov.name}`,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Alert sebelum simpan pakai react-toastify confirm
    const confirmed = await toastConfirm(
      'Jika anda mengubah data dari lowongan maka status akan berubah menjadi "Unverified". apakah anda yakin ?'
    );
    if (!confirmed) {
      return;
    }
    onSave(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-10 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClosed}
          type="button"
          aria-label="Tutup"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-blue-900">Edit Lowongan</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Baris 1: Judul Pekerjaan & Lokasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Judul Pekerjaan</label>
              <input
                type="text"
                name="judul_pekerjaan"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.judul_pekerjaan}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Lokasi</label>
              <div className="flex flex-col gap-2">
                <select
                  name="provinsi"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedProvinceId}
                  onChange={handleProvinceChange}
                  required
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
                <select
                  name="kota"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={selectedCityId}
                  onChange={handleCityChange}
                  required
                  disabled={!selectedProvinceId}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Baris 2: Tipe Kerja & Gaji */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Tipe Kerja</label>
              <select
                name="tipe_kerja"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.tipe_kerja}
                onChange={handleChange}
                required
              >
                <option value="">Pilih tipe kerja</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Gaji</label>
              <input
                type="text"
                name="gaji"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.gaji}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          {/* Baris 3: Batas Lamaran & Batas Pelamar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Batas Lamaran</label>
              <input
                type="datetime-local"
                name="batas_lamaran"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.batas_lamaran}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Batas Pelamar</label>
              <input
                type="number"
                name="batas_pelamar"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.batas_pelamar}
                onChange={handleChange}
                min={0}
                placeholder="Masukkan batas pelamar (opsional)"
              />
            </div>
          </div>
          {/* Baris 4: Deskripsi & Kualifikasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Deskripsi</label>
              <textarea
                name="deskripsi"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.deskripsi}
                onChange={handleChange}
                required
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-blue-900">Kualifikasi</label>
              <textarea
                name="kualifikasi"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.kualifikasi}
                onChange={handleChange}
                required
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition"
              onClick={onClosed}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// LinkedIn-style Job Card
function LinkedInJobCard({ job, onEdit, onDelete, onStatusChange, statusChanging }) {
  // Status label logic
  let statusLabel = "-";
  let statusClass = "bg-gray-200 text-gray-600";
  let StatusIcon = null;
  if (job.status === "open") {
    statusLabel = "Aktif";
    statusClass = "bg-green-500 text-white";
    StatusIcon = AktifIcon;
  } else if (job.status === "closed") {
    statusLabel = "Tutup";
    statusClass = "bg-red-500 text-white";
    StatusIcon = TutupIcon;
  } else if (job.status === "pending_verification") {
    statusLabel = "Pending";
    statusClass = "bg-yellow-400 text-white";
    StatusIcon = UnverifiedIcon;
  } else if (job.status === "rejected") {
    statusLabel = "Ditolak";
    statusClass = "bg-red-700 text-white";
    StatusIcon = null;
  } else if (job.status) {
    statusLabel = job.status;
    statusClass = "bg-gray-200 text-gray-600";
    StatusIcon = null;
  }

  // Ambil jumlah pelamar dari job.jumlah_pelamar jika ada, fallback ke 0
  const jumlahPelamar = typeof job.jumlah_pelamar === "number"
    ? job.jumlah_pelamar
    : Array.isArray(job.pelamar)
      ? job.pelamar.length
      : 0;

  // Dropdown status
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition flex flex-col md:flex-row p-6 gap-4 max-w-2xl w-full break-words mb-6">
      {/* Logo Perusahaan Placeholder */}
      <div className="flex-shrink-0 flex items-start">
        <div className="h-14 w-14 rounded-lg bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
          <span role="img" aria-label="Company">🏢</span>
        </div>
      </div>
      {/* Job Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center gap-2 min-w-0">
            <h2
              className="text-lg md:text-xl font-semibold text-blue-900 hover:underline cursor-pointer truncate max-w-[20rem] md:max-w-[28rem]"
              title={job.judul_pekerjaan}
            >
              {job.judul_pekerjaan || "Tanpa Judul"}
            </h2>
            <span
              className={`ml-2 px-4 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 text-center ${statusClass}`}
              style={
                statusLabel === "Ditolak"
                  ? {
                      minWidth: 90,
                      justifyContent: "center",
                      alignItems: "center",
                      display: "flex",
                      paddingLeft: "1.5rem",
                      paddingRight: "1.5rem",
                    }
                  : {}
              }
            >
              {StatusIcon && <StatusIcon className="w-4 h-4" />}
              <span
                className={
                  statusLabel === "Ditolak"
                    ? "w-full text-center relative"
                    : "w-full relative right-[10px]"
                }
                style={statusLabel === "Ditolak" ? { right: 0 } : {}}
              >
                {statusLabel}
              </span>
            </span>
          </div>
          <div
            className="text-gray-700 text-sm mt-1 mb-2 line-clamp-2 break-words"
            title={job.deskripsi}
          >
            {job.deskripsi || "-"}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <div className="break-all">
              <span className="font-medium">ID:</span> {job._id}
            </div>
            <div>
              <span className="font-medium">Dibuat:</span> {job.createdAt ? new Date(job.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
            </div>
            {job.lokasi && (
              <div>
                <span className="font-medium">Lokasi:</span> {job.lokasi}
              </div>
            )}
            {job.tipe_kerja && (
              <div>
                <span className="font-medium">Tipe:</span> {job.tipe_kerja}
              </div>
            )}
            {job.gaji && (
              <div>
                <span className="font-medium">Gaji:</span> {job.gaji}
              </div>
            )}
            {job.batas_lamaran && (
              <div>
                <span className="font-medium">Deadline:</span> {new Date(job.batas_lamaran).toLocaleDateString("id-ID")}
              </div>
            )}
            {/* Tambahan: Batas Pelamar */}
            {typeof job.batas_pelamar !== "undefined" && job.batas_pelamar !== null && job.batas_pelamar !== "" && (
              <div>
                <span className="font-medium">Batas Pelamar:</span> {job.batas_pelamar}
              </div>
            )}
            {/* Tambahan: Jumlah Pelamar */}
            <div>
              <span className="font-medium">Jumlah Pelamar:</span> {jumlahPelamar}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 items-center">
          {/* Tombol edit dan hapus */}
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 transition text-sm font-medium"
            title="Edit"
            onClick={() => onEdit && onEdit(job)}
            type="button"
          >
            <IoPencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition text-sm font-medium"
            title="Hapus"
            onClick={() => onDelete && onDelete(job)}
            type="button"
          >
            <IoTrash className="w-4 h-4" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
          {/* Dropdown status */}
          <select
            className="ml-2 px-2 py-1.5 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition"
            value={job.status === "open" ? "open" : job.status === "closed" ? "closed" : ""}
            onChange={e => onStatusChange && onStatusChange(job, e.target.value)}
            disabled={statusChanging === job._id}
            style={{ minWidth: 90 }}
            title="Ubah Status"
          >
            <option value="" disabled>
              Ubah Status
            </option>
            <option value="open">Aktif</option>
            <option value="closed">Tutup</option>
          </select>
          {statusChanging === job._id && (
            <span className="ml-1 text-xs text-blue-500 animate-pulse">Menyimpan...</span>
          )}
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  {
    key: "az",
    label: "A-Z",
    icon: SortAZIcon,
    tooltip: "Judul A-Z",
    iconClass: "w-5 h-5 mr-1 -mt-0.5 align-middle inline-block", // icon a bit larger, right margin, vertical align
    labelClass: "align-middle font-medium", // vertical align, font weight
  },
  {
    key: "za",
    label: "Z-A",
    icon: SortZAIcon,
    tooltip: "Judul Z-A",
    iconClass: "w-5 h-5 mr-1 -mt-0.5 align-middle inline-block",
    labelClass: "align-middle font-medium",
  },
  {
    key: "aktif",
    label: "Aktif",
    icon: AktifIcon,
    tooltip: "Status Aktif",
    iconClass: "w-5 h-5 mr-1 -mt-0.5 align-middle inline-block",
    labelClass: "align-middle font-medium",
  },
  {
    key: "tutup",
    label: "Tutup",
    icon: TutupIcon,
    tooltip: "Status Tutup",
    iconClass: "w-5 h-5 mr-1 -mt-0.5 align-middle inline-block",
    labelClass: "align-middle font-medium",
  },
  {
    key: "unverified",
    label: "Pending",
    icon: UnverifiedIcon,
    tooltip: "Status Unverified",
    iconClass: "w-5 h-5 mr-1 -mt-0.5 align-middle inline-block",
    labelClass: "align-middle font-medium",
  },
];

function sortLowongan(lowongan, sortKey) {
  if (!Array.isArray(lowongan)) return [];
  let arr = [...lowongan];
  switch (sortKey) {
    case "az":
      arr.sort((a, b) =>
        (a.judul_pekerjaan || "").localeCompare(b.judul_pekerjaan || "", "id", { sensitivity: "base" })
      );
      break;
    case "za":
      arr.sort((a, b) =>
        (b.judul_pekerjaan || "").localeCompare(a.judul_pekerjaan || "", "id", { sensitivity: "base" })
      );
      break;
    case "aktif":
      arr = arr.filter((l) => l.status === "open");
      break;
    case "tutup":
      arr = arr.filter((l) => l.status === "closed");
      break;
    case "unverified":
      arr = arr.filter((l) => l.status === "pending_verification");
      break;
    default:
      break;
  }
  return arr;
}

export default function LowonganPerusahaanListPage() {
  const [loading, setLoading] = useState(false);
  const [lowongan, setLowongan] = useState([]);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("az");

  // Untuk konfirmasi hapus
  const [deletingId, setDeletingId] = useState(null);

  // Untuk modal edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Untuk status changing
  const [statusChanging, setStatusChanging] = useState(null);

  // Custom confirm hook for edit modal
  const toastConfirm = useToastConfirm();

  useEffect(() => {
    const fetchLowongan = async () => {
      setLoading(true);
      setError("");
      const token = getTokenFromCookie();
      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/lowongan/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || data.msg || "Gagal mengambil data lowongan.");
        }
        const data = await res.json();
        setLowongan(Array.isArray(data.lowongan) ? data.lowongan : []);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };

    fetchLowongan();
  }, []);

  // Memoize sorted/filtered lowongan
  const displayedLowongan = useMemo(() => sortLowongan(lowongan, sortKey), [lowongan, sortKey]);

  // Handler untuk edit (buka modal)
  const handleEdit = (job) => {
    setEditJob(job);
    setEditModalOpen(true);
  };

  // Handler simpan edit
  const handleSaveEdit = async (form) => {
    if (!editJob) return;
    setSavingEdit(true);
    const token = getTokenFromCookie();
    try {
      // Format batas_lamaran ke ISO string (UTC)
      let batasLamaranISO = form.batas_lamaran;
      if (batasLamaranISO && !batasLamaranISO.endsWith("Z")) {
        // Convert local datetime-local to UTC ISO string
        const dt = new Date(form.batas_lamaran);
        batasLamaranISO = dt.toISOString();
      }
      const body = {
        judul_pekerjaan: form.judul_pekerjaan,
        deskripsi: form.deskripsi,
        kualifikasi: form.kualifikasi,
        lokasi: form.lokasi,
        tipe_kerja: form.tipe_kerja,
        gaji: form.gaji,
        batas_lamaran: batasLamaranISO,
        batas_pelamar: form.batas_pelamar !== "" ? Number(form.batas_pelamar) : undefined,
        status: "pending_verification", // Set status ke Unverified setiap edit
      };
      // Remove batas_pelamar if not set (so it doesn't overwrite with undefined)
      if (typeof body.batas_pelamar === "undefined") {
        delete body.batas_pelamar;
      }
      const res = await fetch(`http://localhost:5000/lowongan/${editJob._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || data.msg || "Gagal mengupdate lowongan.");
        throw new Error(data.message || data.msg || "Gagal mengupdate lowongan.");
      }
      // Update state lowongan
      setLowongan((prev) =>
        prev.map((l) =>
          l._id === editJob._id
            ? { ...l, ...body, batas_lamaran: batasLamaranISO }
            : l
        )
      );
      setEditModalOpen(false);
      setEditJob(null);
      toast.success("Lowongan berhasil diupdate.");
    } catch (err) {
      toast.error(err.message || "Gagal mengupdate lowongan.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handler untuk hapus
  const handleDelete = async (job) => {
    // Tetap pakai window.confirm untuk hapus, atau bisa diubah ke toastConfirm jika ingin konsisten
    if (!window.confirm("Yakin ingin menghapus lowongan ini?")) return;
    setDeletingId(job._id);
    const token = getTokenFromCookie();
    try {
      const res = await fetch(`http://localhost:5000/lowongan/${job._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || data.msg || "Gagal menghapus lowongan.");
        throw new Error(data.message || data.msg || "Gagal menghapus lowongan.");
      }
      // Hapus dari state
      setLowongan((prev) => prev.filter((l) => l._id !== job._id));
      toast.success("Lowongan berhasil dihapus.");
    } catch (err) {
      toast.error(err.message || "Gagal menghapus lowongan.");
    } finally {
      setDeletingId(null);
    }
  };

  // Handler untuk ubah status
  const handleStatusChange = async (job, newStatus) => {
    if (!job || !newStatus || (job.status === newStatus)) return;
    setStatusChanging(job._id);
    const token = getTokenFromCookie();
    try {
      const res = await fetch(`http://localhost:5000/lowongan/${job._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || data.msg || "Gagal mengubah status lowongan.");
        throw new Error(data.message || data.msg || "Gagal mengubah status lowongan.");
      }
      // Update state lowongan
      setLowongan((prev) =>
        prev.map((l) =>
          l._id === job._id
            ? { ...l, status: newStatus }
            : l
        )
      );
      toast.success("Status lowongan berhasil diubah.");
    } catch (err) {
      toast.error(err.message || "Gagal mengubah status lowongan.");
    } finally {
      setStatusChanging(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-2">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <TokenKadaluarsaRedirect />
      <Navbar />
      <div className="max-w-7xl mx-auto relative top-20">
        <NeuButtonBar />
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Lowongan Anda</h1>
        <p className="text-gray-600 mb-6">Daftar lowongan pekerjaan yang telah Anda posting.</p>
        {/* Sorting Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <span className="text-sm text-gray-700 mr-2">Urutkan/Filter:</span>
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = sortKey === opt.key;
            return (
              <button
                key={opt.key}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition
                  ${isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"}
                `}
                title={opt.tooltip}
                onClick={() => setSortKey(opt.key)}
                type="button"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
        {loading && (
          <div className="mb-4 text-blue-600 font-semibold">Memuat data lowongan...</div>
        )}
        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
        {!loading && displayedLowongan.length === 0 && !error && (
          <div className="mb-4 text-gray-700 bg-white border border-gray-200 rounded-lg p-6 text-center">
            <span className="text-2xl block mb-2">🔎</span>
            <span>
              {lowongan.length === 0
                ? "Belum ada lowongan yang Anda buat."
                : "Tidak ada lowongan yang cocok dengan filter/urutan ini."}
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {displayedLowongan.map((l) => (
            <LinkedInJobCard
              key={l._id}
              job={l}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              statusChanging={statusChanging}
            />
          ))}
        </div>
      </div>
      <EditLowonganModal
        open={editModalOpen}
        onClosed={() => {
          setEditModalOpen(false);
          setEditJob(null);
        }}
        job={editJob}
        onSave={handleSaveEdit}
        saving={savingEdit}
      />
    </div>
  );
}
