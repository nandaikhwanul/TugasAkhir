"use client";
import { useEffect, useState, useRef } from "react";
import NavbarPage from "../../navbar/page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenFromSessionStorage } from "../../sessiontoken";

// Komponen QRCode sederhana (tanpa import eksternal)
function SimpleQRCode({ text, size = 256, onLoad }) {
  // Gunakan API pihak ketiga untuk generate QR (karena tidak boleh import)
  const src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    text
  )}&size=${size}x${size}`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      style={{ borderRadius: 8, background: "#fff" }}
      onLoad={onLoad}
    />
  );
}

export default function BotPesanQRCodePage() {
  const [qrString, setQrString] = useState("");
  const [loading, setLoading] = useState(false); // default: tidak loading
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [qrImgLoading, setQrImgLoading] = useState(false);
  // Hapus logoutMessage, gunakan toast
  const intervalRef = useRef(null);

  // Mendapatkan QR code dari endpoint GET
  async function fetchQR({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
    setQrImgLoading(true);
    setError("");
    try {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setError("Token tidak ditemukan.");
        setQrString("");
        setQrImgLoading(false);
        if (showLoading) setLoading(false);
        return;
      }
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pesan/whatsapp-qr", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("whatsapp bot sudah ready. testing dengan mengirim pesan. jika tidak bisa, maka logout dan generate ulang code qr nya.");
      const data = await res.json();
      if (data && data.qr) {
        setQrString(data.qr);
      } else if (typeof data === "string") {
        setQrString(data);
      } else {
        setError("QR code tidak ditemukan di response");
        setQrString("");
      }
    } catch (err) {
      // Ganti pesan error jika error.message sesuai instruksi
      let msg = err.message || "Terjadi kesalahan";
      if (
        msg === "Gagal mengambil QR code" ||
        msg === "whatsapp bot sudah ready. testing dengan mengirim pesan. jika tidak bisa, maka logout dan generate ulang code qr nya."
      ) {
        msg =
          "whatsapp bot sudah ready. testing dengan mengirim pesan. jika tidak bisa, maka logout dan generate ulang code qr nya.";
      }
      setError(msg);
      setQrString("");
      setQrImgLoading(false);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // POST ke /pesan/whatsapp-init untuk generate QR baru
  async function handleBuatQR() {
    setActionLoading(true);
    setError("");
    setQrString(""); // Kosongkan QR sebelum fetch baru
    setLoading(true);
    setQrImgLoading(true);
    try {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setError("Token tidak ditemukan.");
        setLoading(false);
        setQrImgLoading(false);
        setActionLoading(false);
        return;
      }
      // Gunakan endpoint POST https://tugasakhir-production-6c6c.up.railway.app/pesan/whatsapp-init
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pesan/whatsapp-init", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Gagal menginisialisasi WhatsApp Client dan trigger QR code");
      // Tunggu sebentar sebelum fetch QR baru
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mulai polling sampai dapat QR code (atau error)
      let success = false;
      let pollingError = null;
      let pollingCount = 0;
      const maxPolling = 15; // polling max 15x (sekitar 15 detik)
      while (!success && pollingCount < maxPolling) {
        try {
          const qrRes = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pesan/whatsapp-qr", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!qrRes.ok) {
            // Jika error, cek apakah errornya "bot sudah ready"
            const errText = await qrRes.text();
            if (
              errText.includes("whatsapp bot sudah ready") ||
              errText.includes("testing dengan mengirim pesan")
            ) {
              throw new Error(
                "whatsapp bot sudah ready. testing dengan mengirim pesan. jika tidak bisa, maka logout dan generate ulang code qr nya."
              );
            }
            throw new Error("Gagal mengambil QR code");
          }
          const data = await qrRes.json();
          if (data && data.qr) {
            setQrString(data.qr);
            success = true;
            break;
          } else if (typeof data === "string" && data.length > 0) {
            setQrString(data);
            success = true;
            break;
          }
        } catch (err) {
          pollingError = err;
        }
        pollingCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!success) {
        // Jika polling gagal, tampilkan error
        setError(
          pollingError?.message ||
            "Gagal mendapatkan QR code setelah inisialisasi."
        );
        setQrString("");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat membuat QR");
      setQrString("");
    } finally {
      setLoading(false);
      setQrImgLoading(false);
      setActionLoading(false);
    }
  }

  // POST ke /pesan/whatsapp-logout untuk logout bot
  async function handleLogoutQR() {
    setActionLoading(true);
    setError("");
    try {
      const token = getTokenFromSessionStorage();
      if (!token) {
        setError("Token tidak ditemukan.");
        setLoading(false);
        setQrImgLoading(false);
        setActionLoading(false);
        return;
      }
      const res = await fetch("https://tugasakhir-production-6c6c.up.railway.app/pesan/whatsapp-logout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Gagal logout WhatsApp Bot");
      // Ambil pesan sukses dari response
      let msg = "";
      try {
        const data = await res.json();
        if (data && data.message) {
          msg = data.message;
        }
      } catch (e) {
        // fallback jika response bukan json
        msg = "Berhasil logout dari WhatsApp.";
      }
      toast.success(msg || "Berhasil logout dari WhatsApp.");
      setQrString("");
      setLoading(false);
      setQrImgLoading(false);
      // Setelah logout, fetch QR baru (biasanya QR akan muncul lagi untuk login)
      await fetchQR();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat logout QR");
      setLoading(false);
      setQrImgLoading(false);
    } finally {
      setActionLoading(false);
    }
  }

  // Fetch QR code langsung saat komponen mount
  useEffect(() => {
    setQrString("");
    setLoading(false);
    setQrImgLoading(false);

    // Fetch QR code di awal
    fetchQR();

    // Set interval untuk update QR code setiap 7 detik JIKA sudah ada qrString
    intervalRef.current = null;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set interval hanya jika sudah ada qrString
  useEffect(() => {
    if (qrString) {
      intervalRef.current = setInterval(() => {
        fetchQR({ showLoading: false });
      }, 7000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrString]);

  // Cek apakah error adalah pesan "bot sudah ready"
  const isBotReadyError =
    error ===
    "whatsapp bot sudah ready. testing dengan mengirim pesan. jika tidak bisa, maka logout dan generate ulang code qr nya.";

  return (
    <>
      <ToastContainer />
      <NavbarPage />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12">
        <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">Login Bot WhatsApp</h1>
          <p className="mb-6 text-gray-600 text-center">
            {qrString
              ? "Scan QR code di bawah ini menggunakan WhatsApp di ponsel Anda untuk login bot WhatsApp."
              : "Memuat QR code untuk login bot WhatsApp..."}
          </p>
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : qrString ? (
            <div className="flex flex-col items-center">
              {qrImgLoading && (
                <div className="text-gray-500 mb-2">Memuat QR code...</div>
              )}
              <div style={{ minHeight: 256, minWidth: 256, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SimpleQRCode
                  text={qrString}
                  size={256}
                  onLoad={() => {
                    setLoading(false);
                    setQrImgLoading(false);
                  }}
                />
              </div>
            </div>
          ) : loading || qrImgLoading ? (
            <div className="text-gray-500">Memuat QR code...</div>
          ) : (
            <div className="text-gray-500">QR code belum tersedia.</div>
          )}

          {/* Tombol Logout QR dan Buat QR jika error bot ready, 
              jika tidak, ikuti logika lama */}
          <div className="flex gap-4 mt-8">
            {isBotReadyError ? (
              <>
                <button
                  onClick={handleBuatQR}
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60`}
                  type="button"
                >
                  {actionLoading ? "Memproses..." : "Buat QR"}
                </button>
                <button
                  onClick={handleLogoutQR}
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition disabled:opacity-60`}
                  type="button"
                >
                  {actionLoading ? "Memproses..." : "Logout QR"}
                </button>
              </>
            ) : (
              <>
                {!qrString && (
                  <button
                    onClick={handleBuatQR}
                    disabled={actionLoading}
                    className={`px-6 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60`}
                    type="button"
                  >
                    {actionLoading ? "Memproses..." : "Buat QR"}
                  </button>
                )}
                <button
                  onClick={handleLogoutQR}
                  disabled={actionLoading || !qrString}
                  className={`px-6 py-2 rounded bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition disabled:opacity-60`}
                  type="button"
                >
                  {actionLoading ? "Memproses..." : "Logout QR"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
