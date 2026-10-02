import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import { connectDb } from './utils/db.js';
import errorHandler from './middleware/errorHandler.js';
import { checkExpiredMiddleware, checkExpiredBookings } from './utils/expirationEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route Imports
import authRoutes from './routes/authRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const PORT = config.port;

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Expiration Engine Middleware: runs on every API request to guarantee fresh states
app.use('/api', checkExpiredMiddleware);

// Basic Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health Check Route (Unprotected)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FocusDesk API is running smoothly.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/libraries', libraryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

// Initialize MongoDB and start the server
const startServer = async () => {
  try {
    await connectDb();

    // Start background interval for auto-expiration checks (run every 60s)
    setInterval(checkExpiredBookings, 60000);
    console.log('⏰ Expiration Engine scheduled (60s checks).');

    app.listen(PORT, () => {
      console.log(`🚀 FocusDesk Server running in ${config.nodeEnv} mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error during startup, server shutdown:', error);
    process.exit(1);
  }
};

startServer();
