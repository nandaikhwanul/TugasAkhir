import express from "express";
import {
    getPerusahaanById,
    registerPerusahaan,
    checkOldPassword,
    updatePerusahaan,
    getAllAlumniForPerusahaan // tambahkan import endpoint baru
} from "../controllers/Perusahaan.js";
import { verifyUser, perusahaanOnly } from "../middleware/AuthUser.js";

// Tambahan: import controller detailPelamar
import { detailPelamar } from "../controllers/Pelamar.js";

// Import controller untuk detail alumni (untuk perusahaan melihat detail alumni)
import { getAlumniDetailForPerusahaan, searchAlumni } from "../controllers/Alumni.js";

const router = express.Router();

// Route untuk mendapatkan perusahaan berdasarkan uuid (hanya admin/perusahaan yang login)
router.get('/perusahaan/me', verifyUser, getPerusahaanById);

// Route untuk register perusahaan (umum, tidak perlu login)
router.post('/perusahaan', registerPerusahaan);

// Route untuk update perusahaan (PATCH, dengan upload logo, hanya perusahaan/admin)
router.patch('/perusahaan/:id', verifyUser, updatePerusahaan);

// Route untuk cek password lama perusahaan (menggunakan /me sesuai best practice)
router.post('/perusahaan/me/checkoldpassword', verifyUser, perusahaanOnly, checkOldPassword);

// Route untuk melihat detail pelamar tertentu (khusus perusahaan pemilik lowongan)
router.get('/perusahaan/pelamar/:pelamarId', verifyUser, perusahaanOnly, detailPelamar);

// Route untuk perusahaan melihat detail alumni tertentu (termasuk foto_profil)
router.get('/perusahaan/alumni/:id', verifyUser, perusahaanOnly, getAlumniDetailForPerusahaan);

// Route untuk perusahaan mencari alumni (akses: perusahaan, admin, alumni)
router.get('/perusahaan/alumni', verifyUser, searchAlumni);

// Route baru: Mendapatkan semua alumni yang pernah melamar ke lowongan perusahaan ini (khusus perusahaan)
router.get('/perusahaan/alumni-pelamar', verifyUser, perusahaanOnly, getAllAlumniForPerusahaan);

export default router;
