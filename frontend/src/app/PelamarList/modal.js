import React, { useState } from "react";

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

// Hapus channel Email
const CHANNELS = [
  { label: "Web", value: "web" },
  { label: "Whatsapp", value: "whatsapp" },
];

// Daftar tahap (tanpa pesan otomatis per tahap)
const TAHAP_OPTIONS = [
  { value: "1", label: "Tahap 1" },
  { value: "2", label: "Tahap 2" },
  { value: "3", label: "Tahap 3" },
  { value: "final", label: "Tahap Final" },
];

// Pesan otomatis diterima/ditolak
const DEFAULT_PESAN_OTOMATIS = [
  { label: "Diterima (Default)", value: "diterima", text: "Selamat, Anda dinyatakan lolos ke tahap berikutnya. Silakan menunggu instruksi selanjutnya." },
  { label: "Ditolak (Default)", value: "ditolak", text: "Mohon maaf, Anda belum lolos pada proses rekrutmen ini. Terima kasih atas partisipasinya." },
];

export default function VerifikasiModal({
  open,
  onClose,
  pelamar,
  onVerifikasi,
  loading,
}) {
  // State untuk tahap
  const [tahap, setTahap] = useState(TAHAP_OPTIONS[0].value);

  // State untuk daftar pesan otomatis (bisa tambah baru)
  const [pesanOtomatisList, setPesanOtomatisList] = useState([...DEFAULT_PESAN_OTOMATIS]);
  // State untuk pesan otomatis yang dipilih (index di pesanOtomatisList, atau "custom")
  const [selectedPesanOtomatis, setSelectedPesanOtomatis] = useState("diterima");
  // State untuk pesan yang akan dikirim (bisa edit manual)
  const [pesan, setPesan] = useState(DEFAULT_PESAN_OTOMATIS[0].text);
  const [pesanManual, setPesanManual] = useState(false); // true jika user edit pesan
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedChannels, setSelectedChannels] = useState(["web"]);
  const [aksiTerakhir, setAksiTerakhir] = useState("kirim"); // "kirim" (diterima) atau "tolak"

  // State untuk menambah pesan otomatis baru
  const [showAddPesanOtomatis, setShowAddPesanOtomatis] = useState(false);
  const [newPesanLabel, setNewPesanLabel] = useState("");
  const [newPesanText, setNewPesanText] = useState("");

  if (!open) return null;

  // Handler untuk dropdown tahap
  const handleTahapChange = (e) => {
    const val = e.target.value;
    setTahap(val);
    // Tidak mengubah pesan otomatis berdasarkan tahap
  };

  // Handler untuk dropdown pesan otomatis
  const handlePesanOtomatisChange = (e) => {
    const val = e.target.value;
    setSelectedPesanOtomatis(val);
    setPesanManual(false);
    if (val === "custom") {
      setPesan("");
    } else {
      const found = pesanOtomatisList.find((p) => p.value === val);
      setPesan(found ? found.text : "");
    }
  };

  // Handler untuk field pesan
  const handlePesanChange = (e) => {
    setPesan(e.target.value);
    setPesanManual(true);
    setSelectedPesanOtomatis("custom");
  };

  // Handler untuk checkbox channel
  const handleChannelChange = (e) => {
    const { value, checked } = e.target;
    setSelectedChannels((prev) => {
      if (checked) {
        return [...prev, value];
      } else {
        return prev.filter((ch) => ch !== value);
      }
    });
  };

  // Handler klik kirim/tolak
  const handleAksi = async (aksi) => {
    setError("");
    setSuccess("");
    setAksiTerakhir(aksi);

    if (!pelamar || !pelamar._id) {
      setError("Data pelamar tidak valid.");
      return;
    }
    if (selectedChannels.length === 0) {
      setError("Pilih minimal satu channel pengiriman pesan.");
      return;
    }

    // Set pesan otomatis jika user belum edit manual
    if (!pesanManual) {
      let pesanOto = "";
      if (aksi === "tolak") {
        // Cari pesan otomatis default ditolak
        const found = pesanOtomatisList.find((p) => p.value === "ditolak");
        pesanOto = found ? found.text : "";
        setPesan(pesanOto);
      } else {
        // Cari pesan otomatis default diterima
        const found = pesanOtomatisList.find((p) => p.value === "diterima");
        pesanOto = found ? found.text : "";
        setPesan(pesanOto);
      }
    }

    // Kirim pesan ke alumni via endpoint
    const alumniId =
      pelamar?.alumni?._id ||
      pelamar?.alumniId ||
      pelamar?._id ||
      pelamar?.id;

    if (!alumniId) {
      setError("ID alumni tidak ditemukan.");
      return;
    }

    const token = getTokenFromCookie();
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }

    try {
      // Kirim pesan ke semua channel yang dipilih
      for (const channel of selectedChannels) {
        const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pesan/kirim-ke-alumni", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            alumniId,
            pesan: pesan,
            channel,
            tahap, // kirim tahap juga jika backend perlu
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data?.message ||
              `Gagal mengirim pesan ke channel ${channel}.`
          );
        }
      }

      // Jalankan verifikasi (jika ada)
      if (typeof onVerifikasi === "function") {
        await onVerifikasi({
          aksi,
          pesan: pesan,
          tahap,
        });
      }

      setSuccess(
        aksi === "terima" || aksi === "kirim"
          ? "Pelamar berhasil dikirim ke tahap yang dipilih & pesan dikirim."
          : "Pelamar berhasil ditolak & pesan dikirim."
      );
      setPesanManual(false);
      // Reset pesan ke default sesuai aksi terakhir
      if (aksi === "tolak") {
        const found = pesanOtomatisList.find((p) => p.value === "ditolak");
        setPesan(found ? found.text : "");
        setSelectedPesanOtomatis("ditolak");
      } else {
        const found = pesanOtomatisList.find((p) => p.value === "diterima");
        setPesan(found ? found.text : "");
        setSelectedPesanOtomatis("diterima");
      }
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1200);
    } catch (err) {
      setError(
        err?.message ||
          "Terjadi kesalahan saat memproses pelamar atau mengirim pesan."
      );
    }
  };

  // Handler untuk menambah pesan otomatis baru
  const handleAddPesanOtomatis = (e) => {
    e.preventDefault();
    if (!newPesanLabel.trim() || !newPesanText.trim()) return;
    // Buat value unik
    const value = "custom_" + Date.now();
    setPesanOtomatisList((prev) => [
      ...prev,
      { label: newPesanLabel, value, text: newPesanText },
    ]);
    setSelectedPesanOtomatis(value);
    setPesan(newPesanText);
    setPesanManual(false);
    setShowAddPesanOtomatis(false);
    setNewPesanLabel("");
    setNewPesanText("");
  };

  // Nama pelamar
  let namaPelamar =
    pelamar?.nama ||
    pelamar?.alumni?.nama ||
    pelamar?.alumni?.name ||
    "ini";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Tutup"
          type="button"
          disabled={!!loading}
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-2 text-gray-900">
          Konfirmasi Proses Lamaran
        </h2>
        <div className="mb-4 text-gray-800">
          <div>
            Apakah Anda yakin ingin memproses pelamar{" "}
            <span className="font-semibold">{namaPelamar}</span>?
          </div>
        </div>
        {/* Dropdown tahap */}
        <div className="mb-4">
          <label htmlFor="tahap" className="block text-gray-700 font-medium mb-1">
            Pilih Tahap
          </label>
          <select
            id="tahap"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
            value={tahap}
            onChange={handleTahapChange}
            disabled={!!loading}
          >
            {TAHAP_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {/* Dropdown pesan otomatis */}
        <div className="mb-4">
          <label htmlFor="pesanOtomatis" className="block text-gray-700 font-medium mb-1">
            Pilih Pesan Otomatis
          </label>
          <div className="flex gap-2">
            <select
              id="pesanOtomatis"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
              value={selectedPesanOtomatis}
              onChange={handlePesanOtomatisChange}
              disabled={!!loading}
            >
              {pesanOtomatisList.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Buat Pesan Baru...</option>
            </select>
            <button
              type="button"
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => setShowAddPesanOtomatis((v) => !v)}
              disabled={!!loading}
              title="Tambah Pesan Otomatis Baru"
            >
              +
            </button>
          </div>
          {showAddPesanOtomatis && (
            <form
              className="mt-2 p-2 border border-gray-200 rounded bg-gray-50"
              onSubmit={handleAddPesanOtomatis}
            >
              <div className="mb-2">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-black"
                  placeholder="Nama Pesan (misal: Undangan Interview)"
                  value={newPesanLabel}
                  onChange={(e) => setNewPesanLabel(e.target.value)}
                  disabled={!!loading}
                  required
                />
              </div>
              <div className="mb-2">
                <textarea
                  className="w-full border border-gray-300 rounded px-2 py-1 text-black"
                  placeholder="Isi Pesan Otomatis"
                  value={newPesanText}
                  onChange={(e) => setNewPesanText(e.target.value)}
                  rows={2}
                  disabled={!!loading}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                  disabled={!!loading}
                >
                  Simpan
                </button>
                <button
                  type="button"
                  className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition"
                  onClick={() => {
                    setShowAddPesanOtomatis(false);
                    setNewPesanLabel("");
                    setNewPesanText("");
                  }}
                  disabled={!!loading}
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
        {/* Field untuk pesan */}
        <div className="mb-4">
          <label htmlFor="pesan" className="block text-gray-700 font-medium mb-1">
            Pesan (otomatis diterima/ditolak, bisa diedit)
          </label>
          <textarea
            id="pesan"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
            rows={3}
            placeholder="Tulis pesan untuk pelamar (misal: alasan diterima/ditolak, instruksi selanjutnya, dsb)"
            value={pesan}
            onChange={handlePesanChange}
            disabled={!!loading}
          />
          <div className="text-xs text-gray-500 mt-1">
            Pilih pesan otomatis di atas, atau edit manual di sini.
          </div>
        </div>
        {/* Channel checkbox */}
        <div className="mb-4">
          <div className="block text-gray-700 font-medium mb-1">
            Kirim pesan melalui:
          </div>
          <div className="flex gap-4">
            {CHANNELS.map((ch) => (
              <label key={ch.value} className="inline-flex items-center">
                <input
                  type="checkbox"
                  value={ch.value}
                  checked={selectedChannels.includes(ch.value)}
                  onChange={handleChannelChange}
                  disabled={!!loading}
                  className="mr-1"
                />
                {/* Tambahkan text-black ke label channel */}
                <span className="text-black">{ch.label}</span>
              </label>
            ))}
          </div>
        </div>
        {error && (
          <div className="mb-2 text-red-600 font-semibold">{error}</div>
        )}
        {success && (
          <div className="mb-2 text-green-600 font-semibold">{success}</div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition disabled:opacity-60"
            onClick={() => {
              // Set pesan otomatis ditolak jika belum manual
              if (!pesanManual) {
                const found = pesanOtomatisList.find((p) => p.value === "ditolak");
                setPesan(found ? found.text : "");
                setSelectedPesanOtomatis("ditolak");
              }
              handleAksi("tolak");
            }}
            disabled={!!loading}
            type="button"
          >
            {loading === true ? "Menolak..." : "Tolak"}
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-60"
            onClick={() => {
              // Set pesan otomatis diterima jika belum manual
              if (!pesanManual) {
                const found = pesanOtomatisList.find((p) => p.value === "diterima");
                setPesan(found ? found.text : "");
                setSelectedPesanOtomatis("diterima");
              }
              handleAksi("kirim");
            }}
            disabled={!!loading}
            type="button"
          >
            {loading === true ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
}
