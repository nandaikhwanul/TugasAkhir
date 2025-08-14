import Pelamar from '../models/Pelamar.js';
import Lowongan from '../models/Lowongan.js';
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

// Endpoint untuk alumni melamar lowongan
// POST /pelamar
// Body: { lowongan: <lowonganId> }
export const lamarLowongan = async (req, res) => {
  try {
    // Verifikasi token RS256 secara manual jika belum diverifikasi middleware
    let user = req.user;
    if (!user) {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
      }
      const token = authHeader.split(' ')[1];
      if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "Server error: public key tidak ditemukan" });
      }
      try {
        user = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
      } catch (err) {
        let errorMsg = "Token tidak valid atau kadaluarsa";
        if (err && err.message && err.message.includes("jwt expired")) {
          errorMsg = "Sesi login Anda telah berakhir. Silakan login kembali.";
        }
        return res.status(401).json({ message: errorMsg });
      }
    }

    // Pastikan user adalah alumni dan punya _id
    if (!user || (!user._id && !user.id) || user.role !== "alumni") {
      return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
    }

    const alumni = (user._id || user.id).toString();
    const { lowongan } = req.body;

    // Validasi input
    if (!lowongan) {
      return res.status(400).json({ message: 'lowongan harus diisi.' });
    }

    // Cek apakah lowongan benar-benar ada dan statusnya open
    const lowonganData = await Lowongan.findById(lowongan);
    if (!lowonganData) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
    }
    if (lowonganData.status !== 'open') {
      return res.status(400).json({ message: 'Lowongan ini tidak terbuka untuk lamaran.' });
    }

    // Cek apakah sudah pernah melamar lowongan yang sama
    const existing = await Pelamar.findOne({ alumni, lowongan });
    if (existing) {
      return res.status(409).json({ message: 'Anda sudah melamar lowongan ini.' });
    }

    // Buat data pelamar baru
    const pelamarBaru = new Pelamar({
      alumni,
      lowongan
    });

    await pelamarBaru.save();

    // Tambahkan count jumlah_pelamar di collection Lowongan
    await Lowongan.findByIdAndUpdate(lowongan, { $inc: { jumlah_pelamar: 1 } });

    res.status(201).json({
      message: 'Lamaran berhasil dikirim.',
      pelamar: pelamarBaru
    });
  } catch (err) {
    // Tangani error jika req.user undefined
    let errorMsg = err.message;
    if (err && err.message && err.message.includes("Cannot read properties of undefined")) {
      errorMsg = "User belum login atau token tidak valid.";
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: errorMsg });
  }
};

// Endpoint untuk perusahaan melihat daftar pelamar pada lowongan tertentu
// GET /lowongan/:id/pelamar
export const getPelamarByLowongan = async (req, res) => {
  try {
    // Pastikan req.user ada dan role perusahaan
    const user = req.user;
    if (!user || typeof user !== "object") {
      return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
    }

    // Hanya role perusahaan yang boleh akses
    if (user.role !== 'perusahaan') {
      return res.status(403).json({ message: 'Anda tidak berhak melihat pelamar untuk lowongan ini.' });
    }

    const lowonganId = req.params.id;

    // Cari lowongan, pastikan ada dan populate perusahaan
    const lowongan = await Lowongan.findById(lowonganId).populate('perusahaan');
    if (!lowongan) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
    }

    // Pastikan hanya perusahaan yang memposting lowongan yang bisa melihat pelamar
    // Cek apakah user._id (atau user.id) === lowongan.perusahaan._id
    if (!lowongan.perusahaan || !lowongan.perusahaan._id) {
      return res.status(403).json({ message: 'Anda tidak berhak melihat pelamar untuk lowongan ini.' });
    }

    // Debug log untuk membandingkan ID perusahaan
    // console.log("perusahaanId (from token):", (user._id || user.id || "").toString());
    // console.log("pemilikLowonganId (from lowongan):", lowongan.perusahaan._id.toString());

    // Konversi kedua id ke string dan bandingkan
    const perusahaanId = (user._id || user.id || "").toString();
    const pemilikLowonganId = lowongan.perusahaan._id.toString();

    if (perusahaanId !== pemilikLowonganId) {
      // Debug log jika tidak sama
      // console.log("ID perusahaan tidak cocok. Akses ditolak.");
      return res.status(403).json({ message: 'Anda tidak berhak melihat pelamar untuk lowongan ini.' });
    }

    // Ambil semua pelamar untuk lowongan ini, populate data alumni
    const pelamarList = await Pelamar.find({ lowongan: lowonganId }).populate('alumni');

    // Tambahkan nomor urut pada setiap pelamar
    const pelamarWithNumber = pelamarList.map((pelamar, idx) => ({
      nomor: idx + 1,
      ...pelamar.toObject()
    }));

    res.status(200).json({
      message: 'Daftar pelamar berhasil diambil.',
      pelamar: pelamarWithNumber
    });
  } catch (err) {
    // Tangani error jika req.user undefined
    let errorMsg = err && err.message ? err.message : String(err);
    if (err && err.message && err.message.includes("Cannot read properties of undefined")) {
      errorMsg = "User belum login atau token tidak valid.";
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: errorMsg });
  }
};

// Fungsi untuk melihat detail data pelamar tertentu (khusus perusahaan pemilik lowongan)
export const detailPelamar = async (req, res) => {
  try {
    // Verifikasi token RS256 secara manual jika belum diverifikasi middleware
    let user = req.user;
    if (!user) {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
      }
      const token = authHeader.split(' ')[1];
      if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "Server error: public key tidak ditemukan" });
      }
      try {
        user = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
      } catch (err) {
        let errorMsg = "Token tidak valid atau kadaluarsa";
        if (err && err.message && err.message.includes("jwt expired")) {
          errorMsg = "Sesi login Anda telah berakhir. Silakan login kembali.";
        }
        return res.status(401).json({ message: errorMsg });
      }
    }

    // Pastikan user adalah perusahaan
    if (!user || (!user._id && !user.id) || user.role !== "perusahaan") {
      return res.status(401).json({ message: 'User bukan perusahaan atau token tidak valid.' });
    }

    const perusahaanId = (user._id || user.id).toString();
    const { pelamarId } = req.params;

    if (!pelamarId) {
      return res.status(400).json({ message: 'pelamarId harus diisi di parameter.' });
    }

    // Cari pelamar dan populate lowongan & alumni
    const pelamar = await Pelamar.findById(pelamarId)
      .populate({
        path: 'lowongan',
        populate: { path: 'perusahaan' }
      })
      .populate('alumni');

    if (!pelamar) {
      return res.status(404).json({ message: 'Data pelamar tidak ditemukan.' });
    }

    // Pastikan pelamar ini melamar ke lowongan milik perusahaan yang sedang login
    if (
      !pelamar.lowongan ||
      !pelamar.lowongan.perusahaan ||
      pelamar.lowongan.perusahaan._id.toString() !== perusahaanId
    ) {
      return res.status(403).json({ message: 'Anda tidak berhak melihat detail pelamar ini.' });
    }

    res.status(200).json({
      message: 'Detail pelamar berhasil diambil.',
      pelamar: pelamar.toObject()
    });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    if (err && err.message && err.message.includes("Cannot read properties of undefined")) {
      errorMsg = "User belum login atau token tidak valid.";
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: errorMsg });
  }
};

// Fungsi untuk menampilkan pelamar yang statusnya "diterima" dan "ditolak" untuk perusahaan yang sedang login
export const getPelamarDiterimaDitolak = async (req, res) => {
  try {
    // Pastikan user adalah perusahaan
    const user = req.user;
    if (!user || (!user._id && !user.id) || user.role !== "perusahaan") {
      return res.status(401).json({ message: 'User bukan perusahaan atau token tidak valid.' });
    }
    const perusahaanId = (user._id || user.id).toString();

    // Cari pelamar yang statusnya "diterima" atau "ditolak" pada lowongan milik perusahaan ini
    const pelamarList = await Pelamar.find({
      status: { $in: ["diterima", "ditolak"] }
    })
      .populate({
        path: 'lowongan',
        match: { perusahaan: perusahaanId },
        populate: { path: 'perusahaan', select: 'nama_perusahaan' }
      })
      .populate('alumni');

    // Filter hanya pelamar yang lowongannya memang milik perusahaan ini (karena match di populate bisa null)
    const filteredPelamar = pelamarList.filter(p => p.lowongan);

    // Gabungkan pelamar dengan nama alumni yang sama (berdasarkan email atau _id alumni)
    // dan gabungkan pekerjaan (judul_pekerjaan lowongan) mereka
    const pelamarMap = new Map();

    filteredPelamar.forEach(p => {
      if (!p.alumni) return;
      // Gunakan _id alumni sebagai key unik
      const alumniId = p.alumni._id ? p.alumni._id.toString() : (p.alumni.id ? p.alumni.id.toString() : null);
      if (!alumniId) return;

      // Nama alumni
      const namaAlumni = p.alumni.name || p.alumni.nama || "";
      // Judul pekerjaan/lowongan
      const pekerjaan = p.lowongan && p.lowongan.judul_pekerjaan ? p.lowongan.judul_pekerjaan : "";

      if (pelamarMap.has(alumniId)) {
        // Sudah ada, gabungkan nama (jika berbeda) dan pekerjaan
        const existing = pelamarMap.get(alumniId);

        // Gabungkan nama jika belum ada (atau berbeda)
        if (!existing.nama.includes(namaAlumni)) {
          existing.nama.push(namaAlumni);
        }

        // Gabungkan pekerjaan jika belum ada
        if (pekerjaan && !existing.pekerjaan.includes(pekerjaan)) {
          existing.pekerjaan.push(pekerjaan);
        }

        // Gabungkan status jika belum ada
        if (p.status && !existing.status.includes(p.status)) {
          existing.status.push(p.status);
        }

        // Gabungkan data pelamarId
        if (p._id && !existing.pelamarId.includes(p._id.toString())) {
          existing.pelamarId.push(p._id.toString());
        }
      } else {
        pelamarMap.set(alumniId, {
          alumniId,
          nama: [namaAlumni],
          pekerjaan: pekerjaan ? [pekerjaan] : [],
          status: p.status ? [p.status] : [],
          pelamarId: p._id ? [p._id.toString()] : [],
          alumni: p.alumni, // Simpan data alumni (bisa diubah jika ingin lebih ringkas)
        });
      }
    });

    // Ubah nama dan pekerjaan menjadi string gabungan (jika lebih dari satu)
    const pelamarGabung = Array.from(pelamarMap.values()).map(item => ({
      alumniId: item.alumniId,
      nama: item.nama.join(" / "),
      pekerjaan: item.pekerjaan.join(" / "),
      status: item.status.join(" / "),
      pelamarId: item.pelamarId,
      alumni: item.alumni
    }));

    res.status(200).json({
      message: 'Daftar pelamar dengan status diterima/ditolak berhasil diambil.',
      pelamar: pelamarGabung
    });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: errorMsg });
  }
};

// Endpoint: GET /lowongan/pelamar/count (hitung semua pelamar di semua lowongan milik perusahaan ini)
// Menampilkan juga pertumbuhan +15 Sejak kemarin, dst
export const countPelamarByLowongan = async (req, res) => {
  try {
    // Verifikasi user login & role perusahaan
    const user = req.user;
    if (!user || (!user._id && !user.id) || user.role !== "perusahaan") {
      return res.status(403).json({ message: "Hanya perusahaan yang dapat mengakses data ini." });
    }
    const perusahaanId = user._id ? user._id.toString() : user.id.toString();

    // Ambil semua _id lowongan milik perusahaan ini
    const daftarLowongan = await Lowongan.find({ perusahaan: perusahaanId }, { _id: 1 });
    const daftarIdLowonganPerusahaan = daftarLowongan.map(l => l._id);

    if (!daftarIdLowonganPerusahaan || daftarIdLowonganPerusahaan.length === 0) {
      return res.status(200).json({ 
        jumlah_pelamar: 0,
        pertumbuhan: {
          label: null,
          jumlah: 0,
          keterangan: null
        }
      });
    }

    // Hitung jumlah pelamar total (sekarang)
    const jumlah_pelamar = await Pelamar.countDocuments({ lowongan: { $in: daftarIdLowonganPerusahaan } });

    // Helper untuk membuat rentang waktu
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const weekAgoStart = new Date(todayStart);
    weekAgoStart.setDate(todayStart.getDate() - 7);

    // Hitung jumlah pelamar pada waktu-waktu tertentu
    // 1. Kemarin
    const countYesterday = await Pelamar.countDocuments({
      lowongan: { $in: daftarIdLowonganPerusahaan },
      createdAt: { $gte: yesterdayStart, $lt: todayStart }
    });

    // 2. Minggu lalu (jika kemarin tidak ada)
    let countWeek = 0;
    if (countYesterday === 0) {
      countWeek = await Pelamar.countDocuments({
        lowongan: { $in: daftarIdLowonganPerusahaan },
        createdAt: { $gte: weekAgoStart, $lt: yesterdayStart }
      });
    }

    // Hanya tampilkan pertumbuhan kemarin, jika tidak ada baru minggu lalu
    let pertumbuhan = {
      label: null,
      jumlah: 0,
      keterangan: null
    };

    if (countYesterday > 0) {
      pertumbuhan = {
        label: "kemarin",
        jumlah: countYesterday,
        keterangan: `+${countYesterday} Sejak kemarin`
      };
    } else if (countWeek > 0) {
      pertumbuhan = {
        label: "minggu_lalu",
        jumlah: countWeek,
        keterangan: `+${countWeek} Sejak minggu lalu`
      };
    }

    res.status(200).json({ 
      jumlah_pelamar,
      pertumbuhan
    });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: errorMsg });
  }
};

// Fungsi untuk menghitung jumlah pelamar dengan status "diterima" dan "ditolak" untuk perusahaan, dipisah
export const getJumlahPelamarDiterimaDitolak = async (req, res) => {
  try {
    // Verifikasi user perusahaan
    if (!req.user || req.user.role !== "perusahaan") {
      return res.status(403).json({ message: "Akses hanya untuk perusahaan." });
    }

    // Pastikan _id perusahaan dikonversi ke string agar selalu cocok
    const perusahaanId = (req.user._id || req.user.id).toString();

    // Ambil semua lowongan milik perusahaan (pastikan _id perusahaan sama persis)
    const daftarLowongan = await Lowongan.find({ perusahaan: perusahaanId }, { _id: 1 });
    const daftarIdLowongan = daftarLowongan.map(l => l._id);

    // Hitung jumlah pelamar status "diterima"
    const jumlahDiterima = await Pelamar.countDocuments({
      lowongan: { $in: daftarIdLowongan },
      status: "diterima"
    });

    // Hitung jumlah pelamar status "ditolak"
    const jumlahDitolak = await Pelamar.countDocuments({
      lowongan: { $in: daftarIdLowongan },
      status: "ditolak"
    });

    res.status(200).json({ 
      jumlah_pelamar_diterima: jumlahDiterima,
      jumlah_pelamar_ditolak: jumlahDitolak
    });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: errorMsg });
  }
};

// Mendapatkan data jumlah pelamar per bulan di setiap tahunnya (untuk grafik) - HANYA untuk perusahaan pemilik lowongan
export const getPelamarPerBulanPerTahun = async (req, res) => {
  try {
    // Batasi akses: hanya user dengan role "perusahaan" yang boleh mengakses endpoint ini
    if (!req.user || req.user.role !== "perusahaan") {
      return res.status(403).json({ message: "Akses hanya untuk perusahaan." });
    }

    // Filter berdasarkan perusahaanId dari req.user
    const perusahaanId = (req.user._id || req.user.id).toString();
    // Cari semua lowongan milik perusahaan ini
    const daftarLowongan = await Lowongan.find({ perusahaan: perusahaanId }, { _id: 1 });
    const daftarIdLowongan = daftarLowongan.map(l => l._id);

    // Jika perusahaan tidak punya lowongan, hasil pasti kosong
    if (daftarIdLowongan.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Agregasi: group by tahun & bulan dari tanggalMelamar, hanya untuk pelamar di lowongan milik perusahaan ini
    const hasil = await Pelamar.aggregate([
      { $match: { lowongan: { $in: daftarIdLowongan } } },
      {
        $group: {
          _id: {
            tahun: { $year: "$tanggalMelamar" },
            bulan: { $month: "$tanggalMelamar" }
          },
          jumlah: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          tahun: "$_id.tahun",
          bulan: "$_id.bulan",
          jumlah: 1
        }
      },
      { $sort: { tahun: 1, bulan: 1 } }
    ]);

    res.status(200).json({ data: hasil });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: errorMsg });
  }
};

// Mendapatkan total lowongan yang dilamar, diterima, dan ditolak oleh user (alumni) yang sedang login
export const getStatistikLamaranAlumni = async (req, res) => {
  try {
    // Diasumsikan sudah ada middleware auth yang set req.userId (alumni)
    const alumniId = req.userId;

    // Agregasi untuk menghitung jumlah lamaran per status
    const hasil = await Pelamar.aggregate([
      { $match: { alumni: alumniId } },
      {
        $group: {
          _id: "$status", // status: "diterima", "ditolak", "pending", dll
          total: { $sum: 1 }
        }
      }
    ]);

    // Normalisasi hasil ke bentuk { diterima: x, ditolak: y, dilamar: z }
    // "dilamar" = total semua status
    let statistik = {
      diterima: 0,
      ditolak: 0,
      dilamar: 0
    };

    hasil.forEach(item => {
      if (item._id === "diterima") statistik.diterima = item.total;
      else if (item._id === "ditolak") statistik.ditolak = item.total;
      statistik.dilamar += item.total;
    });

    res.status(200).json({
      msg: "Statistik lamaran alumni",
      data: statistik
    });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: errorMsg });
  }
};

// Mendapatkan daftar semua lamaran yang dilakukan oleh alumni yang sedang login
// GET /pelamar/alumni/me
export const getListLamaranAlumni = async (req, res) => {
  try {
    // Pastikan user sudah login dan merupakan alumni
    const user = req.user;
    if (!user || (!user._id && !user.id) || user.role !== "alumni") {
      return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
    }
    const alumniId = (user._id || user.id).toString();

    // Ambil semua lamaran milik alumni ini, urutkan terbaru dulu
    const daftarLamaran = await Pelamar.find({ alumni: alumniId })
      .sort({ createdAt: -1 })
      .populate('lowongan') // jika ingin detail lowongan
      .populate('alumni', 'nama email'); // jika ingin info alumni (opsional)

    res.status(200).json({
      message: "Daftar lamaran alumni ditemukan.",
      data: daftarLamaran
    });
  } catch (err) {
    let errorMsg = err && err.message ? err.message : String(err);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: errorMsg });
  }
};



