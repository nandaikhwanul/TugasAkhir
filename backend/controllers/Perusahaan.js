import Perusahaan from "../models/Perusahaan.js";
import argon2 from "argon2";
import { validationResult, body } from "express-validator";
import multer from "multer";
import path from "path";
import fs from "fs";

// Fungsi untuk mengecek old password perusahaan (menggunakan /me, userId dari session/token)
export const checkOldPassword = async (req, res) => {
    const { oldPassword } = req.body;
    if (!req.userId) {
        return res.status(401).json({ msg: "Mohon login terlebih dahulu!" });
    }
    try {
        const perusahaan = await Perusahaan.findById(req.userId);
        if (!perusahaan) {
            return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
        }
        const match = await argon2.verify(perusahaan.password, oldPassword);
        if (!match) {
            return res.status(400).json({ msg: "Password lama salah" });
        }
        return res.status(200).json({ msg: "Password lama benar" });
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
};

// Konfigurasi multer untuk upload logo perusahaan dan foto_cover
const storageLogo = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.resolve("uploads/perusahaan");
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
                const perusahaan = await Perusahaan.findById(req.userId);
                // Hapus logo lama jika upload logo_perusahaan
                if (file.fieldname === "logo_perusahaan" && perusahaan && perusahaan.logo_perusahaan) {
                    const oldLogo = perusahaan.logo_perusahaan;
                    if (
                        typeof oldLogo === "string" &&
                        !oldLogo.startsWith("http")
                    ) {
                        const absPath = path.resolve(oldLogo);
                        if (fs.existsSync(absPath)) {
                            fs.unlinkSync(absPath);
                        } else {
                            const localPath = path.resolve("uploads/perusahaan", oldLogo);
                            if (fs.existsSync(localPath)) {
                                fs.unlinkSync(localPath);
                            }
                        }
                    }
                }
                // Hapus foto_cover lama jika upload foto_cover
                if (file.fieldname === "foto_cover" && perusahaan && perusahaan.foto_cover) {
                    const oldCover = perusahaan.foto_cover;
                    if (
                        typeof oldCover === "string" &&
                        !oldCover.startsWith("http")
                    ) {
                        const absPath = path.resolve(oldCover);
                        if (fs.existsSync(absPath)) {
                            fs.unlinkSync(absPath);
                        } else {
                            const localPath = path.resolve("uploads/perusahaan", oldCover);
                            if (fs.existsSync(localPath)) {
                                fs.unlinkSync(localPath);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Gagal menghapus file lama perusahaan:", err.message);
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        if (file.fieldname === "logo_perusahaan") {
            cb(null, 'logo-' + uniqueSuffix + ext);
        } else if (file.fieldname === "foto_cover") {
            cb(null, 'cover-' + uniqueSuffix + ext);
        } else {
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    }
});
const uploadLogoPerusahaan = multer({
    storage: storageLogo,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
        }
        cb(null, true);
    }
}).fields([
    { name: 'logo_perusahaan', maxCount: 1 },
    { name: 'foto_cover', maxCount: 1 }
]);

// Express-validator rules untuk registerPerusahaan
export const registerPerusahaanValidation = [
    body('nama_perusahaan')
        .notEmpty().withMessage('Nama perusahaan wajib diisi')
        .isLength({ min: 3, max: 100 }).withMessage('Nama perusahaan minimal 3 dan maksimal 100 karakter')
        .trim()
        .custom(async (value, { req }) => {
            const perusahaan = await Perusahaan.findOne({ nama_perusahaan: value });
            if (perusahaan) {
                // Gunakan throw dengan objek agar express-validator mengaitkan error ke field yang benar
                throw { msg: 'Nama perusahaan sudah terdaftar', param: 'nama_perusahaan' };
            }
            return true;
        }),
    body('email_perusahaan')
        .isEmail().withMessage('Email perusahaan tidak valid')
        .custom(async (value, { req }) => {
            const perusahaan = await Perusahaan.findOne({ email_perusahaan: value });
            if (perusahaan) {
                throw { msg: 'Email perusahaan sudah terdaftar', param: 'email_perusahaan' };
            }
            return true;
        }),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('confPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw { msg: 'Password dan Confirm Password tidak cocok', param: 'confPassword' };
        }
        return true;
    }),
];

// Get perusahaan by id (MongoDB _id)
export const getPerusahaanById = async (req, res) => {
    try {
        const perusahaan = await Perusahaan.findById(req.userId, [
            'nama_perusahaan',
            'nama_brand',
            'jumlah_karyawan',
            'email_perusahaan',
            'alamat',
            'bidang_perusahaan',
            'nomor_telp',
            'logo_perusahaan',
            'foto_cover',
            'deskripsi_perusahaan',
            'website',
            'media_sosial',
            'role'
        ]);
        if (!perusahaan) return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
        res.status(200).json(perusahaan);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Register perusahaan (hanya nama_perusahaan, email_perusahaan, password, confPassword)
export const registerPerusahaan = async (req, res) => {
    // Validasi input menggunakan express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Gunakan .mapped() agar hasil konsisten keyed per field
        const fieldErrors = Object.fromEntries(
            Object.entries(errors.mapped()).map(([field, errObj]) => [field, errObj.msg])
        );
        return res.status(400).json({ errors: fieldErrors });
    }

    const {
        nama_perusahaan,
        email_perusahaan,
        password,
        confPassword
    } = req.body;

    try {
        // Cek ulang duplikasi sebelum create (race condition prevention)
        const cekNama = await Perusahaan.findOne({ nama_perusahaan });
        if (cekNama) {
            return res.status(400).json({ errors: { nama_perusahaan: "Nama perusahaan sudah terdaftar" } });
        }
        const cekEmail = await Perusahaan.findOne({ email_perusahaan });
        if (cekEmail) {
            return res.status(400).json({ errors: { email_perusahaan: "Email perusahaan sudah terdaftar" } });
        }

        const hashPassword = await argon2.hash(password);
        const perusahaan = await Perusahaan.create({
            nama_perusahaan,
            email_perusahaan,
            password: hashPassword,
            role: "perusahaan"
        });
        req.session.userId = perusahaan._id;
        req.session.role = "perusahaan";
        res.status(201).json({
            msg: "Register Perusahaan Berhasil",
            perusahaan: {
                _id: perusahaan._id,
                nama_perusahaan: perusahaan.nama_perusahaan,
                email_perusahaan: perusahaan.email_perusahaan,
                role: perusahaan.role
            }
        });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Update perusahaan (menggunakan JWT, bukan session, dan bisa update logo_perusahaan dan foto_cover)
export const updatePerusahaan = (req, res) => {
    uploadLogoPerusahaan(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ msg: err.message });
        } else if (err) {
            return res.status(400).json({ msg: err.message });
        }

        // Izinkan admin atau perusahaan
        if (!req.userId || (req.role !== "perusahaan" && req.role !== "admin")) {
            if (req.files && req.files.logo_perusahaan) {
                fs.unlinkSync(req.files.logo_perusahaan[0].path);
            }
            if (req.files && req.files.foto_cover) {
                fs.unlinkSync(req.files.foto_cover[0].path);
            }
            return res.status(401).json({ msg: "Akses terlarang, hanya perusahaan atau admin yang dapat mengakses." });
        }

        let perusahaan;
        try {
            perusahaan = await Perusahaan.findById(req.params.id);
        } catch (error) {
            if (req.files && req.files.logo_perusahaan) {
                fs.unlinkSync(req.files.logo_perusahaan[0].path);
            }
            if (req.files && req.files.foto_cover) {
                fs.unlinkSync(req.files.foto_cover[0].path);
            }
            return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
        }
        if (!perusahaan) {
            if (req.files && req.files.logo_perusahaan) {
                fs.unlinkSync(req.files.logo_perusahaan[0].path);
            }
            if (req.files && req.files.foto_cover) {
                fs.unlinkSync(req.files.foto_cover[0].path);
            }
            return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
        }

        // Hanya perusahaan itu sendiri atau admin yang boleh update
        if (req.role !== "admin" && perusahaan._id.toString() !== req.userId) {
            if (req.files && req.files.logo_perusahaan) {
                fs.unlinkSync(req.files.logo_perusahaan[0].path);
            }
            if (req.files && req.files.foto_cover) {
                fs.unlinkSync(req.files.foto_cover[0].path);
            }
            return res.status(403).json({ msg: "Akses terlarang, hanya perusahaan terkait atau admin yang dapat mengakses." });
        }

        const {
            nama_perusahaan,
            nama_brand,
            jumlah_karyawan,
            email_perusahaan,
            alamat,
            bidang_perusahaan,
            nomor_telp,
            deskripsi_perusahaan,
            website,
            media_sosial,
            password,
            confPassword
        } = req.body;
        let hashPassword = perusahaan.password;

        // Validasi duplikasi jika field diubah
        if (nama_perusahaan && nama_perusahaan !== perusahaan.nama_perusahaan) {
            const cekNama = await Perusahaan.findOne({ nama_perusahaan });
            if (cekNama) {
                if (req.files && req.files.logo_perusahaan) fs.unlinkSync(req.files.logo_perusahaan[0].path);
                if (req.files && req.files.foto_cover) fs.unlinkSync(req.files.foto_cover[0].path);
                return res.status(400).json({ errors: { nama_perusahaan: "Nama perusahaan sudah terdaftar" } });
            }
        }
        if (email_perusahaan && email_perusahaan !== perusahaan.email_perusahaan) {
            const cekEmail = await Perusahaan.findOne({ email_perusahaan });
            if (cekEmail) {
                if (req.files && req.files.logo_perusahaan) fs.unlinkSync(req.files.logo_perusahaan[0].path);
                if (req.files && req.files.foto_cover) fs.unlinkSync(req.files.foto_cover[0].path);
                return res.status(400).json({ errors: { email_perusahaan: "Email perusahaan sudah terdaftar" } });
            }
        }

        if (password && password !== "") {
            if (password !== confPassword) {
                if (req.files && req.files.logo_perusahaan) {
                    fs.unlinkSync(req.files.logo_perusahaan[0].path);
                }
                if (req.files && req.files.foto_cover) {
                    fs.unlinkSync(req.files.foto_cover[0].path);
                }
                return res.status(400).json({ errors: { confPassword: "Password dan Confirm Password tidak cocok" } });
            }
            hashPassword = await argon2.hash(password);
        }

        let logo_perusahaan = perusahaan.logo_perusahaan;
        if (req.files && req.files.logo_perusahaan) {
            if (logo_perusahaan && logo_perusahaan.startsWith("/uploads/perusahaan/")) {
                const oldPath = path.resolve("." + logo_perusahaan);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            logo_perusahaan = `/uploads/perusahaan/${req.files.logo_perusahaan[0].filename}`;
        }

        let foto_cover = perusahaan.foto_cover;
        if (req.files && req.files.foto_cover) {
            if (foto_cover && foto_cover.startsWith("/uploads/perusahaan/")) {
                const oldPath = path.resolve("." + foto_cover);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            foto_cover = `/uploads/perusahaan/${req.files.foto_cover[0].filename}`;
        }

        // Parse media_sosial if sent as JSON string (from form-data)
        let mediaSosialObj = perusahaan.media_sosial;
        let mediaSosialShouldUpdate = false;
        if (typeof media_sosial !== "undefined") {
            mediaSosialShouldUpdate = true;
            if (media_sosial === "" || media_sosial === null) {
                mediaSosialObj = null;
            } else {
                try {
                    if (typeof media_sosial === "string") {
                        mediaSosialObj = JSON.parse(media_sosial);
                    } else {
                        mediaSosialObj = media_sosial;
                    }
                } catch (e) {
                    if (req.files && req.files.logo_perusahaan) {
                        fs.unlinkSync(req.files.logo_perusahaan[0].path);
                    }
                    if (req.files && req.files.foto_cover) {
                        fs.unlinkSync(req.files.foto_cover[0].path);
                    }
                    return res.status(400).json({ msg: "Format media_sosial tidak valid (harus JSON)" });
                }
            }
        }

        // Build updateFields to avoid sending undefined
        const updateFields = {
            nama_perusahaan: typeof nama_perusahaan !== "undefined" ? nama_perusahaan : perusahaan.nama_perusahaan,
            nama_brand: typeof nama_brand !== "undefined" ? nama_brand : perusahaan.nama_brand,
            jumlah_karyawan: typeof jumlah_karyawan !== "undefined" ? jumlah_karyawan : perusahaan.jumlah_karyawan,
            email_perusahaan: typeof email_perusahaan !== "undefined" ? email_perusahaan : perusahaan.email_perusahaan,
            alamat: typeof alamat !== "undefined" ? alamat : perusahaan.alamat,
            bidang_perusahaan: typeof bidang_perusahaan !== "undefined" ? bidang_perusahaan : perusahaan.bidang_perusahaan,
            nomor_telp: typeof nomor_telp !== "undefined" ? nomor_telp : perusahaan.nomor_telp,
            logo_perusahaan: logo_perusahaan,
            foto_cover: foto_cover,
            deskripsi_perusahaan: typeof deskripsi_perusahaan !== "undefined" ? deskripsi_perusahaan : perusahaan.deskripsi_perusahaan,
            website: typeof website !== "undefined" ? website : perusahaan.website,
            password: hashPassword,
            role: perusahaan.role
        };

        // Only set media_sosial if it should be updated, otherwise keep as is
        if (mediaSosialShouldUpdate) {
            updateFields.media_sosial = mediaSosialObj;
        } else {
            updateFields.media_sosial = perusahaan.media_sosial;
        }

        try {
            await Perusahaan.findByIdAndUpdate(perusahaan._id, updateFields, { new: true });

            const updatedPerusahaan = await Perusahaan.findById(perusahaan._id);

            // Build response object with all fields, never undefined
            const responsePerusahaan = {
                _id: updatedPerusahaan._id,
                nama_perusahaan: updatedPerusahaan.nama_perusahaan ?? "",
                nama_brand: updatedPerusahaan.nama_brand ?? "",
                jumlah_karyawan: updatedPerusahaan.jumlah_karyawan ?? "",
                email_perusahaan: updatedPerusahaan.email_perusahaan ?? "",
                alamat: updatedPerusahaan.alamat ?? "",
                bidang_perusahaan: updatedPerusahaan.bidang_perusahaan ?? "",
                nomor_telp: updatedPerusahaan.nomor_telp ?? "",
                logo_perusahaan: updatedPerusahaan.logo_perusahaan ?? "",
                foto_cover: updatedPerusahaan.foto_cover ?? "",
                deskripsi_perusahaan: updatedPerusahaan.deskripsi_perusahaan ?? "",
                website: updatedPerusahaan.website ?? "",
                media_sosial: typeof updatedPerusahaan.media_sosial !== "undefined" ? updatedPerusahaan.media_sosial : null,
                role: updatedPerusahaan.role ?? ""
            };

            res.status(200).json({
                msg: "Perusahaan Updated",
                perusahaan: responsePerusahaan
            });
        } catch (error) {
            if (req.files && req.files.logo_perusahaan) {
                fs.unlinkSync(req.files.logo_perusahaan[0].path);
            }
            if (req.files && req.files.foto_cover) {
                fs.unlinkSync(req.files.foto_cover[0].path);
            }
            res.status(400).json({ msg: error.message });
        }
    });
};

// Mendapatkan semua alumni yang pernah melamar ke lowongan perusahaan ini (khusus perusahaan)
export const getAllAlumniForPerusahaan = async (req, res) => {
    try {
        // Pastikan user adalah perusahaan
        if (!req.userId) {
            return res.status(401).json({ msg: "Mohon login sebagai perusahaan!" });
        }

        // Ambil semua lowongan milik perusahaan ini
        const lowongan = await import("../models/Lowongan.js").then(m => m.default);
        const pelamar = await import("../models/Pelamar.js").then(m => m.default);
        const alumni = await import("../models/Alumni.js").then(m => m.default);

        // Cari semua lowongan yang dibuat oleh perusahaan ini
        const lowonganList = await lowongan.find({ perusahaan: req.userId }, { _id: 1 });
        const lowonganIds = lowonganList.map(l => l._id);

        // Cari semua pelamar yang melamar ke lowongan-lowongan tersebut
        const pelamarList = await pelamar.find({ lowongan: { $in: lowonganIds } });

        // Ambil semua alumniId unik dari pelamar
        const alumniIds = [...new Set(pelamarList.map(p => p.alumni))];

        // Ambil data alumni, tambahkan foto_profil, foto_sampul, dan skill
        // Gunakan projection object, bukan array!
        const alumniList = await alumni.find(
            { _id: { $in: alumniIds } },
            {
                name: 1,
                nim: 1,
                nohp: 1,
                alamat: 1,
                program_studi: 1,
                tahun_lulus: 1,
                tanggal_lahir: 1,
                email: 1,
                foto_profil: 1,
                foto_sampul: 1,
                role: 1,
                skill: 1
            }
        );

        res.status(200).json(alumniList);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};