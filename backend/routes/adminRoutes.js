import express from 'express';
import { getStats, getLibraries, getUsers, verifyLibrary, toggleBlockUser } from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Enforce admin-only access on all routes inside this file
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/stats', getStats);
router.get('/libraries', getLibraries);
router.get('/users', getUsers);
router.patch('/libraries/:libraryId/verify', verifyLibrary);
router.patch('/users/:userId/block', toggleBlockUser);

export default router;
