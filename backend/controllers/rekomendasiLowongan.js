/**
 * Rekomendasi Lowongan berdasarkan kecocokan program_studi alumni dengan kualifikasi lowongan
 * Endpoint: POST /rekomendasi-lowongan
 * 
 * Algoritma:
 * - Ambil data alumni dari req.user (sudah login, sudah diverifikasi via middleware)
 * - Ambil program_studi dari data alumni, bukan dari body request
 * - Ambil semua lowongan yang status-nya "aktif" atau "open"
 * - Cek field kualifikasi pada lowongan (diasumsikan array/string)
 * - Abaikan kualifikasi yang terlalu pendek (< 3 karakter) dari pencocokan
 * - Hitung skor kecocokan menggunakan library string-similarity
 * - Jika ada kecocokan eksak (case-insensitive, termasuk substring), skor = 1
 * - Jika tidak, gunakan skor string-similarity
 * - Filter hanya skor > 0.7 atau kecocokan eksak
 * - Urutkan berdasarkan skor kecocokan
 * - Kembalikan top N (misal 10) lowongan yang paling cocok
 * - Populate field perusahaan dan mapping field nama_perusahaan, logo_perusahaan, bidang_perusahaan ke response
 */

import Lowongan from '../models/Lowongan.js';
import stringSimilarity from 'string-similarity';
import Alumni from '../models/Alumni.js'; // Pastikan model Alumni ada

function isExactMatch(kualifikasi, program_studi) {
  if (!kualifikasi || !program_studi) return false;
  // Case-insensitive, trim, dan substring match dua arah
  const k = kualifikasi.trim().toLowerCase();
  const p = program_studi.trim().toLowerCase();
  return k === p || k.includes(p) || p.includes(k);
}

// Helper: abaikan kualifikasi yang terlalu pendek (< 3 karakter)
function isValidKualifikasi(k) {
  return typeof k === "string" && k.trim().length >= 3;
}

export const rekomendasiLowongan = async (req, res) => {
  try {
    // Ambil id alumni dari req.user (diasumsikan sudah diisi oleh middleware authAlumni)
    const alumniId = req.user && req.user.id;
    if (!alumniId) {
      return res.status(401).json({ message: "Unauthorized: Alumni belum login" });
    }

    // Ambil data alumni dari database
    const alumni = await Alumni.findById(alumniId);
    if (!alumni) {
      return res.status(404).json({ message: "Data alumni tidak ditemukan" });
    }

    const program_studi = alumni.program_studi;
    if (!program_studi) {
      return res.status(400).json({ message: "Profil alumni belum memiliki program_studi" });
    }

    // Ambil semua lowongan yang status-nya "aktif" atau "open" dan populate perusahaan
    const lowongans = await Lowongan.find({ status: { $in: ["aktif", "open"] } })
      .populate('perusahaan', 'nama_perusahaan logo_perusahaan bidang_perusahaan');

    // Skoring kecocokan menggunakan string-similarity dan pencocokan eksak
    const rekomendasi = lowongans.map(l => {
      let skor = 0;
      let exact = false;

      if (Array.isArray(l.kualifikasi)) {
        // Filter kualifikasi yang valid (tidak terlalu pendek)
        const kualifikasiValid = l.kualifikasi.filter(isValidKualifikasi);

        // Cek eksak match di salah satu kualifikasi valid
        exact = kualifikasiValid.some(k => isExactMatch(k, program_studi));
        if (exact) {
          skor = 1;
        } else if (kualifikasiValid.length > 0) {
          skor = Math.max(...kualifikasiValid.map(k => stringSimilarity.compareTwoStrings(k, program_studi)));
        } else {
          skor = 0;
        }
      } else if (typeof l.kualifikasi === "string") {
        // Abaikan kualifikasi yang terlalu pendek
        if (isValidKualifikasi(l.kualifikasi)) {
          exact = isExactMatch(l.kualifikasi, program_studi);
          if (exact) {
            skor = 1;
          } else {
            skor = stringSimilarity.compareTwoStrings(l.kualifikasi, program_studi);
          }
        } else {
          skor = 0;
          exact = false;
        }
      }
      return { lowongan: l, skor, exact };
    })
    // Filter: hanya skor > 0.7 ATAU kecocokan eksak
    .filter(r => r.skor > 0.7 || r.exact)
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 10); // top 10

    res.json({
      rekomendasi: rekomendasi.map(r => {
        const l = r.lowongan;
        const perusahaan = l.perusahaan && typeof l.perusahaan === 'object'
          ? {
              nama_perusahaan: l.perusahaan.nama_perusahaan,
              logo_perusahaan: l.perusahaan.logo_perusahaan,
              bidang_perusahaan: l.perusahaan.bidang_perusahaan
            }
          : {};
        return {
          ...l.toObject(),
          skor_kecocokan: r.skor,
          nama_perusahaan: perusahaan.nama_perusahaan || null,
          logo_perusahaan: perusahaan.logo_perusahaan || null,
          bidang_perusahaan: perusahaan.bidang_perusahaan || null
        };
      })
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil rekomendasi lowongan", error: err.message });
  }
};
