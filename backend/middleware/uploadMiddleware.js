import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedMime = /^image\/(jpeg|jpg|png|webp|pjpeg|x-png|avif)$/i;
  const allowedExt = /\.(jpe?g|png|webp|avif)$/i;

  if (allowedMime.test(file.mimetype) || allowedExt.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed.'), false);
  }
};

// Create the multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5, // Maximum 5 files per upload
  },
  fileFilter,
});

export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ status: 'error', message: 'File is too large. Max size is 10MB per photo.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ status: 'error', message: 'Too many files uploaded. Maximum is 5 photos.' });
    }
    return res.status(400).json({ status: 'error', message: err.message });
  } else if (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
  next();
};
