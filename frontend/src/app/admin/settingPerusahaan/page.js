"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../navbar/page";
import Loader from "../../loading/loadingDesign";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenKadaluarsa from "../../tokenKadaluarsa"; // <--- import tokenKadaluarsa.js

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

// SVG icons
const PencilIcon = ({ className = "" }) => (
  <svg
    className={className}
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path d="M16.862 3.487a2.06 2.06 0 0 1 2.915 2.915l-11.1 11.1-4.1 1.185 1.185-4.1 11.1-11.1Z" />
    <path d="M15 6 18 9" />
  </svg>
);

const TrashIcon = ({ className = "" }) => (
  <svg
    className={className}
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

export default function SettingPerusahaanPage() {
  const [perusahaan, setPerusahaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  // PATCH: Gabungkan password dan confPassword ke dalam satu state object
  const [editPasswordData, setEditPasswordData] = useState({
    password: "",
    confPassword: "",
  });
  const [patchLoading, setPatchLoading] = useState(false);

  // State for editing perusahaan data
  const [editData, setEditData] = useState({
    nama_perusahaan: "",
    email_perusahaan: "",
    bidang_perusahaan: "",
    alamat: "",
    nomor_telp: "",
    npwp: "",
    deskripsi_perusahaan: "",
  });

  useEffect(() => {
    async function fetchPerusahaan() {
      setLoading(true);
      setError("");
      setSuccess("");
      const token = getTokenFromCookie();
      if (!token) {
        setError("Unauthorized: Token not found.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("ttps://tugasakhir-production-6c6c.up.railway.app/admin/perusahaan", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!res.ok) {
          setError("Gagal mengambil data perusahaan.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPerusahaan(Array.isArray(data) ? data : (data.perusahaan || []));
      } catch (err) {
        setError("Terjadi kesalahan saat mengambil data perusahaan.");
      } finally {
        setLoading(false);
      }
    }
    fetchPerusahaan();
  }, []);

  // PATCH perusahaan data handler
  const handlePatchPerusahaan = async (id) => {
    setPatchLoading(true);
    setError("");
    setSuccess("");
    const token = getTokenFromCookie();
    try {
      const res = await fetch(`ttps://tugasakhir-production-6c6c.up.railway.app/admin/perusahaan/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.message || "Gagal update data perusahaan.");
      } else {
        toast.success("Data perusahaan berhasil diupdate.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        setEditIdx(null);
        setEditPasswordData({ password: "", confPassword: "" });
        setEditData({
          nama_perusahaan: "",
          email_perusahaan: "",
          bidang_perusahaan: "",
          alamat: "",
          nomor_telp: "",
          npwp: "",
          deskripsi_perusahaan: "",
        });
        // Refresh data
        setPerusahaan((prev) =>
          prev.map((p) =>
            p._id === id
              ? { ...p, ...editData }
              : p
          )
        );
      }
    } catch (err) {
      setError("Terjadi kesalahan saat update data perusahaan.");
    } finally {
      setPatchLoading(false);
    }
  };

  // PATCH password handler
  const handlePatchPassword = async (id) => {
    const { password, confPassword } = editPasswordData;
    if (!password || !confPassword) {
      setError("Password dan konfirmasi password harus diisi.");
      return;
    }
    if (password !== confPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    setPatchLoading(true);
    setError("");
    setSuccess("");
    const token = getTokenFromCookie();
    try {
      const res = await fetch(`ttps://tugasakhir-production-6c6c.up.railway.app/admin/perusahaan/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          password,
          confPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.message || "Gagal update password.");
      } else {
        setSuccess("Password berhasil diupdate.");
        setEditIdx(null);
        setEditPasswordData({ password: "", confPassword: "" });
      }
    } catch (err) {
      setError("Terjadi kesalahan saat update password.");
    } finally {
      setPatchLoading(false);
    }
  };

  // DELETE perusahaan handler
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus perusahaan ini?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    const token = getTokenFromCookie();

    if (!token) {
      toast.error("Anda tidak memiliki izin. Silakan login ulang.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      setError("Unauthorized. Silakan login ulang.");
      setLoading(false);
      return;
    }

    try {
      // Gunakan endpoint sesuai instruksi
      const endpoint = `ttps://tugasakhir-production-6c6c.up.railway.app/admin/perusahaan/${id}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sesi Anda telah berakhir. Silakan login ulang.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        setError("Unauthorized. Silakan login ulang.");
      } else if (!res.ok) {
        let msg = "Gagal menghapus perusahaan.";
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {}
        toast.error(msg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        setError(msg);
      } else {
        toast.success("Perusahaan berhasil dihapus.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        setSuccess("Perusahaan berhasil dihapus.");
        setPerusahaan((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus perusahaan.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      setError("Terjadi kesalahan saat menghapus perusahaan.");
    } finally {
      setLoading(false);
    }
  };

  // When clicking edit, set editData to current perusahaan data
  const handleEditClick = (idx, p) => {
    setEditIdx(idx);
    setEditPasswordData({ password: "", confPassword: "" });
    setError("");
    setSuccess("");
    setEditData({
      nama_perusahaan: p.nama_perusahaan || "",
      email_perusahaan: p.email_perusahaan || "",
      bidang_perusahaan: p.bidang_perusahaan || "",
      alamat: p.alamat || "",
      nomor_telp: p.nomor_telp || "",
      npwp: p.npwp || "",
      deskripsi_perusahaan: p.deskripsi_perusahaan || "",
    });
  };

  // --- MODIFIKASI AGAR TIDAK KETUTUP SIDEBAR ADMIN ---
  // Asumsi sidebar admin memiliki lebar tetap, misal 64px (w-16) atau 240px (w-60)
  // Kita tambahkan padding-left pada konten utama, dan gunakan min-h-screen agar tidak ketutup
  // Jika sidebar fixed, gunakan pl-[sidebar-width] pada konten utama

  // Ganti wrapper utama dengan pl-0 di mobile, pl-16 atau pl-60 di desktop
  // Misal sidebar 240px (w-60), gunakan pl-60 di desktop
  // Jika sidebar lebih kecil, sesuaikan pl-nya

  // Jika Navbar fixed di atas, tambahkan pt-[navbar-height] juga

  // Untuk contoh ini, asumsikan sidebar w-60 (240px), Navbar h-16 (64px)
  // Jika berbeda, sesuaikan angka pl-60 dan pt-16

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {tokenKadaluarsa()}
      <ToastContainer />
      <div
        className={
          [
            "max-w-8xl",
            "mx-auto",
            "px-4",
            "py-8",
            "pl-0",
            "md:pl-60",
            "transition-all",
            "duration-300"
          ].join(" ")
        }
        style={{
          // Jika sidebar fixed di kiri dengan width 240px
          // paddingLeft: typeof window !== "undefined" && window.innerWidth >= 768 ? 240 : 0,
        }}
      >
        <h1 className="text-2xl font-bold mb-6">Setting Perusahaan</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>
        )}
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">Name</th>
                  <th className="px-6 py-4 font-medium text-gray-900">State</th>
                  <th className="px-6 py-4 font-medium text-gray-900">Role</th>
                  <th className="px-6 py-4 font-medium text-gray-900">Data</th>
                  <th className="px-6 py-4 font-medium text-gray-900">Password</th>
                  <th className="px-6 py-4 font-medium text-gray-900 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {perusahaan.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      Tidak ada data perusahaan.
                    </td>
                  </tr>
                ) : (
                  perusahaan.map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-gray-50">
                      {/* Name */}
                      <td className="flex items-center gap-3 px-6 py-4 font-normal text-gray-900">
                        <div className="relative h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover object-center bg-gray-200"
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              p.nama_perusahaan || "P"
                            )}&background=0D8ABC&color=fff&size=128`}
                            alt={p.nama_perusahaan}
                          />
                        </div>
                        <div>
                          {editIdx === idx ? (
                            <input
                              type="text"
                              className="font-medium text-gray-900 border rounded px-2 py-1 text-sm w-full mb-1"
                              value={editData.nama_perusahaan}
                              onChange={e =>
                                setEditData(d => ({ ...d, nama_perusahaan: e.target.value }))
                              }
                              placeholder="Nama Perusahaan"
                              required
                            />
                          ) : (
                            <div className="font-medium text-gray-900">{p.nama_perusahaan}</div>
                          )}
                          {editIdx === idx ? (
                            <input
                              type="email"
                              className="text-gray-400 text-xs border rounded px-2 py-1 text-sm w-full"
                              value={editData.email_perusahaan}
                              onChange={e =>
                                setEditData(d => ({ ...d, email_perusahaan: e.target.value }))
                              }
                              placeholder="Email Perusahaan"
                              required
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">{p.email_perusahaan}</div>
                          )}
                        </div>
                      </td>
                      {/* State */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span>
                          <span className="text-green-600 text-sm font-medium">Active</span>
                        </span>
                      </td>
                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className="text-gray-700 text-sm">Perusahaan</span>
                      </td>
                      {/* Data */}
                      <td className="px-6 py-4">
                        {editIdx === idx ? (
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className="text-blue-700 font-semibold">Email: </span>
                              <input
                                type="email"
                                className="bg-blue-50 rounded px-2 py-0.5 text-blue-700 border w-full"
                                value={editData.email_perusahaan}
                                onChange={e =>
                                  setEditData(d => ({ ...d, email_perusahaan: e.target.value }))
                                }
                                placeholder="Email Perusahaan"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">Bidang: </span>
                              <input
                                type="text"
                                className="bg-blue-50 rounded px-2 py-0.5 text-blue-700 border w-full"
                                value={editData.bidang_perusahaan}
                                onChange={e =>
                                  setEditData(d => ({ ...d, bidang_perusahaan: e.target.value }))
                                }
                                placeholder="Bidang Perusahaan"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">Alamat: </span>
                              <input
                                type="text"
                                className="bg-blue-50 rounded px-2 py-0.5 text-blue-700 border w-full"
                                value={editData.alamat}
                                onChange={e =>
                                  setEditData(d => ({ ...d, alamat: e.target.value }))
                                }
                                placeholder="Alamat"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">No. Telp: </span>
                              <input
                                type="text"
                                className="bg-blue-50 rounded px-2 py-0.5 text-blue-700 border w-full"
                                value={editData.nomor_telp}
                                onChange={e =>
                                  setEditData(d => ({ ...d, nomor_telp: e.target.value }))
                                }
                                placeholder="No. Telp"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">NPWP: </span>
                              <input
                                type="text"
                                className="bg-blue-50 rounded px-2 py-0.5 text-blue-700 border w-full"
                                value={editData.npwp}
                                onChange={e =>
                                  setEditData(d => ({ ...d, npwp: e.target.value }))
                                }
                                placeholder="NPWP"
                                required
                              />
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">Deskripsi: </span>
                              <textarea
                                className="bg-blue-50 rounded px-2 py-0.5 text-blue-700 border w-full"
                                value={editData.deskripsi_perusahaan}
                                onChange={e =>
                                  setEditData(d => ({ ...d, deskripsi_perusahaan: e.target.value }))
                                }
                                placeholder="Deskripsi Perusahaan"
                                rows={2}
                                required
                                style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className="text-blue-700 font-semibold">Email: </span>
                              <span className="bg-blue-50 rounded px-2 py-0.5 text-blue-700">{p.email_perusahaan}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">Bidang: </span>
                              <span className="bg-blue-50 rounded px-2 py-0.5 text-blue-700">{p.bidang_perusahaan}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">Alamat: </span>
                              <span className="bg-blue-50 rounded px-2 py-0.5 text-blue-700">{p.alamat}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">No. Telp: </span>
                              <span className="bg-blue-50 rounded px-2 py-0.5 text-blue-700">{p.nomor_telp}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">NPWP: </span>
                              <span className="bg-blue-50 rounded px-2 py-0.5 text-blue-700">{p.npwp}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">Deskripsi: </span>
                              <span
                                className="bg-blue-50 rounded px-2 py-0.5 text-blue-700 break-words whitespace-pre-wrap"
                                style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                              >
                                {p.deskripsi_perusahaan}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      {/* Password PATCH */}
                      <td className="px-6 py-4 min-w-[180px]">
                        {editIdx === idx ? (
                          <form
                            className="flex flex-col gap-2"
                            onSubmit={e => {
                              e.preventDefault();
                              handlePatchPassword(p._id);
                            }}
                          >
                            <input
                              type="password"
                              className="border rounded px-2 py-1 text-sm"
                              placeholder="Password baru"
                              value={editPasswordData.password}
                              onChange={e =>
                                setEditPasswordData(d => ({
                                  ...d,
                                  password: e.target.value,
                                }))
                              }
                              required
                            />
                            <input
                              type="password"
                              className="border rounded px-2 py-1 text-sm"
                              placeholder="Konfirmasi password"
                              value={editPasswordData.confPassword ?? ""}
                              onChange={e =>
                                setEditPasswordData(d => ({
                                  ...d,
                                  confPassword: e.target.value,
                                }))
                              }
                              required
                            />
                            <div className="flex gap-2 mt-1">
                              <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                                disabled={patchLoading}
                              >
                                {patchLoading ? "Menyimpan..." : "Simpan"}
                              </button>
                              <button
                                type="button"
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-semibold"
                                onClick={() => {
                                  setEditIdx(null);
                                  setEditPasswordData({ password: "", confPassword: "" });
                                  setEditData({
                                    nama_perusahaan: "",
                                    email_perusahaan: "",
                                    bidang_perusahaan: "",
                                    alamat: "",
                                    nomor_telp: "",
                                    npwp: "",
                                    deskripsi_perusahaan: "",
                                  });
                                }}
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="text-gray-400 italic text-xs">••••••••</div>
                        )}
                      </td>
                      {/* Aksi */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* Edit */}
                          {editIdx === idx ? (
                            <form
                              className="flex flex-col gap-2"
                              onSubmit={e => {
                                e.preventDefault();
                                handlePatchPerusahaan(p._id);
                              }}
                            >
                              <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                                disabled={patchLoading}
                              >
                                {patchLoading ? "Menyimpan..." : "Simpan Data"}
                              </button>
                              <button
                                type="button"
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-semibold"
                                onClick={() => {
                                  setEditIdx(null);
                                  setEditPasswordData({ password: "", confPassword: "" });
                                  setEditData({
                                    nama_perusahaan: "",
                                    email_perusahaan: "",
                                    bidang_perusahaan: "",
                                    alamat: "",
                                    nomor_telp: "",
                                    npwp: "",
                                    deskripsi_perusahaan: "",
                                  });
                                }}
                              >
                                Batal
                              </button>
                            </form>
                          ) : (
                            <button
                              title="Edit Data"
                              className="p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-800 transition"
                              onClick={() => handleEditClick(idx, p)}
                            >
                              <PencilIcon />
                            </button>
                          )}
                          {/* Delete */}
                          <button
                            title="Hapus Perusahaan"
                            className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800 transition"
                            onClick={() => handleDelete(p._id)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Custom style for icon hover */}
      <style jsx>{`
        .icon-btn {
          transition: background 0.2s, color 0.2s;
        }
        @media (min-width: 768px) {
          /* Sidebar width 240px (w-60) */
          .pl-60 {
            padding-left: 240px !important;
          }
        }
      `}</style>
    </div>
  );
}