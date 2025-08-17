"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import LowonganNavbar from "../navbar/page";
import Loader from "../loading/loadingDesign";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaRegListAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaUserTie,
  FaCheckCircle,
  FaRegClock,
  FaUsers,
} from "react-icons/fa";
import { getTokenFromSessionStorage } from "../sessiontoken";

// Helper: Cek format gaji harus ada titik pemisah ribuan, misal 5.000.000
function isValidGajiFormat(str) {
  if (!str) return false;
  if (!/^[0-9.]+$/.test(str)) return false;
  if (!str.includes(".")) return false;
  if (str.startsWith(".") || str.endsWith(".")) return false;
  if (str.includes("..")) return false;
  const parts = str.split(".");
  if (parts.length < 2) return false;
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].length !== 3) return false;
  }
  if (isNaN(parts.join(""))) return false;
  return true;
}

const steps = [
  { title: "Info Pekerjaan" },
  { title: "Deskripsi & Kualifikasi" },
  { title: "Gaji & Lokasi" },
  { title: "Preview" },
  { title: "Submit" },
];

const initialForm = {
  judul_pekerjaan: "",
  deskripsi: "",
  kualifikasi: "",
  lokasi: "",
  provinsi: "",
  kota: "",
  tipe_kerja: "",
  gaji_min: "",
  gaji_max: "",
  batas_lamaran_bulan: "",
  batas_lamaran_hari: "",
  batas_lamaran_tahun: "",
  batas_pelamar: "",
  status: "open",
};

function parseKualifikasiToList(kualifikasi) {
  // Pisahkan per baris, hilangkan baris kosong, trim
  if (!kualifikasi) return [];
  return kualifikasi
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Helper: Format batas lamaran ke YYYY-MM-DD
function formatBatasLamaran(tahun, bulan, hari) {
  if (!tahun || !bulan || !hari) return "";
  // Pad bulan dan hari ke 2 digit
  const mm = bulan.toString().padStart(2, "0");
  const dd = hari.toString().padStart(2, "0");
  return `${tahun}-${mm}-${dd}`;
}

// Helper: Cek apakah tanggal batas lamaran valid (tidak boleh hari sebelumnya)
function isBatasLamaranValid(tahun, bulan, hari) {
  if (!tahun || !bulan || !hari) return false;
  const batasLamaran = new Date(
    `${tahun}-${bulan.toString().padStart(2, "0")}-${hari.toString().padStart(2, "0")}T00:00:00`
  );
  const now = new Date();
  // Set jam ke 00:00:00 untuk hari ini
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return batasLamaran >= today;
}

export default function BuatLowongan() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [provinsiLoading, setProvinsiLoading] = useState(false);
  const [kotaLoading, setKotaLoading] = useState(false);
  const router = useRouter();

  // Cek token di awal, redirect ke /login jika tidak ada/expired
  useEffect(() => {
    const token = getTokenFromSessionStorage();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // Ambil data provinsi saat komponen mount
  useEffect(() => {
    let ignore = false;
    async function fetchProvinsi() {
      setProvinsiLoading(true);
      try {
        const res = await fetch(
          "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json"
        );
        const data = await res.json();
        if (!ignore) setProvinsiList(data);
      } catch (e) {
        if (!ignore) setProvinsiList([]);
      } finally {
        if (!ignore) setProvinsiLoading(false);
      }
    }
    fetchProvinsi();
    return () => {
      ignore = true;
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    setValue,
    watch,
    trigger,
    setError: setFormError,
    clearErrors,
  } = useForm({
    mode: "onBlur",
    defaultValues: initialForm,
    shouldUnregister: false,
  });

  const selectedProvinsi = watch("provinsi");

  useEffect(() => {
    let ignore = false;
    async function fetchKota() {
      if (!selectedProvinsi) {
        setKotaList([]);
        setValue("kota", "");
        return;
      }
      setKotaLoading(true);
      try {
        const prov = provinsiList.find((p) => p.name === selectedProvinsi);
        if (!prov) {
          setKotaList([]);
          setValue("kota", "");
          return;
        }
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`
        );
        const data = await res.json();
        if (!ignore) {
          setKotaList(data);
          setValue("kota", "");
        }
      } catch (e) {
        if (!ignore) {
          setKotaList([]);
          setValue("kota", "");
        }
      } finally {
        if (!ignore) setKotaLoading(false);
      }
    }
    fetchKota();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinsi, provinsiList, setValue]);

  function Stepper() {
    return (
      <ol className="flex flex-wrap items-center w-full mb-10 gap-y-4 sm:gap-y-0">
        {steps.map((s, idx) => {
          const isCompleted = idx < step;
          const isActive = idx === step;
          const isFirst = idx === 0;
          const isLast = idx === steps.length - 1;
          return (
            <li
              key={s.title}
              className="flex-1 flex flex-col items-center relative min-w-[90px] sm:min-w-[120px]"
            >
              {!isFirst && (
                <span
                  className={`
                    absolute left-0 top-[26px] -translate-y-1/2
                    h-0.5 w-1/2
                    ${isCompleted || isActive ? "bg-green-400" : "bg-gray-300"}
                    z-0
                    hidden sm:block
                  `}
                  aria-hidden="true"
                />
              )}
              {!isLast && (
                <span
                  className={`
                    absolute right-0 top-[26px] -translate-y-1/2
                    h-0.5 w-1/2
                    ${isCompleted ? "bg-green-400" : "bg-gray-300"}
                    z-0
                    hidden sm:block
                  `}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center z-10">
                <span
                  className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full lg:h-12 lg:w-12 shrink-0
                    ${
                      isCompleted
                        ? "bg-green-400 text-white"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 16 12"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M1 5.917 5.724 10.5 15 1.5"
                      />
                    </svg>
                  ) : (
                    <span className="font-bold text-lg">{idx + 1}</span>
                  )}
                </span>
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap text-center ${
                  isActive
                    ? "text-blue-700"
                    : isCompleted
                    ? "text-gray-700"
                    : "text-gray-500"
                }`}
              >
                {s.title}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  function StepContent() {
    if (step === 0) {
      return (
        <>
          <div>
            <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
              Judul Pekerjaan
            </label>
            <input
              type="text"
              {...register("judul_pekerjaan", {
                required: "Judul pekerjaan wajib diisi",
              })}
              className={`w-full bg-gray-100 border ${
                errors.judul_pekerjaan
                  ? "border-red-400"
                  : "border-gray-300"
              } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
              placeholder="Contoh: Software Engineer"
              autoFocus
            />
            {errors.judul_pekerjaan && (
              <span className="text-red-500 text-sm">
                {errors.judul_pekerjaan.message}
              </span>
            )}
          </div>
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <div>
            <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
              Deskripsi
            </label>
            <textarea
              {...register("deskripsi", {
                required: "Deskripsi wajib diisi",
              })}
              className={`w-full bg-gray-100 border ${
                errors.deskripsi
                  ? "border-red-400"
                  : "border-gray-300"
              } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600 min-h-[90px] resize-vertical`}
              rows={4}
              placeholder="Deskripsikan pekerjaan secara singkat"
            />
            {errors.deskripsi && (
              <span className="text-red-500 text-sm">
                {errors.deskripsi.message}
              </span>
            )}
          </div>
          <div className="mt-4">
            <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
              Kualifikasi
            </label>
            <textarea
              {...register("kualifikasi", {
                required: "Kualifikasi wajib diisi",
              })}
              className={`w-full bg-gray-100 border ${
                errors.kualifikasi
                  ? "border-red-400"
                  : "border-gray-300"
              } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600 min-h-[60px] resize-vertical`}
              rows={4}
              placeholder={`Masukkan kualifikasi, satu per baris. Contoh:\n- Minimal S1 Informatika\n- Pengalaman 2 tahun\n- Mampu bekerja dalam tim`}
            />
            {errors.kualifikasi && (
              <span className="text-red-500 text-sm">
                {errors.kualifikasi.message}
              </span>
            )}
            <div className="text-gray-500 text-xs mt-1">
              Tips: Gunakan satu baris untuk setiap poin kualifikasi. Setiap baris akan otomatis menjadi poin saat preview.
            </div>
          </div>
        </>
      );
    }
    if (step === 2) {
      // Generate tahun, bulan, hari untuk batas lamaran
      const tahunSekarang = new Date().getFullYear();
      const tahunList = [];
      for (let t = tahunSekarang; t <= tahunSekarang + 5; t++) tahunList.push(t);
      const bulanList = [
        { value: "01", label: "Januari" },
        { value: "02", label: "Februari" },
        { value: "03", label: "Maret" },
        { value: "04", label: "April" },
        { value: "05", label: "Mei" },
        { value: "06", label: "Juni" },
        { value: "07", label: "Juli" },
        { value: "08", label: "Agustus" },
        { value: "09", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
      ];
      // Hari tergantung bulan & tahun
      const watchBulan = watch("batas_lamaran_bulan");
      const watchTahun = watch("batas_lamaran_tahun");
      let hariMax = 31;
      if (watchBulan && watchTahun) {
        const bulan = parseInt(watchBulan, 10);
        const tahun = parseInt(watchTahun, 10);
        if ([4, 6, 9, 11].includes(bulan)) hariMax = 30;
        else if (bulan === 2) {
          hariMax =
            tahun % 4 === 0 && (tahun % 100 !== 0 || tahun % 400 === 0)
              ? 29
              : 28;
        }
      }
      const hariList = [];
      for (let h = 1; h <= hariMax; h++) hariList.push(h);

      // Ambil tanggal hari ini untuk validasi batas lamaran
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = (today.getMonth() + 1).toString().padStart(2, "0");
      const todayDay = today.getDate().toString().padStart(2, "0");

      return (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
                Gaji
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  {...register("gaji_min", {
                    required: "Gaji minimum wajib diisi",
                    validate: (value) => {
                      if (!isValidGajiFormat(value)) {
                        return "Format gaji minimum harus pakai titik, contoh: 5.000.000";
                      }
                      if (value && getValues("gaji_max")) {
                        const min = parseInt(
                          value.replace(/[^\d]/g, ""),
                          10
                        );
                        const max = parseInt(
                          getValues("gaji_max").replace(/[^\d]/g, ""),
                          10
                        );
                        if (!isNaN(min) && !isNaN(max) && min > max) {
                          return "Gaji minimum tidak boleh lebih besar dari maksimum";
                        }
                      }
                      return true;
                    },
                  })}
                  className={`w-full bg-gray-100 border ${
                    errors.gaji_min
                      ? "border-red-400"
                      : "border-gray-300"
                  } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                  placeholder="Min (cth: 5.000.000)"
                  autoComplete="off"
                />
                <span className="font-bold text-xl text-gray-500 text-center sm:text-left">
                  -
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  {...register("gaji_max", {
                    required: "Gaji maksimum wajib diisi",
                    validate: (value) => {
                      if (!isValidGajiFormat(value)) {
                        return "Format gaji maksimum harus pakai titik, contoh: 10.000.000";
                      }
                      if (value && getValues("gaji_min")) {
                        const min = parseInt(
                          getValues("gaji_min").replace(/[^\d]/g, ""),
                          10
                        );
                        const max = parseInt(
                          value.replace(/[^\d]/g, ""),
                          10
                        );
                        if (!isNaN(min) && !isNaN(max) && min > max) {
                          return "Gaji maksimum harus lebih besar dari minimum";
                        }
                      }
                      return true;
                    },
                  })}
                  className={`w-full bg-gray-100 border ${
                    errors.gaji_max
                      ? "border-red-400"
                      : "border-gray-300"
                  } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                  placeholder="Max (cth: 10.000.000)"
                  autoComplete="off"
                />
              </div>
              {(errors.gaji_min || errors.gaji_max) && (
                <span className="text-red-500 text-sm">
                  {errors.gaji_min?.message || errors.gaji_max?.message}
                </span>
              )}
              <div className="text-gray-500 text-xs mt-1">
                Format wajib: gunakan titik sebagai pemisah ribuan. Contoh: 5.000.000
              </div>
            </div>
            <div className="flex-1">
              <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
                Batas Lamaran
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  {...register("batas_lamaran_bulan", {
                    required: "Bulan wajib dipilih",
                  })}
                  className={`w-full sm:w-1/3 bg-gray-100 border ${
                    errors.batas_lamaran_bulan
                      ? "border-red-400"
                      : "border-gray-300"
                  } rounded-lg px-2 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                >
                  <option value="">Bulan</option>
                  {bulanList.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <select
                  {...register("batas_lamaran_hari", {
                    required: "Hari wajib dipilih",
                  })}
                  className={`w-full sm:w-1/3 bg-gray-100 border ${
                    errors.batas_lamaran_hari
                      ? "border-red-400"
                      : "border-gray-300"
                  } rounded-lg px-2 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                >
                  <option value="">Hari</option>
                  {hariList.map((h) => (
                    <option key={h} value={h.toString().padStart(2, "0")}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  {...register("batas_lamaran_tahun", {
                    required: "Tahun wajib dipilih",
                  })}
                  className={`w-full sm:w-1/3 bg-gray-100 border ${
                    errors.batas_lamaran_tahun
                      ? "border-red-400"
                      : "border-gray-300"
                  } rounded-lg px-2 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                >
                  <option value="">Tahun</option>
                  {tahunList.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              {/* Custom error for batas lamaran tidak boleh hari sebelumnya */}
              {(errors.batas_lamaran_bulan ||
                errors.batas_lamaran_hari ||
                errors.batas_lamaran_tahun) && (
                <span className="text-red-500 text-sm">
                  {errors.batas_lamaran_bulan?.message ||
                    errors.batas_lamaran_hari?.message ||
                    errors.batas_lamaran_tahun?.message}
                </span>
              )}
              {errors.batas_lamaran_tanggal_invalid && (
                <span className="text-red-500 text-sm">
                  {errors.batas_lamaran_tanggal_invalid.message}
                </span>
              )}
              <div className="text-gray-500 text-xs mt-1">
                Pilih bulan, hari, dan tahun untuk batas lamaran. <br />
                <span className="text-red-500">
                  Batas lamaran tidak boleh hari sebelumnya.
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex-1">
              <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
                Batas Pelamar
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                {...register("batas_pelamar", {
                  required: "Batas pelamar wajib diisi",
                  min: {
                    value: 1,
                    message: "Minimal 1 pelamar",
                  },
                  max: {
                    value: 1000,
                    message: "Maksimal 1000 pelamar",
                  },
                  validate: (value) => {
                    if (!value) return "Batas pelamar wajib diisi";
                    const num = parseInt(value, 10);
                    if (isNaN(num)) return "Batas pelamar harus berupa angka";
                    if (num < 1) return "Minimal 1 pelamar";
                    if (num > 1000) return "Maksimal 1000 pelamar";
                    return true;
                  },
                })}
                className={`w-full bg-gray-100 border ${
                  errors.batas_pelamar
                    ? "border-red-400"
                    : "border-gray-300"
                } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                placeholder="Maksimal pelamar (max 1000)"
              />
              {errors.batas_pelamar && (
                <span className="text-red-500 text-sm">
                  {errors.batas_pelamar.message}
                </span>
              )}
            </div>
            <div className="flex-1">
              <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
                Provinsi
              </label>
              <select
                {...register("provinsi", {
                  required: "Provinsi wajib dipilih",
                })}
                className={`w-full bg-gray-100 border ${
                  errors.provinsi
                    ? "border-red-400"
                    : "border-gray-300"
                } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                disabled={provinsiLoading}
              >
                <option value="">Pilih Provinsi</option>
                {provinsiList.map((prov) => (
                  <option key={prov.id} value={prov.name}>
                    {prov.name}
                  </option>
                ))}
              </select>
              {errors.provinsi && (
                <span className="text-red-500 text-sm">
                  {errors.provinsi.message}
                </span>
              )}
            </div>
            <div className="flex-1">
              <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
                Kota/Kabupaten
              </label>
              <select
                {...register("kota", {
                  required: "Kota/Kabupaten wajib dipilih",
                })}
                className={`w-full bg-gray-100 border ${
                  errors.kota
                    ? "border-red-400"
                    : "border-gray-300"
                } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
                disabled={!selectedProvinsi || kotaLoading}
              >
                <option value="">Pilih Kota/Kabupaten</option>
                {kotaList.map((kota) => (
                  <option key={kota.id} value={kota.name}>
                    {kota.name}
                  </option>
                ))}
              </select>
              {errors.kota && (
                <span className="text-red-500 text-sm">
                  {errors.kota.message}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
              Tipe Kerja
            </label>
            <select
              {...register("tipe_kerja", {
                required: "Tipe kerja wajib diisi",
              })}
              className={`w-full bg-gray-100 border ${
                errors.tipe_kerja
                  ? "border-red-400"
                  : "border-gray-300"
              } rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600`}
            >
              <option value="">Pilih tipe kerja</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
            {errors.tipe_kerja && (
              <span className="text-red-500 text-sm">
                {errors.tipe_kerja.message}
              </span>
            )}
          </div>
          <div className="mt-4">
            <label className="block font-semibold text-gray-800 mb-1.5 text-[15px]">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-3 text-gray-800 text-[15px] outline-none focus:border-blue-600"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </>
      );
    }
    if (step === 3) {
      const form = getValues();
      const kualifikasiList = parseKualifikasiToList(form.kualifikasi);

      // Compose batas lamaran string
      const batasLamaranStr = formatBatasLamaran(
        form.batas_lamaran_tahun,
        form.batas_lamaran_bulan,
        form.batas_lamaran_hari
      );

      return (
        <div className="p-2">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4 sm:p-6 mb-4 text-gray-800 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <FaRegListAlt className="text-blue-500 text-2xl sm:text-3xl" />
              <div className="font-bold text-xl sm:text-2xl text-blue-900 tracking-tight text-center sm:text-left">
                Preview Lowongan
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaUserTie className="text-blue-400" />
                  <span className="font-semibold">Judul:</span>
                </div>
                <div className="ml-7 mb-3 text-base sm:text-lg">
                  {form.judul_pekerjaan ? (
                    form.judul_pekerjaan
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FaRegListAlt className="text-blue-400" />
                  <span className="font-semibold">Deskripsi:</span>
                </div>
                <div className="ml-7 mb-3 whitespace-pre-line">
                  {form.deskripsi ? (
                    form.deskripsi
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FaCheckCircle className="text-green-500" />
                  <span className="font-semibold">Kualifikasi:</span>
                </div>
                <div className="ml-7 mb-3">
                  {kualifikasiList.length > 0 ? (
                    <ul className="space-y-2">
                      {kualifikasiList.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <circle cx="10" cy="10" r="8" fill="#0ea5e9" />
                              <path
                                d="M7.5 10.5L9.5 12.5L13 9"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span className="text-gray-800">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className="text-pink-500" />
                  <span className="font-semibold">Lokasi:</span>
                </div>
                <div className="ml-7 mb-3">
                  {form.provinsi && form.kota ? (
                    `${form.kota}, ${form.provinsi}`
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FaUserTie className="text-purple-500" />
                  <span className="font-semibold">Tipe Kerja:</span>
                </div>
                <div className="ml-7 mb-3">
                  {form.tipe_kerja ? (
                    form.tipe_kerja
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FaMoneyBillWave className="text-green-500" />
                  <span className="font-semibold">Gaji:</span>
                </div>
                <div className="ml-7 mb-3">
                  {form.gaji_min && form.gaji_max ? (
                    `${form.gaji_min} - ${form.gaji_max}`
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FaRegClock className="text-yellow-500" />
                  <span className="font-semibold">Batas Lamaran:</span>
                </div>
                <div className="ml-7 mb-3">
                  {batasLamaranStr ? (
                    batasLamaranStr
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FaUsers className="text-blue-500" />
                  <span className="font-semibold">Batas Pelamar:</span>
                </div>
                <div className="ml-7 mb-3">
                  {form.batas_pelamar ? (
                    form.batas_pelamar
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FaCheckCircle className="text-green-500" />
                  <span className="font-semibold">Status:</span>
                </div>
                <div className="ml-7 mb-3 capitalize">{form.status}</div>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none select-none">
              <FaRegListAlt className="text-blue-300 text-[80px] sm:text-[120px]" />
            </div>
          </div>
          <div className="text-gray-600 text-sm text-center">
            Silakan periksa kembali data lowongan Anda sebelum submit.
          </div>
        </div>
      );
    }
    if (step === 4) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-xl sm:text-2xl font-bold text-green-700 mb-4">
            Lowongan anda berhasil di format
          </div>
          <div className="text-gray-700 mb-6 text-center">
            Silahkan klik tombol <b>Submit</b> untuk menyelesaikanya.
          </div>
        </div>
      );
    }
    return null;
  }

  // Custom canNext untuk validasi batas lamaran tidak boleh hari sebelumnya
  const canNext = useCallback(
    async () => {
      const fieldsPerStep = [
        ["judul_pekerjaan"],
        ["deskripsi", "kualifikasi"],
        [
          "gaji_min",
          "gaji_max",
          "batas_lamaran_bulan",
          "batas_lamaran_hari",
          "batas_lamaran_tahun",
          "batas_pelamar",
          "provinsi",
          "kota",
          "tipe_kerja",
          "status",
        ],
        [],
        [],
      ];
      const fields = fieldsPerStep[step] || [];
      const valid = await trigger(fields);

      // Step 2: validasi batas lamaran tidak boleh hari sebelumnya
      if (step === 2) {
        const values = getValues();
        const tahun = values.batas_lamaran_tahun;
        const bulan = values.batas_lamaran_bulan;
        const hari = values.batas_lamaran_hari;
        if (tahun && bulan && hari) {
          if (!isBatasLamaranValid(tahun, bulan, hari)) {
            setFormError("batas_lamaran_tanggal_invalid", {
              type: "manual",
              message: "Batas lamaran tidak boleh hari sebelumnya.",
            });
            return false;
          } else {
            clearErrors("batas_lamaran_tanggal_invalid");
          }
        }
      }
      return valid;
    },
    [step, trigger, getValues, setFormError, clearErrors]
  );

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    setLoading(true);

    const token = getTokenFromSessionStorage();
    if (!token) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    try {
      const lokasiGabungan =
        data.provinsi && data.kota ? `${data.kota}, ${data.provinsi}` : "";
      const gajiGabungan =
        data.gaji_min && data.gaji_max
          ? `${data.gaji_min} - ${data.gaji_max}`
          : "";

      // Compose batas_lamaran string
      const batasLamaranStr = formatBatasLamaran(
        data.batas_lamaran_tahun,
        data.batas_lamaran_bulan,
        data.batas_lamaran_hari
      );

      // Validate batasLamaranStr
      let batasLamaranISO = "";
      if (batasLamaranStr) {
        // Convert to ISO string (set to 00:00:00 local time)
        const dateObj = new Date(`${batasLamaranStr}T00:00:00`);
        if (!isNaN(dateObj.getTime())) {
          // Cek juga di sini, jika hari sebelumnya, tolak
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (dateObj < today) {
            setError("Batas lamaran tidak boleh hari sebelumnya.");
            setLoading(false);
            return;
          }
          batasLamaranISO = dateObj.toISOString();
        }
      }

      const res = await fetch(
        "https://tugasakhir-production-6c6c.up.railway.app/lowongan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            ...data,
            gaji: gajiGabungan,
            lokasi: lokasiGabungan,
            batas_lamaran: batasLamaranISO,
            batas_pelamar: data.batas_pelamar
              ? parseInt(data.batas_pelamar, 10)
              : "",
          }),
        }
      );

      if (res.status === 401 || res.status === 403) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        const resData = await res.json().catch(() => ({}));
        throw new Error(
          resData.message || resData.msg || "Gagal membuat lowongan."
        );
      }

      setSuccess("Lowongan berhasil dibuat!");
      toast.success("Lowongan berhasil dibuat!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      reset();

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
      toast.error(err.message || "Terjadi kesalahan.", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  // Responsive Layout
  // Gunakan flex dan overflow-hidden agar tidak scroll, form tetap di tengah
  return (
    <div className="min-h-screen h-screen w-full absolute left-0 top-0 right-0 bg-gray-100 overflow-hidden flex flex-col">
      <LowonganNavbar />
      <ToastContainer />
      {/* Modal Loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg flex items-center justify-center p-8">
            <Loader />
          </div>
        </div>
      )}
      <div
        className="flex-1 flex justify-center items-center w-full relative"
        style={{ minHeight: 0 }}
      >
        <div
          className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-10"
          style={{
            marginTop: 0,
            marginBottom: 0,
            maxHeight: "calc(100vh - 64px - 32px)",
            overflow: "auto",
            boxSizing: "border-box",
          }}
        >
          <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-gray-800 text-center tracking-tight">
            Buat Lowongan Baru
          </h1>
          <Stepper />
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            autoComplete="off"
            style={{ minHeight: 0 }}
          >
            <StepContent />
            {error && (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2 font-semibold text-[15px]">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-700 bg-green-50 border border-green-200 rounded px-4 py-2 font-semibold text-[15px]">
                {success}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                type="button"
                className={`flex-1 bg-white text-blue-700 py-3.5 rounded-full font-bold text-lg border-2 border-blue-700 shadow transition
                  ${
                    step === 0 || loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-50"
                  }`}
                disabled={step === 0 || loading}
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
              >
                Kembali
              </button>
              {/* Tombol Next */}
              {step < steps.length - 1 && (
                <button
                  type="button"
                  className={`flex-1 py-3.5 rounded-full font-bold text-lg border-0 shadow transition text-white
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    bg-blue-700
                  `}
                  style={{
                    opacity: loading ? 0.6 : 1,
                    background: "#0a66c2",
                  }}
                  disabled={loading}
                  onClick={async () => {
                    const valid = await canNext();
                    if (valid)
                      setStep((s) => Math.min(s + 1, steps.length - 1));
                  }}
                >
                  {step === steps.length - 2
                    ? "Buat Lowongan"
                    : "Selanjutnya"}
                </button>
              )}
              {/* Tombol Submit hanya muncul di step terakhir */}
              {step === steps.length - 1 && (
                <button
                  type="submit"
                  className={`flex-1 py-3.5 rounded-full font-bold text-lg border-0 shadow transition text-white
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    bg-blue-700
                  `}
                  style={{
                    opacity: loading ? 0.6 : 1,
                    background: "#0a66c2",
                  }}
                  disabled={loading}
                >
                  Submit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
