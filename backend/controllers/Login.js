import Alumni from "../models/Alumni.js";
import Perusahaan from "../models/Perusahaan.js";
import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { validationResult, check } from "express-validator";

// Load private key untuk signing JWT (RS256)
let PRIVATE_KEY;
try {
    PRIVATE_KEY = fs.readFileSync(path.resolve("private.key"), "utf8");
} catch (err) {
    console.error("Gagal membaca private.key:", err.message);
    PRIVATE_KEY = null;
}

// Helper untuk set cookie JWT (hanya lewat Set-Cookie, tidak perlu set header Authorization)
function setTokenCookie(res, token) {
    // 30 menit
    const maxAge = 30 * 60 * 1000;
    res.cookie("token", token, {
        maxAge: maxAge,
        path: "/"
    });
}

// Middleware express-validator untuk login
export const loginValidation = [
    check("email")
        .notEmpty().withMessage("Email wajib diisi")
        .isEmail().withMessage("Format email tidak valid"),
    check("password")
        .notEmpty().withMessage("Password wajib diisi")
];

// Login hanya menggunakan email (untuk Alumni, Perusahaan, Admin, dan SuperAdmin)
export const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorObj = errors.array().reduce((acc, curr) => {
            acc[curr.param] = curr.msg;
            return acc;
        }, {});
        return res.status(400).json({ errors: errorObj });
    }

    const { email, password } = req.body;

    if (!PRIVATE_KEY) {
        return res.status(500).json({ msg: "Server error: private key tidak ditemukan" });
    }

    try {
        let user = null;
        let responseData = {};

        // Coba login sebagai Alumni
        user = await Alumni.findOne({ email: email });
        if (user) {
            const match = await argon2.verify(user.password, password);
            if (!match) return res.status(400).json({ msg: "Password salah" });

            const token = jwt.sign(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: "alumni"
                },
                PRIVATE_KEY,
                { expiresIn: "30m", algorithm: "RS256" }
            );

            user.token = token;
            await user.save();

            setTokenCookie(res, token);

            responseData = {
                msg: "Login berhasil sebagai alumni",
                id: user._id,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: "alumni"
                },
                token: token
            };
            return res.status(200).json(responseData);
        }

        // Coba login sebagai Perusahaan
        user = await Perusahaan.findOne({ email_perusahaan: email });
        if (user) {
            const match = await argon2.verify(user.password, password);
            if (!match) return res.status(400).json({ msg: "Password salah" });

            const token = jwt.sign(
                {
                    id: user._id,
                    nama_perusahaan: user.nama_perusahaan,
                    email_perusahaan: user.email_perusahaan,
                    role: "perusahaan"
                },
                PRIVATE_KEY,
                { expiresIn: "30m", algorithm: "RS256" }
            );

            user.token = token;
            await user.save();

            setTokenCookie(res, token);

            responseData = {
                msg: "Login berhasil sebagai perusahaan",
                id: user._id,
                user: {
                    id: user._id,
                    nama_perusahaan: user.nama_perusahaan,
                    email_perusahaan: user.email_perusahaan,
                    role: "perusahaan"
                },
                token: token
            };
            return res.status(200).json(responseData);
        }

        // Coba login sebagai Admin
        user = await Admin.findOne({ email: email });
        if (user) {
            const match = await argon2.verify(user.password, password);
            if (!match) return res.status(400).json({ msg: "Password salah" });

            const token = jwt.sign(
                {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: "admin"
                },
                PRIVATE_KEY,
                { expiresIn: "30m", algorithm: "RS256" }
            );

            if ('token' in user) {
                user.token = token;
                await user.save();
            }

            setTokenCookie(res, token);

            responseData = {
                msg: "Login berhasil sebagai admin",
                id: user._id,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: "admin"
                },
                token: token
            };
            return res.status(200).json(responseData);
        }

        // Coba login sebagai SuperAdmin
        user = await SuperAdmin.findOne({ email: email });
        if (user) {
            const match = await argon2.verify(user.password, password);
            if (!match) return res.status(400).json({ msg: "Password salah" });

            const token = jwt.sign(
                {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: "superadmin"
                },
                PRIVATE_KEY,
                { expiresIn: "30m", algorithm: "RS256" }
            );

            if ('token' in user) {
                user.token = token;
                await user.save();
            }

            setTokenCookie(res, token);

            responseData = {
                msg: "Login berhasil sebagai superadmin",
                id: user._id,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: "superadmin"
                },
                token: token
            };
            return res.status(200).json(responseData);
        }

        return res.status(404).json({ msg: "User tidak ditemukan" });
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
};

export const logoutUser = async (req, res) => {
    try {
        let userId = null;
        let userType = null;
        let UserModel = null;

        if (req.role) {
            userType = req.role;
        } else if (req.userType) {
            userType = req.userType;
        } else if (req.session && req.session.role) {
            userType = req.session.role;
        } else if (req.body && req.body.role) {
            userType = req.body.role;
        }

        if (req.userId) {
            userId = req.userId;
        } else if (req.session && req.session.userId) {
            userId = req.session.userId;
        } else if (req.body && req.body.id) {
            userId = req.body.id;
        } else if (req.params && req.params.id) {
            userId = req.params.id;
        }

        if (userType === "alumni") {
            UserModel = (await import("../models/Alumni.js")).default;
        } else if (userType === "perusahaan") {
            UserModel = (await import("../models/Perusahaan.js")).default;
        } else if (userType === "admin") {
            UserModel = (await import("../models/Admin.js")).default;
        } else if (userType === "superadmin") {
            UserModel = (await import("../models/SuperAdmin.js")).default;
        }

        if (UserModel && userId) {
            await UserModel.updateOne({ _id: userId }, { $set: { token: null } });
        }

        // Hapus cookie token
        res.clearCookie("token", {
            path: "/"
        });

        req.session.destroy((err) => {
            if (err) return res.status(400).json({ msg: "Tidak dapat logout" });
            res.status(200).json({ msg: "Anda telah logout" });
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
