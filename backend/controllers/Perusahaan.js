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

// Konfigurasi multer untuk upload logo perusahaan
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
                if (perusahaan && perusahaan.logo_perusahaan) {
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
            }
        } catch (err) {
            console.error("Gagal menghapus logo perusahaan lama:", err.message);
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
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
}).single('logo_perusahaan');

// Express-validator rules untuk registerPerusahaan
export const registerPerusahaanValidation = [
    body('nama_perusahaan')
        .notEmpty().withMessage('Nama perusahaan wajib diisi')
        .isLength({ min: 3, max: 100 }).withMessage('Nama perusahaan minimal 3 dan maksimal 100 karakter')
        .trim()
        .custom(async (value) => {
            const perusahaan = await Perusahaan.findOne({ nama_perusahaan: value });
            if (perusahaan) {
                throw new Error('Nama perusahaan sudah terdaftar');
            }
            return true;
        }),
    body('email_perusahaan')
        .isEmail().withMessage('Email perusahaan tidak valid')
        .custom(async (value) => {
            const perusahaan = await Perusahaan.findOne({ email_perusahaan: value });
            if (perusahaan) {
                throw new Error('Email perusahaan sudah terdaftar');
            }
            return true;
        }),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('confPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password dan Confirm Password tidak cocok');
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
        // Map errors.array() menjadi objek keyed per field
        const fieldErrors = Object.fromEntries(
            errors.array().map(e => [e.param, e.msg])
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

// Update perusahaan (menggunakan JWT, bukan session, dan bisa update logo_perusahaan)
export const updatePerusahaan = (req, res) => {
    uploadLogoPerusahaan(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ msg: err.message });
        } else if (err) {
            return res.status(400).json({ msg: err.message });
        }

        // Izinkan admin atau perusahaan
        if (!req.userId || (req.role !== "perusahaan" && req.role !== "admin")) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(401).json({ msg: "Akses terlarang, hanya perusahaan atau admin yang dapat mengakses." });
        }

        let perusahaan;
        try {
            perusahaan = await Perusahaan.findById(req.params.id);
        } catch (error) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
        }
        if (!perusahaan) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
        }

        // Hanya perusahaan itu sendiri atau admin yang boleh update
        if (req.role !== "admin" && perusahaan._id.toString() !== req.userId) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
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
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ errors: { nama_perusahaan: "Nama perusahaan sudah terdaftar" } });
            }
        }
        if (email_perusahaan && email_perusahaan !== perusahaan.email_perusahaan) {
            const cekEmail = await Perusahaan.findOne({ email_perusahaan });
            if (cekEmail) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ errors: { email_perusahaan: "Email perusahaan sudah terdaftar" } });
            }
        }

        if (password && password !== "") {
            if (password !== confPassword) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ errors: { confPassword: "Password dan Confirm Password tidak cocok" } });
            }
            hashPassword = await argon2.hash(password);
        }

        let logo_perusahaan = perusahaan.logo_perusahaan;
        if (req.file) {
            if (logo_perusahaan && logo_perusahaan.startsWith("/uploads/perusahaan/")) {
                const oldPath = path.resolve("." + logo_perusahaan);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            logo_perusahaan = `/uploads/perusahaan/${req.file.filename}`;
        }

        // Parse media_sosial if sent as JSON string (from form-data)
        let mediaSosialObj = perusahaan.media_sosial;
        if (typeof media_sosial !== "undefined") {
            if (media_sosial === "" || media_sosial === null) {
                mediaSosialObj = undefined;
            } else {
                try {
                    if (typeof media_sosial === "string") {
                        mediaSosialObj = JSON.parse(media_sosial);
                    } else {
                        mediaSosialObj = media_sosial;
                    }
                } catch (e) {
                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }
                    return res.status(400).json({ msg: "Format media_sosial tidak valid (harus JSON)" });
                }
            }
        }

        try {
            await Perusahaan.findByIdAndUpdate(perusahaan._id, {
                nama_perusahaan: nama_perusahaan ?? perusahaan.nama_perusahaan,
                nama_brand: nama_brand ?? perusahaan.nama_brand,
                jumlah_karyawan: jumlah_karyawan ?? perusahaan.jumlah_karyawan,
                email_perusahaan: email_perusahaan ?? perusahaan.email_perusahaan,
                alamat: alamat ?? perusahaan.alamat,
                bidang_perusahaan: bidang_perusahaan ?? perusahaan.bidang_perusahaan,
                nomor_telp: nomor_telp ?? perusahaan.nomor_telp,
                logo_perusahaan: logo_perusahaan,
                deskripsi_perusahaan: deskripsi_perusahaan ?? perusahaan.deskripsi_perusahaan,
                website: typeof website !== "undefined" ? website : perusahaan.website,
                media_sosial: typeof mediaSosialObj !== "undefined" ? mediaSosialObj : perusahaan.media_sosial,
                password: hashPassword,
                role: perusahaan.role
            }, { new: true });

            const updatedPerusahaan = await Perusahaan.findById(perusahaan._id);

            res.status(200).json({
                msg: "Perusahaan Updated",
                perusahaan: {
                    _id: updatedPerusahaan._id,
                    nama_perusahaan: updatedPerusahaan.nama_perusahaan,
                    nama_brand: updatedPerusahaan.nama_brand,
                    jumlah_karyawan: updatedPerusahaan.jumlah_karyawan,
                    email_perusahaan: updatedPerusahaan.email_perusahaan,
                    alamat: updatedPerusahaan.alamat,
                    bidang_perusahaan: updatedPerusahaan.bidang_perusahaan,
                    nomor_telp: updatedPerusahaan.nomor_telp,
                    logo_perusahaan: updatedPerusahaan.logo_perusahaan,
                    deskripsi_perusahaan: updatedPerusahaan.deskripsi_perusahaan,
                    website: updatedPerusahaan.website,
                    media_sosial: updatedPerusahaan.media_sosial,
                    role: updatedPerusahaan.role
                }
            });
        } catch (error) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
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

