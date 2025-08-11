import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import connectMongoDB from "./config/Database.js";
import PerusahaanRoute from "./routes/perusahaan.js";
import AlumniRoute from "./routes/alumni.js";
import LoginRoute from "./routes/login.js";
import AdminRoute from "./routes/admin.js";
import LowonganRoute from "./routes/lowongan.js";
import PelamarRoute from "./routes/pelamar.js";
import PesanRoute from "./routes/pesan.js";
import FotoPerusahaanRoute from "./routes/fotoPerusahaan.js";
import ContentRoute from "./routes/content.js";
import pesanBebasRoute from "./routes/pesanBebas.js"; // importkan pesanBebasRoute
import PengalamanRoute from "./routes/pengalaman.js"; // import pengalaman route
import TambahAlumniRoute from "./routes/tambahAlumni.js"; // tambahkan import route tambahAlumni
import CVRoute from "./routes/CV.js"; // import route CV

// Import semua forum routes
import forumPostRoutes from "./routes/forumPostRoutes.js";
import forumCategoryRoutes from "./routes/forumCategoryRoutes.js";
import forumCommentRoutes from "./routes/forumCommentRoutes.js";

// Import superadmin route
import SuperAdminRoute from "./routes/superAdmin.js"; // tambahkan import route superadmin

dotenv.config();

const app = express();

// Connect to MongoDB
connectMongoDB();

app.use(session({
    secret: process.env.SESS_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

// Izinkan CORS untuk mengakses localhost:3000
app.use(cors({
    credentials: true,
    origin: ['https://tugasakhir-production-0986.up.railway.app', 'http://localhost:3000'], 
}));

app.use(express.json());

// Serve folder uploads sebagai static file agar file upload bisa diakses publik
app.use('/uploads', express.static('uploads'));

app.use(PerusahaanRoute);
app.use(AlumniRoute);
app.use(LoginRoute);
app.use(PelamarRoute);
app.use("/lowongan", LowonganRoute);
app.use('/admin', AdminRoute);
app.use('/superadmin', SuperAdminRoute); // pasang route superadmin
app.use('/pesan', PesanRoute);
app.use('/foto-perusahaan', FotoPerusahaanRoute);
app.use('/content', ContentRoute);
app.use('/pesan-bebas', pesanBebasRoute); // pasang pesanBebasRoute
app.use('/pengalaman', PengalamanRoute); // pasang pengalaman route
app.use('/tambah-alumni', TambahAlumniRoute); // pasang route tambahAlumni
app.use('/cv', CVRoute); // daftarkan route CV

// Pasang semua forum routes
app.use('/forum/posts', forumPostRoutes);
app.use('/forum/categories', forumCategoryRoutes);
app.use('/forum/comments', forumCommentRoutes);

const PORT = process.env.APP_PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server up and running on port ${PORT}...`);
});
