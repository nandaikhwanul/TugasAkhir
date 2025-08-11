import express from "express";
import {
    createLowongan,
    updateLowongan,
    deleteLowongan,
    updateStatusLowongan,
    verifikasiLowongan,
    getAllLowongan,
    previewLowonganForAlumni,
    getPendingLowonganForAdmin,
    getLowonganByPerusahaan,
    getLowonganPerusahaanById,
    terimaPelamar,
    tolakPelamar,
    searchLowongan,
    countActiveLowonganByPerusahaanSinceLastWeek,
    getLowonganTraffic,
    incrementLowonganTraffic,
    countPendingLowonganByPerusahaan // <-- tambahkan import controller
} from "../controllers/Lowongan.js";
import {
    authAdminVerifikasiLowongan,
    authAlumniLowongan,
    authPerusahaanLowongan,
    authPerusahaanUpdateStatusLowongan
} from "../middleware/AuthLowongan.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Semua lowongan (khusus alumni, untuk rekomendasi)
router.get("/", authAlumniLowongan, getAllLowongan);

// Search lowongan (khusus alumni, query: q)
router.get("/search", authAlumniLowongan, searchLowongan);

// Create lowongan (hanya perusahaan)
router.post("/", authPerusahaanLowongan, createLowongan);

// Update lowongan (hanya perusahaan)
router.put("/:id", authPerusahaanLowongan, updateLowongan);

// Delete lowongan (hanya perusahaan)
router.delete("/:id", authPerusahaanLowongan, deleteLowongan);

// Update status lowongan (hanya perusahaan)
router.patch("/:id/status", verifyUser, authPerusahaanUpdateStatusLowongan, updateStatusLowongan);

// Verifikasi lowongan (hanya admin)
router.patch("/:id/verifikasi", authAdminVerifikasiLowongan, verifikasiLowongan);

// Preview lowongan untuk alumni (hanya info penting, status open)
router.get("/preview/alumni/:id", authAlumniLowongan, previewLowonganForAlumni);

// Daftar lowongan pending_verification (hanya admin)
router.get("/pending/admin", authAdminVerifikasiLowongan, getPendingLowonganForAdmin);

// Daftar lowongan milik perusahaan (hanya perusahaan)
router.get("/me", authPerusahaanLowongan, getLowonganByPerusahaan);

// Detail satu lowongan milik perusahaan (hanya perusahaan)
router.get("/me/:id", authPerusahaanLowongan, getLowonganPerusahaanById);

// Perusahaan menerima pelamar pada lowongan tertentu
router.patch("/pelamar/:pelamarId/terima", authPerusahaanLowongan, terimaPelamar);

// Perusahaan menolak pelamar pada lowongan tertentu
router.patch("/pelamar/:pelamarId/tolak", authPerusahaanLowongan, tolakPelamar);

// Tambahkan route untuk menghitung jumlah lowongan aktif milik perusahaan (hanya perusahaan)
router.get("/me/count/active", authPerusahaanLowongan, countActiveLowonganByPerusahaanSinceLastWeek);

// Tambahkan route untuk menghitung jumlah lowongan pending milik perusahaan (hanya perusahaan)
router.get("/me/count/pending", authPerusahaanLowongan, countPendingLowonganByPerusahaan);

// Endpoint: GET /lowongan/:id/traffic (hanya perusahaan pemilik lowongan)
router.get("/:id/traffic", authPerusahaanLowongan, getLowonganTraffic);

// Endpoint: POST /lowongan/:id/traffic (hanya perusahaan pemilik lowongan)
router.post("/:id/traffic", verifyUser, incrementLowonganTraffic);

export default router;
