"use client";
import React, { useEffect, useState } from "react";
import { getTokenFromSessionStorage } from "@/app/sessiontoken";
import { FaUserEdit, FaTrash, FaSave, FaTimes, FaEnvelope, FaUser, FaKey, FaSyncAlt } from "react-icons/fa";
import Sidebar from "../sidebar/page";

export default function EditAdminPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch all admins
  const fetchAdmins = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const token = getTokenFromSessionStorage();
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/superadmin/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Gagal mengambil data admin");
      const data = await res.json();
      // Only use the required fields: _id, username, email, role
      const adminsData = (data.admins || []).map((admin) => ({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      }));
      setAdmins(adminsData);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Start editing
  const handleEdit = (admin) => {
    setEditId(admin._id);
    setEditForm({
      username: admin.username || "",
      email: admin.email || "",
      password: "",
    });
    setMessage({ type: "", text: "" });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditId(null);
    setEditForm({ username: "", email: "", password: "" });
    setMessage({ type: "", text: "" });
  };

  // Handle form change
  const handleChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Save edit
  const handleSave = async (adminId) => {
    setMessage({ type: "", text: "" });
    try {
      const token = getTokenFromSessionStorage();
      const res = await fetch(
        `https://tugasakhir-production-6c6c.up.railway.app/superadmin/edit-admin/${adminId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );
      if (!res.ok) {
        let data = {};
        try {
          data = await res.json();
        } catch {}
        throw new Error(data.message || "Gagal mengedit admin");
      }
      setMessage({ type: "success", text: "Admin berhasil diupdate" });
      setEditId(null);
      setEditForm({ username: "", email: "", password: "" });
      fetchAdmins();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan" });
    }
  };

  // Delete admin
  const handleDelete = async (adminId) => {
    if (!window.confirm("Yakin ingin menghapus admin ini?")) return;
    setMessage({ type: "", text: "" });
    try {
      const token = getTokenFromSessionStorage();
      const res = await fetch(
        `https://tugasakhir-production-6c6c.up.railway.app/superadmin/delete-admin/${adminId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        let data = {};
        try {
          data = await res.json();
        } catch {}
        throw new Error(data.message || "Gagal menghapus admin");
      }
      setMessage({ type: "success", text: "Admin berhasil dihapus" });
      fetchAdmins();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan" });
    }
  };

  // Refresh list
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdmins();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      {/* Hamburger for mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-700 text-white md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        style={{ display: sidebarOpen ? "none" : "block" }}
      >
        {/* Hamburger icon */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="7" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="4" y="15" width="16" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
      {/* Main content */}
      <main className="flex-1 py-10 px-2 md:ml-64 transition-all duration-300">
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
              <FaUserEdit className="text-blue-500" /> Edit Admin
            </h2>
            <button
              onClick={handleRefresh}
              className={`flex items-center gap-2 px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold transition ${
                refreshing ? "opacity-60 cursor-not-allowed" : ""
              }`}
              disabled={refreshing}
              title="Refresh"
            >
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
          {message.text && (
            <div
              className={`mb-4 px-4 py-2 rounded text-center font-medium ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
          {loading ? (
            <div className="text-center text-blue-600 py-10 font-semibold">Memuat data admin...</div>
          ) : admins.length === 0 ? (
            <div className="text-center text-gray-500 py-10">Belum ada admin terdaftar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg bg-white">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="py-3 px-4 text-left font-semibold text-blue-700">Username</th>
                    <th className="py-3 px-4 text-left font-semibold text-blue-700">Email</th>
                    <th className="py-3 px-4 text-left font-semibold text-blue-700">Role</th>
                    <th className="py-3 px-4 text-center font-semibold text-blue-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr
                      key={admin._id}
                      className="border-b last:border-b-0 hover:bg-blue-50 transition"
                    >
                      {editId === admin._id ? (
                        <>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <FaUser className="text-gray-400" />
                              <input
                                type="text"
                                name="username"
                                value={editForm.username}
                                onChange={handleChange}
                                className="border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-200"
                                required
                              />
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <FaEnvelope className="text-gray-400" />
                              <input
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleChange}
                                className="border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-200"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <FaKey className="text-gray-400" />
                              <input
                                type="password"
                                name="password"
                                value={editForm.password}
                                onChange={handleChange}
                                className="border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-200"
                                placeholder="Password baru (opsional)"
                                autoComplete="new-password"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                              {admin.role}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleSave(admin._id)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded mr-2 transition"
                              title="Simpan"
                            >
                              <FaSave /> Simpan
                            </button>
                            <button
                              onClick={handleCancel}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded transition"
                              title="Batal"
                            >
                              <FaTimes /> Batal
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <FaUser className="text-blue-400" />
                              <span className="font-medium">{admin.username}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <FaEnvelope className="text-blue-400" />
                              <span>{admin.email}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                              {admin.role}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleEdit(admin)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded mr-2 transition"
                              title="Edit"
                            >
                              <FaUserEdit /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(admin._id)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
                              title="Hapus"
                            >
                              <FaTrash /> Hapus
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <style jsx global>{`
        @media (min-width: 768px) {
          body {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
