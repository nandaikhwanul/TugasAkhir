import mongoose from 'mongoose';

// Skema seperti di pesan.js, tapi pengirim dan penerima bisa 3 tipe: Alumni, Perusahaan, Admin
const PesanBebasSchema = new mongoose.Schema({
  isi: {
    type: String,
    required: true,
    trim: true
  },
  pengirim: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'pengirim_tipe'
  },
  pengirim_tipe: {
    type: String,
    required: true,
    enum: ['Alumni', 'Perusahaan', 'Admin']
  },
  penerima: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'penerima_tipe'
  },
  penerima_tipe: {
    type: String,
    required: true,
    enum: ['Alumni', 'Perusahaan', 'Admin']
  },
  sudah_dibaca: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'pesan_bebas',
  timestamps: true
});

export default mongoose.model('PesanBebas', PesanBebasSchema);
