import express from 'express';
import {
  kirimNotifikasiHasilLamaran,
  kirimPesanKeAlumni,
  getPesanUntukAlumni,
  getUnreadPesanCount,
  updateSudahDibaca,
  logoutWhatsAppBot,
  getWhatsAppQr,
  initWhatsAppClient,
  deletePesan // tambahkan import deletePesan
} from '../controllers/Pesan.js';
import { verifyUser } from '../middleware/AuthUser.js';
import { sendMessage } from '../controllers/Whatsapp.js';

const router = express.Router();

// Perusahaan mengirim notifikasi hasil lamaran ke alumni pelamar
router.post('/notifikasi-hasil-lamaran', verifyUser, kirimNotifikasiHasilLamaran);

// Perusahaan mengirim pesan custom ke alumni
router.post('/kirim-ke-alumni', verifyUser, kirimPesanKeAlumni);

// Alumni melihat daftar pesan miliknya sendiri
router.get('/alumni/me', verifyUser, getPesanUntukAlumni);

// ROUTE BARU: Kirim pesan WhatsApp langsung
router.post('/kirim-whatsapp', verifyUser, sendMessage);

// ROUTE BARU: Mendapatkan jumlah pesan belum dibaca (unread) untuk user login
router.get('/unread-count', verifyUser, getUnreadPesanCount);

// ROUTE BARU: Update status sudah_dibaca pada pesan tertentu (hanya penerima yang bisa)
router.patch('/:id/sudah-dibaca', verifyUser, updateSudahDibaca);

// ROUTE BARU: Mendapatkan QR code WhatsApp Web (untuk login bot WA)
router.get('/whatsapp-qr', getWhatsAppQr);

// ROUTE BARU: Logout WhatsApp bot
router.post('/whatsapp-logout', logoutWhatsAppBot);

// ROUTE BARU: Inisialisasi WhatsApp client dan trigger QR code
router.post('/whatsapp-init', initWhatsAppClient);

// Tambahan routes sesuai permintaan
router.get('/whatsapp-status', (req, res) => {
  // Cek status WhatsApp client (ready atau tidak)
  // Import fungsi isWhatsAppClientReady dari controller jika perlu
  // Untuk contoh, asumsikan fungsi diekspor dari controller
  import('../controllers/Pesan.js').then(({ isWhatsAppClientReady }) => {
    const ready = isWhatsAppClientReady && isWhatsAppClientReady();
    res.status(200).json({ ready: !!ready });
  }).catch(err => {
    res.status(500).json({ message: 'Gagal cek status WhatsApp client', error: err.message });
  });
});

// ROUTE BARU: Hapus pesan (hanya penerima atau pengirim yang boleh menghapus)
router.delete('/:id', verifyUser, deletePesan);

export default router;