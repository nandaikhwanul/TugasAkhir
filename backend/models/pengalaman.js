import mongoose from "mongoose";

const PengalamanSchema = new mongoose.Schema({
    alumni: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Alumni",
        required: true
    },
    jenis: {
        type: String,
        enum: ["kerja", "organisasi", "magang", "lainnya"],
        required: true
    },
    nama: {
        type: String,
        required: true
    },
    posisi: {
        type: String,
        required: true
    },
    lokasi: {
        type: String
    },
    deskripsi: {
        type: String
    },
    tanggal_mulai: {
        type: Date,
        required: true
    },
    tanggal_selesai: {
        type: Date
    },
    masih_berjalan: {
        type: Boolean,
        default: false
    },
    dibuat_pada: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Pengalaman", PengalamanSchema);
