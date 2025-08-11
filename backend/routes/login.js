import express from "express";
import { login, logoutUser } from "../controllers/Login.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Semua tipe user login lewat satu endpoint /login
router.post("/login", login);

// Generalized logout endpoint for all user types
router.post("/logout", verifyUser, logoutUser);

export default router;
