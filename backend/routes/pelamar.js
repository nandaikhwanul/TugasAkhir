import express from 'express';
import { 
  lamarLowongan, 
  getPelamarByLowongan, 
  getPelamarDiterimaDitolak, 
  countPelamarByLowongan,
  getJumlahPelamarDiterimaDitolak,
  getPelamarPerBulanPerTahun,
  getStatistikLamaranAlumni // tambahkan import controller baru
} from '../controllers/Pelamar.js';
import { authAlumni, authPerusahaan } from '../middleware/AuthPelamar.js';

// Import rekomendasiLowongan controller
import { rekomendasiLowongan } from '../controllers/rekomendasiLowongan.js';

const router = express.Router();

// Route untuk alumni melamar lowongan
// POST /pelamar
router.post('/pelamar', authAlumni, lamarLowongan);

// Route untuk perusahaan melihat daftar pelamar pada lowongan tertentu
// GET /lowongan/:id/pelamar
router.get('/lowongan/:id/pelamar', authPerusahaan, getPelamarByLowongan);

// Route untuk perusahaan melihat daftar pelamar yang statusnya diterima/ditolak
// GET /pelamar/diterima-ditolak
router.get('/pelamar/diterima-ditolak', authPerusahaan, getPelamarDiterimaDitolak);

// Route untuk perusahaan menghitung jumlah pelamar di semua lowongan miliknya
// GET /lowongan/pelamar/count
router.get('/lowongan/pelamar/count', authPerusahaan, countPelamarByLowongan);

// Route baru: jumlah pelamar diterima/ditolak (khusus perusahaan)
// GET /pelamar/count/diterima-ditolak
router.get('/pelamar/count/diterima-ditolak', authPerusahaan, getJumlahPelamarDiterimaDitolak);

// Route baru: jumlah pelamar per bulan per tahun (khusus perusahaan)
// GET /pelamar/grafik/per-bulan-tahun
router.get('/pelamar/grafik/per-bulan-tahun', authPerusahaan, getPelamarPerBulanPerTahun);

// Route baru: statistik lamaran alumni (khusus alumni yang sedang login)
// GET /pelamar/statistik/alumni
router.get('/pelamar/statistik/alumni', authAlumni, getStatistikLamaranAlumni);

// Route rekomendasi lowongan untuk alumni
// POST /pelamar/rekomendasi-lowongan
router.post('/pelamar/rekomendasi-lowongan', authAlumni, rekomendasiLowongan);

export default router;
