import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Load public key untuk verifikasi JWT (RS256)
let PUBLIC_KEY;
try {
    PUBLIC_KEY = fs.readFileSync(path.resolve("public.key"), "utf8");
} catch (err) {
    console.error("Gagal membaca public.key:", err.message);
    PUBLIC_KEY = null;
}

// Middleware untuk memastikan user yang login adalah perusahaan
const authPerusahaan = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "Mohon login ke akun Anda!" });
    }
    const token = authHeader.split(' ')[1];

    if (!PUBLIC_KEY) {
        return res.status(500).json({ msg: "Server error: public key tidak ditemukan" });
    }

    try {
        const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
        req.user = decoded;
        req.userId = decoded.id || decoded._id;
        req.role = decoded.role;
        if (req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat melakukan aksi ini" });
        }
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token tidak valid atau kadaluarsa" });
    }
};

// Middleware untuk memastikan user yang login adalah alumni (hanya alumni yang bisa melamar)
const authAlumni = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "User belum login atau token tidak valid." });
    }
    const token = authHeader.split(' ')[1];

    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "Server error: public key tidak ditemukan" });
    }

    try {
        const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
        // Pastikan payload memiliki _id dan role alumni
        if (!decoded || (!decoded._id && !decoded.id) || decoded.role !== "alumni") {
            return res.status(403).json({ message: "Hanya alumni yang dapat melakukan aksi ini" });
        }
        req.user = decoded;
        req.userId = decoded._id || decoded.id;
        req.role = decoded.role;
        next();
    } catch (err) {
        let errorMsg = "Token tidak valid atau kadaluarsa";
        if (err && err.message && err.message.includes("jwt expired")) {
            errorMsg = "Sesi login Anda telah berakhir. Silakan login kembali.";
        }
        return res.status(401).json({ message: errorMsg });
    }
};

export { authPerusahaan, authAlumni };
