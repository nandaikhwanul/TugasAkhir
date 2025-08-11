import Nim from "../models/nim.js";
import xlsx from "xlsx";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Helper function to check admin from Bearer token using RS256
function isAdminFromToken(req) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    if (!token) return false;
    try {
        // Load public key for RS256
        const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || path.resolve("public.key");
        let publicKey;
        if (fs.existsSync(publicKeyPath)) {
            publicKey = fs.readFileSync(publicKeyPath, "utf8");
        } else if (process.env.JWT_PUBLIC_KEY) {
            publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
        } else {
            throw new Error("Public key for RS256 not found");
        }
        const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
        return decoded && decoded.role === "admin";
    } catch (err) {
        return false;
    }
}

// Tambah NIM lewat input text (single NIM)
export const tambahNim = async (req, res) => {
    if (!isAdminFromToken(req)) {
        return res.status(403).json({ msg: "Hanya admin yang bisa melakukan aksi ini" });
    }
    try {
        const { nim } = req.body;
        if (!nim) {
            return res.status(400).json({ msg: "NIM wajib diisi" });
        }
        // Cek duplikat
        const existing = await Nim.findOne({ nim });
        if (existing) {
            return res.status(400).json({ msg: "NIM sudah terdaftar" });
        }
        const newNim = new Nim({ nim });
        await newNim.save();
        res.status(201).json({ msg: "NIM berhasil ditambahkan", data: newNim });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Tambah NIM lewat file XLS/XLSX
export const tambahNimXls = async (req, res) => {
    if (!isAdminFromToken(req)) {
        return res.status(403).json({ msg: "Hanya admin yang bisa melakukan aksi ini" });
    }
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "File tidak ditemukan" });
        }
        // Baca file excel
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // Asumsikan NIM ada di kolom pertama, baris pertama adalah header (jika ada)
        let nims = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row && row[0]) {
                nims.push(String(row[0]).trim());
            }
        }
        if (nims.length === 0) {
            return res.status(400).json({ msg: "Tidak ada NIM yang ditemukan di file" });
        }

        // Filter NIM yang sudah ada
        const existingNims = await Nim.find({ nim: { $in: nims } }).select("nim");
        const existingSet = new Set(existingNims.map(n => n.nim));
        const newNims = nims.filter(nim => !existingSet.has(nim));

        // Insert NIM baru
        const inserted = await Nim.insertMany(newNims.map(nim => ({ nim })));
        res.status(201).json({
            msg: "NIM dari file berhasil ditambahkan",
            total: inserted.length,
            data: inserted
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
