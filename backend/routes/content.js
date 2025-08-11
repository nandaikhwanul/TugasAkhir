import express from "express";
import {
  uploadContentMedia,
  createContent,
  getAllContent,
} from "../controllers/Content.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Route untuk upload content (perusahaan upload content)
// Gunakan middleware uploadContentMedia untuk handle upload foto/video
router.post("/", verifyUser, uploadContentMedia, createContent);

// Route untuk mendapatkan semua konten beserta foto, video, dan pembuatnya (perusahaan)
router.get("/", getAllContent);

export default router;
