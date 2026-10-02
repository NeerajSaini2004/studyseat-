import express from 'express';
import { createReview, listForLibrary } from '../controllers/reviewController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('student'), createReview);
router.get('/library/:libraryId', listForLibrary);

export default router;
