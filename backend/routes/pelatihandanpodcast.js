import express from "express";
import {
  createPelatihanDanPodcast,
  getAllPelatihanDanPodcast,
  getPelatihanDanPodcastById,
  updatePelatihanDanPodcast,
  deletePelatihanDanPodcast,
} from "../controllers/PelatihanDanPodcast.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// CREATE pelatihan/podcast
router.post("/", verifyUser, createPelatihanDanPodcast);

// GET semua pelatihan/podcast (bisa filter)
router.get("/", getAllPelatihanDanPodcast);

// GET detail pelatihan/podcast by id
router.get("/:id", getPelatihanDanPodcastById);

// UPDATE pelatihan/podcast
router.put("/:id", verifyUser, updatePelatihanDanPodcast);

// DELETE pelatihan/podcast
router.delete("/:id", verifyUser, deletePelatihanDanPodcast);

export default router;
