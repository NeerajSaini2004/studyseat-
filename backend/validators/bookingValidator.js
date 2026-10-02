import mongoose from 'mongoose';

export const validateCreateBooking = (req, res, next) => {
  const { libraryId, seatId, startTime, endTime } = req.body;

  if (!libraryId || !mongoose.Types.ObjectId.isValid(libraryId)) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid libraryId is required.',
    });
  }

  if (!seatId || !mongoose.Types.ObjectId.isValid(seatId)) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid seatId is required.',
    });
  }

  if (!startTime || isNaN(Date.parse(startTime))) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid ISO string startTime is required.',
    });
  }

  if (!endTime || isNaN(Date.parse(endTime))) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid ISO string endTime is required.',
    });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return res.status(400).json({
      status: 'error',
      message: 'Booking start time must be strictly before end time.',
    });
  }

  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minutes buffer for network delay/clock skew
  if (start.getTime() < now.getTime() - buffer) {
    return res.status(400).json({
      status: 'error',
      message: 'Booking start time cannot be in the past.',
    });
  }

  next();
};
