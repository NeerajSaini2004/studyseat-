import express from 'express';
import { createLibrary, getLibrary, getSeats, listLibraries, updateLibrary, updateSeat, uploadPhotos } from '../controllers/libraryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { upload, handleUploadErrors } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', listLibraries);
router.post('/', authenticateToken, authorizeRoles('owner'), createLibrary);
router.get('/:id', getLibrary);
router.patch('/:id', authenticateToken, authorizeRoles('owner'), updateLibrary);
router.post('/:id/photos', authenticateToken, authorizeRoles('owner'), upload.array('photos', 5), handleUploadErrors, uploadPhotos);
router.get('/:id/seats', authenticateToken, getSeats);
router.patch('/:id/seats/:seatId', authenticateToken, authorizeRoles('owner'), updateSeat);

export default router;
