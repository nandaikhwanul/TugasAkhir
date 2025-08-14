import Pesan from '../models/Pesan.js';
import Pelamar from '../models/Pelamar.js';
import Alumni from '../models/Alumni.js';
import Lowongan from '../models/Lowongan.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.RESEND_ENV_PATH || 'resend.env' });

import pkg from 'whatsapp-web.js';
const { Client: WhatsAppClient, LocalAuth } = pkg;
import puppeteer from 'puppeteer-core';

// Tidak ada kode Telegram di file ini

let whatsappClient = null;
let lastQrString = null;

// Status eksplisit untuk ready WhatsApp client
let isWhatsAppReady = false;
let isWhatsAppReadyPromise = null;
let isWhatsAppReadyResolve = null;
let isWhatsAppReadyReject = null;

/**
 * Mengecek status ready WhatsApp client.
 * @returns {boolean} true jika client sudah ready, false jika belum.
 */
function isWhatsAppClientReady() {
  return isWhatsAppReady === true;
}

function getWhatsAppClient() {
  if (!whatsappClient) {
    whatsappClient = new WhatsAppClient({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        library: puppeteer
      }
    });

    // Promise untuk menunggu event 'ready'
    isWhatsAppReadyPromise = new Promise((resolve, reject) => {
      isWhatsAppReadyResolve = resolve;
      isWhatsAppReadyReject = reject;
    });

    whatsappClient.on('qr', (qr) => {
      lastQrString = qr;
      isWhatsAppReady = false;
      // Jika sedang menunggu ready, jangan resolve
      console.log('QR code WhatsApp Web diterima. Scan QR code ini di WhatsApp Web pada browser headless server Anda.');
      console.log('QR string:', qr);
    });
    whatsappClient.on('ready', () => {
      isWhatsAppReady = true;
      lastQrString = null;
      if (isWhatsAppReadyResolve) isWhatsAppReadyResolve();
      console.log('WhatsApp client is ready!');
    });
    whatsappClient.on('disconnected', (reason) => {
      isWhatsAppReady = false;
      if (isWhatsAppReadyReject) isWhatsAppReadyReject(new Error('WhatsApp client disconnected: ' + reason));
      console.log('WhatsApp client disconnected:', reason);
      whatsappClient = null;
      // Reset promise
      isWhatsAppReadyPromise = null;
      isWhatsAppReadyResolve = null;
      isWhatsAppReadyReject = null;
    });
    whatsappClient.on('auth_failure', (msg) => {
      isWhatsAppReady = false;
      if (isWhatsAppReadyReject) isWhatsAppReadyReject(new Error('WhatsApp auth failure: ' + msg));
      console.error('WhatsApp auth failure:', msg);
      whatsappClient = null;
      // Reset promise
      isWhatsAppReadyPromise = null;
      isWhatsAppReadyResolve = null;
      isWhatsAppReadyReject = null;
    });
    whatsappClient.on('error', (err) => {
      isWhatsAppReady = false;
      if (isWhatsAppReadyReject) isWhatsAppReadyReject(new Error('WhatsApp client error: ' + (err && err.message ? err.message : err)));
      console.error('WhatsApp client error:', err);
      whatsappClient = null;
      // Reset promise
      isWhatsAppReadyPromise = null;
      isWhatsAppReadyResolve = null;
      isWhatsAppReadyReject = null;
    });
    try {
      whatsappClient.initialize();
    } catch (err) {
      isWhatsAppReady = false;
      if (isWhatsAppReadyReject) isWhatsAppReadyReject(new Error('Gagal initialize WhatsApp client: ' + (err && err.message ? err.message : err)));
      console.error('Gagal initialize WhatsApp client:', err);
      whatsappClient = null;
      // Reset promise
      isWhatsAppReadyPromise = null;
      isWhatsAppReadyResolve = null;
      isWhatsAppReadyReject = null;
    }
  }
  return whatsappClient;
}

// Endpoint untuk inisialisasi WhatsApp client dan memicu QR code
export const initWhatsAppClient = async (req, res) => {
  try {
    const client = getWhatsAppClient();

    // Tunggu event 'ready' atau error/disconnect sebelum mengembalikan status
    let readyStatus = false;
    if (isWhatsAppClientReady()) {
      readyStatus = true;
    } else if (isWhatsAppReadyPromise) {
      try {
        await Promise.race([
          isWhatsAppReadyPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout menunggu WhatsApp ready')), 15000))
        ]);
        readyStatus = isWhatsAppClientReady();
      } catch (e) {
        readyStatus = false;
      }
    }

    if (lastQrString) {
      console.log('QR code WhatsApp Web diterima. Scan QR code ini di WhatsApp Web pada browser headless server Anda.');
      console.log('QR string:', lastQrString);
    } else {
      client.once('qr', (qr) => {
        lastQrString = qr;
        isWhatsAppReady = false;
        console.log('QR code WhatsApp Web diterima. Scan QR code ini di WhatsApp Web pada browser headless server Anda.');
        console.log('QR string:', qr);
      });
    }

    return res.status(200).json({
      message: 'Inisialisasi WhatsApp client dipicu. QR code akan muncul di terminal jika tersedia.',
      whatsappReady: readyStatus
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal inisialisasi WhatsApp client.', error: err.message });
  }
};

// Endpoint hanya mengirimkan string kode QR (bukan gambar)
export const getWhatsAppQr = (req, res) => {
  if (lastQrString) {
    return res.status(200).json({ qr: lastQrString });
  } else {
    return res.status(404).json({ message: 'QR code belum tersedia atau sudah tidak berlaku.' });
  }
};

function getPerusahaanIdFromJWT(req) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || path.resolve('public.key');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    return decoded.id || decoded._id;
  } catch (err) {
    return null;
  }
}

export async function sendEmailTujuan({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY belum di-set di environment');
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || 'noreply@yourdomain.com';
  const result = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
  });
  return result;
}

export async function sendWhatsAppTujuan({ to, text }) {
  const client = getWhatsAppClient();
  let nomor = to;
  if (/^\d+$/.test(nomor)) {
    if (!nomor.startsWith('62')) {
      nomor = '62' + nomor.replace(/^0+/, '');
    }
    nomor = nomor + '@c.us';
  }
  // Tunggu event 'ready' sebelum mengirim pesan, dan cek error/disconnect
  if (!isWhatsAppClientReady()) {
    if (isWhatsAppReadyPromise) {
      try {
        await Promise.race([
          isWhatsAppReadyPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout menunggu WhatsApp ready')), 15000))
        ]);
      } catch (e) {
        throw new Error('WhatsApp client belum ready: ' + (e && e.message ? e.message : e));
      }
    } else {
      throw new Error('WhatsApp client belum ready.');
    }
  }
  if (!isWhatsAppClientReady()) {
    throw new Error('WhatsApp client tidak dalam status ready.');
  }
  try {
    return await client.sendMessage(nomor, text);
  } catch (err) {
    throw new Error('Gagal mengirim pesan WhatsApp: ' + (err.message || err));
  }
}

// Controller untuk perusahaan mengirimkan pesan pemberitahuan diterima/ditolak ke alumni pelamar.
export const kirimNotifikasiHasilLamaran = async (req, res) => {
  try {
    const { pelamarId, lowonganId, status, pesan, channel } = req.body;
    const perusahaanId = getPerusahaanIdFromJWT(req);

    if (!perusahaanId) {
      return res.status(401).json({ message: 'Token tidak valid atau tidak ditemukan.' });
    }

    if (
      !pelamarId ||
      !lowonganId ||
      !['diterima', 'ditolak'].includes(status) ||
      !pesan ||
      !channel
    ) {
      return res.status(400).json({ message: 'Data tidak lengkap.' });
    }

    const pelamar = await Pelamar.findById(pelamarId).populate('alumni lowongan');
    if (!pelamar) {
      return res.status(404).json({ message: 'Pelamar tidak ditemukan. Pastikan pelamarId adalah ID pelamar, bukan ID alumni.' });
    }
    if (!pelamar.lowongan || String(pelamar.lowongan._id) !== String(lowonganId)) {
      return res.status(400).json({ message: 'Pelamar tidak terdaftar pada lowongan tersebut.' });
    }

    const lowongan = await Lowongan.findById(lowonganId);
    if (!lowongan) {
      return res.status(404).json({ message: 'Lowongan tidak ditemukan.' });
    }
    if (String(lowongan.perusahaan) !== String(perusahaanId)) {
      return res.status(403).json({ message: 'Anda tidak berhak mengirim notifikasi untuk pelamar ini.' });
    }

    if (pelamar.status !== status) {
      pelamar.status = status;
      await pelamar.save();
    }

    const pesanBaru = new Pesan({
      isi: pesan,
      penerima: pelamar.alumni?._id || pelamar.alumni,
      pengirim: perusahaanId,
      channel,
      status: 'terkirim',
      lowongan: lowonganId
    });
    await pesanBaru.save();

    if (channel === 'email') {
      const alumni = pelamar.alumni && pelamar.alumni.email
        ? pelamar.alumni
        : await Alumni.findById(pelamar.alumni);

      if (!alumni || !alumni.email) {
        return res.status(400).json({ message: 'Email alumni tidak ditemukan.' });
      }

      let perusahaan = null;
      try {
        perusahaan = await Lowongan.findById(lowonganId).populate('perusahaan', 'nama_perusahaan email_perusahaan');
      } catch (e) {}
      let namaPerusahaan = perusahaan && perusahaan.perusahaan && perusahaan.perusahaan.nama_perusahaan
        ? perusahaan.perusahaan.nama_perusahaan
        : 'Perusahaan';

      try {
        await sendEmailTujuan({
          to: alumni.email,
          subject: `Notifikasi Lamaran Anda (${status}) - ${namaPerusahaan}`,
          text: pesan,
          html: `<p>${pesan}</p>`,
        });
      } catch (err) {
        return res.status(500).json({ message: 'Gagal mengirim email ke alumni.', error: err.message });
      }
    }

    if (channel === 'whatsapp') {
      const alumni = pelamar.alumni && pelamar.alumni.nohp
        ? pelamar.alumni
        : await Alumni.findById(pelamar.alumni);

      if (!alumni || !alumni.nohp) {
        return res.status(400).json({ message: 'Nomor WhatsApp alumni tidak ditemukan.' });
      }

      try {
        await sendWhatsAppTujuan({
          to: alumni.nohp,
          text: pesan,
        });
      } catch (err) {
        return res.status(500).json({ message: 'Gagal mengirim WhatsApp ke alumni.', error: err.message || err });
      }
    }

    // Tidak ada kode Telegram

    return res.status(200).json({
      message: `Notifikasi ${status} berhasil dikirim ke alumni.`,
      data: {
        pelamarId: pelamar._id,
        lowonganId: lowonganId,
        status: pelamar.status,
        pesan: pesanBaru
      }
    });
  } catch (error) {
    if (
      error &&
      error.message &&
      error.message.includes('net::ERR_NAME_NOT_RESOLVED')
    ) {
      return res.status(500).json({
        message: 'Gagal menghubungi WhatsApp Web. Pastikan server memiliki akses internet dan domain web.whatsapp.com dapat diakses.',
        error: error.message
      });
    }
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Controller untuk perusahaan mengirim pesan custom ke alumni (bukan notifikasi hasil lamaran).
export const kirimPesanKeAlumni = async (req, res) => {
  try {
    const { alumniId, pesan, channel, lowonganId } = req.body;
    const perusahaanId = getPerusahaanIdFromJWT(req);

    if (!perusahaanId) {
      return res.status(401).json({ message: 'Token tidak valid atau tidak ditemukan.' });
    }

    if (!alumniId || !pesan || !channel) {
      return res.status(400).json({ message: 'Data tidak lengkap.' });
    }

    const alumni = await Alumni.findById(alumniId);
    if (!alumni) {
      return res.status(404).json({ message: 'Alumni tidak ditemukan.' });
    }

    const pesanBaru = new Pesan({
      isi: pesan,
      penerima: alumniId,
      pengirim: perusahaanId,
      channel,
      status: 'terkirim',
      ...(lowonganId && { lowongan: lowonganId })
    });
    await pesanBaru.save();

    if (channel === 'email') {
      let namaPerusahaan = 'Perusahaan';
      if (lowonganId) {
        try {
          const lowongan = await Lowongan.findById(lowonganId).populate('perusahaan', 'nama_perusahaan');
          if (lowongan && lowongan.perusahaan && lowongan.perusahaan.nama_perusahaan) {
            namaPerusahaan = lowongan.perusahaan.nama_perusahaan;
          }
        } catch (e) {}
      }
      try {
        await sendEmailTujuan({
          to: alumni.email,
          subject: `Pesan dari ${namaPerusahaan}`,
          text: pesan,
          html: `<p>${pesan}</p>`,
        });
      } catch (err) {
        return res.status(500).json({ message: 'Gagal mengirim email ke alumni.', error: err.message });
      }
    }

    if (channel === 'whatsapp') {
      if (!alumni.nohp) {
        return res.status(400).json({ message: 'Nomor WhatsApp alumni tidak ditemukan.' });
      }
      try {
        await sendWhatsAppTujuan({
          to: alumni.nohp,
          text: pesan,
        });
      } catch (err) {
        return res.status(500).json({ message: 'Gagal mengirim WhatsApp ke alumni.', error: err.message || err });
      }
    }

    // Tidak ada kode Telegram

    return res.status(200).json({
      message: 'Pesan berhasil dikirim ke alumni.',
      data: pesanBaru
    });
  } catch (error) {
    if (
      error &&
      error.message &&
      error.message.includes('net::ERR_NAME_NOT_RESOLVED')
    ) {
      return res.status(500).json({
        message: 'Gagal menghubungi WhatsApp Web. Pastikan server memiliki akses internet dan domain web.whatsapp.com dapat diakses.',
        error: error.message
      });
    }
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Controller untuk menampilkan daftar pesan yang diterima oleh alumni (pelamar) tertentu.
export const getPesanUntukAlumni = async (req, res) => {
  try {
    const alumniId = req.user && (req.user.id || req.user._id);

    if (!alumniId) {
      return res.status(401).json({ message: 'Token tidak valid atau tidak ditemukan.' });
    }

    const alumni = await Alumni.findById(alumniId);
    if (!alumni) {
      return res.status(404).json({ message: 'Alumni tidak ditemukan.' });
    }

    const pesanList = await Pesan.find({ penerima: alumniId })
      .sort({ createdAt: -1 })
      .populate('pengirim', 'nama_perusahaan email_perusahaan logo_perusahaan');

    return res.status(200).json({
      message: 'Daftar pesan untuk alumni ditemukan.',
      data: pesanList
    });
  } catch (error) {
    if (
      error &&
      error.message &&
      error.message.includes('Cannot populate path `lowongan`')
    ) {
      return res.status(500).json({
        message: 'Terjadi kesalahan server. Field "lowongan" tidak ada di schema Pesan. Silakan tambahkan field tersebut jika ingin relasi ke lowongan.',
        error: error.message
      });
    }
    if (
      error &&
      error.message &&
      error.message.includes('net::ERR_NAME_NOT_RESOLVED')
    ) {
      return res.status(500).json({
        message: 'Gagal menghubungi WhatsApp Web. Pastikan server memiliki akses internet dan domain web.whatsapp.com dapat diakses.',
        error: error.message
      });
    }
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Endpoint untuk mendapatkan jumlah pesan belum dibaca (unread) untuk user yang sedang login.
export const getUnreadPesanCount = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (!user._id && !user.id) || !user.role) {
      return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
    }

    const userId = (user._id && user._id.toString()) || (user.id && user.id.toString());
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    let filter = {};
    if (user.role === "alumni" || user.role === "perusahaan") {
      filter = { penerima: userId, sudah_dibaca: false };
    } else {
      return res.status(403).json({ message: 'Role tidak diizinkan untuk melihat pesan.' });
    }

    const unreadCount = await Pesan.countDocuments(filter);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ unread: unreadCount });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Endpoint untuk mengubah status sudah_dibaca pada pesan tertentu (hanya penerima yang bisa).
export const updateSudahDibaca = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (!user._id && !user.id) || !user.role) {
      return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
    }

    const pesanId = req.params.id;
    if (!pesanId) {
      return res.status(400).json({ message: 'ID pesan harus disertakan.' });
    }

    const pesan = await Pesan.findById(pesanId).populate('penerima', '_id');
    if (!pesan) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
    }

    const userId = (user._id && user._id.toString()) || (user.id && user.id.toString());

    let penerimaId = pesan.penerima;
    if (penerimaId && typeof penerimaId === 'object' && penerimaId._id) {
      penerimaId = penerimaId._id.toString();
    } else if (typeof penerimaId === 'string') {
      // sudah string
    } else if (penerimaId && penerimaId.toString) {
      penerimaId = penerimaId.toString();
    }

    if (penerimaId !== userId) {
      return res.status(403).json({ message: 'Anda tidak diizinkan mengubah status pesan ini.' });
    }

    const { sudah_dibaca } = req.body;
    if (typeof sudah_dibaca !== "boolean") {
      return res.status(400).json({ message: 'Field sudah_dibaca harus berupa boolean.' });
    }

    pesan.sudah_dibaca = sudah_dibaca;
    await pesan.save();

    return res.status(200).json({ message: 'Status sudah_dibaca berhasil diupdate.', pesan });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Endpoint untuk menghapus pesan (hanya penerima atau pengirim yang boleh menghapus)
export const deletePesan = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (!user._id && !user.id)) {
      return res.status(401).json({ message: 'User belum login atau token tidak valid.' });
    }
    const pesanId = req.params.id;
    if (!pesanId) {
      return res.status(400).json({ message: 'ID pesan harus disertakan.' });
    }

    const pesan = await Pesan.findById(pesanId);
    if (!pesan) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
    }

    const userId = (user._id && user._id.toString()) || (user.id && user.id.toString());
    const penerimaId = pesan.penerima && pesan.penerima.toString();
    const pengirimId = pesan.pengirim && pesan.pengirim.toString();

    if (userId !== penerimaId && userId !== pengirimId) {
      return res.status(403).json({ message: 'Anda tidak diizinkan menghapus pesan ini.' });
    }

    await Pesan.findByIdAndDelete(pesanId);

    return res.status(200).json({ message: 'Pesan berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Fungsi untuk logout WhatsApp bot
export const logoutWhatsAppBot = async (req, res) => {
  try {
    if (typeof whatsappClient === 'undefined' || !whatsappClient) {
      return res.status(400).json({ message: 'WhatsApp client belum terinisialisasi.' });
    }

    await whatsappClient.logout();
    whatsappClient = null;
    isWhatsAppReady = false;
    // Reset promise
    isWhatsAppReadyPromise = null;
    isWhatsAppReadyResolve = null;
    isWhatsAppReadyReject = null;
    return res.status(200).json({ message: 'Berhasil logout dari WhatsApp.' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal logout dari WhatsApp.', error: error.message });
  }
};
