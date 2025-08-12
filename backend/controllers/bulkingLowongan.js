// Fungsi untuk menerima dan menyimpan banyak data lowongan sekaligus (bulk insert)
import Lowongan from '../models/Lowongan.js'; // pastikan path model sesuai

/**
 * Controller untuk bulk insert data lowongan
 * Expects req.body = [{...}, {...}, ...]
 */
export const bulkInsertLowongan = async (req, res) => {
  try {
    const data = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Data lowongan harus berupa array dan tidak boleh kosong.' });
    }

    // Validasi sederhana: pastikan setiap item punya field wajib (judul_pekerjaan, deskripsi, dll)
    for (let [i, item] of data.entries()) {
      if (!item.judul_pekerjaan || !item.deskripsi) {
        return res.status(400).json({ message: `Data lowongan ke-${i + 1} tidak lengkap.` });
      }
    }

    // Simpan ke database secara bulk
    const result = await Lowongan.insertMany(data);
    return res.status(201).json({
      message: 'Berhasil menambahkan data lowongan secara bulk.',
      insertedCount: result.length,
      data: result,
    });
  } catch (err) {
    console.error('Bulk insert lowongan error:', err);
    return res.status(500).json({ message: 'Gagal menambahkan data lowongan secara bulk.', error: err.message });
  }
};
