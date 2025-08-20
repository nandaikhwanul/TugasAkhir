"use client";
import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Format waktu relatif sederhana
function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000); // in seconds
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

// Helper untuk truncate isi pesan ke 10 kata (lebih ringkas)
function truncateTextByWords(text, maxWords = 10) {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

// Helper untuk decode JWT dan ambil payload
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function LihatPesan() {
  const [pesanList, setPesanList] = useState([]);
  const [selectedPesan, setSelectedPesan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Untuk deteksi mode mobile (tailwind: md breakpoint = 768px)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fungsi untuk menandai pesan sudah dibaca
  const markAsRead = async (pesan) => {
    if (pesan.sudah_dibaca) {
      setSelectedPesan(pesan);
      return;
    }
    const token = getTokenFromSessionStorage();
    if (!token) {
      setFetchError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    const payload = parseJwt(token);
    const role = payload && payload.role ? payload.role : null;

    try {
      setPesanList((prev) =>
        prev.map((p) =>
          p._id === pesan._id ? { ...p, sudah_dibaca: true } : p
        )
      );
      setSelectedPesan({ ...pesan, sudah_dibaca: true });

      let endpoint = "";
      let options = {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sudah_dibaca: true }),
      };

      if (role === "alumni") {
        endpoint = `https://tugasakhir-production-6c6c.up.railway.app/pesan/${pesan._id}/sudah-dibaca`;
      } else {
        endpoint = `https://tugasakhir-production-6c6c.up.railway.app/pesan-bebas/${pesan._id}/dibaca`;
        options = {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };
      }

      const res = await fetch(endpoint, options);
      if (!res.ok) {
        setPesanList((prev) =>
          prev.map((p) =>
            p._id === pesan._id ? { ...p, sudah_dibaca: false } : p
          )
        );
        throw new Error("Gagal menandai pesan sebagai sudah dibaca");
      }
    } catch (err) {
      setFetchError(err.message || "Terjadi kesalahan saat menandai pesan dibaca");
    }
  };

  // Fungsi untuk menghapus pesan
  const handleDeletePesan = async (pesan) => {
    // pesan bisa berupa id atau object
    const pesanId = typeof pesan === "string" ? pesan : pesan?._id;
    if (!pesanId) return;

    toast.info(
      ({ closeToast }) => (
        <div>
          <div className="mb-2">Yakin ingin menghapus pesan ini?</div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              onClick={async () => {
                toast.dismiss();
                setDeleting(true);
                setFetchError(null);
                const token = getTokenFromSessionStorage();
                if (!token) {
                  setFetchError("Token tidak ditemukan. Silakan login ulang.");
                  setDeleting(false);
                  toast.error("Token tidak ditemukan. Silakan login ulang.");
                  return;
                }
                try {
                  // Ambil role dari token
                  const payload = parseJwt(token);
                  const role = payload && payload.role ? payload.role : null;

                  let endpoint = "";
                  if (role === "alumni") {
                    // Endpoint khusus alumni
                    endpoint = `https://tugasakhir-production-6c6c.up.railway.app/pesan/${pesanId}`;
                  } else {
                    // Endpoint lama untuk non-alumni
                    endpoint = `https://tugasakhir-production-6c6c.up.railway.app/pesan-bebas/${pesanId}`;
                  }

                  const res = await fetch(endpoint, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  if (!res.ok) {
                    throw new Error("Gagal menghapus pesan");
                  }
                  // Hapus dari list
                  setPesanList((prev) => prev.filter((p) => p._id !== pesanId));
                  // Jika pesan yang dihapus adalah yang sedang dipilih, reset selectedPesan
                  setSelectedPesan((prev) => (prev && prev._id === pesanId ? null : prev));
                  toast.success("Pesan berhasil dihapus");
                } catch (err) {
                  setFetchError(err.message || "Terjadi kesalahan saat menghapus pesan");
                  toast.error(err.message || "Terjadi kesalahan saat menghapus pesan");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
            >
              Hapus
            </button>
            <button
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
              onClick={() => toast.dismiss()}
              disabled={deleting}
            >
              Batal
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        position: "top-center",
      }
    );
  };

  useEffect(() => {
    async function fetchPesan() {
      setLoading(true);
      setFetchError(null);
      try {
        const token = getTokenFromSessionStorage();
        if (!token) {
          setFetchError("Token tidak ditemukan. Silakan login ulang.");
          setLoading(false);
          return;
        }
        // Cek role dari token
        const payload = parseJwt(token);
        let endpoint = "https://tugasakhir-production-6c6c.up.railway.app/pesan-bebas";
        let role = null;
        if (payload && payload.role) {
          role = payload.role;
          setUserRole(role);
        }
        if (role === "alumni") {
          endpoint = "https://tugasakhir-production-6c6c.up.railway.app/pesan/alumni/me";
        }
        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Gagal mengambil pesan");
        }
        const data = await res.json();

        // Transformasi data agar field pengirim_info konsisten
        let pesanData = (data.data || []).map((pesan) => {
          if (role === "alumni" && pesan.pengirim && pesan.pengirim.nama_perusahaan) {
            // Untuk alumni, gunakan nama_perusahaan dan email_perusahaan
            return {
              ...pesan,
              pengirim_info: {
                name: pesan.pengirim.nama_perusahaan,
                email: pesan.pengirim.email_perusahaan,
              },
            };
          } else if (pesan.pengirim_info) {
            // Untuk non-alumni, sudah ada pengirim_info
            return pesan;
          } else {
            // Fallback jika tidak ada pengirim_info
            return {
              ...pesan,
              pengirim_info: {
                name: "Tanpa Nama",
                email: "-",
              },
            };
          }
        });

        setPesanList(pesanData);

        // Pilih pesan pertama secara default (hanya di desktop)
        if (!isMobile && pesanData && pesanData.length > 0) {
          // Jika pesan pertama belum dibaca, tandai sebagai sudah dibaca
          if (!pesanData[0].sudah_dibaca) {
            markAsRead(pesanData[0]);
          } else {
            setSelectedPesan(pesanData[0]);
          }
        }
      } catch (err) {
        setFetchError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchPesan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Handler untuk memilih pesan (dan menandai sudah dibaca)
  const handleSelectPesan = (pesan) => {
    markAsRead(pesan);
  };

  // Handler tombol kembali di mobile
  const handleBackToList = () => {
    setSelectedPesan(null);
  };

  return (
    <>
      <ToastContainer />
      {/* Responsive: mobile hanya tampilkan list atau detail, desktop tampilkan keduanya */}
      <div className="flex flex-col md:flex-row h-full w-full gap-4 md:gap-6 p-2 md:p-6 relative top-10">
        {/* Sidebar daftar pesan */}
        {/* Mobile: tampilkan hanya jika tidak sedang lihat detail */}
        {(isMobile && !selectedPesan) || !isMobile ? (
          <aside
            className={`md:w-1/3 w-[28rem] bg-white rounded-2xl shadow-md p-0 md:p-2 overflow-hidden flex flex-col max-h-[80vh] ${
              isMobile ? "" : "w-[2rem]"
            }`}
            style={isMobile ? { minWidth: 0 } : {}}
          >
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <span className="font-bold text-lg text-sky-800 flex items-center gap-2">
                Pesan Masuk
                <span className="inline-flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full h-6 min-w-[1.5rem] px-2 ml-1">
                  {pesanList.filter((p) => !p.sudah_dibaca).length}
                </span>
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Memuat pesan...</div>
              ) : fetchError ? (
                <div className="text-center text-red-500 py-8">{fetchError}</div>
              ) : pesanList.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Tidak ada pesan</div>
              ) : (
                <ul>
                  {pesanList.map((pesan) => (
                    <li
                      key={pesan._id}
                      className={`flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition
                        ${
                          selectedPesan && selectedPesan._id === pesan._id
                            ? "bg-sky-50"
                            : pesan.sudah_dibaca
                            ? "bg-white hover:bg-gray-50"
                            : "bg-purple-100/40 hover:bg-purple-100"
                        }
                      `}
                      onClick={() => handleSelectPesan(pesan)}
                    >
                      {/* Badge bulat inisial */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-200 flex items-center justify-center font-bold text-sky-700 text-lg uppercase">
                        {pesan.pengirim_info?.name
                          ? pesan.pengirim_info.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                          : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800 truncate">
                            {pesan.pengirim_info?.name || "Tanpa Nama"}
                          </span>
                          {!pesan.sudah_dibaca && (
                            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-600" title="Belum dibaca"></span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {truncateTextByWords(pesan.isi, 10)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{timeAgo(pesan.createdAt)}</div>
                      </div>
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 p-1"
                        title="Hapus pesan"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeletePesan(pesan);
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        ) : null}

        {/* Detail pesan */}
        {/* Mobile: tampilkan hanya jika sedang lihat detail */}
        {(isMobile && selectedPesan) || !isMobile ? (
          <section className="flex-1 w-full rounded-2xl p-4 md:p-8 flex flex-col max-h-52 md:w-10">
            {!selectedPesan ? (
              <div className="flex items-center justify-center text-gray-400 text-center h-10">
                Pilih pesan untuk melihat detail
              </div>
            ) : (
              <>
                {/* Tombol kembali di mobile */}
                {isMobile && (
                  <button
                    className="mb-4 flex items-center gap-2 text-sky-700 hover:text-sky-900 font-medium"
                    onClick={handleBackToList}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke daftar pesan
                  </button>
                )}
                <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-sky-200 flex items-center justify-center font-bold text-sky-700 text-2xl uppercase">
                      {selectedPesan.pengirim_info?.name
                        ? selectedPesan.pengirim_info.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                        : "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-black">
                        {selectedPesan.pengirim_info?.name || "Tanpa Nama"}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {selectedPesan.pengirim_info?.email || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-end items-center mt-2 md:mt-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedPesan.sudah_dibaca
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {selectedPesan.sudah_dibaca ? "Sudah dibaca" : "Belum dibaca"}
                    </span>
                    <button
                      className="ml-4 text-red-500 hover:text-red-700 p-1"
                      title="Hapus pesan"
                      onClick={() => handleDeletePesan(selectedPesan)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <article className="flex-1 text-gray-700 leading-relaxed break-words">
                  <p className="mb-8">{selectedPesan.isi}</p>
                  <footer className="border-t pt-4 text-sm text-gray-500">
                    <div>
                      <span className="text-gray-400">Dikirim: </span>
                      {new Date(selectedPesan.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-400">Pengirim: </span>
                      {selectedPesan.pengirim_info?.name || "-"}
                    </div>
                  </footer>
                </article>
              </>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}
