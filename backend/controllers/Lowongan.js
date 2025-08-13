import Lowongan from "../models/Lowongan.js";
import { spawn } from "child_process";
import Pelamar from "../models/Pelamar.js";

// Create Lowongan (Input) - hanya bisa dibuat oleh role perusahaan
export const createLowongan = async (req, res) => {
    try {
        // Cek role user, hanya perusahaan yang boleh membuat lowongan
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat membuat lowongan" });
        }

        const {
            judul_pekerjaan,
            deskripsi,
            kualifikasi,
            lokasi,
            tipe_kerja,
            gaji,
            batas_lamaran,
            batas_pelamar // tambahkan batas_pelamar dari body
        } = req.body;

        // Validasi batas_pelamar wajib diisi dan harus number positif
        if (typeof batas_pelamar !== "number" || batas_pelamar <= 0) {
            return res.status(400).json({ msg: "batas_pelamar wajib diisi dan harus berupa angka positif" });
        }

        // Pastikan id perusahaan diambil dari req.user._id atau req.user.id
        const perusahaanId = req.user._id || req.user.id;
        if (!perusahaanId) {
            return res.status(400).json({ msg: "ID perusahaan tidak ditemukan pada token." });
        }

        // Set status ke "pending_verification" saat dibuat
        const newLowongan = new Lowongan({
            judul_pekerjaan,
            deskripsi,
            kualifikasi,
            lokasi,
            tipe_kerja,
            gaji,
            batas_lamaran,
            batas_pelamar, // simpan batas_pelamar
            // jumlah_pelamar tidak perlu diisi di sini, biarkan default 0 dari schema
            status: "pending_verification", // status default menunggu verifikasi admin
            perusahaan: perusahaanId // pastikan id perusahaan terisi dengan benar
        });

        await newLowongan.save();
        res.status(201).json({
            msg: "Terima kasih, postingan Anda akan diverifikasi oleh admin sebelum dipublikasikan.",
            lowongan: newLowongan
        });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Edit Lowongan (hanya perusahaan yang bisa update, dan hanya field tertentu, status tidak bisa diubah langsung)
export const updateLowongan = async (req, res) => {
    try {
        // Hanya perusahaan yang boleh update lowongan
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat mengubah lowongan" });
        }

        // Ambil id perusahaan dari token user
        const perusahaanId = req.user._id || req.user.id;
        if (!perusahaanId) {
            return res.status(400).json({ msg: "ID perusahaan tidak ditemukan pada token." });
        }

        // Cari lowongan berdasarkan id dan pastikan perusahaan pembuatnya sesuai
        const lowongan = await Lowongan.findById(req.params.id);
        if (!lowongan) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan" });
        }
        if (String(lowongan.perusahaan) !== String(perusahaanId)) {
            return res.status(403).json({ msg: "Anda tidak berhak mengedit lowongan ini" });
        }

        // Tidak boleh mengubah status lewat endpoint ini
        const {
            judul_pekerjaan,
            deskripsi,
            kualifikasi,
            lokasi,
            tipe_kerja,
            gaji,
            batas_lamaran,
            batas_pelamar // tambahkan batas_pelamar ke update
        } = req.body;

        // Update field yang diizinkan
        lowongan.judul_pekerjaan = judul_pekerjaan ?? lowongan.judul_pekerjaan;
        lowongan.deskripsi = deskripsi ?? lowongan.deskripsi;
        lowongan.kualifikasi = kualifikasi ?? lowongan.kualifikasi;
        lowongan.lokasi = lokasi ?? lowongan.lokasi;
        lowongan.tipe_kerja = tipe_kerja ?? lowongan.tipe_kerja;
        lowongan.gaji = gaji ?? lowongan.gaji;
        lowongan.batas_lamaran = batas_lamaran ?? lowongan.batas_lamaran;
        if (batas_pelamar !== undefined) {
            // Validasi batas_pelamar jika diupdate
            if (typeof batas_pelamar !== "number" || batas_pelamar <= 0) {
                return res.status(400).json({ msg: "batas_pelamar harus berupa angka positif" });
            }
            lowongan.batas_pelamar = batas_pelamar;
        }

        // Jika lowongan sudah diverifikasi (status open) atau ditolak, ubah status kembali ke pending_verification
        if (lowongan.status === "open" || lowongan.status === "rejected") {
            lowongan.status = "pending_verification";
        }

        await lowongan.save();

        res.status(200).json({ msg: "Lowongan berhasil diupdate. Akan diverifikasi ulang oleh admin.", lowongan });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Delete Lowongan (hanya perusahaan yang membuat lowongan yang bisa hapus)
export const deleteLowongan = async (req, res) => {
    try {
        // Hanya perusahaan yang boleh hapus lowongan
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat menghapus lowongan" });
        }

        // Ambil id perusahaan dari token user (support _id dan id)
        const perusahaanId = req.user._id || req.user.id;
        if (!perusahaanId) {
            return res.status(400).json({ msg: "ID perusahaan tidak ditemukan pada token." });
        }

        // Cari lowongan berdasarkan id
        const lowongan = await Lowongan.findById(req.params.id);
        if (!lowongan) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan" });
        }

        // Pastikan field perusahaan pada lowongan sudah di-populate atau string id
        // Jika lowongan.perusahaan adalah ObjectId, convert ke string
        // Jika lowongan.perusahaan adalah object (populated), ambil _id
        let lowonganPerusahaanId = lowongan.perusahaan;
        if (typeof lowonganPerusahaanId === "object" && lowonganPerusahaanId !== null) {
            lowonganPerusahaanId = lowonganPerusahaanId._id || lowonganPerusahaanId.id;
        }

        if (String(lowonganPerusahaanId) !== String(perusahaanId)) {
            return res.status(403).json({ msg: "Anda tidak berhak menghapus lowongan ini" });
        }

        await Lowongan.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: "Lowongan berhasil dihapus" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Verifikasi Lowongan oleh Admin berdasarkan ID Lowongan
export const verifikasiLowongan = async (req, res) => {
    try {
        // Hanya admin yang bisa verifikasi atau reject
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ msg: "Hanya admin yang dapat memproses verifikasi atau penolakan lowongan" });
        }

        const { id } = req.params; // id lowongan
        const { action, alasan_penolakan } = req.body; // action: "approve" atau "reject"

        const lowongan = await Lowongan.findById(id);
        if (!lowongan) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan" });
        }

        // Hanya bisa diproses jika status masih pending_verification
        if (lowongan.status !== "pending_verification") {
            return res.status(400).json({ msg: "Lowongan sudah diproses atau status tidak valid" });
        }

        if (action === "approve") {
            lowongan.status = "open";
            await lowongan.save();
            return res.status(200).json({ msg: "Lowongan berhasil diverifikasi dan sekarang sudah terbuka", lowongan });
        } else if (action === "reject") {
            lowongan.status = "rejected";
            // Simpan alasan penolakan jika ada (opsional, tambahkan field di model jika ingin menyimpan)
            if (alasan_penolakan) {
                lowongan.alasan_penolakan = alasan_penolakan;
            }
            await lowongan.save();
            return res.status(200).json({ msg: "Lowongan berhasil ditolak", lowongan });
        } else {
            return res.status(400).json({ msg: "Action tidak valid. Gunakan 'approve' atau 'reject'." });
        }
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Update Status Lowongan (perusahaan bisa open dan close lowongan, admin tidak bisa update status lowongan)
export const updateStatusLowongan = async (req, res) => {
    try {
        // Hanya perusahaan yang boleh update status lowongan
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat mengubah status lowongan" });
        }

        const { status } = req.body;
        // Perusahaan hanya boleh mengubah status ke "open" atau "closed"
        if (status !== "open" && status !== "closed") {
            return res.status(400).json({ msg: "Perusahaan hanya dapat mengubah status ke 'open' atau 'closed'" });
        }

        const lowongan = await Lowongan.findById(req.params.id);
        if (!lowongan) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan" });
        }

        // Pastikan field perusahaan pada dokumen lowongan benar-benar terisi
        if (!lowongan.perusahaan) {
            return res.status(403).json({ msg: "Lowongan tidak memiliki perusahaan yang terdaftar" });
        }

        // Pastikan perbandingan id perusahaan dan user sebagai string (untuk menghindari perbedaan tipe data)
        const perusahaanLowonganId = lowongan.perusahaan.toString();
        const userId = req.user._id ? req.user._id.toString() : req.user.id?.toString();

        if (!userId || perusahaanLowonganId !== userId) {
            return res.status(403).json({ msg: "Anda tidak berhak mengubah status lowongan ini" });
        }

        // Hanya bisa ubah status jika lowongan sudah diverifikasi (status open/closed)
        if (lowongan.status !== "open" && lowongan.status !== "closed") {
            return res.status(400).json({ msg: "Status lowongan hanya bisa diubah jika status saat ini 'open' atau 'closed'" });
        }

        // Tidak bisa mengubah ke open jika status saat ini bukan closed
        if (status === "open" && lowongan.status !== "closed") {
            return res.status(400).json({ msg: "Status lowongan hanya bisa diubah ke 'open' jika status saat ini 'closed'" });
        }

        // Tidak bisa mengubah ke closed jika status saat ini bukan open
        if (status === "closed" && lowongan.status !== "open") {
            return res.status(400).json({ msg: "Status lowongan hanya bisa diubah ke 'closed' jika status saat ini 'open'" });
        }

        lowongan.status = status;
        await lowongan.save();

        res.status(200).json({ msg: `Status lowongan berhasil diubah menjadi '${status}'`, lowongan });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// getAllLowongan khusus untuk alumni (hanya alumni yang bisa akses, dan rekomendasi hanya untuk alumni)
export const getAllLowongan = async (req, res) => {
    try {
        // Hanya alumni yang boleh mengakses endpoint ini
        if (!req.user || req.user.role !== "alumni") {
            return res.status(403).json({ msg: "Hanya alumni yang dapat mengakses daftar lowongan ini" });
        }

        // Ambil semua lowongan (bisa diubah jika ingin filter status open saja)
        const lowonganList = await Lowongan.find().populate("perusahaan", "nama_perusahaan logo_perusahaan");

        // Jika ada query rekomendasi untuk alumni tertentu, jalankan mesin.py
        const { rekomendasi_alumni_id, top_n } = req.query;
        if (rekomendasi_alumni_id) {
            // Pastikan alumni yang meminta rekomendasi adalah dirinya sendiri
            if (String(req.user._id) !== String(rekomendasi_alumni_id)) {
                return res.status(403).json({ msg: "Anda hanya dapat meminta rekomendasi untuk akun Anda sendiri" });
            }

            // Siapkan data alumni dan lowongan untuk dikirim ke Python
            const Alumni = (await import("../models/Alumni.js")).default;
            const alumniList = await Alumni.find({}, "_id program_studi").lean();
            // Format lowongan agar kualifikasi selalu array of string
            const lowonganListForPy = lowonganList.map(l => ({
                _id: l._id.toString(),
                judul_pekerjaan: l.judul_pekerjaan,
                kualifikasi: Array.isArray(l.kualifikasi) ? l.kualifikasi : [l.kualifikasi]
            }));

            // Siapkan input untuk Python (JSON string)
            const inputData = JSON.stringify({
                alumni_list: alumniList,
                lowongan_list: lowonganListForPy,
                alumni_id: rekomendasi_alumni_id,
                top_n: top_n ? parseInt(top_n) : 5
            });

            // Jalankan mesin.py dengan child_process
            const py = spawn("python3", ["MachineLearning/mesin.py"]);
            let pyData = "";
            let pyErr = "";

            py.stdin.write(inputData);
            py.stdin.end();

            py.stdout.on("data", (data) => {
                pyData += data.toString();
            });

            py.stderr.on("data", (data) => {
                pyErr += data.toString();
            });

            py.on("close", (code) => {
                // Tambahkan console log untuk debugging
                console.log("Python process exited with code:", code);
                console.log("Python stdout:", pyData);
                console.log("Python stderr:", pyErr);

                if (code !== 0 || pyErr) {
                    return res.status(500).json({ msg: "Gagal menjalankan rekomendasi Python", error: pyErr });
                }
                try {
                    const rekomendasi = JSON.parse(pyData);
                    return res.status(200).json({ rekomendasi });
                } catch (e) {
                    return res.status(500).json({ msg: "Gagal parsing hasil rekomendasi", error: e.message });
                }
            });
        } else {
            // Default: tampilkan semua lowongan
            res.status(200).json(lowonganList);
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};


// Preview Lowongan untuk Alumni, field deskripsi sekarang dikirim ke frontend
export const previewLowonganForAlumni = async (req, res) => {
    try {
        // Pastikan user adalah alumni
        if (!req.user || req.user.role !== "alumni") {
            return res.status(403).json({ msg: "Hanya alumni yang dapat mengakses preview lowongan" });
        }

        // Ambil id lowongan dari query atau params
        const lowonganId = req.query.id || req.params.id;
        if (!lowonganId) {
            return res.status(400).json({ msg: "ID lowongan harus disediakan di query (?id=...)" });
        }

        // Cari lowongan dengan status "open" dan id sesuai
        const l = await Lowongan.findOne({ _id: lowonganId, status: "open" })
            .populate("perusahaan", "nama_perusahaan logo_perusahaan bidang_perusahaan");

        if (!l) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan atau tidak tersedia untuk alumni" });
        }

        // Format preview: info penting + deskripsi + jumlah_pelamar + batas_pelamar
        const preview = {
            _id: l._id,
            judul_pekerjaan: l.judul_pekerjaan,
            deskripsi: l.deskripsi, // field deskripsi sekarang dikirim ke frontend
            kualifikasi: l.kualifikasi, // tambahkan kualifikasi ke preview
            perusahaan: l.perusahaan ? {
                _id: l.perusahaan._id,
                nama_perusahaan: l.perusahaan.nama_perusahaan,
                logo_perusahaan: l.perusahaan.logo_perusahaan,
                bidang_perusahaan: l.perusahaan.bidang_perusahaan
            } : null,
            lokasi: l.lokasi,
            tipe_kerja: l.tipe_kerja,
            gaji: l.gaji,
            batas_lamaran: l.batas_lamaran,
            status: l.status,
            createdAt: l.createdAt,
            jumlah_pelamar: l.jumlah_pelamar, // tambahkan jumlah_pelamar
            batas_pelamar: l.batas_pelamar // tambahkan batas_pelamar
        };

        res.status(200).json({ preview });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mendapatkan daftar lowongan yang masih pending_verification, hanya bisa diakses admin
export const getPendingLowonganForAdmin = async (req, res) => {
    try {
        // Hanya admin yang boleh mengakses
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ msg: "Hanya admin yang dapat melihat daftar lowongan pending" });
        }

        // Cari semua lowongan dengan status pending_verification
        const pendingLowongan = await Lowongan.find({ status: "pending_verification" })
            .populate("perusahaan", "nama_perusahaan logo_perusahaan bidang_perusahaan");

        res.status(200).json({ pendingLowongan });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mendapatkan daftar lowongan yang dibuat oleh perusahaan yang sedang login
export const getLowonganByPerusahaan = async (req, res) => {
    try {
        // Hanya perusahaan yang boleh mengakses
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat melihat daftar lowongan miliknya" });
        }

        // Cari semua lowongan yang dibuat oleh perusahaan ini
        const lowonganList = await Lowongan.find({ perusahaan: req.user.id })
            .populate("perusahaan", "nama_perusahaan logo_perusahaan bidang_perusahaan");

        res.status(200).json({ lowongan: lowonganList });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mendapatkan satu lowongan spesifik milik perusahaan yang sedang login
export const getLowonganPerusahaanById = async (req, res) => {
    try {
        // Hanya perusahaan yang boleh mengakses
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat melihat detail lowongan miliknya" });
        }

        const lowonganId = req.params.id || req.query.id;
        if (!lowonganId) {
            return res.status(400).json({ msg: "ID lowongan harus disediakan di params atau query (?id=...)" });
        }

        // Cari lowongan dengan id dan perusahaan sesuai user login
        const lowongan = await Lowongan.findOne({ _id: lowonganId, perusahaan: req.user.id })
            .populate("perusahaan", "nama_perusahaan logo_perusahaan bidang_perusahaan");

        if (!lowongan) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan atau bukan milik perusahaan Anda" });
        }

        res.status(200).json({ lowongan });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};



// Menerima pelamar (hanya perusahaan pemilik lowongan yang bisa menerima pelamar)
// Menerima atau menolak pelamar (hanya perusahaan pemilik lowongan yang bisa menerima/menolak pelamar)
export const terimaPelamar = async (req, res) => {
    try {
        // Ambil pelamarId dari params, lowonganId dari body
        const { pelamarId } = req.params;
        const { lowonganId } = req.body;

        // Validasi input
        if (!pelamarId || !lowonganId) {
            return res.status(400).json({ msg: "pelamarId dan lowonganId wajib diisi" });
        }

        // Cari data pelamar berdasarkan _id dan lowongan, populate lowongan dan alumni
        const pelamar = await Pelamar.findOne({ _id: pelamarId, lowongan: lowonganId })
            .populate("lowongan")
            .populate("alumni", "_id nama email");

        if (!pelamar) {
            return res.status(404).json({ msg: "Pelamar tidak ditemukan untuk lowongan ini" });
        }

        // Pastikan user adalah perusahaan dan pemilik lowongan
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat memproses pelamar" });
        }
        if (!pelamar.lowongan || pelamar.lowongan.perusahaan.toString() !== req.user.id) {
            return res.status(403).json({ msg: "Anda tidak berhak memproses pelamar untuk lowongan ini" });
        }

        // Proses terima pelamar
        pelamar.status = "diterima";
        await pelamar.save();

        // Tambahkan update jumlah_pelamar pada lowongan terkait
        if (pelamar.lowongan && pelamar.lowongan._id) {
            await Lowongan.findByIdAndUpdate(
                pelamar.lowongan._id,
                { $inc: { jumlah_pelamar: 1 } }
            );
        }

        // Kembalikan data pelamar beserta id alumni yang melamar
        res.status(200).json({
            msg: "Pelamar berhasil diterima",
            pelamar: {
                _id: pelamar._id,
                status: pelamar.status,
                lowongan: pelamar.lowongan ? pelamar.lowongan._id : null,
                alumni: pelamar.alumni ? {
                    _id: pelamar.alumni._id,
                    nama: pelamar.alumni.nama,
                    email: pelamar.alumni.email
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi terpisah untuk tolak pelamar dan hapus data pelamarnya
export const tolakPelamar = async (req, res) => {
    try {
        const { pelamarId } = req.params;
        const { lowonganId } = req.body;

        if (!pelamarId || !lowonganId) {
            return res.status(400).json({ msg: "pelamarId dan lowonganId wajib diisi" });
        }

        // Cari data pelamar berdasarkan _id dan lowongan, populate lowongan dan alumni
        const pelamar = await Pelamar.findOne({ _id: pelamarId, lowongan: lowonganId })
            .populate("lowongan")
            .populate("alumni", "_id nama email");

        if (!pelamar) {
            return res.status(404).json({ msg: "Pelamar tidak ditemukan untuk lowongan ini" });
        }

        // Pastikan user adalah perusahaan dan pemilik lowongan
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat memproses pelamar" });
        }
        if (!pelamar.lowongan || pelamar.lowongan.perusahaan.toString() !== req.user.id) {
            return res.status(403).json({ msg: "Anda tidak berhak memproses pelamar untuk lowongan ini" });
        }

        // Hapus data pelamar
        await Pelamar.deleteOne({ _id: pelamarId });

        // Kurangi jumlah_pelamar pada lowongan terkait jika jumlah_pelamar > 0
        if (pelamar.lowongan && pelamar.lowongan._id) {
            await Lowongan.findByIdAndUpdate(
                pelamar.lowongan._id,
                { $inc: { jumlah_pelamar: -1 } }
            );
        }

        res.status(200).json({
            msg: "Pelamar berhasil ditolak dan data pelamar dihapus",
            pelamar: {
                _id: pelamar._id,
                lowongan: pelamar.lowongan ? pelamar.lowongan._id : null,
                alumni: pelamar.alumni ? {
                    _id: pelamar.alumni._id,
                    nama: pelamar.alumni.nama,
                    email: pelamar.alumni.email
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi untuk search lowongan berdasarkan query string pada semua field utama lowongan + nama_perusahaan (relasi)
export const searchLowongan = async (req, res) => {
    try {
        const { q } = req.query;
        const regex = q && typeof q === "string" && q.trim() !== "" ? new RegExp(q, "i") : null;

        // Gunakan aggregation agar pencarian nama_perusahaan dilakukan di MongoDB, bukan di JS
        const pipeline = [
            // Hanya status open
            { $match: { status: "open" } },
            // Join perusahaan
            {
                $lookup: {
                    from: "perusahaans", // nama koleksi di MongoDB (biasanya jamak dan lowercase)
                    localField: "perusahaan",
                    foreignField: "_id",
                    as: "perusahaan"
                }
            },
            // Unwind perusahaan agar field jadi objek, bukan array
            { $unwind: { path: "$perusahaan", preserveNullAndEmptyArrays: true } }
        ];

        if (regex) {
            pipeline.push({
                $match: {
                    $or: [
                        { judul_pekerjaan: { $regex: regex } },
                        { lokasi: { $regex: regex } },
                        { tipe_kerja: { $regex: regex } },
                        // kualifikasi bisa array atau string
                        { kualifikasi: { $regex: regex } },
                        { kualifikasi: { $elemMatch: { $regex: regex } } },
                        // Cari di nama_perusahaan (relasi)
                        { "perusahaan.nama_perusahaan": { $regex: regex } }
                    ]
                }
            });
        }

        // Hanya ambil field yang diperlukan (optional, bisa dihapus jika ingin semua)
        pipeline.push({
            $project: {
                judul_pekerjaan: 1,
                kualifikasi: 1,
                lokasi: 1,
                tipe_kerja: 1,
                gaji: 1,
                batas_lamaran: 1,
                status: 1,
                alasan_penolakan: 1,
                createdAt: 1,
                updatedAt: 1,
                jumlah_pelamar: 1,
                batas_pelamar: 1,
                perusahaan: {
                    _id: "$perusahaan._id",
                    nama_perusahaan: "$perusahaan.nama_perusahaan",
                    email: "$perusahaan.email",
                    logo_perusahaan: "$perusahaan.logo_perusahaan"
                }
            }
        });

        const lowongans = await Lowongan.aggregate(pipeline);

        res.status(200).json(lowongans);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Preview Lowongan untuk Admin, bisa melihat semua status dan detail
export const previewLowonganForAdmin = async (req, res) => {
    try {
        // Pastikan user adalah admin
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ msg: "Hanya admin yang dapat mengakses preview lowongan ini" });
        }

        // Ambil id lowongan dari query atau params
        const lowonganId = req.query.id || req.params.id;
        if (!lowonganId) {
            return res.status(400).json({ msg: "ID lowongan harus disediakan di query (?id=...)" });
        }

        // Cari lowongan dengan id sesuai (admin bisa lihat semua status)
        const l = await Lowongan.findOne({ _id: lowonganId })
            .populate("perusahaan", "nama_perusahaan logo_perusahaan bidang_perusahaan email");

        if (!l) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan" });
        }

        // Format preview: info penting + deskripsi + status + jumlah_pelamar + batas_pelamar
        const preview = {
            _id: l._id,
            judul_pekerjaan: l.judul_pekerjaan,
            deskripsi: l.deskripsi,
            kualifikasi: l.kualifikasi,
            perusahaan: l.perusahaan ? {
                _id: l.perusahaan._id,
                nama_perusahaan: l.perusahaan.nama_perusahaan,
                logo_perusahaan: l.perusahaan.logo_perusahaan,
                bidang_perusahaan: l.perusahaan.bidang_perusahaan,
                email: l.perusahaan.email
            } : null,
            lokasi: l.lokasi,
            tipe_kerja: l.tipe_kerja,
            gaji: l.gaji,
            batas_lamaran: l.batas_lamaran,
            status: l.status,
            alasan_penolakan: l.alasan_penolakan || null,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
            jumlah_pelamar: l.jumlah_pelamar,
            batas_pelamar: l.batas_pelamar
        };

        res.status(200).json({ preview });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi untuk menghitung jumlah lowongan aktif saat ini dan yang dibuat sejak 7 hari terakhir (status open)
export const countActiveLowonganByPerusahaanSinceLastWeek = async (req, res) => {
    try {
        // Pastikan user login dan role perusahaan
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat mengakses data ini" });
        }
        const perusahaanId = req.user._id || req.user.id;
        if (!perusahaanId) {
            return res.status(400).json({ msg: "ID perusahaan tidak ditemukan pada token." });
        }
        // Hitung tanggal 7 hari lalu
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Hitung jumlah lowongan aktif (status open) saat ini
        const jumlah_lowongan_aktif = await Lowongan.countDocuments({
            status: "open",
            perusahaan: perusahaanId
        });

        // Hitung jumlah lowongan aktif (status open) yang dibuat sejak 7 hari terakhir
        const jumlah_lowongan_aktif_sejak_minggu_lalu = await Lowongan.countDocuments({
            status: "open",
            perusahaan: perusahaanId,
            createdAt: { $gte: sevenDaysAgo }
        });

        res.status(200).json({
            jumlah_lowongan_aktif,
            jumlah_lowongan_aktif_sejak_minggu_lalu
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi untuk menghitung total traffic dan pertumbuhan traffic semua lowongan milik perusahaan
// Endpoint: GET /lowongan/:id/traffic (tapi diubah: ambil semua lowongan milik perusahaan, bukan hanya satu lowongan)
export const getLowonganTraffic = async (req, res) => {
    try {
        // Hanya perusahaan yang boleh melihat traffic
        if (!req.user || req.user.role !== "perusahaan") {
            return res.status(403).json({ msg: "Hanya perusahaan yang dapat mengakses data traffic lowongan." });
        }

        const perusahaanId = req.user._id ? req.user._id.toString() : req.user.id?.toString();
        if (!perusahaanId) {
            return res.status(400).json({ msg: "ID perusahaan tidak ditemukan pada token." });
        }

        // Ambil semua lowongan milik perusahaan
        const lowongans = await Lowongan.find({ perusahaan: perusahaanId });

        // Jika tidak ada lowongan
        if (!lowongans || lowongans.length === 0) {
            return res.status(200).json({
                total_traffic_hari_ini: 0,
                total_traffic_kemarin: 0,
                pertambahan_traffic: 0,
                persentase_pertambahan: 0,
                detail: []
            });
        }

        // Karena tidak ada log harian traffic, kita tidak bisa menghitung traffic kemarin secara akurat.
        // Jadi, tampilkan total traffic saat ini, dan info dummy untuk pertambahan dan persentase.

        // Total traffic semua lowongan milik perusahaan
        const total_traffic_hari_ini = lowongans.reduce((sum, l) => sum + (typeof l.traffic === "number" ? l.traffic : 0), 0);

        // Dummy: traffic kemarin = traffic hari ini - 8% (anggap pertumbuhan 8% per hari, hanya untuk simulasi)
        // (Karena tidak ada log harian, ini hanya ilustrasi)
        const total_traffic_kemarin = Math.round(total_traffic_hari_ini / 1.08);

        const pertambahan_traffic = total_traffic_hari_ini - total_traffic_kemarin;
        const persentase_pertambahan = total_traffic_kemarin === 0
            ? (total_traffic_hari_ini > 0 ? 100 : 0)
            : Math.round((pertambahan_traffic / total_traffic_kemarin) * 100);

        // Detail per lowongan (opsional, bisa dihilangkan jika tidak perlu)
        const detail = lowongans.map(l => ({
            lowonganId: l._id,
            judul_pekerjaan: l.judul_pekerjaan,
            traffic: typeof l.traffic === "number" ? l.traffic : 0
        }));

        res.status(200).json({
            total_traffic_hari_ini,
            total_traffic_kemarin,
            pertambahan_traffic,
            persentase_pertambahan,
            detail
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi untuk menambah traffic (kunjungan) ke halaman lowongan tertentu
// Endpoint: POST /lowongan/:id/traffic
export const incrementLowonganTraffic = async (req, res) => {
    try {
        // Endpoint ini bisa diakses oleh siapa saja yang sudah login (alumni, perusahaan, dsb)
        // Tidak perlu membatasi hanya perusahaan

        const lowonganId = req.params.id;
        if (!lowonganId) {
            return res.status(400).json({ msg: "ID lowongan wajib diisi." });
        }

        // Cari lowongan, pastikan ada
        const lowongan = await Lowongan.findById(lowonganId);
        if (!lowongan) {
            return res.status(404).json({ msg: "Lowongan tidak ditemukan." });
        }

        // Tambah traffic +1 secara atomik
        const updatedLowongan = await Lowongan.findByIdAndUpdate(
            lowonganId,
            { $inc: { traffic: 1 } },
            { new: true }
        );

        res.status(200).json({
            lowonganId,
            traffic: updatedLowongan.traffic
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
// Endpoint: GET /lowongan/me/count/pending
// Hanya perusahaan yang bisa melihat jumlah lowongan miliknya yang statusnya pending_verification
export const countPendingLowonganByPerusahaan = async (req, res) => {
    try {
        // Verifikasi user login & role perusahaan
        const user = req.user;
        if (!user || (!user._id && !user.id) || user.role !== "perusahaan") {
            return res.status(403).json({ message: "Hanya perusahaan yang dapat mengakses data ini." });
        }
        const perusahaanId = user._id ? user._id.toString() : user.id.toString();

        // Hitung jumlah lowongan milik perusahaan ini yang statusnya pending_verification
        const jumlah_pending = await Lowongan.countDocuments({
            perusahaan: perusahaanId,
            status: "pending_verification"
        });

        // Hitung total lowongan milik perusahaan ini
        const total_lowongan = await Lowongan.countDocuments({
            perusahaan: perusahaanId
        });

        return res.status(200).json({
            perusahaanId,
            total_lowongan,
            jumlah_pending
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};

// Endpoint: GET /lowongan/filter
// Query params: lokasi, tipe_kerja, gaji_min, gaji_max, kualifikasi (comma separated)
export const filterLowongan = async (req, res) => {
    try {
        const { lokasi, tipe_kerja, gaji_min, gaji_max, kualifikasi } = req.query;

        // Build filter object
        const filter = {};

        if (lokasi) {
            // Case-insensitive partial match
            filter.lokasi = { $regex: lokasi, $options: "i" };
        }

        if (tipe_kerja) {
            // Exact match, case-insensitive
            filter.tipe_kerja = { $regex: `^${tipe_kerja}$`, $options: "i" };
        }

        // Karena field gaji di schema adalah String, filter range tidak bisa pakai $gte/$lte.
        // Maka, filter gaji_min/gaji_max hanya akan mencari lowongan yang gaji-nya mengandung angka minimum/maksimum (string match).
        // Atau, jika format gaji adalah "5000000-7000000", kita bisa coba parsing angka awal/akhir.
        // Berikut pendekatan sederhana: cari lowongan yang gaji-nya mengandung angka minimum/maksimum.
        if (gaji_min || gaji_max) {
            // Buat regex untuk mencari angka di string gaji
            let gajiRegex = "";
            if (gaji_min && gaji_max) {
                // Cari string gaji yang mengandung range antara gaji_min dan gaji_max
                // Contoh: "5000000-7000000" atau "Rp 5.000.000 - 7.000.000"
                // Kita cari string yang mengandung kedua angka
                gajiRegex = `${gaji_min}.*${gaji_max}|${gaji_max}.*${gaji_min}`;
            } else if (gaji_min) {
                gajiRegex = gaji_min;
            } else if (gaji_max) {
                gajiRegex = gaji_max;
            }
            filter.gaji = { $regex: gajiRegex, $options: "i" };
        }

        if (kualifikasi) {
            // kualifikasi bisa berupa string (1 skill) atau comma separated
            let skills = [];
            if (Array.isArray(kualifikasi)) {
                skills = kualifikasi;
            } else if (typeof kualifikasi === "string") {
                skills = kualifikasi.split(",").map(s => s.trim()).filter(Boolean);
            }
            if (skills.length > 0) {
                // Cari lowongan yang memiliki SEMUA kualifikasi yang diminta
                filter.kualifikasi = { $all: skills };
            }
        }

        // Tampilkan hanya lowongan yang status-nya "open" atau "closed"
        filter.status = { $in: ["open", "closed"] };

        const lowongans = await Lowongan.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            count: lowongans.length,
            data: lowongans
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

