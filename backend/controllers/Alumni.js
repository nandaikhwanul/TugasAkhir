import Alumni from "../models/Alumni.js";
import argon2 from "argon2";
import { validationResult, body } from "express-validator";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp"; // Tambahkan sharp untuk resize foto_sampul
// Controller untuk mengambil semua lowongan yang disimpan (saved) oleh alumni
import Lowongan from "../models/Lowongan.js";
import Nim from "../models/nim.js"; // Import model Nim

// Fungsi untuk mengecek password lama alumni
export const checkOldPassword = async (req, res) => {
    const { oldPassword } = req.body;
    if (!oldPassword) {
        return res.status(400).json({ msg: "Password lama wajib diisi" });
    }

    let alumni;
    try {
        alumni = await Alumni.findById(req.userId);
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
    if (!alumni) return res.status(404).json({ msg: "Alumni tidak ditemukan" });

    try {
        const valid = await argon2.verify(alumni.password, oldPassword);
        if (!valid) {
            return res.status(400).json({ msg: "Password lama salah" });
        }
        const alumniWithNumber = {
            nomor: 1,
            ...alumni.toObject()
        };
        return res.status(200).json({ msg: "Password lama benar", alumni: alumniWithNumber });
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
};

// Endpoint untuk perusahaan melihat detail alumni (termasuk foto_profil)
export const getAlumniDetailForPerusahaan = async (req, res) => {
    try {
        // id alumni diambil dari parameter url
        const alumni = await Alumni.findById(req.params.id, [
            'name',
            'nim',
            'nohp',
            'alamat',
            'email',
            'role',
            'foto_profil',
            'foto_sampul',
            'deskripsi',
            'program_studi',
            'tahun_lulus',
            'tanggal_lahir'
        ]);
        if (!alumni) return res.status(404).json({ msg: "Alumni tidak ditemukan" });
        // Hanya data yang aman yang dikembalikan
        res.status(200).json(alumni);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get alumni data from token (authenticated user)
export const getAlumniById = async (req, res) => {
    try {
        const alumni = await Alumni.findById(req.userId, [
            'name',
            'nim',
            'nohp',
            'alamat',
            'email',
            'role',
            'foto_profil',
            'foto_sampul',
            'deskripsi',
            'program_studi',
            'tahun_lulus',
            'tanggal_lahir',
            'skill'
        ]);
        if (!alumni) return res.status(404).json({ msg: "Alumni tidak ditemukan" });
        res.status(200).json(alumni);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Express-validator rules for registerAlumni
export const registerAlumniValidation = [
    body('name')
        .notEmpty().withMessage('Nama wajib diisi'),
    body('nim')
        .notEmpty().withMessage('NIM wajib diisi'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('confPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password dan Confirm Password tidak cocok');
        }
        return true;
    })
];

// Register alumni
export const registerAlumni = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const msg = errors.array().map(e => e.msg).join(', ');
        return res.status(400).json({ msg });
    }

    const { name, nim, email, password, confPassword } = req.body;
    let duplicateMsg = [];
    try {
        // Cek apakah NIM ada di koleksi Nim
        const nimExist = await Nim.findOne({ nim });
        if (!nimExist) {
            return res.status(400).json({ msg: "NIM tidak terdaftar" });
        }

        const existingName = await Alumni.findOne({ name });
        if (existingName) {
            duplicateMsg.push("Nama sudah terdaftar");
        }
        const existingNim = await Alumni.findOne({ nim });
        if (existingNim) {
            duplicateMsg.push("NIM sudah terdaftar");
        }
        if (duplicateMsg.length > 0) {
            return res.status(400).json({ msg: duplicateMsg.join(', ') });
        }

        const hashPassword = await argon2.hash(password);
        const createdAlumni = await Alumni.create({
            name,
            nim,
            email,
            password: hashPassword,
            confPassword: confPassword,
            role: "alumni"
        });
        const { _id, name: resName, nim: resNim, email: resEmail, role: resRole, confPassword: resConfPassword } = createdAlumni;
        res.status(201).json({
            msg: "Register Alumni Berhasil",
            alumni: {
                _id,
                name: resName,
                nim: resNim,
                email: resEmail,
                confPassword: resConfPassword,
                role: resRole
            }
        });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const validateUpdateAlumni = [
    body("name").optional().isString().withMessage("Nama harus berupa string"),
    body("nim").optional().isString().withMessage("NIM harus berupa string"),
    body("nohp").optional().isString().withMessage("No HP harus berupa string"),
    body("alamat").optional().isString().withMessage("Alamat harus berupa string"),
    body("program_studi").optional().isString().withMessage("Program Studi harus berupa string"),
    body("tahun_lulus").optional().isInt({ min: 1900, max: 2100 }).withMessage("Tahun lulus tidak valid"),
    body("tanggal_lahir").optional().isISO8601().withMessage("Tanggal lahir tidak valid"),
    body("email").optional().isEmail().withMessage("Email tidak valid"),
    body("password").optional().isLength({ min: 6 }).withMessage("Password minimal 6 karakter"),
    body("confPassword").optional().custom((value, { req }) => {
        if (req.body.password && value !== req.body.password) {
            throw new Error("Password dan Confirm Password tidak cocok");
        }
        return true;
    }),
    body("foto_profil").optional().isString().withMessage("Foto profil harus berupa string"),
    body("foto_sampul").optional().isString().withMessage("Foto sampul harus berupa string"),
    body("deskripsi").optional().isString().withMessage("Deskripsi harus berupa string"),
    body("skill").optional().isArray().withMessage("Skill harus berupa array string"),
    // Tambahan validasi untuk media_sosial dan portofolio
    body("media_sosial").optional().isArray().withMessage("Media sosial harus berupa array"),
    body("portofolio").optional().isArray().withMessage("Portofolio harus berupa array"),
];

export const updateAlumni = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array().map(e => e.msg).join(", ") });
    }

    let alumni;
    try {
        if (req.role === "admin") {
            const alumniId = req.body.id || req.query.id || req.userId;
            alumni = await Alumni.findById(alumniId);
        } else {
            alumni = await Alumni.findById(req.userId);
        }
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
    if (!alumni) return res.status(404).json({ msg: "Alumni tidak ditemukan" });

    // Tambahkan media_sosial dan portofolio ke destructuring
    const { 
        name, nim, nohp, alamat, program_studi, tahun_lulus, tanggal_lahir, email, password, confPassword, 
        foto_profil, foto_sampul, deskripsi, skill, media_sosial, portofolio 
    } = req.body;
    let hashPassword = alumni.password;

    if (password && password !== "") {
        hashPassword = await argon2.hash(password);
    }

    try {
        let duplicateMsg = [];
        if (name && name !== alumni.name) {
            const existingName = await Alumni.findOne({ name, _id: { $ne: alumni._id } });
            if (existingName) {
                duplicateMsg.push("Nama sudah terdaftar");
            }
        }
        if (nim && nim !== alumni.nim) {
            const existingNim = await Alumni.findOne({ nim, _id: { $ne: alumni._id } });
            if (existingNim) {
                duplicateMsg.push("NIM sudah terdaftar");
            }
        }
        if (duplicateMsg.length > 0) {
            return res.status(400).json({ msg: duplicateMsg.join(', ') });
        }

        alumni.name = name ?? alumni.name;
        alumni.nim = nim ?? alumni.nim;
        alumni.nohp = nohp ?? alumni.nohp;
        alumni.alamat = alamat ?? alumni.alamat;
        alumni.program_studi = program_studi ?? alumni.program_studi;
        alumni.tahun_lulus = tahun_lulus ?? alumni.tahun_lulus;
        alumni.tanggal_lahir = tanggal_lahir ?? alumni.tanggal_lahir;
        alumni.email = email ?? alumni.email;
        alumni.password = hashPassword;
        if (typeof foto_profil !== "undefined") {
            alumni.foto_profil = foto_profil;
        }
        if (typeof foto_sampul !== "undefined") {
            alumni.foto_sampul = foto_sampul;
        }
        if (typeof deskripsi !== "undefined") {
            alumni.deskripsi = deskripsi;
        }
        if (typeof skill !== "undefined") {
            alumni.skill = Array.isArray(skill) ? skill : [];
        }
        // Tambahkan update media_sosial dan portofolio
        if (typeof media_sosial !== "undefined") {
            alumni.media_sosial = Array.isArray(media_sosial) ? media_sosial : [];
        }
        if (typeof portofolio !== "undefined") {
            alumni.portofolio = Array.isArray(portofolio) ? portofolio : [];
        }
        await alumni.save();
        res.status(200).json({ msg: "Alumni Updated" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// ========== ENDPOINT KHUSUS UNTUK UPDATE FOTO PROFIL ==========

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.resolve("uploads/alumni");
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        } catch (err) {
            cb(err, dir);
        }
    },
    filename: async function (req, file, cb) {
        try {
            if (req.userId) {
                const alumni = await Alumni.findById(req.userId);
                if (alumni && alumni.foto_profil) {
                    const oldFoto = alumni.foto_profil;
                    if (
                        typeof oldFoto === "string" &&
                        !oldFoto.startsWith("http")
                    ) {
                        const oldFileName = oldFoto.split('/').pop();
                        const filePath = path.resolve("uploads/alumni", oldFileName);
                        if (fs.existsSync(filePath)) {
                            try {
                                fs.unlinkSync(filePath);
                            } catch (err) {
                                console.error("Gagal menghapus foto profil lama:", err.message);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Gagal menghapus foto profil lama:", err.message);
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'alumni-' + uniqueSuffix + ext);
    }
});
const uploadFotoProfil = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
        }
        cb(null, true);
    }
}).single('foto_profil');

export const updateFotoProfil = (req, res) => {
    uploadFotoProfil(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ msg: err.message });
        } else if (err) {
            return res.status(400).json({ msg: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ msg: "File foto_profil wajib diupload" });
        }

        let alumni;
        try {
            alumni = await Alumni.findById(req.userId);
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }
        if (!alumni) return res.status(404).json({ msg: "Alumni tidak ditemukan" });

        const fotoProfilUrl = `/uploads/alumni/${req.file.filename}`;
        alumni.foto_profil = fotoProfilUrl;
        try {
            await alumni.save();
            res.status(200).json({
                msg: "Foto profil berhasil diupdate",
                foto_profil: fotoProfilUrl
            });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    });
};

// ========== ENDPOINT KHUSUS UNTUK UPDATE FOTO SAMPUL ==========

const storageSampul = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.resolve("uploads/alumni/sampul");
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        } catch (err) {
            cb(err, dir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'sampul-' + uniqueSuffix + ext);
    }
});
const uploadFotoSampul = multer({
    storage: storageSampul,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
        }
        cb(null, true);
    }
}).single('foto_sampul');

export const updateFotoSampul = (req, res) => {
    uploadFotoSampul(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ msg: err.message });
        } else if (err) {
            return res.status(400).json({ msg: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ msg: "File foto_sampul wajib diupload" });
        }

        let alumni;
        try {
            alumni = await Alumni.findById(req.userId);
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }
        if (!alumni) return res.status(404).json({ msg: "Alumni tidak ditemukan" });

        // Resize foto_sampul ke rasio 3:1 (misal 1200x400)
        const filePath = req.file.path;
        const ext = path.extname(req.file.filename);
        const resizedFileName = req.file.filename.replace(ext, `-3x1${ext}`);
        const resizedFilePath = path.resolve("uploads/alumni/sampul", resizedFileName);

        try {
            await sharp(filePath)
                .resize({ width: 1200, height: 400, fit: "cover" })
                .toFile(resizedFilePath);

            // Hapus file asli jika berbeda
            if (filePath !== resizedFilePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    // Log error, tapi jangan return error 400
                    console.error("Gagal menghapus file sampul asli:", err.message);
                }
            }

            // Hapus foto_sampul lama jika ada dan bukan url eksternal
            if (alumni.foto_sampul && typeof alumni.foto_sampul === "string" && !alumni.foto_sampul.startsWith("http")) {
                const oldFileName = alumni.foto_sampul.split('/').pop();
                const oldFilePath = path.resolve("uploads/alumni/sampul", oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    try {
                        fs.unlinkSync(oldFilePath);
                    } catch (err) {
                        // Log error, tapi jangan return error 400
                        console.error("Gagal menghapus foto sampul lama:", err.message);
                    }
                }
            }

            const fotoSampulUrl = `/uploads/alumni/sampul/${resizedFileName}`;
            alumni.foto_sampul = fotoSampulUrl;
            await alumni.save();
            res.status(200).json({
                msg: "Foto sampul berhasil diupdate",
                foto_sampul: fotoSampulUrl
            });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    });
};

// Endpoint untuk mencari alumni (bisa diakses semua role)
export const searchAlumni = async (req, res) => {
    try {
        // Ambil query pencarian dari query string (?q=...)
        const { q } = req.query;
        if (!q || q.trim() === "") {
            return res.status(400).json({ msg: "Query pencarian (q) wajib diisi" });
        }

        // Pencarian pada beberapa field (name, nim, email, program_studi)
        // Untuk tahun_lulus, hanya cari jika q berupa angka
        const regex = new RegExp(q, "i");
        const orConditions = [
            { name: regex },
            { nim: regex },
            { email: regex },
            { program_studi: regex }
        ];

        // Cek jika q adalah angka (hanya digit)
        if (/^\d+$/.test(q.trim())) {
            // tahun_lulus bisa berupa string atau number tergantung skema, 
            // jika number, parseInt(q) bisa digunakan
            orConditions.push({ tahun_lulus: q.trim() });
        }

        const alumniList = await Alumni.find({
            $or: orConditions
        }, [
            'name',
            'nim',
            'nohp',
            'alamat',
            'email',
            'role',
            'foto_profil',
            'foto_sampul',
            'deskripsi',
            'program_studi',
            'tahun_lulus',
            'tanggal_lahir'
        ]).limit(50); // batasi hasil maksimal 50

        res.status(200).json({
            msg: "Hasil pencarian alumni",
            data: alumniList
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
// Controller untuk save/unsave lowongan oleh alumni

// Asumsi: Model Alumni dan Lowongan sudah diimport di bagian atas file ini
// dan field 'savedLowongan' (array of ObjectId Lowongan) sudah ada di schema Alumni

// Helper function to normalize savedLowongan array to array of string IDs
function normalizeSavedLowongan(savedLowongan) {
    if (!Array.isArray(savedLowongan)) return [];
    return savedLowongan.map(id => id && id.toString ? id.toString() : String(id));
}

export const toggleSaveLowongan = async (req, res) => {
    try {
        const alumniId = req.userId; // diasumsikan sudah ada middleware auth yang set req.userId
        const { lowonganId } = req.body;

        if (!lowonganId) {
            return res.status(400).json({ msg: "lowonganId wajib diisi" });
        }

        // Cari alumni
        const alumni = await Alumni.findById(alumniId);
        if (!alumni) {
            return res.status(404).json({ msg: "Alumni tidak ditemukan" });
        }

        // Cari lowongan
        const lowongan = await Lowongan.findById(lowonganId);
        if (!lowongan) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan" });
        }

        // Cek apakah lowongan sudah disimpan oleh alumni
        const indexAlumni = alumni.savedLowongan?.findIndex(id => id.toString() === lowonganId);
        const indexLowongan = lowongan.savedBy?.findIndex(id => id.toString() === alumniId);

        let action;
        if (indexAlumni !== -1 && indexAlumni !== undefined) {
            // Sudah disimpan, maka unsave
            alumni.savedLowongan.splice(indexAlumni, 1);
            if (indexLowongan !== -1 && indexLowongan !== undefined) {
                lowongan.savedBy.splice(indexLowongan, 1);
            }
            action = "unsaved";
        } else {
            // Belum disimpan, maka save
            alumni.savedLowongan = alumni.savedLowongan || [];
            lowongan.savedBy = lowongan.savedBy || [];
            // Pastikan tidak double
            if (!alumni.savedLowongan.some(id => id.toString() === lowonganId)) {
                alumni.savedLowongan.push(lowonganId);
            }
            // Hanya tambahkan jika belum ada
            if (!lowongan.savedBy.some(id => id.toString() === alumniId)) {
                lowongan.savedBy.push(alumniId);
            }
            action = "saved";
        }

        await alumni.save();
        await lowongan.save();

        // Normalisasi: pastikan array ID string dengan helper
        const normalizedSavedLowongan = normalizeSavedLowongan(alumni.savedLowongan);

        res.status(200).json({
            msg: `Lowongan berhasil di-${action}`,
            savedLowongan: normalizedSavedLowongan
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getSavedLowongan = async (req, res) => {
    try {
        const alumniId = req.userId; // diasumsikan sudah ada middleware auth yang set req.userId

        // Cari semua lowongan yang savedBy-nya mengandung alumniId
        const savedLowongan = await Lowongan.find({ savedBy: alumniId })
            .select("-__v")
            .populate("perusahaan", "nama_perusahaan email logo_perusahaan");

        res.status(200).json({
            savedLowongan: savedLowongan || []
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const unsaveLowongan = async (req, res) => {
    try {
        const alumniId = req.userId; // diasumsikan sudah ada middleware auth yang set req.userId
        const { lowonganId } = req.body;

        if (!lowonganId) {
            return res.status(400).json({ msg: "lowonganId harus disertakan" });
        }

        // Cari alumni dan lowongan
        const alumni = await Alumni.findById(alumniId);
        const lowongan = await Lowongan.findById(lowonganId);

        if (!alumni || !lowongan) {
            return res.status(404).json({ msg: "Alumni atau Lowongan tidak ditemukan" });
        }

        // Hapus lowonganId dari savedLowongan alumni
        alumni.savedLowongan = (alumni.savedLowongan || []).filter(
            id => id.toString() !== lowonganId
        );

        // Hapus alumniId dari savedBy lowongan
        lowongan.savedBy = (lowongan.savedBy || []).filter(
            id => id.toString() !== alumniId
        );

        await alumni.save();
        await lowongan.save();

        // Normalisasi: pastikan array ID string dengan helper
        const normalizedSavedLowongan = normalizeSavedLowongan(alumni.savedLowongan);

        res.status(200).json({
            msg: "Lowongan berhasil di-unsave",
            savedLowongan: normalizedSavedLowongan
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

