import express from "express";
import { uploadCV, uploadCVMulter, getCV, deleteCV } from "../controllers/CV.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Upload CV (PDF) oleh alumni
router.post("/upload", verifyUser, uploadCVMulter.single("cv"), uploadCV);

// Ambil CV milik alumni yang sedang login
router.get("/", verifyUser, getCV);

// Hapus CV milik alumni yang sedang login
router.delete("/", verifyUser, deleteCV);

export default router;
