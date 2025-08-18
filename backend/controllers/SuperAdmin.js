import Admin from '../models/Admin.js';
import SuperAdmin from '../models/SuperAdmin.js';
import argon2 from 'argon2';

// Controller untuk super admin membuat admin baru
export const createAdmin = async (req, res) => {
    try {
        // Pastikan user yang membuat adalah superadmin
        const superAdminId = req.user && req.user.id;
        const superAdmin = await SuperAdmin.findById(superAdminId);
        if (!superAdmin || superAdmin.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized. Only superadmin can create admin.' });
        }

        const { username, password, email } = req.body;

        // Validasi input
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Username, password, and email are required.' });
        }

        // Cek apakah username atau email sudah digunakan
        const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existingAdmin) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        // Hash password dengan argon2
        const hashedPassword = await argon2.hash(password);

        // Buat admin baru
        const newAdmin = new Admin({
            username,
            password: hashedPassword,
            email,
            role: 'admin'
        });

        await newAdmin.save();

        res.status(201).json({ message: 'Admin created successfully', admin: { username, email, role: newAdmin.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller untuk register super admin baru
export const registerSuperAdmin = async (req, res) => {
    try {
        // Cek apakah sudah ada superadmin di database
        const superAdminCount = await SuperAdmin.countDocuments();
        if (superAdminCount > 0) {
            return res.status(403).json({ message: 'SuperAdmin account already exists. Only one SuperAdmin is allowed.' });
        }

        const { username, password, email } = req.body;

        // Validasi input
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Username, password, and email are required.' });
        }

        // Cek apakah username atau email sudah digunakan
        const existingSuperAdmin = await SuperAdmin.findOne({ $or: [{ username }, { email }] });
        if (existingSuperAdmin) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        // Hash password dengan argon2
        const hashedPassword = await argon2.hash(password);

        // Buat super admin baru
        const newSuperAdmin = new SuperAdmin({
            username,
            password: hashedPassword,
            email,
            role: 'superadmin'
        });

        await newSuperAdmin.save();

        res.status(201).json({ message: 'SuperAdmin registered successfully', superadmin: { username, email, role: newSuperAdmin.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller untuk mendapatkan data superadmin yang sedang login
export const getSuperAdminMe = async (req, res) => {
    try {
        const superAdminId = req.user && req.user.id;
        if (!superAdminId) {
            return res.status(401).json({ message: 'Unauthorized. No superadmin id found in token.' });
        }
        const superAdmin = await SuperAdmin.findById(superAdminId).select('-password');
        if (!superAdmin) {
            return res.status(404).json({ message: 'SuperAdmin not found.' });
        }
        res.status(200).json({
            id: superAdmin._id,
            username: superAdmin.username,
            email: superAdmin.email,
            role: superAdmin.role,
            createdAt: superAdmin.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller untuk mendapatkan list semua admin (hanya superadmin)
export const getAdmins = async (req, res) => {
    try {
        // Pastikan user yang meminta adalah superadmin
        const superAdminId = req.user && req.user.id;
        const superAdmin = await SuperAdmin.findById(superAdminId);
        if (!superAdmin || superAdmin.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized. Only superadmin can view admins.' });
        }

        // Ambil semua admin, exclude password
        const admins = await Admin.find().select('-password');
        res.status(200).json({ admins });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller untuk mendapatkan detail admin by id (hanya superadmin)
export const getAdminById = async (req, res) => {
    try {
        // Pastikan user yang meminta adalah superadmin
        const superAdminId = req.user && req.user.id;
        const superAdmin = await SuperAdmin.findById(superAdminId);
        if (!superAdmin || superAdmin.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized. Only superadmin can view admin.' });
        }

        const { id } = req.params;
        const admin = await Admin.findById(id).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }
        res.status(200).json({ admin });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller untuk edit admin (oleh superadmin)
export const editAdmin = async (req, res) => {
    try {
        // Pastikan user yang mengedit adalah superadmin
        const superAdminId = req.user && req.user.id;
        const superAdmin = await SuperAdmin.findById(superAdminId);
        if (!superAdmin || superAdmin.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized. Only superadmin can edit admin.' });
        }

        const { id } = req.params; // id admin yang akan diedit
        const { username, password, email } = req.body;

        // Cari admin yang akan diedit
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        // Cek jika username/email baru sudah digunakan oleh admin lain
        if (username && username !== admin.username) {
            const existingUsername = await Admin.findOne({ username, _id: { $ne: id } });
            if (existingUsername) {
                return res.status(409).json({ message: 'Username already exists.' });
            }
            admin.username = username;
        }
        if (email && email !== admin.email) {
            const existingEmail = await Admin.findOne({ email, _id: { $ne: id } });
            if (existingEmail) {
                return res.status(409).json({ message: 'Email already exists.' });
            }
            admin.email = email;
        }

        // Jika password diisi, hash password baru
        if (password) {
            admin.password = await argon2.hash(password);
        }

        await admin.save();

        res.status(200).json({ message: 'Admin updated successfully', admin: { username: admin.username, email: admin.email, role: admin.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller untuk delete admin (oleh superadmin)
export const deleteAdmin = async (req, res) => {
    try {
        // Pastikan user yang menghapus adalah superadmin
        const superAdminId = req.user && req.user.id;
        const superAdmin = await SuperAdmin.findById(superAdminId);
        if (!superAdmin || superAdmin.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized. Only superadmin can delete admin.' });
        }

        const { id } = req.params; // id admin yang akan dihapus

        // Cari admin yang akan dihapus
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        await Admin.deleteOne({ _id: id });

        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
