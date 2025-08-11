import mongoose from "mongoose";

const FotoPerusahaanSchema = new mongoose.Schema({
  perusahaan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Perusahaan",
    required: true,
  },
  foto: {
    type: [String],
    required: true,
  },
  // Tambahkan field lain jika diperlukan, misal: caption, urutan, dsb.
}, {
  timestamps: true,
});

export default mongoose.model("FotoPerusahaan", FotoPerusahaanSchema);
