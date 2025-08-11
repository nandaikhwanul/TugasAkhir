"use client";
import { useState, useEffect } from "react";

// Field list as per instruction
const FIELD_DEFS = [
  { name: "nama_brand", label: "Nama Brand", type: "text" },
  { name: "jumlah_karyawan", label: "Jumlah Karyawan", type: "number" },
  { name: "email_perusahaan", label: "Email Perusahaan", type: "email" },
  { name: "alamat", label: "Alamat", type: "text" },
  { name: "bidang_perusahaan", label: "Bidang Perusahaan", type: "text" },
  { name: "nomor_telp", label: "Nomor Telepon", type: "text" },
  { name: "deskripsi_perusahaan", label: "Deskripsi Perusahaan", type: "textarea" },
  { name: "website", label: "Website", type: "text" },
];

// Step definitions, grouping fields for stepper
const STEPS = [
  {
    label: "Data Perusahaan",
    fields: [
      "nama_brand",
      "jumlah_karyawan",
      "email_perusahaan",
      "alamat",
      "nomor_telp",
    ],
  },
  {
    label: "Informasi Tambahan",
    fields: [
      "bidang_perusahaan",
      "website",
      "deskripsi_perusahaan",
    ],
  },
  {
    label: "Konfirmasi",
    fields: [],
  },
];

// Helper to get field definition by name
const getFieldDef = (name) => FIELD_DEFS.find((f) => f.name === name);

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

// Helper: Ambil id perusahaan dari cookie (client-side)
function getPerusahaanIdFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith("id=")) {
      return decodeURIComponent(c.substring("id=".length));
    }
  }
  return null;
}

export default function PerusahaanStepper({ onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    nama_brand: "",
    jumlah_karyawan: "",
    email_perusahaan: "",
    alamat: "",
    bidang_perusahaan: "",
    nomor_telp: "",
    deskripsi_perusahaan: "",
    website: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch perusahaan email and id on mount
  useEffect(() => {
    async function fetchPerusahaanEmail() {
      setLoadingEmail(true);
      setEmailError("");
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setEmailError("Token tidak ditemukan.");
          setLoadingEmail(false);
          return;
        }
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!res.ok) {
          setEmailError("Gagal mengambil data perusahaan.");
          setLoadingEmail(false);
          return;
        }
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          email_perusahaan: data.email_perusahaan || "",
          // Optionally prefill other fields if available
          nama_brand: data.nama_brand || "",
          jumlah_karyawan: data.jumlah_karyawan || "",
          alamat: data.alamat || "",
          bidang_perusahaan: data.bidang_perusahaan || "",
          nomor_telp: data.nomor_telp || "",
          deskripsi_perusahaan: data.deskripsi_perusahaan || "",
          website: data.website || "",
        }));
        // Simpan id perusahaan ke cookie jika belum ada
        if (typeof document !== "undefined" && data._id) {
          document.cookie = `id=${encodeURIComponent(data._id)}; path=/`;
        }
        setLoadingEmail(false);
      } catch (err) {
        setEmailError("Terjadi kesalahan saat mengambil email perusahaan.");
        setLoadingEmail(false);
      }
    }
    fetchPerusahaanEmail();
    // eslint-disable-next-line
  }, []);

  // All field names (for progress)
  const allFieldNames = FIELD_DEFS.map((f) => f.name);
  const totalFields = allFieldNames.length;
  const filledFields = allFieldNames.filter(
    (name) => form[name] && form[name].toString().trim() !== ""
  ).length;
  const progressPercent = Math.round((filledFields / totalFields) * 100);

  // Find the first step that has an empty field, or return last step (confirmation)
  const getFirstIncompleteStep = () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const stepFields = STEPS[i].fields;
      for (let field of stepFields) {
        if (!form[field] || form[field].toString().trim() === "") {
          return i;
        }
      }
    }
    return STEPS.length - 1;
  };

  // On next, jump to first incomplete step if any, else next step
  const handleNext = () => {
    const firstIncompleteStep = getFirstIncompleteStep();
    if (firstIncompleteStep !== step) {
      setStep(firstIncompleteStep);
    } else if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  // On back, just go to previous step
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // On change, update form state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // On submit, PATCH ke endpoint dengan semua data field, id dan token dari cookie
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const firstIncompleteStep = getFirstIncompleteStep();
    if (firstIncompleteStep !== STEPS.length - 1) {
      setStep(firstIncompleteStep);
      return;
    }
    setSubmitLoading(true);
    try {
      const token = getTokenFromCookie();
      const id = getPerusahaanIdFromCookie();
      if (!token) {
        setSubmitError("Token tidak ditemukan.");
        setSubmitLoading(false);
        return;
      }
      if (!id) {
        setSubmitError("ID perusahaan tidak ditemukan.");
        setSubmitLoading(false);
        return;
      }
      // Kirim PATCH ke endpoint
      const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/perusahaan/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nama_brand: form.nama_brand,
          jumlah_karyawan: form.jumlah_karyawan,
          alamat: form.alamat,
          bidang_perusahaan: form.bidang_perusahaan,
          nomor_telp: form.nomor_telp,
          deskripsi_perusahaan: form.deskripsi_perusahaan,
          website: form.website,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSubmitError(
          errData?.message ||
            "Gagal mengupdate data perusahaan. Silakan coba lagi."
        );
        setSubmitLoading(false);
        return;
      }
      setSubmitted(true);
      setSubmitLoading(false);
      setStep(STEPS.length - 1);
      setTimeout(() => {
        if (typeof onClose === "function") {
          onClose();
        } else if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 1000);
    } catch (err) {
      setSubmitError("Terjadi kesalahan saat mengirim data.");
      setSubmitLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-10 bg-white rounded-xl shadow-lg p-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-blue-700">Progress</span>
          <span className="text-xs font-medium text-blue-700">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.label} className="flex-1 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                idx === step
                  ? "bg-blue-600"
                  : idx < step
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >
              {idx + 1}
            </div>
            <span
              className={`text-xs mt-2 text-center ${
                idx === step
                  ? "text-blue-700 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {s.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className="w-full h-1 bg-gray-200 mt-2 mb-2"></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit}>
        {step < STEPS.length - 1 && (
          <div className="space-y-5">
            {STEPS[step].fields.map((fieldName) => {
              const field = getFieldDef(fieldName);
              if (!field) return null;
              // Special handling for email_perusahaan: disabled and loading/error state
              if (field.name === "email_perusahaan") {
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-black mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={
                        loadingEmail
                          ? "Memuat..."
                          : form[field.name]
                      }
                      disabled
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-black bg-gray-100 cursor-not-allowed ${
                        loadingEmail ? "animate-pulse" : ""
                      }`}
                      required
                    />
                    {emailError && (
                      <div className="text-xs text-red-500 mt-1">{emailError}</div>
                    )}
                    {/* Progress bar for each input */}
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          form[field.name] && form[field.name].toString().trim() !== ""
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                        style={{
                          width:
                            form[field.name] && form[field.name].toString().trim() !== ""
                              ? "100%"
                              : "0%",
                        }}
                      ></div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-black mb-1">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-blue-400 text-black"
                      rows={3}
                      required
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-blue-400 text-black"
                      required
                    />
                  )}
                  {/* Progress bar for each input */}
                  <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        form[field.name] && form[field.name].toString().trim() !== ""
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                      style={{
                        width:
                          form[field.name] && form[field.name].toString().trim() !== ""
                            ? "100%"
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Konfirmasi Step */}
        {step === STEPS.length - 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-black">
              Konfirmasi Data Perusahaan
            </h2>
            <div className="space-y-2 text-sm text-black">
              {FIELD_DEFS.map((field) => (
                <div key={field.name}>
                  <span className="font-medium">{field.label}:</span>{" "}
                  {form[field.name]}
                </div>
              ))}
            </div>
            {submitted && (
              <div className="mt-6 text-green-600 font-semibold">
                Data berhasil dikirim!
              </div>
            )}
            {submitError && (
              <div className="mt-4 text-red-600 font-semibold">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || submitLoading}
            className={`px-5 py-2 rounded-lg font-semibold text-sm ${
              step === 0 || submitLoading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Kembali
          </button>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
              disabled={
                STEPS[step].fields.some((f) => !form[f] || form[f].toString().trim() === "")
                || loadingEmail
                || submitLoading
              }
            >
              Selanjutnya
            </button>
          )}
          {step === STEPS.length - 1 && (
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 ${
                submitLoading ? "opacity-60 cursor-not-allowed" : ""
              }`}
              disabled={submitted || submitLoading}
            >
              {submitLoading
                ? "Mengirim..."
                : submitted
                ? "Terkirim"
                : "Kirim"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
