import mongoose from "mongoose";

const PelamarSchema = new mongoose.Schema({
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true
  },
  lowongan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lowongan',
    required: true
  },
  tanggalMelamar: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'diterima', 'ditolak'],
    default: 'pending'
  }
});

export default mongoose.model('Pelamar', PelamarSchema);
