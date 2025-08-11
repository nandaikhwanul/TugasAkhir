import express from "express";
import { 
    getAllAlumni, 
    getAllPerusahaan, 
    registerAdmin, 
    getAdminMe, 
    deleteAlumni,
    deletePerusahaan
} from "../controllers/Admin.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";
import { updateAlumni, validateUpdateAlumni } from "../controllers/Alumni.js";
import { updatePerusahaan } from "../controllers/Perusahaan.js";

// Tambahan: import controller previewLowonganForAdmin
import { previewLowonganForAdmin } from "../controllers/Lowongan.js";

const router = express.Router();

// Route untuk mendapatkan semua data alumni (hanya admin, dengan authorization)
router.get('/alumni', verifyUser, adminOnly, getAllAlumni);

// Route untuk mendapatkan data admin berdasarkan token (/me)
router.get('/me', verifyUser, adminOnly, getAdminMe);

// Route untuk mendapatkan semua data perusahaan (hanya admin, dengan authorization)
router.get('/perusahaan', verifyUser, adminOnly, getAllPerusahaan);

// Route untuk register admin (opsional, biasanya tidak perlu auth, tapi bisa ditambah jika perlu)
router.post('/register', registerAdmin);

// Route untuk update data alumni oleh admin
router.patch('/alumni/:id', verifyUser, adminOnly, validateUpdateAlumni, (req, res, next) => {
    req.body.id = req.params.id;
    updateAlumni(req, res, next);
});

// Route untuk menghapus alumni oleh admin
router.delete('/alumni/:id', verifyUser, adminOnly, deleteAlumni);

// Route untuk update data perusahaan oleh admin
router.patch('/perusahaan/:id', verifyUser, adminOnly, updatePerusahaan);

// Route untuk menghapus perusahaan oleh admin
router.delete('/perusahaan/:id', verifyUser, adminOnly, deletePerusahaan);

// Tambahkan route preview lowongan untuk admin
// GET /admin/lowongan/preview?id=...
router.get('/lowongan/preview', verifyUser, adminOnly, previewLowonganForAdmin);

export default router;
