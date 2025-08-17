import express from "express";
import { 
    getAllAlumni, 
    getAllPerusahaan, 
    registerAdmin, 
    getAdminMe, 
    deleteAlumni,
    deletePerusahaan,
    deleteAllLowongan
} from "../controllers/Admin.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";
import { updateAlumni, validateUpdateAlumni } from "../controllers/Alumni.js";
import { updatePerusahaan } from "../controllers/Perusahaan.js";
import { previewLowonganForAdmin } from "../controllers/Lowongan.js";

// Tambahan: import statistik dashboard admin
import { 
    getDashboardStats, 
    getAlumniPerTahun, 
    getAlumniPerJurusan, 
    getLowonganStatus, 
    getPerusahaanPerBidang 
} from "../controllers/DashboardAdmin.js";

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

// Tambahkan route untuk hapus semua lowongan (hanya admin)
router.delete('/lowongan', verifyUser, adminOnly, deleteAllLowongan);

// =====================
// Tambahan: Statistik Dashboard Admin
// =====================

// Card statistik utama (total alumni, perusahaan, lowongan)
router.get('/dashboard/stats', verifyUser, adminOnly, getDashboardStats);

// Grafik alumni per tahun (line chart)
router.get('/dashboard/alumni-per-tahun', verifyUser, adminOnly, getAlumniPerTahun);

// Grafik alumni per jurusan (pie chart)
router.get('/dashboard/alumni-per-jurusan', verifyUser, adminOnly, getAlumniPerJurusan);

// Grafik status lowongan (doughnut chart)
router.get('/dashboard/lowongan-status', verifyUser, adminOnly, getLowonganStatus);

// Grafik perusahaan per bidang (bar chart)
router.get('/dashboard/perusahaan-per-bidang', verifyUser, adminOnly, getPerusahaanPerBidang);

export default router;
