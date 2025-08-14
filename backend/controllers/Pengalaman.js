import Pengalaman from "../models/pengalaman.js";

// Mendapatkan semua pengalaman milik alumni tertentu
export const getPengalamanByAlumni = async (req, res) => {
    try {
        const alumniId = req.params.alumniId || req.userId;
        if (!alumniId) {
            return res.status(400).json({ msg: "ID alumni wajib diisi" });
        }
        const pengalaman = await Pengalaman.find({ alumni: alumniId }).sort({ tanggal_mulai: -1 });
        res.status(200).json({ msg: "Daftar pengalaman alumni", data: pengalaman });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mendapatkan detail satu pengalaman berdasarkan ID
export const getPengalamanById = async (req, res) => {
    try {
        const pengalaman = await Pengalaman.findById(req.params.id);
        if (!pengalaman) {
            return res.status(404).json({ msg: "Pengalaman tidak ditemukan" });
        }
        res.status(200).json({ msg: "Detail pengalaman", data: pengalaman });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Membuat pengalaman baru
export const createPengalaman = async (req, res) => {
    try {
        const {
            jenis,
            nama,
            posisi,
            lokasi,
            deskripsi,
            tanggal_mulai,
            tanggal_selesai,
            masih_berjalan
        } = req.body;

        if (!jenis || !nama || !posisi || !tanggal_mulai) {
            return res.status(400).json({ msg: "Field wajib diisi: jenis, nama, posisi, tanggal_mulai" });
        }

        const pengalaman = new Pengalaman({
            alumni: req.userId,
            jenis,
            nama,
            posisi,
            lokasi,
            deskripsi,
            tanggal_mulai,
            tanggal_selesai,
            masih_berjalan
        });

        await pengalaman.save();
        res.status(201).json({ msg: "Pengalaman berhasil ditambahkan", data: pengalaman });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mengupdate pengalaman berdasarkan ID
export const updatePengalaman = async (req, res) => {
    try {
        const pengalaman = await Pengalaman.findById(req.params.id);
        if (!pengalaman) {
            return res.status(404).json({ msg: "Pengalaman tidak ditemukan" });
        }
        // Pastikan hanya pemilik yang bisa update
        if (pengalaman.alumni.toString() !== req.userId) {
            return res.status(403).json({ msg: "Tidak diizinkan mengubah pengalaman ini" });
        }

        const updateFields = [
            "jenis",
            "nama",
            "posisi",
            "lokasi",
            "deskripsi",
            "tanggal_mulai",
            "tanggal_selesai",
            "masih_berjalan"
        ];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                pengalaman[field] = req.body[field];
            }
        });

        await pengalaman.save();
        res.status(200).json({ msg: "Pengalaman berhasil diupdate", data: pengalaman });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Menghapus pengalaman berdasarkan ID
export const deletePengalaman = async (req, res) => {
    try {
        const pengalaman = await Pengalaman.findById(req.params.id);
        if (!pengalaman) {
            return res.status(404).json({ msg: "Pengalaman tidak ditemukan" });
        }
        // Pastikan hanya pemilik yang bisa hapus
        if (pengalaman.alumni.toString() !== req.userId) {
            return res.status(403).json({ msg: "Tidak diizinkan menghapus pengalaman ini" });
        }
        await Pengalaman.deleteOne({ _id: req.params.id });
        res.status(200).json({ msg: "Pengalaman berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mendapatkan pengalaman berdasarkan ID untuk perusahaan (read-only, tanpa cek kepemilikan)
export const getPengalamanByIdForPerusahaan = async (req, res) => {
    try {
        // Populate field alumni untuk mengambil data alumni terkait
        const pengalaman = await Pengalaman.findById(req.params.id).populate('alumni');
        if (!pengalaman) {
            return res.status(404).json({ msg: "Pengalaman tidak ditemukan" });
        }

        // Cocokkan id alumni di field pengalaman dengan id alumni di model Alumni
        if (
            !pengalaman.alumni ||
            pengalaman.alumni._id.toString() !== pengalaman.alumni._id.toString()
        ) {
            // Secara logika, ini selalu true jika populate berhasil, tapi bisa ditambah validasi lain jika perlu
            return res.status(400).json({ msg: "Relasi alumni pada pengalaman tidak valid" });
        }

        res.status(200).json({ data: pengalaman });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

