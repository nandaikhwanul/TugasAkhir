import mongoose from "mongoose";

const AlumniSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100,
        trim: true
    },
    nim: {
        type: String,
        required: true,
        trim: true,
        minlength: 7
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, "Please fill a valid email address"]
    },
    password: {
        type: String,
        required: true
    },
    confPassword: {
        type: String,
        required: true
    },
    nohp: {
        type: String,
        trim: true,
        minlength: 10 // Minimal nomor HP 10 digit
    },
    alamat: {
        type: String,
        trim: true
    },
    tanggal_lahir: {
        type: Date
    },
    program_studi: {
        type: String,
        trim: true
    },
    tahun_lulus: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear()
    },
    skill: {
        type: [String],
        default: []
    },
    role: {
        type: String,
        required: true,
        default: "alumni",
        enum: ["alumni"]
    },
    token: {
        type: String,
        default: null
    },
    foto_profil: {
        type: String,
        default: null,
        trim: true
        // URL ke foto profil alumni, bisa null jika belum diupload
    },
    foto_sampul: {
        type: String,
        default: null,
        trim: true
        // URL ke foto sampul alumni, bisa null jika belum diupload
    },
    deskripsi: {
        type: String,
        default: "",
        trim: true
        // Deskripsi singkat tentang alumni
    },
    media_sosial: {
        type: [
            {
                platform: { type: String, trim: true }, // contoh: "LinkedIn", "Instagram"
                url: { type: String, trim: true }
            }
        ],
        default: []
        // Daftar media sosial alumni
    },
    portofolio: {
        type: [
            {
                nama: { type: String, trim: true }, // nama portofolio atau project
                url: { type: String, trim: true }
            }
        ],
        default: []
        // Daftar link portofolio alumni
    },
    pengalaman: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pengalaman"
        }
    ]
}, {
    collection: "alumni",
    timestamps: true
});

export default mongoose.model("Alumni", AlumniSchema);