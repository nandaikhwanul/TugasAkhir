import express from "express";
import {
    getAlumniById,
    registerAlumni,
    updateAlumni,
    registerAlumniValidation,
    updateFotoProfil,
    updateFotoSampul,
    checkOldPassword,
    toggleSaveLowongan,
    getSavedLowongan,
    unsaveLowongan,
    validateUpdateAlumni // tambahkan import unsaveLowongan
} from "../controllers/Alumni.js";
import { verifyUser, alumniOnly } from "../middleware/AuthUser.js";

const router = express.Router();

// Route untuk mendapatkan data alumni dari token (alumni) atau berdasarkan id (admin)
router.get('/alumni/me', verifyUser, getAlumniById);

// Route untuk register alumni (umum, tidak perlu login) pakai validation
router.post('/alumni', registerAlumniValidation, registerAlumni);

// Route untuk update alumni
// Admin bisa update alumni manapun dengan mengirimkan id di body/query, alumni hanya bisa update dirinya sendiri
router.patch('/alumni/me', verifyUser, updateAlumni);

// Endpoint khusus update profil alumni (PATCH /alumni/me/profil)
// Admin bisa update alumni manapun dengan id di body/query, alumni hanya bisa update dirinya sendiri
router.patch('/alumni/me/profil', validateUpdateAlumni, verifyUser, updateAlumni);

// Endpoint khusus update foto profil alumni (PATCH /alumni/me/foto-profil)
// Admin bisa update alumni manapun dengan id di body/query, alumni hanya bisa update dirinya sendiri
router.patch('/alumni/me/foto-profil', verifyUser, updateFotoProfil);

// Endpoint khusus update foto sampul alumni (PATCH /alumni/me/foto-sampul)
// Admin bisa update alumni manapun dengan id di body/query, alumni hanya bisa update dirinya sendiri
router.patch('/alumni/me/foto-sampul', verifyUser, updateFotoSampul);

// Endpoint untuk cek password lama alumni (hanya alumni, bukan admin)
router.post('/alumni/me/check-old-password', verifyUser, alumniOnly, checkOldPassword);

// Tambahkan route untuk save/unsave lowongan oleh alumni
router.post('/alumni/me/toggle-save-lowongan', verifyUser, alumniOnly, toggleSaveLowongan);

// Tambahkan route untuk mendapatkan semua lowongan yang sudah di-save oleh alumni
router.get('/alumni/me/saved-lowongan', verifyUser, alumniOnly, getSavedLowongan);

// Tambahkan route untuk unsave lowongan secara eksplisit
router.post('/alumni/me/unsave-lowongan', verifyUser, alumniOnly, unsaveLowongan);

export default router;