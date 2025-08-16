"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromSessionStorage } from "../../sessiontoken";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CATEGORIES = [
  {
    _id: "6897401324867c87afbca3cd",
    name: "Karir",
    description: "Diskusi seputar karir dan pengembangan diri",
  },
  {
    _id: "68976a42165d49d0452e6535",
    name: "Lowongan",
    description: "Diskusi seputar karir dan pengembangan diri",
  },
  {
    _id: "68976a4c165d49d0452e6538",
    name: "Polling",
    description: "Diskusi seputar karir dan pengembangan diri",
  },
];

export default function BuatPostForum() {
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    tags: "",
    category: CATEGORIES[0]._id,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagsChange = (e) => {
    setForm((prev) => ({
      ...prev,
      tags: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Prepare tags as array, pisahkan dengan #
    const tagsArray = form.tags
      .split("#")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      tags: tagsArray,
      category: form.category,
    };

    try {
      // Ambil token dari session storage
      const token = getTokenFromSessionStorage();
      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan. Silakan login ulang.");
      }

      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Gagal membuat postingan";
        try {
          const data = await res.json();
          if (data && data.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }

      // Show toast and redirect
      toast.success("Postingan berhasil dibuat!", {
        position: "top-center",
        autoClose: 2000,
        onClose: () => {
          router.push("/forum");
        },
      });
      // Optionally reset form, but user will be redirected anyway
      setForm({
        title: "",
        summary: "",
        content: "",
        tags: "",
        category: CATEGORIES[0]._id,
      });
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 w-full h-full">
      <ToastContainer />
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-xl w-full mx-auto mt-8 p-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-4">Buat Postingan Forum Alumni</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1" htmlFor="title">
                Judul Postingan
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Masukkan judul postingan"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="summary">
                Ringkasan Singkat
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                value={form.summary}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Masukkan ringkasan singkat"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="content">
                Isi Postingan
              </label>
              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                placeholder="Tulis isi lengkap postingan di sini"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="tags">
                Tag (pisahkan dengan #)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={form.tags}
                onChange={handleTagsChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Contoh: alumni#event#info"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="category">
                Kategori
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Buat Postingan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
