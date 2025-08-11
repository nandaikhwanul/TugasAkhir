import express from 'express';
import {
  kirimPesanBebas,
  getPesanBebasUser,
  tandaiPesanBebasSudahDibaca,
  getUnreadPesanBebasCount,
  hapusPesanBebas
} from '../controllers/PesanBebas.js';
import { verifyUser } from '../middleware/AuthUser.js';

const router = express.Router();

// Kirim pesan bebas (alumni, perusahaan, admin)
router.post('/', verifyUser, kirimPesanBebas);

// Ambil daftar pesan bebas user (sebagai pengirim/penerima)
router.get('/', verifyUser, getPesanBebasUser);

// Tandai pesan bebas sudah dibaca (hanya penerima yang bisa)
router.patch('/:id/dibaca', verifyUser, tandaiPesanBebasSudahDibaca);

// Hitung jumlah pesan belum dibaca (unread) untuk user login
router.get('/unread-count', verifyUser, getUnreadPesanBebasCount);

// Hapus pesan bebas (hanya penerima yang bisa menghapus)
router.delete('/:id', verifyUser, hapusPesanBebas);

export default router;
