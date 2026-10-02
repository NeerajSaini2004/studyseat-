import express from 'express';
import { list, markAsRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, list);
router.patch('/:id/read', authenticateToken, markAsRead);

export default router;
