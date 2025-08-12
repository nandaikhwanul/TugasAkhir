"use client";

import React, { useRef, useState } from "react";
import { FiUploadCloud, FiLink2 } from "react-icons/fi";
import { MdOutlineCastForEducation } from "react-icons/md";
import { FaPodcast } from "react-icons/fa";
import Navbar from "../../navbar/page";

// Helper untuk membagi array menjadi chunk
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Helper untuk validasi link embed (sederhana, bisa dikembangkan)
function isValidEmbedLink(link) {
  // Youtube, TikTok, Twitter, Facebook, dst (basic check)
  return (
    /youtube\.com|youtu\.be|tiktok\.com|twitter\.com|facebook\.com|fb\.watch/.test(link)
  );
}

/**
 * INSTRUKSI PENGGUNA:
 * - Pilih tab "Pelatihan" atau "Podcast" sesuai kategori video yang ingin diupload.
 * - Pilih mode upload: "Upload File" untuk upload file, atau "Upload Link" untuk menambah video dari link.
 * - Untuk upload file: pilih file, isi judul & deskripsi, lalu klik tombol "Upload".
 * - Untuk upload link: masukkan link video, isi judul & deskripsi, lalu klik tombol "Upload".
 * - Video yang diupload akan langsung muncul di tab yang aktif.
 */

export default function AdminDashboardUpload() {
  // State untuk daftar video
  const [pelatihanVideos, setPelatihanVideos] = useState([
    {
      id: 1,
      title: "Pelatihan React Dasar",
      url: "https://www.youtube.com/embed/dGcsHMXbSOA",
      desc: "Belajar React dari dasar untuk pemula.",
    },
    {
      id: 2,
      title: "Pelatihan UI/UX Design",
      url: "https://www.youtube.com/embed/3tYp4UQISp8",
      desc: "Dasar-dasar UI/UX untuk pengembangan aplikasi.",
    },
    // Tambahkan data lain jika ingin menguji 6 data
  ]);
  const [podcastVideos, setPodcastVideos] = useState([
    {
      id: 1,
      title: "Podcast Karir IT",
      url: "https://www.youtube.com/embed/2Xc9gXyf2G4",
      desc: "Diskusi seputar karir di bidang IT.",
    },
    {
      id: 2,
      title: "Podcast Sukses Alumni",
      url: "https://www.youtube.com/embed/5qap5aO4i9A",
      desc: "Cerita sukses alumni dan tips berkarir.",
    },
    // Tambahkan data lain jika ingin menguji 6 data
  ]);

  // State upload
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileObject, setFileObject] = useState(null);
  const [activeTab, setActiveTab] = useState("pelatihan");
  const [uploadMode, setUploadMode] = useState("file"); // "file" | "link"
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [showUploadBox, setShowUploadBox] = useState(true); // for animation
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileSuccess, setFileSuccess] = useState("");
  const inputRef = useRef(null);

  // Animasi transisi upload box
  const handleSwitchMode = (mode) => {
    if (uploadMode === mode) return;
    setShowUploadBox(false);
    setTimeout(() => {
      setUploadMode(mode);
      setShowUploadBox(true);
      setFileName("");
      setFileObject(null);
      setLinkInput("");
      setLinkError("");
      setLinkSuccess("");
      setTitleInput("");
      setDescInput("");
      setFileError("");
      setFileSuccess("");
      // Reset file input value to avoid uncontrolled warning
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }, 250); // match with transition duration
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
      setFileObject(e.dataTransfer.files[0]);
      // Set file input value to empty to avoid uncontrolled warning
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setFileObject(e.target.files[0]);
    } else {
      setFileName("");
      setFileObject(null);
    }
  };

  const handleClick = () => {
    if (uploadMode === "file") {
      if (inputRef.current) inputRef.current.click();
    }
  };

  // Upload file ke list video (simulasi, hanya menambah ke state)
  const handleFileUpload = (e) => {
    e.preventDefault();
    setFileError("");
    setFileSuccess("");
    if (!fileName || !fileObject) {
      setFileError("Pilih file terlebih dahulu.");
      return;
    }
    if (!titleInput.trim()) {
      setFileError("Judul video wajib diisi.");
      return;
    }
    if (!descInput.trim()) {
      setFileError("Deskripsi video wajib diisi.");
      return;
    }
    // Simulasi: generate url dummy (seharusnya upload ke server dan dapat url)
    // Untuk demo, gunakan URL.createObjectURL, tapi pada real case harus upload ke server
    const dummyUrl = URL.createObjectURL(fileObject);
    const newVideo = {
      id: Date.now(),
      title: titleInput,
      url: dummyUrl,
      desc: descInput,
    };
    if (activeTab === "pelatihan") {
      setPelatihanVideos((prev) => [newVideo, ...prev]);
    } else {
      setPodcastVideos((prev) => [newVideo, ...prev]);
    }
    setFileSuccess("Video berhasil diupload!");
    setFileName("");
    setFileObject(null);
    setTitleInput("");
    setDescInput("");
    // Reset file input value to avoid uncontrolled warning
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    // (opsional) setTimeout untuk menghilangkan pesan sukses
    setTimeout(() => setFileSuccess(""), 2000);
  };

  // Upload link ke list video
  const handleLinkSubmit = (e) => {
    e.preventDefault();
    setLinkError("");
    setLinkSuccess("");
    if (!linkInput.trim()) {
      setLinkError("Link tidak boleh kosong.");
      return;
    }
    if (!isValidEmbedLink(linkInput.trim())) {
      setLinkError("Link tidak valid atau tidak didukung.");
      return;
    }
    if (!titleInput.trim()) {
      setLinkError("Judul video wajib diisi.");
      return;
    }
    if (!descInput.trim()) {
      setLinkError("Deskripsi video wajib diisi.");
      return;
    }
    // Tambahkan ke list video
    const newVideo = {
      id: Date.now(),
      title: titleInput,
      url: linkInput.trim(),
      desc: descInput,
    };
    if (activeTab === "pelatihan") {
      setPelatihanVideos((prev) => [newVideo, ...prev]);
    } else {
      setPodcastVideos((prev) => [newVideo, ...prev]);
    }
    setLinkSuccess("Link berhasil diupload!");
    setLinkInput("");
    setTitleInput("");
    setDescInput("");
    // (opsional) setTimeout untuk menghilangkan pesan sukses
    setTimeout(() => setLinkSuccess(""), 2000);
  };

  // Membagi video menjadi baris-baris 5 kolom
  const pelatihanChunks = chunkArray(pelatihanVideos, 5);
  const podcastChunks = chunkArray(podcastVideos, 5);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start bg-gray-50 py-12 w-full"
      style={{
        width: "99vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
        <Navbar />
      {/* INSTRUKSI */}
      <div className="mb-6 w-full max-w-2xl px-4 ">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          <b>Instruksi:</b>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Pilih tab <b>Pelatihan</b> atau <b>Podcast</b> sesuai kategori video.</li>
            <li>Pilih mode upload: <b>Upload File</b> atau <b>Upload Link</b>.</li>
            <li>Isi <b>judul</b> dan <b>deskripsi</b> video.</li>
            <li>
              Untuk <b>Upload File</b>: pilih file video, lalu klik tombol <b>Upload</b>.
              <br />
              Untuk <b>Upload Link</b>: masukkan link video, lalu klik tombol <b>Upload</b>.
            </li>
            <li>Video akan langsung muncul di daftar sesuai tab yang aktif.</li>
          </ol>
        </div>
      </div>

      {/* Tombol switch mode upload */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleSwitchMode("file")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow transition-all duration-200
            ${
              uploadMode === "file"
                ? "bg-blue-600 text-white scale-105"
                : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
            }`}
          aria-pressed={uploadMode === "file"}
        >
          <FiUploadCloud size={20} />
          Upload File
        </button>
        <button
          onClick={() => handleSwitchMode("link")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow transition-all duration-200
            ${
              uploadMode === "link"
                ? "bg-blue-600 text-white scale-105"
                : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
            }`}
          aria-pressed={uploadMode === "link"}
        >
          <FiLink2 size={20} />
          Upload Link
        </button>
      </div>

      {/* Upload Box (animated transition) */}
      <div
        className={`w-full max-w-md relative`}
        style={{ minHeight: 320 }}
      >
        <div
          className={`
            absolute inset-0 transition-all duration-300
            ${showUploadBox ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
          `}
        >
          {uploadMode === "file" ? (
            <form
              className={`w-full h-full p-8 bg-white rounded-lg shadow-md border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onClick={handleClick}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{ outline: "none" }}
              tabIndex={0}
              onSubmit={handleFileUpload}
            >
              <FiUploadCloud size={48} className="text-blue-500 mb-4" />
              <p className="text-gray-700 mb-2 font-semibold">
                Drag &amp; drop file di sini, atau{" "}
                <span className="text-blue-600 underline">klik untuk upload</span>
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Format: MP4, PDF, JPG, PNG, dll.
              </p>
              {/* 
                Perbaikan error: 
                Jangan pernah set value prop pada input type="file" (baik undefined, null, atau string kosong).
                Biarkan input file tetap uncontrolled.
              */}
              <input
                type="file"
                ref={inputRef}
                className="hidden"
                onChange={handleChange}
                accept="video/*,application/pdf,image/*"
                // Jangan set value prop di sini!
              />
              {fileName && (
                <div className="mt-2 text-green-600 font-medium text-sm">
                  File dipilih: {fileName}
                </div>
              )}
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-4 py-2 mt-4 mb-2 focus:outline-none focus:border-blue-500 transition"
                placeholder="Judul video"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
              />
              <textarea
                className="w-full border border-gray-300 rounded px-4 py-2 mb-2 focus:outline-none focus:border-blue-500 transition"
                placeholder="Deskripsi video"
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                rows={2}
              />
              {fileError && (
                <div className="text-red-500 text-sm mb-2">{fileError}</div>
              )}
              {fileSuccess && (
                <div className="text-green-600 text-sm mb-2">{fileSuccess}</div>
              )}
              <button
                type="submit"
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-700 transition"
              >
                Upload
              </button>
            </form>
          ) : (
            <form
              className="w-full min-h-[480px] p-8 bg-white rounded-lg shadow-md border-2 border-blue-300 flex flex-col items-center justify-center transition-colors scroll-auto"
              style={{ outline: "none" }}
              onSubmit={handleLinkSubmit}
            >
              <FiLink2 size={48} className="text-blue-500 mb-4" />
              <p className="text-gray-700 mb-2 font-semibold">
                Masukkan link video (YouTube, TikTok, Twitter, Facebook, dll)
              </p>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-2 focus:outline-none focus:border-blue-500 transition"
                placeholder="https://youtube.com/..."
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-2 focus:outline-none focus:border-blue-500 transition"
                placeholder="Judul video"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
              />
              <textarea
                className="w-full border border-gray-300 rounded px-4 py-2 mb-2 focus:outline-none focus:border-blue-500 transition"
                placeholder="Deskripsi video"
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                rows={2}
              />
              {linkError && (
                <div className="text-red-500 text-sm mb-2">{linkError}</div>
              )}
              {linkSuccess && (
                <div className="text-green-600 text-sm mb-2">{linkSuccess}</div>
              )}
              <button
                type="submit"
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-700 transition"
              >
                Upload
              </button>
              <p className="text-gray-400 text-xs mt-3">
                Link yang didukung: YouTube, TikTok, Twitter, Facebook, dll.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Tombol Pelatihan & Podcast */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={() => {
            setActiveTab("pelatihan");
            setFileError("");
            setFileSuccess("");
            setLinkError("");
            setLinkSuccess("");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow transition 
            ${
              activeTab === "pelatihan"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
            }`}
        >
          <MdOutlineCastForEducation size={22} />
          Pelatihan
        </button>
        <button
          onClick={() => {
            setActiveTab("podcast");
            setFileError("");
            setFileSuccess("");
            setLinkError("");
            setLinkSuccess("");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow transition 
            ${
              activeTab === "podcast"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
            }`}
        >
          <FaPodcast size={20} />
          Podcast
        </button>
      </div>

      {/* List Video Pelatihan */}
      {activeTab === "pelatihan" && (
        <div className="w-full mt-12">
          <h2 className="text-xl font-bold mb-4 text-gray-800 px-4">
            Video Pelatihan
          </h2>
          {pelatihanChunks.length === 0 && (
            <div className="text-gray-500 px-4">Belum ada video pelatihan.</div>
          )}
          {pelatihanChunks.map((chunk, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4 mb-6"
            >
              {chunk.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow p-4 flex flex-col items-center"
                >
                  <div className="w-full aspect-video mb-2">
                    <iframe
                      src={video.url}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-48 rounded"
                    ></iframe>
                  </div>
                  <div className="w-full">
                    <h3 className="font-semibold text-gray-700">
                      {video.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{video.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* List Video Podcast */}
      {activeTab === "podcast" && (
        <div className="w-full mt-12">
          <h2 className="text-xl font-bold mb-4 text-gray-800 px-4">
            Video Podcast
          </h2>
          {podcastChunks.length === 0 && (
            <div className="text-gray-500 px-4">Belum ada video podcast.</div>
          )}
          {podcastChunks.map((chunk, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4 mb-6"
            >
              {chunk.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow p-4 flex flex-col items-center"
                >
                  <div className="w-full aspect-video mb-2">
                    <iframe
                      src={video.url}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-48 rounded"
                    ></iframe>
                  </div>
                  <div className="w-full">
                    <h3 className="font-semibold text-gray-700">
                      {video.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{video.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
