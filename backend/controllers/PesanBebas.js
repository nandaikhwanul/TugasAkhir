import PesanBebas from '../models/pesanBebas.js';
import Alumni from '../models/Alumni.js';
import Perusahaan from '../models/Perusahaan.js';
import Admin from '../models/Admin.js';

// Helper untuk ambil info pengirim
async function getPengirimInfo(pengirimId, pengirimTipe) {
  if (pengirimTipe === 'Alumni') {
    const alumni = await Alumni.findById(pengirimId).select('name email');
    if (!alumni) return { name: null, email: null };
    return { name: alumni.name, email: alumni.email };
  } else if (pengirimTipe === 'Perusahaan') {
    const perusahaan = await Perusahaan.findById(pengirimId).select('nama_perusahaan email_perusahaan');
    if (!perusahaan) return { name: null, email: null };
    return { name: perusahaan.nama_perusahaan, email: perusahaan.email_perusahaan };
  } else if (pengirimTipe === 'Admin') {
    const admin = await Admin.findById(pengirimId).select('username email');
    if (!admin) return { name: null, email: null };
    return { name: admin.username, email: admin.email };
  }
  return { name: null, email: null };
}

// Kirim pesan bebas (alumni, perusahaan, admin)
export const kirimPesanBebas = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Data body: { isi, penerima: { id, tipe } }
    const { isi, penerima } = req.body;
    if (!isi || !penerima || !penerima.id || !penerima.tipe) {
      return res.status(400).json({ message: 'Isi pesan dan penerima wajib diisi' });
    }

    let pengirim, pengirim_tipe;
    if (user.role === 'alumni') {
      pengirim = user.id;
      pengirim_tipe = 'Alumni';
    } else if (user.role === 'perusahaan') {
      pengirim = user.id;
      pengirim_tipe = 'Perusahaan';
    } else if (user.role === 'admin') {
      pengirim = user.id;
      pengirim_tipe = 'Admin';
    } else {
      return res.status(400).json({ message: 'Role user tidak valid' });
    }

    if (!['Alumni', 'Perusahaan', 'Admin'].includes(penerima.tipe)) {
      return res.status(400).json({ message: 'Tipe penerima tidak valid' });
    }

    // Hanya kirim id dan tipe, jangan objek penerima/pengirim
    const pesan = await PesanBebas.create({
      isi,
      pengirim,
      pengirim_tipe,
      penerima: penerima.id,
      penerima_tipe: penerima.tipe,
      sudah_dibaca: false
    });

    // Tambahkan info pengirim ke response
    const pengirimInfo = await getPengirimInfo(pengirim, pengirim_tipe);

    res.status(201).json({
      message: 'Pesan berhasil dikirim',
      data: {
        ...pesan.toObject(),
        pengirim_info: pengirimInfo
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengirim pesan', error: err.message });
  }
};

// Ambil daftar pesan yang DITERIMA user (bukan semua, hanya yang user login sebagai penerima)
export const getPesanBebasUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId, userTipe;
    if (user.role === 'alumni') {
      userId = user.id;
      userTipe = 'Alumni';
    } else if (user.role === 'perusahaan') {
      userId = user.id;
      userTipe = 'Perusahaan';
    } else if (user.role === 'admin') {
      userId = user.id;
      userTipe = 'Admin';
    } else {
      return res.status(400).json({ message: 'Role user tidak valid' });
    }

    // Hanya pesan yang user sebagai penerima
    const pesanList = await PesanBebas.find({
      penerima: userId,
      penerima_tipe: userTipe
    }).sort({ createdAt: -1 });

    // Ambil info pengirim untuk setiap pesan
    const pesanWithPengirim = await Promise.all(
      pesanList.map(async (pesan) => {
        const pengirimInfo = await getPengirimInfo(pesan.pengirim, pesan.pengirim_tipe);
        return {
          ...pesan.toObject(),
          pengirim_info: pengirimInfo
        };
      })
    );

    res.status(200).json({ data: pesanWithPengirim });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil pesan', error: err.message });
  }
};

// Tandai pesan bebas sudah dibaca (hanya penerima yang bisa)
export const tandaiPesanBebasSudahDibaca = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId, userTipe;
    if (user.role === 'alumni') {
      userId = user.id;
      userTipe = 'Alumni';
    } else if (user.role === 'perusahaan') {
      userId = user.id;
      userTipe = 'Perusahaan';
    } else if (user.role === 'admin') {
      userId = user.id;
      userTipe = 'Admin';
    } else {
      return res.status(400).json({ message: 'Role user tidak valid' });
    }

    const { id } = req.params;
    const pesan = await PesanBebas.findById(id);
    if (!pesan) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan' });
    }

    // Hanya penerima yang boleh menandai sudah dibaca
    if (
      pesan.penerima.toString() !== userId ||
      pesan.penerima_tipe !== userTipe
    ) {
      return res.status(403).json({ message: 'Anda bukan penerima pesan ini' });
    }

    pesan.sudah_dibaca = true;
    await pesan.save();

    // Tambahkan info pengirim ke response
    const pengirimInfo = await getPengirimInfo(pesan.pengirim, pesan.pengirim_tipe);

    res.status(200).json({
      message: 'Pesan ditandai sudah dibaca',
      data: {
        ...pesan.toObject(),
        pengirim_info: pengirimInfo
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update status pesan', error: err.message });
  }
};

// Tambahkan: Hitung jumlah pesan belum dibaca (unread) untuk user login
export const getUnreadPesanBebasCount = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId, userTipe;
    if (user.role === 'alumni') {
      userId = user.id;
      userTipe = 'Alumni';
    } else if (user.role === 'perusahaan') {
      userId = user.id;
      userTipe = 'Perusahaan';
    } else if (user.role === 'admin') {
      userId = user.id;
      userTipe = 'Admin';
    } else {
      return res.status(400).json({ message: 'Role user tidak valid' });
    }

    // Hitung pesan yang belum dibaca untuk user login sebagai penerima
    const unreadCount = await PesanBebas.countDocuments({
      penerima: userId,
      penerima_tipe: userTipe,
      sudah_dibaca: false
    });

    res.status(200).json({ unread_count: unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghitung pesan belum dibaca', error: err.message });
  }
};

// Hapus pesan bebas (hanya penerima yang bisa menghapus)
export const hapusPesanBebas = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId, userTipe;
    if (user.role === 'alumni') {
      userId = user.id;
      userTipe = 'Alumni';
    } else if (user.role === 'perusahaan') {
      userId = user.id;
      userTipe = 'Perusahaan';
    } else if (user.role === 'admin') {
      userId = user.id;
      userTipe = 'Admin';
    } else {
      return res.status(400).json({ message: 'Role user tidak valid' });
    }

    const { id } = req.params;
    const pesan = await PesanBebas.findById(id);
    if (!pesan) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan' });
    }

    // Hanya penerima yang boleh menghapus pesan
    if (
      pesan.penerima.toString() !== userId ||
      pesan.penerima_tipe !== userTipe
    ) {
      return res.status(403).json({ message: 'Anda bukan penerima pesan ini' });
    }

    await PesanBebas.findByIdAndDelete(id);

    res.status(200).json({ message: 'Pesan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus pesan', error: err.message });
  }
};
