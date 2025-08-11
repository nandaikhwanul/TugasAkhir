import express from "express";
import { 
  uploadFotoPerusahaanHandler, 
  getFotoPerusahaanByPerusahaanId,
  deleteFotoPerusahaan
} from "../controllers/fotoPerusahaan.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Endpoint untuk upload foto perusahaan (array)
router.post("/upload", verifyUser, uploadFotoPerusahaanHandler);

// Endpoint GET untuk mengambil foto perusahaan berdasarkan ID perusahaan
router.get("/perusahaan/:perusahaanId", verifyUser, getFotoPerusahaanByPerusahaanId);

// Endpoint DELETE untuk menghapus foto perusahaan tertentu
router.delete("/delete", verifyUser, deleteFotoPerusahaan);

export default router;
