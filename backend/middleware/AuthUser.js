import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import Alumni from "../models/Alumni.js";
import Perusahaan from "../models/Perusahaan.js";
import Admin from "../models/Admin.js";

// Untuk menyimpan daftar token yang sudah di-blacklist (misal setelah logout)
const blacklistedTokens = new Set();

// Load public key untuk verifikasi JWT (RS256)
let PUBLIC_KEY;
try {
    // Pastikan path sesuai dengan lokasi file public.key Anda
    PUBLIC_KEY = fs.readFileSync(path.resolve("public.key"), "utf8");
} catch (err) {
    console.error("Gagal membaca public.key:", err.message);
    PUBLIC_KEY = null;
}

// Fungsi untuk blacklist token (panggil saat logout)
export const blacklistToken = (token) => {
    blacklistedTokens.add(token);
};

// Fungsi destroy token ketika logout (ambil token dari header Authorization)
export const destroyToken = async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ msg: "Token tidak ditemukan di header Authorization" });
    }
    const token = authHeader.split(' ')[1];

    // Jika token sudah di-blacklist, tidak bisa logout lagi
    if (blacklistedTokens.has(token)) {
        return res.status(400).json({ msg: "Anda sudah logout, token sudah tidak berlaku." });
    }

    // Verifikasi token untuk mendapatkan payload (role dan id)
    if (!PUBLIC_KEY) {
        return res.status(500).json({ msg: "Server error: public key tidak ditemukan" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
    } catch (err) {
        return res.status(401).json({ msg: "Token tidak valid atau kadaluarsa" });
    }

    // Hapus token di database sesuai role user
    try {
        if (decoded.role === "alumni") {
            await Alumni.updateOne(
                { _id: decoded.id || decoded._id, token: token },
                { $set: { token: null } }
            );
        } else if (decoded.role === "perusahaan") {
            await Perusahaan.updateOne(
                { _id: decoded.id || decoded._id, token: token },
                { $set: { token: null } }
            );
        } else if (decoded.role === "admin") {
            // Model Admin kemungkinan tidak punya field token, tapi jika ada:
            await Admin.updateOne(
                { _id: decoded.id || decoded._id, token: token },
                { $set: { token: null } }
            );
        }
    } catch (err) {
        return res.status(500).json({ msg: "Gagal menghapus token di database: " + err.message });
    }

    blacklistToken(token);
    return res.status(200).json({ msg: "Token berhasil dihapus (logout berhasil)" });
};

// Middleware untuk verifikasi user login (menggunakan Bearer JWT, RS256)
export const verifyUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "Mohon login ke akun Anda!" });
    }
    const token = authHeader.split(' ')[1];

    // Cek apakah token sudah di-blacklist (misal setelah logout)
    if (blacklistedTokens.has(token)) {
        return res.status(401).json({ msg: "Token sudah tidak berlaku, silakan login kembali." });
    }

    if (!PUBLIC_KEY) {
        return res.status(500).json({ msg: "Server error: public key tidak ditemukan" });
    }

    try {
        const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
        req.user = decoded;
        req.userId = decoded.id || decoded._id;
        req.role = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token tidak valid atau kadaluarsa" });
    }
};

// Middleware hanya untuk admin
export const adminOnly = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ msg: "Mohon login ke akun Anda!" });
    }
    if (req.user.role !== "admin") {
        return res.status(403).json({ msg: "Akses terlarang, hanya admin yang dapat mengakses." });
    }
    next();
};

// Middleware hanya untuk alumni
export const alumniOnly = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ msg: "Mohon login ke akun Anda!" });
    }
    if (req.user.role !== "alumni") {
        return res.status(403).json({ msg: "Akses terlarang, hanya alumni yang dapat mengakses." });
    }
    next();
};

// Middleware hanya untuk perusahaan
export const perusahaanOnly = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ msg: "Mohon login ke akun Anda!" });
    }
    if (req.user.role !== "perusahaan") {
        return res.status(403).json({ msg: "Akses terlarang, hanya perusahaan yang dapat mengakses." });
    }
    next();
};

// Endpoint /protected untuk menguji akses token dari frontend
// Hanya bisa diakses jika token valid (menggunakan verifyUser)
export const protectedRoute = (req, res) => {
    // req.user sudah diisi oleh verifyUser
    return res.status(200).json({
        msg: "Akses ke endpoint /protected berhasil. Token valid.",
        user: req.user
    });
};
