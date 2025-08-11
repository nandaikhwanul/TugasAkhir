import Content from "../models/content.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Konfigurasi multer untuk upload foto dan video
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Simpan foto di folder uploads/foto, video di uploads/video
    if (file.fieldname === "foto") {
      cb(null, "uploads/foto");
    } else if (file.fieldname === "video") {
      cb(null, "uploads/video");
    } else {
      cb(null, "uploads/other");
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max untuk video
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "foto") {
      // Hanya izinkan file gambar untuk foto
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/webp"
      ) {
        cb(null, true);
      } else {
        cb(new Error("File foto harus berupa gambar (jpg, jpeg, png, webp)"));
      }
    } else if (file.fieldname === "video") {
      // Hanya izinkan file video untuk video
      if (
        file.mimetype === "video/mp4" ||
        file.mimetype === "video/quicktime" ||
        file.mimetype === "video/x-matroska" ||
        file.mimetype === "video/webm"
      ) {
        cb(null, true);
      } else {
        cb(new Error("File video harus berupa video (mp4, mov, mkv, webm)"));
      }
    } else {
      cb(null, false);
    }
  },
});

// Middleware untuk upload multiple foto dan multiple video
export const uploadContentMedia = upload.fields([
  { name: "foto", maxCount: 10 },
  { name: "video", maxCount: 10 },
]);

// Create content (Perusahaan/Alumni upload content) tanpa judul
export const createContent = async (req, res) => {
  try {
    // Ambil data dari body (hanya isi)
    const { isi } = req.body;
    // Ambil id perusahaan/alumni dari token (req.userId diasumsikan sudah diisi oleh middleware auth)
    // dan role dari req.role
    const userId = req.userId;
    const userRole = req.role;

    if (!userId || !userRole) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    // Ambil file foto dan video dari req.files (jika ada)
    let fotoUrls = [];
    let videoUrls = [];

    // FOTO
    if (req.files && req.files.foto && req.files.foto.length > 0) {
      fotoUrls = req.files.foto.map((file) => {
        // Path publik, sesuaikan jika pakai static folder
        return `/uploads/foto/${file.filename}`;
      });
    } else if (req.body.foto) {
      // Jika upload via url (bukan file), tetap support
      if (Array.isArray(req.body.foto)) {
        fotoUrls = req.body.foto;
      } else if (typeof req.body.foto === "string" && req.body.foto.trim() !== "") {
        fotoUrls = [req.body.foto];
      }
    }

    // VIDEO
    if (req.files && req.files.video && req.files.video.length > 0) {
      videoUrls = req.files.video.map((file) => {
        return `/uploads/video/${file.filename}`;
      });
    } else if (req.body.video) {
      // Jika upload via url (bukan file), tetap support
      if (Array.isArray(req.body.video)) {
        videoUrls = req.body.video;
      } else if (typeof req.body.video === "string" && req.body.video.trim() !== "") {
        videoUrls = [req.body.video];
      }
    }

    // Siapkan data content, bisa dari perusahaan atau alumni
    let contentData = {
      isi,
      foto: fotoUrls,
      video: videoUrls,
    };

    if (userRole === "perusahaan") {
      contentData.perusahaan = userId;
    } else if (userRole === "alumni") {
      contentData.alumni = userId;
    } else {
      return res.status(403).json({ msg: "Role tidak diizinkan untuk upload konten" });
    }

    const newContent = new Content(contentData);

    await newContent.save();

    res.status(201).json({
      msg: "Content berhasil diupload",
      content: newContent,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Fungsi baru: Menampilkan semua artikel beserta foto, video, dan pembuatnya (perusahaan/alumni)
export const getAllContent = async (req, res) => {
  try {
    // Ambil semua konten, populate field perusahaan dan alumni (pengirim)
    const contents = await Content.find({})
      .populate({
        path: "perusahaan",
        select: "nama_perusahaan email_perusahaan logo_perusahaan", // sesuaikan field yang ingin ditampilkan
      })
      .populate({
        path: "alumni",
        select: "name nim email foto_profil", // sesuaikan field yang ingin ditampilkan
      })
      .sort({ createdAt: -1 }); // urutkan terbaru dulu

    res.status(200).json({
      msg: "Daftar semua konten",
      data: contents,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};