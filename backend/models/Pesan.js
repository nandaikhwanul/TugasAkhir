import mongoose from 'mongoose';

const PesanSchema = new mongoose.Schema({
  isi: {
    type: String,
    required: true,
    trim: true
  },
  penerima: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true
  },
  pengirim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Perusahaan',
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'whatsapp', 'web', 'telegram'],
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['terkirim', 'gagal', 'dibaca'],
    default: 'terkirim',
    trim: true
  },
  sudah_dibaca: {
    type: Boolean,
    default: false
  },
  waktu: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'pesan',
  timestamps: true
});

export default mongoose.model('Pesan', PesanSchema);
