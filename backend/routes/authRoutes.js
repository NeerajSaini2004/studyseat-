import express from 'express';
import { register, login, googleLogin, getMe, updateProfile } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidator.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/google', googleLogin);
router.get('/me', authenticateToken, getMe);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
