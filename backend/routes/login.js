import express from "express";
import { login, logoutUser } from "../controllers/Login.js";
import { verifyUser, protectedRoute } from "../middleware/AuthUser.js";

const router = express.Router();

// Semua tipe user login lewat satu endpoint /login
router.post("/login", login);

// Generalized logout endpoint for all user types
router.post("/logout", verifyUser, logoutUser);

// Endpoint /protected untuk menguji akses token dari frontend
// Hanya bisa diakses jika token valid (menggunakan verifyUser)
router.get("/protected", verifyUser, protectedRoute);

export default router;
