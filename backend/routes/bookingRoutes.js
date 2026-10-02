import express from 'express';
import { create, cancel, list, approve, reject } from '../controllers/bookingController.js';
import { validateCreateBooking } from '../validators/bookingValidator.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('student'), validateCreateBooking, create);
router.get('/', authenticateToken, list);
router.patch('/:id/cancel', authenticateToken, cancel);
router.patch('/:id/approve', authenticateToken, authorizeRoles('owner'), approve);
router.patch('/:id/reject', authenticateToken, authorizeRoles('owner'), reject);

export default router;
