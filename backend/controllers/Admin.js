import Admin from '../models/Admin.js';
import Alumni from '../models/Alumni.js';
import Perusahaan from '../models/Perusahaan.js';
import argon2 from "argon2";
import Lowongan from '../models/Lowongan.js';
/**
 * Semua pengecekan admin JWT di controller DIHAPUS,
 * karena sudah dilakukan oleh middleware verifyUser & adminOnly di route.
 */

// Controller untuk admin mengakses semua data alumni (SEMUA FIELD)
export const getAllAlumni = async (req, res) => {
    try {
        // Ambil semua data alumni, semua field
        const alumni = await Alumni.find({});
        res.status(200).json(alumni);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Controller untuk admin mengakses semua data perusahaan
export const getAllPerusahaan = async (req, res) => {
    try {
        // Ambil semua data perusahaan (semua field)
        const perusahaan = await Perusahaan.find({});
        res.status(200).json(perusahaan);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Controller untuk admin mengakses semua data admin
export const getAllAdmin = async (req, res) => {
    try {
        const admin = await Admin.find({});
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Controller untuk register admin
export const registerAdmin = async (req, res) => {
    const { username, email, password, confPassword } = req.body;
    if (!username || !email || !password || !confPassword) {
        return res.status(400).json({ msg: "Semua field harus diisi" });
    }
    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
    }
    try {
        // Cek apakah username sudah ada
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ msg: "Username sudah digunakan" });
        }
        // Cek apakah email sudah ada
        const existingEmail = await Admin.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email sudah digunakan" });
        }
        const hashPassword = await argon2.hash(password);
        await Admin.create({
            username,
            email,
            password: hashPassword,
            role: "admin"
        });
        res.status(201).json({ msg: "Register Admin Berhasil" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Controller untuk admin mengedit data profil alumni
export const updateAlumniProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const alumni = await Alumni.findById(id);
        if (!alumni) {
            return res.status(404).json({ msg: "Alumni tidak ditemukan" });
        }
        Object.assign(alumni, req.body);
        await alumni.save();
        res.status(200).json({ msg: "Profil alumni berhasil diupdate", data: alumni });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Controller untuk admin mengedit data profil perusahaan
export const updatePerusahaanProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const perusahaan = await Perusahaan.findById(id);
        if (!perusahaan) {
            return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
        }
        Object.assign(perusahaan, req.body);
        await perusahaan.save();
        res.status(200).json({ msg: "Profil perusahaan berhasil diupdate", data: perusahaan });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Controller untuk mendapatkan data admin berdasarkan token (/me)
export const getAdminMe = async (req, res) => {
    try {
        // req.userId biasanya di-set oleh middleware autentikasi (verifyUser)
        const admin = await Admin.findById(req.userId).select("-password");
        if (!admin) {
            return res.status(404).json({ msg: "Admin tidak ditemukan" });
        }
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// ========== HANYA ADMIN YANG BISA: Hapus alumni ==========
// (Sudah dipastikan hanya admin lewat middleware adminOnly di route)
export const deleteAlumni = async (req, res) => {
    let alumni;
    try {
        alumni = await Alumni.findById(req.params.id);
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
    if (!alumni) return res.status(404).json({ msg: "Alumni tidak ditemukan" });
    try {
        await Alumni.deleteOne({ _id: alumni._id });
        res.status(200).json({ msg: "Alumni Deleted" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// ========== HANYA ADMIN YANG BISA: Hapus perusahaan ==========
export const deletePerusahaan = async (req, res) => {
    let perusahaan;
    try {
        perusahaan = await Perusahaan.findById(req.params.id);
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
    if (!perusahaan) return res.status(404).json({ msg: "Perusahaan tidak ditemukan" });
    try {
        await Perusahaan.deleteOne({ _id: perusahaan._id });
        res.status(200).json({ msg: "Perusahaan Deleted" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// ========== HANYA ADMIN YANG BISA: Hapus semua lowongan ==========


export const deleteAllLowongan = async (req, res) => {
    try {
        const result = await Lowongan.deleteMany({});
        res.status(200).json({ msg: "Semua lowongan berhasil dihapus", deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

