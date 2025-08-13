import express from "express";
import {
    getPengalamanByAlumni,
    getPengalamanById,
    createPengalaman,
    updatePengalaman,
    deletePengalaman,
    getPengalamanByIdForPerusahaan
} from "../controllers/Pengalaman.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Mendapatkan semua pengalaman milik alumni tertentu
router.get("/alumni/:alumniId", verifyUser, getPengalamanByAlumni);

// Mendapatkan semua pengalaman milik alumni yang sedang login
router.get("/me", verifyUser, getPengalamanByAlumni);

// Mendapatkan detail satu pengalaman berdasarkan ID
router.get("/:id", verifyUser, getPengalamanById);

// Endpoint untuk perusahaan mendapatkan pengalaman (tanpa auth user)
router.get("/perusahaan/:id", getPengalamanByIdForPerusahaan);

// Membuat pengalaman baru
router.post("/", verifyUser, createPengalaman);

// Mengupdate pengalaman berdasarkan ID
router.put("/:id", verifyUser, updatePengalaman);

// Menghapus pengalaman berdasarkan ID
router.delete("/:id", verifyUser, deletePengalaman);

export default router;