import mongoose from "mongoose";

const PerusahaanSchema = new mongoose.Schema({
    nama_perusahaan: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100,
        trim: true
    },
    nama_brand: {
        type: String,
        trim: true
    },
    jumlah_karyawan: {
        type: Number,
        min: 1
    },
    email_perusahaan: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, "Please fill a valid email address"]
    },
    alamat: {
        type: String,
        trim: true
    },
    bidang_perusahaan: {
        type: String,
        trim: true
    },
    nomor_telp: {
        type: String,
        trim: true
    },
    deskripsi_perusahaan: {
        type: String,
        trim: true
    },
    logo_perusahaan: {
        type: String,
        trim: true
    },
    // Tambahan field foto (opsional)
    foto: [{
        type: String,
        trim: true
    }],
    // Tambahan field media sosial dan website
    website: {
        type: String,
        trim: true
    },
    media_sosial: {
        type: Map,
        of: String,
        default: undefined // agar field tidak selalu muncul jika kosong
        // Contoh: { instagram: "url", linkedin: "url", facebook: "url", twitter: "url" }
    },
    role: {
        type: String,
        default: "perusahaan",
        enum: ["perusahaan"]
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String,
        default: null
    }
}, {
    collection: "perusahaan",
    timestamps: true
});

export default mongoose.model("Perusahaan", PerusahaanSchema);