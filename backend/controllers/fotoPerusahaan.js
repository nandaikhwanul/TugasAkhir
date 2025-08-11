import multer from "multer";
import path from "path";
import fs from "fs";
import FotoPerusahaan from "../models/fotoPerusahaan.js";

// Konfigurasi storage untuk upload foto perusahaan (array)
const storageFotoPerusahaan = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.resolve("uploads/foto_perusahaan");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const uploadFotoPerusahaan = multer({
  storage: storageFotoPerusahaan,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
    }
  }
}).array("foto", 10); // maksimal 10 foto per upload

// Controller untuk upload foto perusahaan (array)
export const uploadFotoPerusahaanHandler = async (req, res) => {
  uploadFotoPerusahaan(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: err.message });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "Tidak ada file yang diupload" });
    }

    const perusahaanId = req.body.perusahaan || req.userId;
    if (!perusahaanId) {
      // Hapus file yang sudah terupload jika tidak ada perusahaanId
      req.files.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      return res.status(400).json({ msg: "ID perusahaan tidak ditemukan" });
    }

    try {
      const fotoPaths = req.files.map(f => f.path);

      // Simpan ke database
      const fotoPerusahaan = new FotoPerusahaan({
        perusahaan: perusahaanId,
        foto: fotoPaths
      });
      await fotoPerusahaan.save();

      res.status(201).json({
        msg: "Foto perusahaan berhasil diupload",
        data: fotoPerusahaan
      });
    } catch (error) {
      // Hapus file jika gagal simpan ke database
      req.files.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      res.status(500).json({ msg: error.message });
    }
  });
};

// Endpoint GET untuk mengambil foto perusahaan berdasarkan ID perusahaan
export const getFotoPerusahaanByPerusahaanId = async (req, res) => {
  try {
    const perusahaanId = req.params.perusahaanId || req.query.perusahaanId;
    if (!perusahaanId) {
      return res.status(400).json({ msg: "ID perusahaan tidak ditemukan" });
    }

    // Ambil hanya field foto dari semua dokumen foto perusahaan untuk perusahaan ini
    const fotoPerusahaan = await FotoPerusahaan.find(
      { perusahaan: perusahaanId },
      { foto: 1, _id: 0 }
    );

    // Gabungkan semua array foto dari dokumen yang ditemukan
    const allFoto = fotoPerusahaan && fotoPerusahaan.length > 0
      ? fotoPerusahaan.flatMap(fp => fp.foto)
      : [];

    // Jika tidak ada foto, tetap return 200 dengan data: []
    res.status(200).json({
      msg: allFoto.length > 0 ? "Foto perusahaan ditemukan" : "Tidak ada foto perusahaan",
      data: allFoto
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Controller untuk menghapus foto perusahaan tertentu
// Dapat menghapus satu file dari array foto pada dokumen FotoPerusahaan
// Diharapkan client mengirimkan path foto yang ingin dihapus (harus persis dengan yang ada di database)
export const deleteFotoPerusahaan = async (req, res) => {
  try {
    // Path foto yang ingin dihapus (harus sama dengan yang di database)
    const { fotoPath } = req.body;
    if (!fotoPath) {
      return res.status(400).json({ msg: "Path foto yang ingin dihapus harus disertakan" });
    }

    // Cari dokumen yang mengandung fotoPath
    const fotoDoc = await FotoPerusahaan.findOne({ foto: fotoPath });
    if (!fotoDoc) {
      return res.status(404).json({ msg: "Foto tidak ditemukan di database" });
    }

    // Hapus file dari sistem file
    if (fs.existsSync(fotoPath)) {
      fs.unlinkSync(fotoPath);
    }

    // Hapus path dari array foto di dokumen
    fotoDoc.foto = fotoDoc.foto.filter(f => f !== fotoPath);

    // Jika array foto kosong setelah dihapus, hapus dokumen
    if (fotoDoc.foto.length === 0) {
      await FotoPerusahaan.deleteOne({ _id: fotoDoc._id });
    } else {
      await fotoDoc.save();
    }

    res.status(200).json({ msg: "Foto perusahaan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
