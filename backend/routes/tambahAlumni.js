import express from "express";
import { tambahNim, tambahNimXls } from "../controllers/tambahAlumni.js";
import multer from "multer";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();
const upload = multer();

// Route untuk tambah NIM lewat input text
router.post("/tambah-nim", verifyUser,tambahNim);

// Route untuk tambah NIM lewat file XLS/XLSX
router.post("/tambah-nim-xls", verifyUser, upload.single("file"), tambahNimXls);

export default router;
