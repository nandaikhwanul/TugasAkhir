"use client"
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getTokenFromSessionStorage } from "../../sessiontoken";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "../../navbar/page"; // Import Navbar
import { FaTrash } from "react-icons/fa";

// Ganti ke endpoint lokal sesuai instruksi
const API_BASE_URL = 'https://tugasakhir-production-6c6c.up.railway.app';

const initialFileForm = {
  judul: '',
  deskripsi: '',
  tipe: 'pelatihan',
};

const initialLinkForm = {
  judul: '',
  deskripsi: '',
  tipe: 'pelatihan',
  videoPelatihanUrl: '',
  videoPodcastUrl: '',
};

// Helper: Convert YouTube URL to embed format if possible
function getYouTubeEmbedUrl(url) {
  if (!url) return url;
  // Handle youtu.be short links
  if (url.match(/^https?:\/\/youtu\.be\//)) {
    const id = url.split('youtu.be/')[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  // Handle youtube.com/watch?v= links
  if (url.match(/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/)) {
    const id = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  // Handle already embed
  if (url.match(/^https?:\/\/(www\.)?youtube\.com\/embed\//)) {
    return url;
  }
  // Handle youtube.com/shorts/ links
  if (url.match(/^https?:\/\/(www\.)?youtube\.com\/shorts\//)) {
    const id = url.split('/shorts/')[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}

// Helper: Convert Instagram URL to embed format if possible
function getInstagramEmbedUrl(url) {
  if (!url) return url;
  // Instagram embed: https://www.instagram.com/p/xxxx/ => https://www.instagram.com/p/xxxx/embed
  const match = url.match(/^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([^/?#&]+)/);
  if (match) {
    return `https://www.instagram.com/${match[2]}/${match[3]}/embed`;
  }
  return url;
}

// Helper: General embed URL for known platforms
function getEmbedUrl(url) {
  if (!url) return url;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return getYouTubeEmbedUrl(url);
  }
  if (url.includes('instagram.com')) {
    return getInstagramEmbedUrl(url);
  }
  // Add more platforms if needed
  return url;
}

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [formType, setFormType] = useState('file'); // 'file' or 'link'

  // Form states for file upload
  const [fileForm, setFileForm] = useState(initialFileForm);

  // Form states for link upload (for pelatihan, use videoPelatihanUrl; for podcast, use videoPodcastUrl)
  const [linkForm, setLinkForm] = useState(initialLinkForm);

  // Fetch data from the API
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getTokenFromSessionStorage();
      const response = await fetch(`${API_BASE_URL}/pelatihandanpodcast`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Gagal mengambil data');
      const result = await response.json();
      // result.data sesuai controller
      setData(result.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle drag and drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle form changes for file upload
  const handleFileFormChange = (e) => {
    setFileForm({ ...fileForm, [e.target.name]: e.target.value });
  };

  // Handle form changes for link upload
  const handleLinkFormChange = (e) => {
    const { name, value } = e.target;
    setLinkForm({ ...linkForm, [name]: value });
  };

  // Handle file selection via input button
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Submit form for file upload
  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Silakan pilih file untuk diunggah.');
      return;
    }

    setIsUploading(true);
    setMessage('');

    // Create FormData object
    const formData = new FormData();
    formData.append('judul', fileForm.judul);
    formData.append('deskripsi', fileForm.deskripsi);
    formData.append('tipe', fileForm.tipe);
    // formData.append('tanggal', new Date().toISOString().split('T')[0]); // tanggal tidak dipakai di controller
    formData.append('video', selectedFile); // fieldname HARUS "video" sesuai controller

    try {
      const token = getTokenFromSessionStorage();
      // Penting: Jangan set Content-Type ke application/json saat upload file!
      // fetch akan otomatis set Content-Type ke multipart/form-data jika body adalah FormData
      const response = await fetch(`${API_BASE_URL}/pelatihandanpodcast`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      // Cek apakah response berupa JSON, jika tidak, tangani error HTML
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Jika bukan JSON, kemungkinan error HTML
        const text = await response.text();
        throw new Error('Gagal mengunggah file. Server mengembalikan respons tidak valid: ' + text.slice(0, 100));
      }

      if (!response.ok) {
        throw new Error(result.msg || 'Gagal mengunggah file.');
      }
      // Success: pakai react-toastify
      toast.success('File berhasil diunggah!');
      setFileForm(initialFileForm);
      setSelectedFile(null);
      setMessage('');
      // fetchData();
      // Refresh browser setelah berhasil upload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage('Error: ' + error.message);
      toast.error('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit form for link upload
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage('');

    try {
      const token = getTokenFromSessionStorage();
      let body = {
        judul: linkForm.judul,
        deskripsi: linkForm.deskripsi,
        tipe: linkForm.tipe,
        // tanggal: new Date().toISOString().split('T')[0], // tanggal tidak dipakai di controller
      };

      // If tipe is pelatihan, use videoPelatihanUrl
      if (linkForm.tipe === 'pelatihan') {
        body.videoPelatihanUrl = linkForm.videoPelatihanUrl;
      } else if (linkForm.tipe === 'podcast') {
        body.videoPodcastUrl = linkForm.videoPodcastUrl;
      }

      // Validate YouTube/Instagram embed for podcast
      if (linkForm.tipe === 'podcast' && linkForm.videoPodcastUrl) {
        const embedUrl = getEmbedUrl(linkForm.videoPodcastUrl);
        if (
          (linkForm.videoPodcastUrl.includes('youtube.com') || linkForm.videoPodcastUrl.includes('youtu.be')) &&
          !embedUrl.includes('/embed/')
        ) {
          toast.error('URL YouTube harus dalam format embed, misal: https://www.youtube.com/embed/xxxx');
          setIsUploading(false);
          return;
        }
        if (
          linkForm.videoPodcastUrl.includes('instagram.com') &&
          !embedUrl.endsWith('/embed')
        ) {
          toast.error('URL Instagram harus dalam format embed, misal: https://www.instagram.com/p/xxxx/embed');
          setIsUploading(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/pelatihandanpodcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      // Cek apakah response berupa JSON, jika tidak, tangani error HTML
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Jika bukan JSON, kemungkinan error HTML
        const text = await response.text();
        throw new Error('Gagal mengunggah link. Server mengembalikan respons tidak valid: ' + text.slice(0, 100));
      }

      if (!response.ok) {
        throw new Error(result.msg || 'Gagal mengunggah link.');
      }
      // Success: pakai react-toastify
      toast.success('Link berhasil disimpan!');
      setLinkForm(initialLinkForm);
      setMessage('');
      // fetchData();
      // Refresh browser setelah berhasil upload link
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage('Error: ' + error.message);
      toast.error('Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handler for delete
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus konten ini?")) return;
    try {
      const token = getTokenFromSessionStorage();
      const response = await fetch(`${API_BASE_URL}/pelatihandanpodcast/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.msg || "Gagal menghapus konten.");
      }
      toast.success("Konten berhasil dihapus!");
      // Hapus dari state tanpa reload
      setData((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  // ContentCard: show contentUrl for both file and url, and use title/contentType
  const ContentCard = ({ item }) => {
    // item: { title, contentUrl, contentType, ... }
    // contentType: "training_video" | "podcast"
    // contentUrl: bisa url (http...) atau path file lokal (uploads/videos/...)
    // Tampilkan iframe jika url, video tag jika file lokal

    // Helper: apakah contentUrl adalah url eksternal?
    const isExternalUrl = item.contentUrl && (item.contentUrl.startsWith('http://') || item.contentUrl.startsWith('https://'));

    // Tampilkan iframe untuk url eksternal (YouTube, Instagram, dst)
    if (isExternalUrl) {
      let src = item.contentUrl;

      // For YouTube/Instagram, always use embed format
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        src = getYouTubeEmbedUrl(src);
      } else if (src.includes('instagram.com')) {
        src = getInstagramEmbedUrl(src);
      }

      // Note: YouTube/Instagram may block embed if not public or not allowed by owner
      // If embed fails, browser will show error or blank

      return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-auto relative">
          <button
            className="absolute top-2 right-2 z-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-2 transition"
            title="Hapus"
            onClick={() => handleDelete(item._id)}
          >
            <FaTrash className="w-5 h-5" />
          </button>
          <div className="aspect-w-16 h-96 w-full">
            <iframe
              className="w-full h-full"
              src={src}
              title={item.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="p-4 flex-grow flex flex-col">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
            {/* <p className="text-gray-600 mb-4 flex-grow">{item.deskripsi}</p> */}
            <div className="flex items-center text-sm text-gray-500 mt-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="w-4 h-4 mr-1 text-green-500">
                  <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m3.293 6.293a1 1 0 0 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L10 12.586l4.293-4.293a1 1 0 0 1 1.414 0Z"/>
              </svg>
              {/* Tidak ada tanggal di schema, jadi tidak tampilkan */}
            </div>
          </div>
        </div>
      );
    }

    // Jika file lokal, tampilkan video tag
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-auto relative">
        <button
          className="absolute top-2 right-2 z-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-2 transition"
          title="Hapus"
          onClick={() => handleDelete(item._id)}
        >
          <FaTrash className="w-5 h-5" />
        </button>
        <div className="aspect-w-16 aspect-h-9 w-full bg-gray-900 flex items-center justify-center">
          <video
            src={`${API_BASE_URL}/${item.contentUrl.replace(/\\/g, "/")}`}
            className="w-full h-full object-contain"
            controls
            onError={(e) => console.log('Video error:', e)}
          />
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
          {/* <p className="text-gray-600 mb-4 flex-grow">{item.deskripsi}</p> */}
          <div className="flex items-center text-sm text-gray-500 mt-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="w-4 h-4 mr-1 text-green-500">
                <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m3.293 6.293a1 1 0 0 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L10 12.586l4.293-4.293a1 1 0 0 1 1.414 0Z"/>
            </svg>
          </div>
        </div>
      </div>
    );
  };

  // Pisahkan data berdasarkan contentType
  const safeData = Array.isArray(data) ? data : [];
  const trainingVideos = safeData.filter(item => item.contentType === 'training_video');
  const podcasts = safeData.filter(item => item.contentType === 'podcast');

  const Spinner = () => (
    <div className="flex justify-center items-center h-48">
      <div className="w-12 h-12 rounded-full border-4 border-t-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div className="container mx-auto p-4 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-8">Unggah Konten Pelatihan & Podcast</h1>

        {/* Toggle between file and link upload forms */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setFormType('file')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
              formType === 'file' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 4h7v5h5v11H6V4zm8 15v-3h-2v3h-2v-3h-2v3h-2v-5h10v5h-2z"/>
            </svg>
            <span>Unggah File</span>
          </button>
          <button
            onClick={() => setFormType('link')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
              formType === 'link' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="currentColor" d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8s8 3.589 8-8s-3.589-8-8-8zm-1 5h2v6h-2z"/>
            </svg>
            <span>Unggah Link</span>
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 mb-12">
          {formType === 'file' ? (
            <form onSubmit={handleFileSubmit}>
              <div
                className={`flex flex-col items-center justify-center p-8 border-4 border-dashed rounded-lg transition-colors duration-300 mb-6
                  ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="w-12 h-12 text-gray-400 mb-4">
                    <path fill="currentColor" d="M18.944 11.178A7.994 7.994 0 0 0 12 2.012a8.002 8.002 0 0 0-7.07 12.247A5 5 0 0 0 7 21h10a5 5 0 0 0 1.944-9.822ZM13 14h-2v-3H8l4-5l4 5h-3v3z"/>
                </svg>
                <p className="text-gray-600 text-center mb-2">
                  <span className="font-semibold text-indigo-600">Seret & Jatuhkan</span> file di sini, atau
                </p>
                <label className="bg-indigo-500 text-white px-4 py-2 rounded-full font-medium cursor-pointer hover:bg-indigo-600 transition-colors duration-300">
                  Pilih File
                  <input type="file" name="video" onChange={handleFileChange} className="hidden" accept="video/mp4,video/webm,video/mkv" />
                </label>
              </div>

              {selectedFile && (
                <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 p-4 rounded-lg mb-6" role="alert">
                  <p className="font-bold">File Terpilih:</p>
                  <p>{selectedFile.name}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label htmlFor="file-judul" className="font-medium text-gray-700 mb-1">Judul</label>
                  <input
                    type="text"
                    id="file-judul"
                    name="judul"
                    value={fileForm.judul}
                    onChange={handleFileFormChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="file-tipe" className="font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    id="file-tipe"
                    name="tipe"
                    value={fileForm.tipe}
                    onChange={handleFileFormChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value="pelatihan">Video Pelatihan</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col">
                  <label htmlFor="file-deskripsi" className="font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    id="file-deskripsi"
                    name="deskripsi"
                    rows="3"
                    value={fileForm.deskripsi}
                    onChange={handleFileFormChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    required
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center space-x-2 mt-8 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300
                  ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'}`}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                    <span>Mengunggah...</span>
                  </span>
                ) : (
                  <span>Unggah File</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLinkSubmit}>
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label htmlFor="link-judul" className="font-medium text-gray-700 mb-1">Judul</label>
                  <input
                    type="text"
                    id="link-judul"
                    name="judul"
                    value={linkForm.judul}
                    onChange={handleLinkFormChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="link-deskripsi" className="font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    id="link-deskripsi"
                    name="deskripsi"
                    rows="3"
                    value={linkForm.deskripsi}
                    onChange={handleLinkFormChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    required
                  ></textarea>
                </div>
                <div className="flex flex-col">
                  <label htmlFor="link-tipe" className="font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    id="link-tipe"
                    name="tipe"
                    value={linkForm.tipe}
                    onChange={handleLinkFormChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value="pelatihan">Video Pelatihan</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>
                {linkForm.tipe === 'pelatihan' ? (
                  <div className="flex flex-col">
                    <label htmlFor="videoPelatihanUrl" className="font-medium text-gray-700 mb-1">URL Video Pelatihan</label>
                    <input
                      type="url"
                      id="videoPelatihanUrl"
                      name="videoPelatihanUrl"
                      value={linkForm.videoPelatihanUrl}
                      onChange={handleLinkFormChange}
                      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                      placeholder="Contoh: https://example.com/pelatihan-public-speaking"
                      required
                    />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <label htmlFor="videoPodcastUrl" className="font-medium text-gray-700 mb-1">URL Video Podcast</label>
                    <input
                      type="url"
                      id="videoPodcastUrl"
                      name="videoPodcastUrl"
                      value={linkForm.videoPodcastUrl}
                      onChange={handleLinkFormChange}
                      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                      placeholder="Contoh: https://www.youtube.com/embed/xxxx atau https://www.instagram.com/p/xxxx/embed"
                      required
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      Untuk YouTube/Instagram, gunakan format embed. Contoh: <br />
                      <span className="font-mono">https://www.youtube.com/embed/xxxx</span> atau <span className="font-mono">https://www.instagram.com/p/xxxx/embed</span>
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center space-x-2 mt-8 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300
                  ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'}`}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                    <span>Menyimpan Link...</span>
                  </span>
                ) : (
                  <span>Simpan Link</span>
                )}
              </button>
            </form>
          )}

          {/* message dihilangkan, karena sudah pakai toastify */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg font-medium ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Content Display Section */}
        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-12">
            {/* Training Videos Section */}
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="w-8 h-8 text-indigo-600">
                    <path fill="currentColor" d="M15 13.5v-3c0-.3-.2-.5-.5-.5H8c-.3 0-.5.2-.5.5v3c0 .3.2.5.5.5h6.5c.3 0 .5-.2.5-.5zM20 5v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h12c1.1 0 2-.9 2 2zm-1 0H5v14h14V5z"/>
                </svg>
                <h2 className="text-2xl font-bold text-gray-800">Video Pelatihan</h2>
              </div>
              {trainingVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trainingVideos.map(item => (
                    <ContentCard key={item._id} item={item} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada video pelatihan yang tersedia.</p>
              )}
            </div>

            {/* Podcasts Section */}
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="w-8 h-8 text-indigo-600">
                    <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2.45 13.53a.5.5 0 0 1-.77-.45V9.45a.5.5 0 0 1 .77-.45l5.53 2.54a.5.5 0 0 1 0 .91z"/>
                </svg>
                <h2 className="text-2xl font-bold text-gray-800">Podcast</h2>
              </div>
              {podcasts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {podcasts.map(item => (
                    <ContentCard key={item._id} item={item} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada podcast yang tersedia.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
