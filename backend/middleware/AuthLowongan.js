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

// Middleware untuk memastikan hanya perusahaan yang bisa membuat lowongan, dengan verifikasi token Authorization
const authPerusahaanLowongan = (req, res, next) => {
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
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat membuat lowongan" });
        }
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token tidak valid atau kadaluarsa" });
    }
};

// Middleware untuk memastikan hanya admin yang bisa melakukan verifikasi lowongan
const authAdminVerifikasiLowongan = (req, res, next) => {
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
        if (req.user.role !== "admin") {
            return res.status(403).json({ msg: "Hanya admin yang dapat memverifikasi lowongan" });
        }
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token tidak valid atau kadaluarsa" });
    }
};

// Middleware untuk memastikan hanya perusahaan yang bisa update status lowongan ke "closed"
const authPerusahaanUpdateStatusLowongan = (req, res, next) => {
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
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat mengubah status lowongan" });
        }
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token tidak valid atau kadaluarsa" });
    }
};


// Middleware untuk memastikan user yang login adalah alumni (agar alumni bisa mengirimkan token dan request)
const authAlumniLowongan = (req, res, next) => {
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
        if (req.user.role !== "alumni") {
            return res.status(403).json({ msg: "Hanya alumni yang dapat melakukan aksi ini" });
        }
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token tidak valid atau kadaluarsa" });
    }
};

export { authPerusahaanLowongan, authAdminVerifikasiLowongan, authPerusahaanUpdateStatusLowongan, authAlumniLowongan };
