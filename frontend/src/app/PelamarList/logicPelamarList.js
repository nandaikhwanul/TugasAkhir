"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import VerifikasiModal from "./modal";
import NavbarPage from "../navbar/page";

// Helper: Avatar generator (inisial)
function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Modal for Detail Pelamar
function DetailPelamarModal({ open, onClose, pelamar, judulPekerjaan }) {
  if (!open || !pelamar) return null;

  // Ambil data alumni jika ada
  const alumni = pelamar.alumni || {};
  const nama =
    pelamar.nama ||
    alumni.nama ||
    alumni.name ||
    "Tanpa Nama";
  const email = alumni.email || "-";
  const jurusan = alumni.program_studi || "-";
  const tahunLulus = alumni.tahun_lulus || "-";
  const noHp = alumni.nohp || "-";
  const rawTanggalLahir = alumni.tanggal_lahir || "-";

  // Ambil hanya yyyy-mm-dd dari tanggal lahir (jika ada)
  let tanggalLahir = "-";
  if (rawTanggalLahir && typeof rawTanggalLahir === "string" && rawTanggalLahir.length >= 10) {
    tanggalLahir = rawTanggalLahir.slice(0, 10);
  }

  const status = pelamar.status || "-";

  // Ambil link CV jika ada
  const cvUrl =
    pelamar.cvUrl ||
    (alumni && (alumni.cvUrl || alumni.cv || alumni.cv_url)) ||
    pelamar.cv ||
    pelamar.cv_url ||
    null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Tutup"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-black">Detail Pelamar</h2>
        {/* Tampilkan judul pekerjaan */}
        {judulPekerjaan && (
          <div className="mb-4 text-center">
            <span className="font-medium text-gray-500">Judul Pekerjaan: </span>
            <span className="font-semibold text-[#0a66c2]">{judulPekerjaan}</span>
          </div>
        )}
        <div className="flex flex-col items-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#e0e0e0] flex items-center justify-center text-3xl font-bold text-[#0a66c2] mb-2">
            {getInitials(nama)}
          </div>
          <div className="text-lg font-semibold text-black">{nama}</div>
          <div className="text-sm text-black">{email}</div>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-500">Tahun Lulus:</span> <span className="text-green-600">{tahunLulus}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">No HP:</span> <span className="text-green-600">{noHp}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Tanggal Lahir:</span> <span className="text-green-600">{tanggalLahir}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Jurusan:</span> <span className="text-green-600">{jurusan}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Status:</span>{" "}
            {status === "diterima" ? (
              <span className="text-green-600 font-semibold">Diterima</span>
            ) : status === "ditolak" ? (
              <span className="text-red-600 font-semibold">Ditolak</span>
            ) : (
              <span className="text-blue-600 font-semibold">Menunggu Verifikasi</span>
            )}
          </div>
        </div>
      </div>
      {/* Button Lihat CV di bawah container modal */}
      <div className="flex flex-col items-center mt-4">
        {cvUrl ? (
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow transition"
          >
            Lihat CV
          </a>
        ) : (
          <button
            className="bg-gray-400 text-white px-6 py-2 rounded-full font-semibold shadow cursor-not-allowed"
            disabled
          >
            CV Tidak Tersedia
          </button>
        )}
      </div>
    </div>
  );
}

export default function PelamarListPage() {
  const [pelamar, setPelamar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lowonganId, setLowonganId] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [notifLoadingId, setNotifLoadingId] = useState(null);
  const [notifError, setNotifError] = useState("");
  const [notifSuccess, setNotifSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPelamar, setSelectedPelamar] = useState(null);

  // State for detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailPelamar, setSelectedDetailPelamar] = useState(null);

  // State for judul_pekerjaan
  const [judulPekerjaan, setJudulPekerjaan] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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

  function getLowonganId(searchParams, pathname) {
    const idFromQuery = searchParams.get("id");
    if (idFromQuery) return idFromQuery;
    if (pathname) {
      const segments = pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (/^[a-fA-F0-9]{24}$/.test(last)) {
        return last;
      }
    }
    return "";
  }

  // Fetch judul_pekerjaan dari endpoint khusus perusahaan
  const fetchJudulPekerjaan = async (id) => {
    if (!id) {
      setJudulPekerjaan("");
      return;
    }
    const token = getTokenFromCookie();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      // Ganti endpoint ke /lowongan/me/:id
      const res = await fetch(`http://localhost:5000/lowongan/me/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!res.ok) {
        setJudulPekerjaan("");
        return;
      }
      const data = await res.json();
      console.log(data); // <--- log data nya
      // Akses data.lowongan.judul_pekerjaan, bukan langsung data.judul_pekerjaan
      setJudulPekerjaan(
        (data.lowongan && (
          data.lowongan.judul_pekerjaan ||
          data.lowongan.judulPekerjaan ||
          data.lowongan.title ||
          data.lowongan.nama_pekerjaan
        )) || ""
      );
    } catch {
      setJudulPekerjaan("");
    }
  };

  // Step 1: Pisahkan pengambilan lowonganId dan fetch data lain
  useEffect(() => {
    setLowonganId(getLowonganId(searchParams, pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  // Step 2: Fetch pelamar dan judul pekerjaan hanya setelah lowonganId sudah terisi
  useEffect(() => {
    if (!lowonganId) return;
    fetchPelamar();
    fetchJudulPekerjaan(lowonganId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowonganId, router]);

  const fetchPelamar = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setPelamar([]);
    const token = getTokenFromCookie();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/lowongan/${lowonganId}/pelamar`,
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
        } catch {}
        const msg = data.message || data.msg || "";
        if (
          res.status === 401 ||
          /token.*expired|token.*invalid|jwt.*expired|jwt.*invalid/i.test(msg)
        ) {
          router.push("/login");
          return;
        }
        throw new Error(msg || "Gagal mengambil data pelamar.");
      }
      let data = await res.json();
      let pelamarArr = [];
      if (Array.isArray(data)) {
        pelamarArr = data;
      } else if (Array.isArray(data.pelamar)) {
        pelamarArr = data.pelamar;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.data)) {
          pelamarArr = data.data;
        }
      }
      setPelamar(pelamarArr);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const sendNotifikasiHasilLamaran = async ({
    pelamarId,
    lowonganId,
    status,
    pesan,
    channel = "web",
  }) => {
    setNotifLoadingId(pelamarId);
    setNotifError("");
    setNotifSuccess("");
    const token = getTokenFromCookie();
    if (!token) {
      router.push("/login");
      return false;
    }
    try {
      const res = await fetch("http://localhost:5000/pesan/notifikasi-hasil-lamaran", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          pelamarId,
          lowonganId,
          status,
          pesan,
          channel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.msg || "Gagal mengirim notifikasi.";
        setNotifError(msg);
        setNotifLoadingId(null);
        return false;
      }
      setNotifSuccess("Notifikasi berhasil dikirim.");
      setNotifLoadingId(null);
      setTimeout(() => setNotifSuccess(""), 1500);
      return true;
    } catch (err) {
      setNotifError(err.message || "Terjadi kesalahan saat mengirim notifikasi.");
      setNotifLoadingId(null);
      return false;
    }
  };

  const handleProsesPelamar = async (pelamarId, aksi, pesan) => {
    setProcessingId(pelamarId);
    setError("");
    setSuccess("");
    setNotifError("");
    setNotifSuccess("");
    const token = getTokenFromCookie();
    if (!token) {
      router.push("/login");
      return;
    }

    let pesanDefault =
      aksi === "tolak"
        ? "Mohon maaf, Anda belum diterima di perusahaan kami."
        : "Selamat, Anda diterima di perusahaan kami!";
    const finalPesan = pesan && pesan.trim() ? pesan : pesanDefault;

    const notifOk = await sendNotifikasiHasilLamaran({
      pelamarId,
      lowonganId,
      status: aksi === "tolak" ? "ditolak" : "diterima",
      pesan: finalPesan,
      channel: "web",
    });

    if (!notifOk) {
      setProcessingId(null);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/lowongan/pelamar/${pelamarId}/${aksi === "tolak" ? "tolak" : "terima"}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ lowonganId, aksi }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.msg || `Gagal memproses pelamar (${aksi}).`;
        throw new Error(msg);
      }
      setSuccess(
        aksi === "tolak"
          ? "Pelamar berhasil ditolak."
          : "Pelamar berhasil diterima."
      );
      setPelamar((prev) =>
        prev.map((p) =>
          p._id === pelamarId
            ? { ...p, status: aksi === "tolak" ? "ditolak" : "diterima" }
            : p
        )
      );
      setTimeout(() => setSuccess(""), 1500);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenVerifikasiModal = (pelamar) => {
    setSelectedPelamar(pelamar);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPelamar(null);
  };

  const handleVerifikasi = async ({ aksi, pesan }) => {
    if (!selectedPelamar) return;
    await handleProsesPelamar(selectedPelamar._id, aksi, pesan);
    setModalOpen(false);
    setSelectedPelamar(null);
  };

  // Handler for opening detail modal
  const handleOpenDetailModal = (pelamar) => {
    setSelectedDetailPelamar(pelamar);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedDetailPelamar(null);
  };

  // LinkedIn-style card
  return (
    <div className="min-h-screen bg-[#f3f2ef] py-8 px-2 flex flex-col items-center">
      <NavbarPage />
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-[#1d2226] text-center">Daftar Pelamar</h1>
        
        {/* Tampilkan judul_pekerjaan di bawah ID Lowongan */}
        {judulPekerjaan && (
          <div className="mb-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-[#0a66c2] text-center">{judulPekerjaan}</h2>
          </div>
        )}
        {loading && (
          <div className="mb-4 text-blue-600 font-semibold text-center">Memuat data pelamar...</div>
        )}
        {error && (
          <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>
        )}
        {success && (
          <div className="mb-4 text-green-600 font-semibold text-center">{success}</div>
        )}
        {notifError && (
          <div className="mb-4 text-red-600 font-semibold text-center">{notifError}</div>
        )}
        {notifSuccess && (
          <div className="mb-4 text-green-600 font-semibold text-center">{notifSuccess}</div>
        )}
        {!loading && pelamar.length === 0 && !error && (
          <div className="mb-4 text-gray-700 text-center">Belum ada pelamar untuk lowongan ini.</div>
        )}
        <div className="space-y-5">
          {pelamar.map((p, idx) => {
            const nama =
              p.nama ||
              (p.alumni && (p.alumni.nama || p.alumni.name)) ||
              "Tanpa Nama";
            const email = (p.alumni && p.alumni.email) || "-";
            const nim = (p.alumni && p.alumni.nim) || "-";
            const jurusan = (p.alumni && p.alumni.program_studi) || "-";
            const status = p.status || "-";
            // LinkedIn style: card with avatar, name, info, action
            return (
              <div
                key={p._id || idx}
                className="bg-white rounded-lg shadow border border-gray-200 flex flex-col md:flex-row items-center md:items-start px-6 py-5 hover:shadow-lg transition"
                style={{
                  borderLeft: status === "diterima"
                    ? "4px solid #1db954"
                    : status === "ditolak"
                    ? "4px solid #e60023"
                    : "4px solid #0a66c2"
                }}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#e0e0e0] text-2xl font-bold text-[#0a66c2] mr-0 md:mr-6 mb-3 md:mb-0">
                  {getInitials(nama)}
                </div>
                {/* Info */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-[#1d2226]">{nama}</div>
                      <div className="text-sm text-gray-600">{email}</div>
                    </div>
                    <div className="mt-2 md:mt-0 flex flex-row gap-2">
                      {status === "diterima" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-300">
                          <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Diterima
                        </span>
                      )}
                      {status === "ditolak" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-300">
                          <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          Ditolak
                        </span>
                      )}
                      {status !== "diterima" && status !== "ditolak" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-300">
                          <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>
                          Menunggu Verifikasi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
                    <div>
                      <span className="font-medium text-gray-500">NIM:</span> {nim}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Jurusan:</span> {jurusan}
                    </div>
                  </div>
                </div>
                {/* Action */}
                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end w-full md:w-auto">
                  {status !== "diterima" && status !== "ditolak" && (
                    <>
                      <button
                        className="bg-[#0a66c2] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#004182] transition w-full md:w-auto shadow-sm"
                        onClick={() => handleOpenVerifikasiModal(p)}
                        disabled={processingId === p._id || notifLoadingId === p._id}
                      >
                        {processingId === p._id || notifLoadingId === p._id
                          ? "Memproses..."
                          : "Verifikasi"}
                      </button>
                      {/* Button detail di bawah button verifikasi */}
                      <button
                        type="button"
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-semibold transition w-full md:w-auto shadow-sm"
                        onClick={() => handleOpenDetailModal(p)}
                      >
                        Detail
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Modal Verifikasi */}
      {modalOpen && selectedPelamar && (
        <VerifikasiModal
          open={modalOpen}
          onClose={handleCloseModal}
          pelamar={selectedPelamar}
          onVerifikasi={handleVerifikasi}
          loading={processingId === (selectedPelamar && selectedPelamar._id)}
        />
      )}
      {/* Modal Detail Pelamar */}
      <DetailPelamarModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        pelamar={selectedDetailPelamar}
        judulPekerjaan={judulPekerjaan}
      />
    </div>
  );
}
