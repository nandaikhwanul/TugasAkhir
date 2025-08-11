"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../navbar/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";

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

// LinkedIn-style avatar color generator
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

function CompanyAvatar({ name }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "C";
  const bg = stringToColor(name || "C");
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-bold text-lg shadow"
      style={{
        width: 48,
        height: 48,
        background: bg,
        border: "2px solid #fff",
      }}
    >
      {initials}
    </div>
  );
}

// Icon for view
function ViewIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Icon for approve
function CheckIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Icon for reject
function RejectIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

// Modal untuk preview detail lowongan
function PreviewModal({ open, onClose, lowonganId }) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !lowonganId) {
      setDetail(null);
      setError("");
      return;
    }
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      setDetail(null);
      const token = getTokenFromCookie();
      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `ttps://tugasakhir-production-6c6c.up.railway.app/admin/lowongan/preview?id=${encodeURIComponent(lowonganId)}`,
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
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || data.msg || "Gagal mengambil detail lowongan.");
        }
        const data = await res.json();
        console.log("Data detail lowongan:", data); // log data yang diberikan

        // --- FIX: handle data.preview structure ---
        // Cek jika data.preview ada, gunakan itu, jika tidak, fallback ke data.lowongan atau data
        let l = null;
        if (data.preview) {
          l = data.preview;
        } else if (data.lowongan) {
          l = data.lowongan;
        } else {
          l = data;
        }

        // Perusahaan bisa di dalam l.perusahaan atau l.nama_perusahaan, atau l.perusahaan.nama_perusahaan
        let perusahaanObj = l.perusahaan;
        let namaPerusahaan =
          (perusahaanObj && (perusahaanObj.nama_perusahaan || perusahaanObj.nama)) ||
          l.nama_perusahaan ||
          "";

        setDetail({
          judul_pekerjaan: l.judul_pekerjaan,
          deskripsi: l.deskripsi,
          kualifikasi: l.kualifikasi,
          lokasi: l.lokasi,
          tipe_kerja: l.tipe_kerja,
          gaji: l.gaji,
          batas_lamaran: l.batas_lamaran,
          status: l.status,
          perusahaan: perusahaanObj,
          nama_perusahaan: namaPerusahaan,
          _id: l._id,
          alasan_penolakan: l.alasan_penolakan,
        });
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [open, lowonganId]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Tutup"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-2 text-[#0a66c2] flex items-center gap-2">
          <ViewIcon className="text-[#0a66c2]" /> Preview Lowongan
        </h2>
        {loading && (
          <div className="flex items-center gap-2 text-[#0a66c2] font-semibold mb-2">
            <svg className="animate-spin h-5 w-5 text-[#0a66c2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#0a66c2" strokeWidth="4"></circle>
              <path className="opacity-75" fill="#0a66c2" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Memuat detail lowongan...
          </div>
        )}
        {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
        {!loading && !error && detail && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <CompanyAvatar name={
                (detail.perusahaan && (detail.perusahaan.nama_perusahaan || detail.perusahaan.nama)) ||
                detail.nama_perusahaan ||
                "Perusahaan"
              } />
              <div>
                <div className="font-bold text-lg text-[#0a66c2]">{detail.judul_pekerjaan || "Tanpa Judul"}</div>
                <div className="text-gray-700 text-sm">
                  <span className="font-medium">Perusahaan:</span>{" "}
                  <span className="font-semibold">
                    {(detail.perusahaan && (detail.perusahaan.nama_perusahaan || detail.perusahaan.nama)) ||
                      detail.nama_perusahaan ||
                      "-"}
                  </span>
                </div>
                <div className="text-gray-500 text-xs">
                  <span className="font-medium">ID:</span> {detail._id}
                </div>
                <div className="text-xs mt-1">
                  <span className="font-medium">Status:</span>{" "}
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0a66c2] border border-blue-100">
                    {detail.status}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-500">Deskripsi:</span>
              <div className="text-gray-700 text-sm whitespace-pre-line mt-1">
                {detail.deskripsi || "-"}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-500">Kualifikasi:</span>
              <div className="text-gray-700 text-sm whitespace-pre-line mt-1">
                {detail.kualifikasi || "-"}
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-500">Lokasi:</span>{" "}
              <span className="text-gray-700">{detail.lokasi || "-"}</span>
            </div>
            <div>
              <span className="font-medium text-blue-500">Tipe Kerja:</span>{" "}
              <span className="text-gray-700">{detail.tipe_kerja || "-"}</span>
            </div>
            <div>
              <span className="font-medium text-blue-500">Gaji:</span>{" "}
              <span className="text-gray-700">{detail.gaji || "-"}</span>
            </div>
            <div>
              <span className="font-medium text-blue-500">Batas Lamaran:</span>{" "}
              <span className="text-gray-700">
                {detail.batas_lamaran
                  ? new Date(detail.batas_lamaran).toLocaleDateString("id-ID")
                  : "-"}
              </span>
            </div>
            {detail.alasan_penolakan && (
              <div>
                <span className="font-medium text-red-600">Alasan Penolakan:</span>{" "}
                <span className="text-gray-700">{detail.alasan_penolakan}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifikasiLowonganPage() {
  const [loading, setLoading] = useState(false);
  const [pendingLowongan, setPendingLowongan] = useState([]);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, lowonganId: null });
  const [previewModal, setPreviewModal] = useState({ open: false, lowonganId: null });
  const router = useRouter();

  // Fetch lowongan pending verifikasi (khusus admin)
  useEffect(() => {
    const fetchPendingLowongan = async () => {
      setLoading(true);
      setError("");
      const token = getTokenFromCookie();
      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/lowongan/pending/admin", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || data.msg || "Gagal mengambil data lowongan pending.");
        }
        const data = await res.json();
        // Only take the required fields for each lowongan, ambil nama_perusahaan dari l.perusahaan.nama_perusahaan
        const filtered = Array.isArray(data.pendingLowongan)
          ? data.pendingLowongan.map((l) => ({
              _id: l._id,
              nama_perusahaan: l.perusahaan?.nama_perusahaan || "-", // ambil dari perusahaan.nama_perusahaan
              judul_pekerjaan: l.judul_pekerjaan,
              deskripsi: l.deskripsi,
              kualifikasi: l.kualifikasi,
              lokasi: l.lokasi,
              tipe_kerja: l.tipe_kerja,
              gaji: l.gaji,
              batas_lamaran: l.batas_lamaran,
              status: l.status,
            }))
          : [];
        setPendingLowongan(filtered);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingLowongan();
  }, []);

  // Approve lowongan
  const handleApprove = async (lowonganId) => {
    setProcessingId(lowonganId);
    setError("");
    const token = getTokenFromCookie();
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setProcessingId(null);
      return;
    }

    try {
      const res = await fetch(
        `ttps://tugasakhir-production-6c6c.up.railway.app/lowongan/${lowonganId}/verifikasi`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ action: "approve" }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.msg || "Gagal menerima lowongan.");
      }
      toast.success("Lowongan berhasil diterima!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      setPendingLowongan((prev) => prev.filter((l) => l._id !== lowonganId));
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject lowongan
  const handleReject = async (lowonganId, alasan) => {
    setProcessingId(lowonganId);
    setError("");
    const token = getTokenFromCookie();
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setProcessingId(null);
      return;
    }

    try {
      const res = await fetch(
        `ttps://tugasakhir-production-6c6c.up.railway.app/lowongan/${lowonganId}/verifikasi`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            action: "reject",
            alasan_penolakan: alasan || "",
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.msg || "Gagal menolak lowongan.");
      }
      toast.success("Lowongan berhasil ditolak!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      setPendingLowongan((prev) => prev.filter((l) => l._id !== lowonganId));
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setProcessingId(null);
      setRejectModal({ open: false, lowonganId: null });
    }
  };

  // Fungsi untuk preview detail lowongan (menggunakan modal, bukan redirect)
  const handleView = (lowonganId) => {
    setPreviewModal({ open: true, lowonganId });
  };

  // Membagi pendingLowongan menjadi array of array, tiap subarray berisi max 3 item
  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  // Modal penolakan dengan react-hook-form
  function RejectModal({ open, onClose, onSubmit, loading }) {
    const { register, handleSubmit, reset } = useForm({
      defaultValues: { alasan_penolakan: "" },
    });

    // Reset form when modal open/close changes
    useEffect(() => {
      if (open) {
        reset({ alasan_penolakan: "" });
      }
    }, [open, reset]);

    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-2 text-red-600 flex items-center gap-2">
            <RejectIcon className="text-red-600" /> Tolak Lowongan
          </h2>
          <p className="mb-3 text-gray-700">
            Anda yakin ingin menolak lowongan ini? Anda dapat memberikan alasan penolakan (opsional).
          </p>
          <form
            onSubmit={handleSubmit((data) => {
              onSubmit(data.alasan_penolakan);
            })}
          >
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 mb-4 resize-none"
              rows={3}
              placeholder="Alasan penolakan (opsional)"
              {...register("alasan_penolakan")}
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded font-semibold border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700"
                onClick={onClose}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                <RejectIcon /> {loading ? "Menolak..." : "Tolak"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Lebar sidebar dari AdminSidebar adalah 220px (lihat file_context_0)
  // Jadi konten utama harus diberi margin-left minimal 220px agar tidak ketutupan sidebar
  // Gunakan responsive: di mobile, margin-left 0, di md ke atas margin-left 220px

  return (
    <div className="min-h-screen bg-[#f3f6f8]">
      <ToastContainer />
      <Navbar />
      <RejectModal
        open={rejectModal.open}
        onClose={() => {
          setRejectModal({ open: false, lowonganId: null });
        }}
        onSubmit={(alasan_penolakan) => {
          if (rejectModal.lowonganId) {
            handleReject(rejectModal.lowonganId, alasan_penolakan);
          }
        }}
        loading={processingId === rejectModal.lowonganId}
      />
      <PreviewModal
        open={previewModal.open}
        lowonganId={previewModal.lowonganId}
        onClose={() => setPreviewModal({ open: false, lowonganId: null })}
      />
      <div
        className="flex flex-col items-center pt-12 pb-16 px-2 min-h-screen"
        style={{
          marginLeft: "0px",
        }}
      >
        {/* Responsive margin-left for sidebar */}
        <style jsx global>{`
          @media (min-width: 768px) {
            .verifikasi-lowongan-main-content {
              margin-left: 220px !important;
            }
          }
        `}</style>
        <div className="verifikasi-lowongan-main-content w-full max-w-6xl">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-8 py-8 mb-8">
            <h1 className="text-3xl font-bold text-[#0a66c2] mb-2 flex items-center gap-2">
              Verifikasi Lowongan Pending
            </h1>
            <p className="text-gray-600 mb-6">
              Tinjau dan verifikasi lowongan pekerjaan yang diajukan oleh perusahaan. Tampilkan profesionalisme seperti LinkedIn!
            </p>
            {loading && (
              <div className="mb-4 flex items-center gap-2 text-[#0a66c2] font-semibold">
                <svg className="animate-spin h-5 w-5 text-[#0a66c2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#0a66c2" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="#0a66c2" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Memuat data lowongan pending...
              </div>
            )}
            {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
            {!loading && pendingLowongan.length === 0 && !error && (
              <div className="mb-4 text-gray-700 flex items-center gap-2">
                <svg width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
                Tidak ada lowongan yang menunggu verifikasi.
              </div>
            )}
            <div className="space-y-8">
              {chunkArray(pendingLowongan, 3).map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex flex-col md:flex-row gap-6"
                >
                  {row.map((lowongan) => (
                    <div
                      key={lowongan._id}
                      className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 flex flex-col items-center px-5 py-5 relative"
                      style={{
                        borderLeft: "6px solid #0a66c2",
                        minWidth: 0,
                      }}
                    >
                      <div className="mb-3 flex-shrink-0">
                        <CompanyAvatar name={lowongan.nama_perusahaan || "Perusahaan"} />
                      </div>
                      <div className="flex-1 w-full min-w-0 flex flex-col items-center">
                        <div className="flex items-center">
                        <span className="font-bold text-lg text-[#0a66c2] group-hover:underline text-center">
                            {lowongan.judul_pekerjaan || "Tanpa Judul"}
                          </span>
                        </div>
                        <div className="text-gray-700 text-sm mt-1 text-center">
                          <span className="font-medium">Perusahaan:</span>{" "}
                          <span className="font-semibold">{lowongan.nama_perusahaan || "-"}</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1 text-center">
                          <span className="font-medium">ID:</span> {lowongan._id}
                        </div>
                        <div className="text-gray-700 text-sm mt-1 text-center">
                          <span className="font-medium">Lokasi:</span>{" "}
                          <span className="font-semibold">{lowongan.lokasi || "-"}</span>
                        </div>
                        <div className="text-gray-700 text-sm mt-1 text-center">
                          <span className="font-medium">Tipe Kerja:</span>{" "}
                          <span className="font-semibold">{lowongan.tipe_kerja || "-"}</span>
                        </div>
                        <div className="text-gray-700 text-sm mt-1 text-center">
                          <span className="font-medium">Gaji:</span>{" "}
                          <span className="font-semibold">{lowongan.gaji || "-"}</span>
                        </div>
                        <div className="text-gray-700 text-sm mt-1 text-center">
                          <span className="font-medium">Batas Lamaran:</span>{" "}
                          <span className="font-semibold">
                            {lowongan.batas_lamaran
                              ? new Date(lowongan.batas_lamaran).toLocaleDateString("id-ID")
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0a66c2] border border-blue-100">
                            {lowongan.status === "pending" ? "Pending" : lowongan.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2 w-full justify-center">
                        <button
                          onClick={() => handleView(lowongan._id)}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-[#0a66c2] px-4 py-2 rounded-full font-semibold shadow transition-all duration-150 border border-gray-200"
                        >
                          <ViewIcon />
                          Preview
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, lowonganId: lowongan._id })}
                          className={`flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-full font-semibold shadow transition-all duration-150 border border-red-200 ${
                            processingId === lowongan._id && rejectModal.open && rejectModal.lowonganId === lowongan._id
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={processingId === lowongan._id && rejectModal.open && rejectModal.lowonganId === lowongan._id}
                        >
                          <RejectIcon />
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApprove(lowongan._id)}
                          className={`flex items-center gap-1 bg-[#0a66c2] hover:bg-[#004182] text-white px-4 py-2 rounded-full font-semibold shadow transition-all duration-150 border border-[#0a66c2] ${
                            processingId === lowongan._id && (!rejectModal.open || rejectModal.lowonganId !== lowongan._id)
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={processingId === lowongan._id && (!rejectModal.open || rejectModal.lowonganId !== lowongan._id)}
                        >
                          <CheckIcon />
                          {processingId === lowongan._id && (!rejectModal.open || rejectModal.lowonganId !== lowongan._id)
                            ? "Menerima..."
                            : "Terima"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Jika kurang dari 3, tambahkan div kosong agar grid tetap rapi */}
                  {row.length < 3 &&
                    Array.from({ length: 3 - row.length }).map((_, idx) => (
                      <div key={idx} className="flex-1 min-w-0" />
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
