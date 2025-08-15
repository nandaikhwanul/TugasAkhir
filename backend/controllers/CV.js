import CV from "../models/CV.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import Alumni from "../models/Alumni.js";

// Konfigurasi multer untuk upload file gambar saja (jpg, jpeg, png, webp, bmp, gif)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/cv/"); // tetap simpan di folder uploads/cv/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/bmp",
  "image/gif"
];

const fileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (jpg, jpeg, png, webp, bmp, gif) yang diperbolehkan."), false);
  }
};

export const uploadCVMulter = multer({ storage, fileFilter });

// Controller untuk upload CV (gambar) oleh alumni
export const uploadCV = async (req, res) => {
  try {
    // Pastikan file ada
    if (!req.file) {
      return res.status(400).json({ message: "File tidak ditemukan." });
    }

    // Pastikan user alumni (asumsi req.user.id adalah id alumni)
    const alumniId = req.user && req.user.id;
    if (!alumniId) {
      return res.status(401).json({ message: "Unauthorized. Alumni tidak ditemukan." });
    }

    // Simpan data CV ke database
    const newCV = new CV({
      alumni: alumniId,
      fileUrl: req.file.path, // path lokal file
      fileName: req.file.originalname,
    });

    await newCV.save();

    res.status(201).json({
      message: "CV (gambar) berhasil diupload.",
      cv: newCV,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengupload CV.", error: error.message });
  }
};

// Controller untuk GET CV milik alumni yang sedang login
export const getCV = async (req, res) => {
  try {
    // Jika alumni, ambil CV milik sendiri
    if (req.user && req.user.role === "alumni") {
      const alumniId = req.user.id;
      if (!alumniId) {
        return res.status(401).json({ message: "Unauthorized. Alumni tidak ditemukan." });
      }

      // Ambil CV terbaru milik alumni (jika ada lebih dari satu, ambil yang terbaru)
      const cv = await CV.findOne({ alumni: alumniId }).sort({ uploadedAt: -1 });

      if (!cv) {
        return res.status(404).json({ message: "CV tidak ditemukan." });
      }

      return res.status(200).json({
        message: "CV ditemukan.",
        cv,
      });
    }

    // Jika perusahaan, ambil CV milik alumni tertentu (alumniId dari query)
    if (req.user && req.user.role === "perusahaan") {
      const alumniId = req.query.alumniId;
      if (!alumniId) {
        return res.status(400).json({ message: "alumniId harus disertakan di query parameter." });
      }

      // Ambil CV terbaru milik alumni yang diminta
      const cv = await CV.findOne({ alumni: alumniId }).sort({ uploadedAt: -1 });

      if (!cv) {
        return res.status(404).json({ message: "CV tidak ditemukan untuk alumni tersebut." });
      }

      return res.status(200).json({
        message: "CV alumni ditemukan.",
        cv,
      });
    }

    // Jika bukan alumni atau perusahaan
    return res.status(403).json({ message: "Forbidden. Role tidak diizinkan." });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil CV.", error: error.message });
  }
};

// Controller untuk hapus CV dari collection
export const deleteCV = async (req, res) => {
  try {
    const alumniId = req.user && req.user.id;
    if (!alumniId) {
      return res.status(401).json({ message: "Unauthorized. Alumni tidak ditemukan." });
    }

    // Ambil CV terbaru milik alumni (jika ada lebih dari satu, ambil yang terbaru)
    const cv = await CV.findOne({ alumni: alumniId }).sort({ uploadedAt: -1 });

    if (!cv) {
      return res.status(404).json({ message: "CV tidak ditemukan." });
    }

    // Hapus file dari sistem file jika ada
    if (cv.fileUrl && fs.existsSync(cv.fileUrl)) {
      try {
        fs.unlinkSync(cv.fileUrl);
      } catch (err) {
        // Log error, tapi lanjutkan hapus dari database
        console.error("Gagal menghapus file fisik CV:", err.message);
      }
    }

    // Hapus dari collection
    await CV.deleteOne({ _id: cv._id });

    res.status(200).json({
      message: "CV berhasil dihapus.",
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus CV.", error: error.message });
  }
};

export const getCVByAlumniId = async (req, res) => {
  try {
    const { alumniId } = req.params;

    // Cek apakah alumni dengan id tersebut ada
    const alumni = await Alumni.findById(alumniId);
    if (!alumni) {
      return res.status(404).json({ message: "Alumni tidak ditemukan." });
    }

    // Ambil CV terbaru milik alumni
    const cv = await CV.findOne({ alumni: alumniId }).sort({ uploadedAt: -1 });

    if (!cv) {
      return res.status(404).json({ message: "CV tidak ditemukan untuk alumni ini." });
    }

    return res.status(200).json({
      message: "CV alumni ditemukan.",
      cv,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil CV.", error: error.message });
  }
};
