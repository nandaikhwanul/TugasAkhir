import Content from "../models/pelatihanDanPodcast.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Konfigurasi penyimpanan file untuk thumbnail dan video
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir;
    if (file.fieldname === "thumbnail") {
      dir = "./uploads/thumbnails";
    } else if (file.fieldname === "video") {
      dir = "./uploads/videos";
    } else {
      dir = "./uploads/others";
    }
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

// File filter untuk thumbnail dan video
function fileFilter(req, file, cb) {
  if (file.fieldname === "thumbnail") {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg and .jpeg format allowed for thumbnail!"));
    }
  } else if (file.fieldname === "video") {
    // Hanya izinkan mp4, mkv, webm
    const filetypes = /mp4|mkv|webm/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = /video\/mp4|video\/x-matroska|video\/webm/.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .mp4, .mkv, .webm format allowed for video!"));
    }
  } else {
    cb(new Error("Invalid field for upload!"));
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max untuk video
  fileFilter: fileFilter,
});

// CREATE pelatihan/podcast (support upload video file atau url)
export const createPelatihanDanPodcast = [
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { judul, deskripsi, tipe, sumber, videoPelatihanUrl, videoPodcastUrl, tags } = req.body;

      // Validasi tipe
      if (!["pelatihan", "podcast"].includes(tipe)) {
        return res.status(400).json({ msg: "Tipe harus 'pelatihan' atau 'podcast'" });
      }

      // Pilih url video/file sesuai tipe
      let contentUrl = "";
      if (tipe === "pelatihan") {
        if (req.files && req.files["video"] && req.files["video"][0]) {
          contentUrl = req.files["video"][0].path; // Simpan path file video
        } else if (videoPelatihanUrl) {
          contentUrl = videoPelatihanUrl;
        } else {
          return res.status(400).json({ msg: "videoPelatihanUrl atau file video wajib diisi" });
        }
      } else {
        if (req.files && req.files["video"] && req.files["video"][0]) {
          contentUrl = req.files["video"][0].path;
        } else if (videoPodcastUrl) {
          contentUrl = videoPodcastUrl;
        } else {
          return res.status(400).json({ msg: "videoPodcastUrl atau file video wajib diisi" });
        }
      }

      // Simpan thumbnail jika ada
      let thumbnailPath = "";
      if (req.files && req.files["thumbnail"] && req.files["thumbnail"][0]) {
        thumbnailPath = req.files["thumbnail"][0].path;
      }

      const newContent = new Content({
        title: judul,
        contentUrl: contentUrl,
        contentType: tipe === "pelatihan" ? "training_video" : "podcast",
        // Anda bisa menambah field lain seperti deskripsi, thumbnail, tags jika schema sudah diupdate
        // deskripsi, thumbnail: thumbnailPath, tags: tags?.split(",")
      });

      await newContent.save();

      res.status(201).json({
        msg: "Pelatihan/Podcast berhasil dibuat",
        data: newContent,
        // thumbnail: thumbnailPath
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
];

// GET semua pelatihan/podcast (bisa filter)
export const getAllPelatihanDanPodcast = async (req, res) => {
  try {
    // Filter by tipe (optional)
    const { tipe } = req.query;
    let filter = {};
    if (tipe) {
      filter.contentType = tipe === "pelatihan" ? "training_video" : "podcast";
    }
    const contents = await Content.find(filter);
    res.status(200).json({ data: contents });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// GET detail pelatihan/podcast by id
export const getPelatihanDanPodcastById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ msg: "Pelatihan/Podcast tidak ditemukan" });
    }
    res.status(200).json({ data: content });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// UPDATE pelatihan/podcast (admin pembuat, upload thumbnail/video baru)
export const updatePelatihanDanPodcast = [
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { judul, deskripsi, tipe, sumber, videoPelatihanUrl, videoPodcastUrl, tags } = req.body;
      const content = await Content.findById(req.params.id);
      if (!content) {
        return res.status(404).json({ msg: "Pelatihan/Podcast tidak ditemukan" });
      }

      // Update fields jika ada
      if (judul !== undefined) content.title = judul;
      if (tipe !== undefined) {
        if (!["pelatihan", "podcast"].includes(tipe)) {
          return res.status(400).json({ msg: "Tipe harus 'pelatihan' atau 'podcast'" });
        }
        content.contentType = tipe === "pelatihan" ? "training_video" : "podcast";
      }

      // Update video jika ada file baru atau url baru
      if (tipe === "pelatihan") {
        if (req.files && req.files["video"] && req.files["video"][0]) {
          // Hapus file lama jika sebelumnya file lokal
          if (content.contentUrl && !content.contentUrl.startsWith("http")) {
            try { fs.unlinkSync(content.contentUrl); } catch {}
          }
          content.contentUrl = req.files["video"][0].path;
        } else if (videoPelatihanUrl) {
          // Hapus file lama jika sebelumnya file lokal
          if (content.contentUrl && !content.contentUrl.startsWith("http")) {
            try { fs.unlinkSync(content.contentUrl); } catch {}
          }
          content.contentUrl = videoPelatihanUrl;
        }
      } else if (tipe === "podcast") {
        if (req.files && req.files["video"] && req.files["video"][0]) {
          if (content.contentUrl && !content.contentUrl.startsWith("http")) {
            try { fs.unlinkSync(content.contentUrl); } catch {}
          }
          content.contentUrl = req.files["video"][0].path;
        } else if (videoPodcastUrl) {
          if (content.contentUrl && !content.contentUrl.startsWith("http")) {
            try { fs.unlinkSync(content.contentUrl); } catch {}
          }
          content.contentUrl = videoPodcastUrl;
        }
      }

      // Update thumbnail jika ada file baru
      if (req.files && req.files["thumbnail"] && req.files["thumbnail"][0]) {
        // Hapus thumbnail lama jika ada
        // if (content.thumbnail) fs.unlinkSync(content.thumbnail);
        // content.thumbnail = req.files["thumbnail"][0].path;
      }

      // Update field lain jika schema sudah diupdate
      // if (deskripsi !== undefined) content.deskripsi = deskripsi;
      // if (tags !== undefined) content.tags = tags.split(",");

      await content.save();
      res.status(200).json({ msg: "Pelatihan/Podcast berhasil diupdate", data: content });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
];

// DELETE pelatihan/podcast (admin pembuat)
export const deletePelatihanDanPodcast = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ msg: "Pelatihan/Podcast tidak ditemukan" });
    }
    // Hapus thumbnail jika ada
    // if (content.thumbnail) fs.unlinkSync(content.thumbnail);
    // Hapus file video jika file lokal
    if (content.contentUrl && !content.contentUrl.startsWith("http")) {
      try { fs.unlinkSync(content.contentUrl); } catch {}
    }
    await Content.deleteOne({ _id: req.params.id });
    res.status(200).json({ msg: "Pelatihan/Podcast berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
