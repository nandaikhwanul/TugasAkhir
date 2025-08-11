import mongoose from "mongoose";

const LowonganSchema = new mongoose.Schema({
    judul_pekerjaan: {
        type: String,
        required: true
    },
    deskripsi: {
        type: String,
        required: true
    },
    kualifikasi: {
        type: String,
        required: true
    },
    lokasi: {
        type: String,
        required: true
    },
    tipe_kerja: {
        type: String,
        enum: ['Full Time', 'Part Time', 'Internship', 'Freelance', 'Contract'],
        required: true
    },
    gaji: {
        type: String,
        required: true
    },
    batas_lamaran: {
        type: Date,
        required: true
    },
    batas_pelamar: {
        type: Number,
        required: true
    },
    jumlah_pelamar: {
        type: Number,
        required: false,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'pending_verification', 'rejected'],
        default: 'pending_verification'
    },
    perusahaan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Perusahaan",
        required: false
    },
    traffic: {
        type: Number,
        default: 0
    },
    // Tambahkan field savedBy untuk menyimpan referensi alumni yang menyimpan lowongan ini
    savedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Alumni"
    }]
}, {
    timestamps: true,
    collection: "lowongan"
});

const Lowongan = mongoose.models.Lowongan || mongoose.model("Lowongan", LowonganSchema);

export default Lowongan;
