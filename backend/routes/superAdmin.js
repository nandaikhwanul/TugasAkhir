import express from 'express';
import { 
    createAdmin, 
    registerSuperAdmin, 
    editAdmin, 
    deleteAdmin, 
    getSuperAdminMe,
    getAdminById, // tambahkan controller getAdminById
    getAdmins // tambahkan controller getAdmins
} from '../controllers/SuperAdmin.js';
import { verifyUser } from '../middleware/AuthUser.js';

const router = express.Router();

// Route untuk superadmin membuat admin baru
router.post('/create-admin', verifyUser, createAdmin);

// Route untuk register super admin
router.post('/register-superadmin', registerSuperAdmin);

// Route untuk get superadmin me
router.get('/me', verifyUser, getSuperAdminMe);

// Route untuk get semua admin (oleh superadmin)
router.get('/admins', verifyUser, getAdmins);

// Route untuk get detail admin by id (oleh superadmin)
router.get('/admin/:id', verifyUser, getAdminById);

// Route untuk edit admin (oleh superadmin)
router.put('/edit-admin/:id', verifyUser, editAdmin);

// Route untuk delete admin (oleh superadmin)
router.delete('/delete-admin/:id', verifyUser, deleteAdmin);

export default router;
