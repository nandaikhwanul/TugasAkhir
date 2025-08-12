"use client";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../../navbar/page";
import Loader from "../../loading/loadingDesign";
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Modal konfirmasi hapus
function ConfirmDeleteModal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Konfirmasi Hapus</h2>
        <p className="mb-4 text-gray-600">Yakin ingin menghapus data alumni ini?</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            onClick={onConfirm}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: parse tanggal_lahir string (yyyy-mm-dd) to {tahun, bulan, tanggal}
function parseTanggalLahir(str) {
  if (!str) return { tahun: "", bulan: "", tanggal: "" };
  // Accepts "1999-05-20" or "1999-5-2"
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(str);
  if (!match) return { tahun: "", bulan: "", tanggal: "" };
  return {
    tahun: match[1],
    bulan: match[2].padStart(2, "0"),
    tanggal: match[3].padStart(2, "0"),
  };
}

// Helper: join {tahun, bulan, tanggal} to "yyyy-mm-dd"
function joinTanggalLahir({ tahun, bulan, tanggal }) {
  if (!tahun || !bulan || !tanggal) return "";
  return `${tahun}-${bulan.padStart(2, "0")}-${tanggal.padStart(2, "0")}`;
}

export default function SettingAlumniPage() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editData, setEditData] = useState({});
  const [deletingIdx, setDeletingIdx] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState({ a: null, idx: null });

  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true);
      setError("");
      setSuccess("");
      const token = getTokenFromSessionStorage();
      if (!token) {
        setError("Unauthorized: Token not found.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/admin/alumni", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!res.ok) {
          setError("Gagal mengambil data alumni.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        // Pastikan setiap alumni punya field tanggal_lahir (bisa undefined/null)
        const alumniList = Array.isArray(data) ? data : (data.alumni || []);
        setAlumni(
          alumniList.map((a) => ({
            ...a,
            tanggal_lahir: a.tanggal_lahir || a.tgllahir || a.tgl_lahir || "",
          }))
        );
      } catch (err) {
        setError("Terjadi kesalahan saat mengambil data alumni.");
      } finally {
        setLoading(false);
      }
    }
    fetchAlumni();
  }, []);

  const handleEditClick = (idx, a) => {
    // Parse tanggal_lahir to {tahun, bulan, tanggal}
    const tgl = a.tanggal_lahir || a.tgllahir || a.tgl_lahir || "";
    const { tahun, bulan, tanggal } = parseTanggalLahir(tgl);
    setEditIdx(idx);
    setEditData({
      name: a.name || a.nama || "",
      nim: a.nim || "",
      nohp: a.nohp || a.noHp || a.no_telp || "",
      alamat: a.alamat || "",
      email: a.email || "",
      tahun_tanggal_lahir: tahun,
      bulan_tanggal_lahir: bulan,
      tanggal_tanggal_lahir: tanggal,
      password: "",
      confpassword: "",
    });
    setSuccess("");
    setError("");
  };

  const handleEditChange = (e) => {
    setEditData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditSave = async (a, idx) => {
    const token = getTokenFromSessionStorage();
    if (!token) {
      setError("Unauthorized: Token not found.");
      setSuccess("");
      return;
    }
    // Gabungkan tanggal lahir
    const tanggal_lahir = joinTanggalLahir({
      tahun: editData.tahun_tanggal_lahir,
      bulan: editData.bulan_tanggal_lahir,
      tanggal: editData.tanggal_tanggal_lahir,
    });
    // Only send password/confpassword if at least one is filled
    const payload = {
      name: editData.name,
      nim: editData.nim,
      nohp: editData.nohp,
      alamat: editData.alamat,
      email: editData.email,
      tanggal_lahir,
    };
    if (editData.password || editData.confpassword) {
      payload.password = editData.password;
      payload.confpassword = editData.confpassword;
    }
    try {
      const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/admin/alumni/${a._id || a.nim}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.msg || "Gagal mengupdate data alumni.");
      }
      setAlumni((prev) =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                name: payload.name,
                nama: payload.name,
                nim: payload.nim,
                nohp: payload.nohp,
                alamat: payload.alamat,
                email: payload.email,
                tanggal_lahir: payload.tanggal_lahir,
                // password/confpassword are not shown in table, so not set here
              }
            : item
        )
      );
      setEditIdx(null);
      setEditData({});
      setError("");
      toast.success("Data alumni berhasil diupdate.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat update data alumni.");
      setSuccess("");
    }
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditData({});
    setSuccess("");
    setError("");
  };

  // Tampilkan modal konfirmasi hapus
  const handleDelete = (a, idx) => {
    setPendingDelete({ a, idx });
    setModalOpen(true);
  };

  // Proses hapus alumni setelah konfirmasi
  const confirmDelete = async () => {
    const { a, idx } = pendingDelete;
    setModalOpen(false);
    setDeletingIdx(idx);
    setError("");
    setSuccess("");
    const token = getTokenFromSessionStorage();
    if (!token) {
      setError("Unauthorized: Token not found.");
      setSuccess("");
      setDeletingIdx(null);
      return;
    }
    try {
      const res = await fetch(`https://tugasakhir-production-6c6c.up.railway.app/admin/alumni/${a._id || a.nim}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.msg || "Gagal menghapus data alumni.");
      }
      setAlumni((prev) => prev.filter((item, i) => i !== idx));
      setSuccess("Data alumni berhasil dihapus.");
      toast.success("Data alumni berhasil dihapus.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menghapus data alumni.");
      setSuccess("");
      toast.error(err.message || "Terjadi kesalahan saat menghapus data alumni.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    } finally {
      setDeletingIdx(null);
      setPendingDelete({ a: null, idx: null });
    }
  };

  // Helper: get initials from name
  function getInitials(name) {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Helper: get role (for demo, just show "Alumni")
  function getRole(a) {
    return "Alumni";
  }

  // Helper: get team (for demo, just show NIM, No HP, Alamat, Tanggal Lahir)
  function getTeam(a) {
    return [
      { label: "NIM", value: a.nim || "-" },
      { label: "No HP", value: a.nohp || a.noHp || a.no_telp || "-" },
      { label: "Alamat", value: a.alamat || "-" },
      { label: "Tanggal Lahir", value: a.tanggal_lahir || a.tgllahir || a.tgl_lahir || "-" },
    ];
  }

  // Helper: get status (for demo, always Active)
  function getStatus(a) {
    return {
      label: "Active",
      color: "green",
    };
  }

  // Helper: generate options for tanggal/bulan/tahun
  const getTanggalOptions = () =>
    Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const getBulanOptions = () =>
    Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const getTahunOptions = () => {
    const now = new Date().getFullYear();
    // Range: 1950 - now
    return Array.from({ length: now - 1949 }, (_, i) => (1950 + i).toString());
  };

  // --- Perbaikan tampilan agar tidak ketutupan sidebar ---
  // Asumsi sidebar ada di kiri, gunakan padding-left yang cukup besar pada container utama.
  // Jika sidebar fixed misal 64px/16rem, gunakan pl-64 (tailwind) atau pl-[260px] jika custom.
  // Juga, gunakan min-h-screen dan overflow-x-auto pada table wrapper agar responsif.

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="pt-8 pl-0 md:pl-64 transition-all duration-300">
        {/* pl-64 = padding-left: 16rem (256px), sesuaikan dengan lebar sidebar */}
        <ToastContainer />
        <ConfirmDeleteModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={confirmDelete}
        />
        <h1 className="text-2xl font-bold mb-6">Daftar Alumni</h1>
        {loading && <Loader />}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md m-5 bg-white">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium text-gray-900">Name</th>
                  <th scope="col" className="px-6 py-4 font-medium text-gray-900">State</th>
                  <th scope="col" className="px-6 py-4 font-medium text-gray-900">Role</th>
                  <th scope="col" className="px-6 py-4 font-medium text-gray-900">Data</th>
                  <th scope="col" className="px-6 py-4 font-medium text-gray-900">Password</th>
                  <th scope="col" className="px-6 py-4 font-medium text-gray-900"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {Array.isArray(alumni) && alumni.length > 0 ? (
                  alumni.map((a, idx) => (
                    <tr key={a._id || a.nim || idx} className="hover:bg-gray-50">
                      <th className="flex gap-3 px-6 py-4 font-normal text-gray-900">
                        <div className="relative h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full overflow-hidden">
                          {/* Avatar: use initials if no image */}
                          <span className="text-lg font-bold text-gray-700">
                            {getInitials(a.name || a.nama)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-700">
                            {editIdx === idx ? (
                              <input
                                type="text"
                                name="name"
                                className="border rounded px-2 py-1 w-full"
                                value={editData.name}
                                onChange={handleEditChange}
                              />
                            ) : (
                              a.name || a.nama || "-"
                            )}
                          </div>
                          <div className="text-gray-400">
                            {editIdx === idx ? (
                              <input
                                type="email"
                                name="email"
                                className="border rounded px-2 py-1 w-full"
                                value={editData.email}
                                onChange={handleEditChange}
                              />
                            ) : (
                              a.email || "-"
                            )}
                          </div>
                        </div>
                      </th>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                          {getStatus(a).label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getRole(a)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {getTeam(a).map((item, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600`}
                            >
                              <span className="font-bold">{item.label}:</span>{" "}
                              {editIdx === idx && item.label === "NIM" ? (
                                <input
                                  type="text"
                                  name="nim"
                                  className="border rounded px-1 py-0.5 w-20"
                                  value={editData.nim}
                                  onChange={handleEditChange}
                                />
                              ) : editIdx === idx && item.label === "No HP" ? (
                                <input
                                  type="text"
                                  name="nohp"
                                  className="border rounded px-1 py-0.5 w-24"
                                  value={editData.nohp}
                                  onChange={handleEditChange}
                                />
                              ) : editIdx === idx && item.label === "Alamat" ? (
                                <input
                                  type="text"
                                  name="alamat"
                                  className="border rounded px-1 py-0.5 w-32"
                                  value={editData.alamat}
                                  onChange={handleEditChange}
                                />
                              ) : editIdx === idx && item.label === "Tanggal Lahir" ? (
                                <div className="flex gap-1 items-center">
                                  <select
                                    name="tanggal_tanggal_lahir"
                                    className="border rounded px-1 py-0.5"
                                    value={editData.tanggal_tanggal_lahir || ""}
                                    onChange={handleEditChange}
                                  >
                                    <option value="">Tgl</option>
                                    {getTanggalOptions().map((tgl) => (
                                      <option key={tgl} value={tgl}>
                                        {tgl}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    name="bulan_tanggal_lahir"
                                    className="border rounded px-1 py-0.5"
                                    value={editData.bulan_tanggal_lahir || ""}
                                    onChange={handleEditChange}
                                  >
                                    <option value="">Bulan</option>
                                    {getBulanOptions().map((bln) => (
                                      <option key={bln} value={bln}>
                                        {bln}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    name="tahun_tanggal_lahir"
                                    className="border rounded px-1 py-0.5"
                                    value={editData.tahun_tanggal_lahir || ""}
                                    onChange={handleEditChange}
                                  >
                                    <option value="">Tahun</option>
                                    {getTahunOptions().map((thn) => (
                                      <option key={thn} value={thn}>
                                        {thn}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                // Tampilkan tanggal lahir dalam format yyyy-mm-dd (tanpa jam)
                                (() => {
                                  const tgl = item.value;
                                  if (!tgl) return "-";
                                  // Only show yyyy-mm-dd
                                  const match = /^(\d{4}-\d{2}-\d{2})/.exec(tgl);
                                  return match ? match[1] : tgl;
                                })()
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editIdx === idx ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="password"
                              name="password"
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Password baru"
                              value={editData.password || ""}
                              onChange={handleEditChange}
                              autoComplete="new-password"
                            />
                            <input
                              type="password"
                              name="confpassword"
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Konfirmasi password"
                              value={editData.confpassword || ""}
                              onChange={handleEditChange}
                              autoComplete="new-password"
                            />
                            <span className="text-xs text-gray-400">
                              Kosongkan jika tidak ingin mengubah password
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-4">
                          {editIdx === idx ? (
                            <>
                              <button
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                onClick={() => handleEditSave(a, idx)}
                              >
                                Simpan
                              </button>
                              <button
                                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                                onClick={handleEditCancel}
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className={`hover:text-red-600 ${deletingIdx === idx ? "opacity-50 cursor-not-allowed" : ""}`}
                                title="Delete"
                                onClick={() => handleDelete(a, idx)}
                                disabled={deletingIdx === idx}
                              >
                                {deletingIdx === idx ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-6 w-6 animate-spin"
                                  >
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                      opacity="0.2"
                                    />
                                    <path
                                      d="M12 2a10 10 0 0 1 10 10"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-6 w-6"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                    />
                                  </svg>
                                )}
                              </button>
                              <button
                                className="hover:text-blue-600"
                                title="Edit"
                                onClick={() => handleEditClick(idx, a)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="h-6 w-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      Tidak ada data alumni.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
