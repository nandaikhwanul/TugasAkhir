import express from "express";
import {
    getPerusahaanById,
    registerPerusahaan,
    checkOldPassword,
    updatePerusahaan,
    getAllAlumniForPerusahaan,
    registerPerusahaanValidation,
    updatePerusahaanProfile
} from "../controllers/Perusahaan.js";
import { verifyUser, perusahaanOnly } from "../middleware/AuthUser.js";
import { detailPelamar } from "../controllers/Pelamar.js";
import { getAlumniDetailForPerusahaan, searchAlumni } from "../controllers/Alumni.js";

const router = express.Router();

// Helper middleware to catch async errors and send proper validation error responses
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            // If error is a validation error with fields, send 400 with field errors
            if (err && err.name === "ValidationError" && err.errors) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: err.errors
                });
            }
            // If error has a status and errors, send accordingly
            if (err && err.status === 400 && err.errors) {
                return res.status(400).json({
                    message: err.message || "Validation failed",
                    errors: err.errors
                });
            }
            // Fallback: pass to default error handler
            next(err);
        });
    };
}

// Route untuk mendapatkan perusahaan berdasarkan uuid (hanya admin/perusahaan yang login)
router.get('/perusahaan/me', verifyUser, asyncHandler(getPerusahaanById));

// Route untuk register perusahaan (umum, tidak perlu login)
router.post('/perusahaan', registerPerusahaanValidation, asyncHandler(registerPerusahaan));

// Route untuk update perusahaan (PATCH, dengan upload logo, hanya perusahaan/admin)
router.patch('/perusahaan/:id', verifyUser, asyncHandler(updatePerusahaan));

// Route untuk update data perusahaan sendiri (hanya perusahaan, PATCH /perusahaan-profile)
router.patch('/perusahaan-profile', verifyUser, perusahaanOnly, asyncHandler(updatePerusahaanProfile));

// Route untuk cek password lama perusahaan (menggunakan /me sesuai best practice)
router.post('/perusahaan/me/checkoldpassword', verifyUser, perusahaanOnly, asyncHandler(checkOldPassword));

// Route untuk melihat detail pelamar tertentu (khusus perusahaan pemilik lowongan)
router.get('/perusahaan/pelamar/:pelamarId', verifyUser, perusahaanOnly, asyncHandler(detailPelamar));

// Route untuk perusahaan melihat detail alumni tertentu (termasuk foto_profil)
router.get('/perusahaan/alumni/:id', verifyUser, perusahaanOnly, asyncHandler(getAlumniDetailForPerusahaan));

// Route untuk perusahaan mencari alumni (akses: perusahaan, admin, alumni)
router.get('/perusahaan/alumni', verifyUser, asyncHandler(searchAlumni));

// Route baru: Mendapatkan semua alumni yang pernah melamar ke lowongan perusahaan ini (khusus perusahaan)
router.get('/perusahaan/alumni-pelamar', verifyUser, perusahaanOnly, asyncHandler(getAllAlumniForPerusahaan));

export default router;
