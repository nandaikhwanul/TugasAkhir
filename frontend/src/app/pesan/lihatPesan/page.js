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

  // Fungsi untuk menandai pesan sudah dibaca
  const markAsRead = async (pesan) => {
    // Jika sudah dibaca, tidak perlu patch
    if (pesan.sudah_dibaca) {
      setSelectedPesan(pesan);
      return;
    }
    const token = getTokenFromSessionStorage();
    if (!token) {
      setFetchError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    // Ambil role dari token
    const payload = parseJwt(token);
    const role = payload && payload.role ? payload.role : null;

    try {
      // Optimistically update UI
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
        // Gunakan endpoint khusus alumni
        endpoint = `https://tugasakhir-production-6c6c.up.railway.app/pesan/${pesan._id}/sudah-dibaca`;
      } else {
        // Endpoint lama untuk non-alumni
        endpoint = `https://tugasakhir-production-6c6c.up.railway.app/pesan-bebas/${pesan._id}/dibaca`;
        // Untuk endpoint lama, PATCH tanpa body
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
        // Rollback UI if failed
        setPesanList((prev) =>
          prev.map((p) =>
            p._id === pesan._id ? { ...p, sudah_dibaca: false } : p
          )
        );
        throw new Error("Gagal menandai pesan sebagai sudah dibaca");
      }
      // Tidak perlu update lagi, sudah dioptimis di atas
    } catch (err) {
      setFetchError(err.message || "Terjadi kesalahan saat menandai pesan dibaca");
    }
  };

  // Fungsi untuk menghapus pesan
  const handleDeletePesan = async (pesanId) => {
    if (!pesanId) return;

    // Konfirmasi hapus dengan react-toastify
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

        // Pilih pesan pertama secara default
        if (pesanData && pesanData.length > 0) {
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
  }, []);

  // Responsive: jika di mobile, sidebar dan detail jadi stack, sidebar bisa collapse
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Buka sidebar otomatis di desktop, tutup di mobile
  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Jika di mobile, klik pesan akan menutup sidebar
  function handleSelectPesanMobile(pesan) {
    markAsRead(pesan);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }

  return (
    <>
      <ToastContainer />
      <main className="flex h-screen py-4 px-2 md:py-8 md:px-8 bg-gray-50">
        {/* Tombol menu untuk mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-30 bg-indigo-600 text-white rounded-full p-2 shadow-lg focus:outline-none"
          style={{ display: sidebarOpen ? "none" : "block" }}
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka daftar pesan"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Sidebar pesan list */}
        <section
          className={`
            fixed z-40 top-0 left-0 h-full w-11/12 max-w-xs bg-white shadow-lg transition-transform duration-300
            md:static md:z-0 md:w-4/12 md:max-w-none md:pr-4 md:ml-52 md:rounded-l-3xl md:h-[600px]
            flex flex-col
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
          `}
          style={{
            minWidth: 0,
            maxHeight: "100vh",
          }}
        >
          {/* Tombol close di mobile */}
          <div className="md:hidden flex justify-end p-4">
            <button
              className="text-gray-500 hover:text-red-500 focus:outline-none"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup daftar pesan"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="mt-2 md:mt-6 overflow-y-auto h-full">
            {loading && (
              <li className="py-5 px-3 text-gray-400">Memuat pesan...</li>
            )}
            {fetchError && (
              <li className="py-5 px-3 text-red-500">{fetchError}</li>
            )}
            {!loading && !fetchError && pesanList.length === 0 && (
              <li className="py-5 px-3 text-gray-400">Tidak ada pesan.</li>
            )}
            {pesanList.map((pesan) => (
              <li
                key={pesan._id}
                className={`py-5 border-b px-3 cursor-pointer transition-colors
                  ${
                    selectedPesan && selectedPesan._id === pesan._id
                      ? "bg-indigo-600 text-white"
                      : pesan.sudah_dibaca
                      ? "bg-white text-gray-800"
                      : "bg-purple-50 text-purple-900"
                  }
                  hover:bg-indigo-100 md:hover:bg-indigo-50
                `}
                onClick={() =>
                  window.innerWidth < 768
                    ? handleSelectPesanMobile(pesan)
                    : markAsRead(pesan)
                }
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold truncate">
                    {pesan.pengirim_info?.name || "Tanpa Nama"}
                  </h3>
                  <p className="text-md text-right">
                    {timeAgo(pesan.createdAt)}
                  </p>
                </div>
                {/* Truncate isi pesan di sini */}
                <div
                  className="text-md break-words"
                  title={pesan.isi}
                  style={{
                    maxWidth: "100%",
                    display: "-webkit-box",
                    WebkitLineClamp: 2, // tampilkan maksimal 2 baris
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {truncateTextByWords(pesan.isi, 10)}
                </div>
                {!pesan.sudah_dibaca && (
                  <span className="inline-block mt-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    Belum dibaca
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
        {/* Overlay untuk sidebar di mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup overlay"
          />
        )}
        {/* Main pesan detail */}
        <section
          className={`
            flex flex-col bg-white rounded-none md:rounded-r-3xl
            w-full md:w-6/12 px-2 md:px-4
            h-[calc(100vh-2rem)] md:h-[600px]
            overflow-y-auto
            transition-all
          `}
        >
          {selectedPesan ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center h-auto md:h-48 border-b-2 mb-4 md:mb-8 pt-4 md:pt-0">
                <div className="flex space-x-4 items-center w-full md:w-auto">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {/* Avatar inisial */}
                    <span className="text-xl font-bold text-indigo-700">
                      {selectedPesan.pengirim_info?.name
                        ? selectedPesan.pengirim_info.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-lg text-black">
                      {selectedPesan.pengirim_info?.name || "Tanpa Nama"}
                    </h3>
                    <p className="text-light text-gray-400">
                      {selectedPesan.pengirim_info?.email || "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <ul className="flex text-gray-400 space-x-4">
                    <li className="w-6 h-6">
                      {/* Tombol hapus */}
                      <button
                        type="button"
                        aria-label="Hapus pesan"
                        disabled={deleting}
                        onClick={() => handleDeletePesan(selectedPesan._id)}
                        className={`transition-colors rounded-full p-0.5 ${
                          deleting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:text-red-600 focus:text-red-600"
                        }`}
                        style={{
                          outline: "none",
                          border: "none",
                          background: "transparent",
                          cursor: deleting ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <section>
                <article className="mt-4 md:mt-8 text-gray-500 leading-7 tracking-wider">
                  <p className="break-words" style={{wordBreak: "break-word", overflowWrap: "break-word"}}>
                    {selectedPesan.isi}
                  </p>
                  <footer className="mt-8 md:mt-12">
                    <p>
                      <span className="text-gray-400">Dikirim: </span>
                      {new Date(selectedPesan.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <span className="text-gray-400">Pengirim: </span>
                      {selectedPesan.pengirim_info?.name || "-"}
                    </p>
                  </footer>
                </article>
              </section>
              <section className="mt-4 md:mt-6 border rounded-xl bg-gray-50 mb-3"></section>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-center px-2">
              Pilih pesan untuk melihat detail
            </div>
          )}
        </section>
      </main>
    </>
  );
}
