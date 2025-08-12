"use client";
import { useRef, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenFromSessionStorage } from "../../../sessiontoken";

// Helper: Konversi path Windows ke path URL (replace backslash ke slash)
function normalizeFotoUrlPath(path) {
  if (!path) return "";
  let url = path.replace(/\\/g, "/");
  const idx = url.indexOf("/uploads/");
  if (idx !== -1) {
    url = url.substring(idx);
  }
  return url;
}

// Helper: Ambil inisial dari nama perusahaan
function getInitials(name) {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (
    words[0][0].toUpperCase() +
    (words[1] ? words[1][0].toUpperCase() : "")
  );
}

// Custom Confirm Toast
function showConfirmToast({ message, onConfirm, onCancel, isLoading }) {
  // Only allow one confirm toast at a time
  if (document.getElementById("custom-confirm-toast")) return;

  const ConfirmContent = () => (
    <div id="custom-confirm-toast" className="flex flex-col gap-2">
      <div className="font-semibold mb-1">{message}</div>
      <div className="flex gap-2 justify-end">
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
          onClick={() => {
            toast.dismiss("confirm-toast");
            if (onCancel) onCancel();
          }}
          disabled={isLoading}
        >
          Batal
        </button>
        <button
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
          onClick={() => {
            toast.dismiss("confirm-toast");
            if (onConfirm) onConfirm();
          }}
          disabled={isLoading}
        >
          Hapus
        </button>
      </div>
    </div>
  );
  toast(
    <ConfirmContent />,
    {
      toastId: "confirm-toast",
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
      position: "top-center",
      style: { minWidth: 260 },
    }
  );
}

export default function FotoPerusahaanPage() {
  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const previewRef = useRef(null);
  const files = useRef([]);
  const dragging = useRef(null);
  const dropping = useRef(null);

  // Untuk upload ke backend
  const [perusahaanId, setPerusahaanId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Untuk daftar foto perusahaan yang sudah diupload
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Untuk status hapus foto
  const [deleteStatus, setDeleteStatus] = useState({}); // { [fotoUrl]: { loading, error } }

  // Untuk data perusahaan (nama, logo_perusahaan)
  const [perusahaan, setPerusahaan] = useState(null);

  // Ambil data perusahaan dan foto perusahaan (array)
  useEffect(() => {
    const fetchPerusahaanAndFotos = async () => {
      setLoading(true);
      setError(null);
      const token = getTokenFromSessionStorage();
      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        toast.error("Token tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        // Fetch data perusahaan untuk mendapatkan id perusahaan dan logo_perusahaan
        const resPerusahaan = await fetch("https://tugasakhir-production-6c6c.up.railway.app/perusahaan/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!resPerusahaan.ok) {
          throw new Error("Gagal mengambil data perusahaan");
        }
        const dataPerusahaan = await resPerusahaan.json();
        const id =
          dataPerusahaan._id ||
          (dataPerusahaan.perusahaan && dataPerusahaan.perusahaan._id);
        if (!id) {
          throw new Error("ID perusahaan tidak ditemukan");
        }
        setPerusahaanId(id);

        // Simpan data perusahaan (nama, logo_perusahaan)
        let perusahaanData = dataPerusahaan;
        if (dataPerusahaan.perusahaan) {
          perusahaanData = dataPerusahaan.perusahaan;
        }
        setPerusahaan(perusahaanData);

        // Hanya fetch foto jika ada logo_perusahaan
        if (
          perusahaanData.logo_perusahaan &&
          perusahaanData.logo_perusahaan !== "" &&
          perusahaanData.logo_perusahaan !== null
        ) {
          // Fetch foto perusahaan dengan id yang didapat
          const res = await fetch(
            `https://tugasakhir-production-6c6c.up.railway.app/foto-perusahaan/perusahaan/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!res.ok) {
            throw new Error("Gagal mengambil data foto perusahaan");
          }
          const data = await res.json();

          // data.data adalah array string path
          if (Array.isArray(data.data) && data.data.length > 0) {
            setFotos(
              data.data.map((path) => ({
                url: normalizeFotoUrlPath(path),
                originalPath: path, // simpan path asli dari backend, tanpa diubah
              }))
            );
          } else {
            setFotos([]);
          }
        } else {
          // Tidak ada logo_perusahaan, jangan ambil foto
          setFotos([]);
        }
      } catch (err) {
        setError(err.message || "Terjadi kesalahan");
        toast.error(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchPerusahaanAndFotos();
  }, [uploadSuccess, deleteStatus]); // refresh saat uploadSuccess atau deleteStatus berubah

  // --- Drag & Drop UI logic ---
  const humanFileSize = (size) => {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) * 1 +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  };

  const loadFile = (file) => {
    const url = URL.createObjectURL(file);
    return url;
  };

  const renderPreviews = () => {
    const previewEl = previewRef.current;
    if (!previewEl) return;
    previewEl.innerHTML = "";

    files.current.forEach((file, index) => {
      const wrapper = document.createElement("div");
      wrapper.className =
        "relative flex flex-col items-center overflow-hidden text-center bg-gray-100 border rounded cursor-move select-none";
      wrapper.setAttribute("style", "padding-top: 100%");
      wrapper.setAttribute("draggable", "true");
      wrapper.setAttribute("data-index", index);

      const removeBtn = document.createElement("button");
      removeBtn.className =
        "absolute top-0 right-0 z-50 p-1 bg-white rounded-bl focus:outline-none";
      removeBtn.innerHTML = `
        <svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>`;
      removeBtn.onclick = () => {
        files.current.splice(index, 1);
        renderPreviews();
      };

      const info = document.createElement("div");
      info.className =
        "absolute bottom-0 left-0 right-0 flex flex-col p-2 text-xs bg-white bg-opacity-50";
      info.innerHTML = `
        <span class="w-full font-bold text-gray-900 truncate">${file.name}</span>
        <span class="text-xs text-gray-900">${humanFileSize(file.size)}</span>
      `;

      let content;
      if (file.type.includes("image")) {
        content = document.createElement("img");
        content.className =
          "absolute inset-0 z-0 object-cover w-full h-full border-4 border-white preview";
        content.src = loadFile(file);
      } else if (file.type.includes("video")) {
        content = document.createElement("video");
        content.className =
          "absolute inset-0 object-cover w-full h-full border-4 border-white pointer-events-none preview";
        content.src = loadFile(file);
        content.controls = true;
      } else {
        content = document.createElement("div");
        content.innerHTML = `<span class="text-gray-400 text-xs">Unsupported</span>`;
      }

      wrapper.appendChild(removeBtn);
      wrapper.appendChild(content);
      wrapper.appendChild(info);

      wrapper.ondragstart = (e) => {
        dragging.current = index;
        e.dataTransfer.effectAllowed = "move";
      };

      wrapper.ondragover = (e) => {
        e.preventDefault();
        dropping.current = index;
        wrapper.classList.add("bg-blue-200", "bg-opacity-80");
      };

      wrapper.ondragleave = () => {
        dropping.current = null;
        wrapper.classList.remove("bg-blue-200", "bg-opacity-80");
      };

      wrapper.ondrop = (e) => {
        e.preventDefault();
        const dragged = files.current.splice(dragging.current, 1)[0];
        files.current.splice(dropping.current, 0, dragged);
        dragging.current = null;
        dropping.current = null;
        renderPreviews();
      };

      previewEl.appendChild(wrapper);
    });
  };

  const addFiles = (newFiles) => {
    // Only allow image files
    const filtered = Array.from(newFiles).filter((f) =>
      f.type.startsWith("image/")
    );
    files.current = [...files.current, ...filtered];
    renderPreviews();
  };

  useEffect(() => {
    const dropEl = dropRef.current;
    const inputEl = inputRef.current;

    if (!dropEl || !inputEl) return;

    dropEl.ondragover = (e) => {
      e.preventDefault();
      dropEl.classList.add("border-blue-400", "ring-4", "ring-inset");
    };

    dropEl.ondragleave = () => {
      dropEl.classList.remove("border-blue-400", "ring-4", "ring-inset");
    };

    dropEl.ondrop = (e) => {
      e.preventDefault();
      dropEl.classList.remove("border-blue-400", "ring-4", "ring-inset");
      const newFiles = Array.from(e.dataTransfer.files);
      addFiles(newFiles);
    };

    inputEl.onchange = (e) => {
      addFiles(Array.from(e.target.files));
    };
  }, []);

  // Render preview on mount and when files.current changes
  useEffect(() => {
    renderPreviews();
    // eslint-disable-next-line
  }, []);

  // Handler upload
  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");
    if (!files.current.length) {
      setUploadError("Pilih minimal satu file gambar.");
      toast.error("Pilih minimal satu file gambar.");
      return;
    }
    setUploading(true);
    try {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setUploadError("Token tidak ditemukan. Silakan login ulang.");
        toast.error("Token tidak ditemukan. Silakan login ulang.");
        setUploading(false);
        return;
      }
      const formData = new FormData();
      if (perusahaanId) {
        formData.append("perusahaan", perusahaanId);
      }
      files.current.forEach((file) => {
        formData.append("foto", file);
      });
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/foto-perusahaan/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        let err = {};
        try {
          err = await res.json();
        } catch (e) {}
        const msg =
          err?.message ||
          `Gagal mengupload foto. Pastikan file gambar valid, ukuran tidak terlalu besar, dan coba lagi. (Status: ${res.status})`;
        setUploadError(msg);
        toast.error(msg);
        setUploading(false);
        return;
      }
      setUploadSuccess("Foto berhasil diupload!");
      toast.success("Foto berhasil diupload!");
      files.current = [];
      renderPreviews();
    } catch (err) {
      setUploadError("Terjadi kesalahan saat upload. Coba lagi.");
      toast.error("Terjadi kesalahan saat upload. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  // Handler hapus foto perusahaan
  const handleDeleteFoto = async (foto) => {
    // foto: { url, originalPath }
    if (!foto || !foto.originalPath) return;
    // Kirim originalPath persis dari backend, tanpa diubah
    const fotoPath = foto.originalPath;
    setDeleteStatus((prev) => ({
      ...prev,
      [foto.url]: { loading: true, error: null },
    }));
    try {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setDeleteStatus((prev) => ({
          ...prev,
          [foto.url]: { loading: false, error: "Token tidak ditemukan. Silakan login ulang." },
        }));
        toast.error("Token tidak ditemukan. Silakan login ulang.");
        return;
      }
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/foto-perusahaan/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fotoPath }),
      });
      if (!res.ok) {
        let err = {};
        try {
          err = await res.json();
        } catch (e) {}
        const msg =
          err?.message ||
          `Gagal menghapus foto. (Status: ${res.status})`;
        setDeleteStatus((prev) => ({
          ...prev,
          [foto.url]: {
            loading: false,
            error: msg,
          },
        }));
        toast.error(msg);
        return;
      }
      // Berhasil, refresh daftar foto
      setDeleteStatus((prev) => ({
        ...prev,
        [foto.url]: { loading: false, error: null, success: true },
      }));
      // Remove foto dari daftar lokal (optimistic update)
      setFotos((prev) => prev.filter((f) => f.url !== foto.url));
      toast.success("Foto berhasil dihapus!");
      // Atau trigger refetch dengan memodifikasi deleteStatus (sudah di dependency useEffect)
    } catch (err) {
      setDeleteStatus((prev) => ({
        ...prev,
        [foto.url]: {
          loading: false,
          error: "Terjadi kesalahan saat menghapus foto.",
        },
      }));
      toast.error("Terjadi kesalahan saat menghapus foto.");
    }
  };

  // State to track which foto is being confirmed for deletion
  const [pendingDeleteFoto, setPendingDeleteFoto] = useState(null);

  // Effect: show confirm toast when pendingDeleteFoto is set
  useEffect(() => {
    if (pendingDeleteFoto) {
      showConfirmToast({
        message: "Yakin ingin menghapus foto ini?",
        onConfirm: () => {
          handleDeleteFoto(pendingDeleteFoto);
          setPendingDeleteFoto(null);
        },
        onCancel: () => {
          setPendingDeleteFoto(null);
        },
        isLoading: deleteStatus[pendingDeleteFoto.url]?.loading,
      });
    }
    // eslint-disable-next-line
  }, [pendingDeleteFoto]);

  return (
    <div className="bg-white p-7 rounded w-11/12 md:w-9/12 mx-auto mt-10 shadow">
      <ToastContainer />
      <h2 className="text-xl font-bold mb-4 text-gray-500">Upload Foto Perusahaan</h2>
      <form onSubmit={handleUpload}>
        <div className="relative flex flex-col p-4 text-gray-400 border border-gray-200 rounded">
          <div
            ref={dropRef}
            className="relative flex flex-col text-gray-400 border border-gray-200 border-dashed rounded cursor-pointer"
          >
            <input
              ref={inputRef}
              accept="image/*"
              type="file"
              multiple
              className="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
              title=""
              disabled={uploading}
            />
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg
                className="w-6 h-6 mr-1 text-current-50"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="m-0">Drag foto ke sini atau klik area ini.</p>
            </div>
          </div>
          <div
            ref={previewRef}
            className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-6"
          ></div>
        </div>
        <button
          type="submit"
          className={`mt-4 px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition ${
            uploading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={uploading}
        >
          {uploading ? "Mengupload..." : "Upload"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2 text-gray-500">Daftar Foto Perusahaan</h3>
        {loading && <div className="text-gray-500 text-sm">Memuat...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Jika logo_perusahaan undefined, tampilkan initial profile dari logo_perusahaan */}
          {perusahaan && (typeof perusahaan.logo_perusahaan === "undefined") ? (
            <div className="col-span-full flex flex-col items-center justify-center py-8">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-600 mb-2 select-none">
                {getInitials(perusahaan.logo_perusahaan || "")}
              </div>
              <div className="text-gray-400 text-sm">Belum ada logo perusahaan. Upload logo untuk menampilkan foto di sini.</div>
            </div>
          ) : perusahaan && (!perusahaan.logo_perusahaan || perusahaan.logo_perusahaan === "" || perusahaan.logo_perusahaan === null) ? (
            <div className="col-span-full flex flex-col items-center justify-center py-8">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-600 mb-2 select-none">
                {getInitials(perusahaan.nama_perusahaan || perusahaan.nama || "")}
              </div>
              <div className="text-gray-400 text-sm">Belum ada logo perusahaan. Upload logo untuk menampilkan foto di sini.</div>
            </div>
          ) : fotos.length === 0 && !loading && !error ? (
            <div className="col-span-full text-gray-400 text-sm">
              Tidak ada foto perusahaan.
            </div>
          ) : (
            fotos.map((foto, idx) => {
              // Dapatkan url, dan pastikan url tidak kosong/null
              let url = foto.url && foto.url.startsWith("http")
                ? foto.url
                : foto.url
                ? `https://tugasakhir-production-6c6c.up.railway.app${foto.url}`
                : "";
              const delStatus = deleteStatus[foto.url] || {};
              // Jangan render <img> sama sekali jika url kosong/null
              return (
                <div
                  key={foto.url || idx}
                  className="border rounded overflow-hidden bg-gray-50 flex flex-col items-center p-2 relative"
                >
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={url}
                      className="w-full"
                    >
                      <img
                        src={url}
                        alt={`Foto perusahaan ${idx + 1}`}
                        className="w-full h-32 object-cover rounded mb-1"
                        style={{ background: "#eee" }}
                      />
                    </a>
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100 text-gray-400">
                      Tidak ada gambar
                    </div>
                  )}
                  {/* Tombol hapus */}
                  <button
                    className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 shadow hover:bg-red-100 transition"
                    title="Hapus foto"
                    onClick={() => {
                      if (!delStatus.loading) {
                        setPendingDeleteFoto(foto);
                      }
                    }}
                    disabled={delStatus.loading}
                  >
                    {delStatus.loading ? (
                      <svg
                        className="w-4 h-4 animate-spin text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </button>
                  {delStatus.error && (
                    <div className="text-xs text-red-500 mt-1">{delStatus.error}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
