import express from 'express';
import { createAdmin, registerSuperAdmin, editAdmin, deleteAdmin, getSuperAdminMe } from '../controllers/SuperAdmin.js';
import { verifyUser } from '../middleware/AuthUser.js';

const router = express.Router();

// Route untuk superadmin membuat admin baru
router.post('/create-admin', verifyUser, createAdmin);

// Route untuk register super admin
router.post('/register-superadmin', registerSuperAdmin);

// Route untuk get superadmin me
router.get('/me', verifyUser, getSuperAdminMe);

// Route untuk edit admin (oleh superadmin)
router.put('/edit-admin/:id', verifyUser, editAdmin);

// Route untuk delete admin (oleh superadmin)
router.delete('/delete-admin/:id', verifyUser, deleteAdmin);

export default router;
