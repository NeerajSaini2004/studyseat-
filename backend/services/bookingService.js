import Booking from '../models/Booking.js';
import Library from '../models/Library.js';
import Payment from '../models/Payment.js';

export const createBooking = async ({ studentId, libraryId, seatId, startTime, endTime, bookingType = 'hourly' }) => {
  const library = await Library.findById(libraryId);
  if (!library) {
    const error = new Error('Library not found');
    error.statusCode = 404;
    throw error;
  }

  // Find the seat embedded subdocument
  const seat = library.seats.id(seatId);
  if (!seat) {
    const error = new Error('Seat not found in this library');
    error.statusCode = 404;
    throw error;
  }

  if (seat.status === 'maintenance') {
    const error = new Error('Seat is currently under maintenance');
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Rule 2: Reservation duration is capped at 2 hours for hourly bookings
  const diffInMs = end.getTime() - start.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (bookingType === 'hourly' && diffInHours > 2) {
    const error = new Error('Hourly reservations are capped at a maximum of 2 hours.');
    error.statusCode = 400;
    throw error;
  }

  if (bookingType === 'monthly' && !library.monthlyFee) {
    const error = new Error('This library does not offer Monthly passes.');
    error.statusCode = 400;
    throw error;
  }

  // Rule 3: A student cannot have overlapping bookings
  const studentOverlappingBooking = await Booking.findOne({
    studentId,
    status: { $in: ['pending', 'approved'] },
    bookingDate: { $lt: end },
    expiryDate: { $gt: start }
  });

  if (studentOverlappingBooking) {
    const error = new Error('You already have a booking during this time frame.');
    error.statusCode = 400;
    throw error;
  }

  // Rule 8: First Come First Serve booking checks for overlapping bookings
  const overlappingBooking = await Booking.findOne({
    libraryId,
    seatId,
    status: 'approved',
    bookingDate: { $lt: end },
    expiryDate: { $gt: start }
  });

  if (overlappingBooking) {
    const error = new Error('Seat is already booked during this time frame (First Come First Serve).');
    error.statusCode = 409;
    throw error;
  }

  // Calculate total fee based on pass type
  let totalFee = 0;
  if (bookingType === 'monthly') {
    totalFee = library.monthlyFee;
  } else {
    totalFee = Math.round(diffInHours * library.fees * 100) / 100;
  }

  // Rule 4: Library owner manually approves bookings (starts as 'pending')
  const booking = await Booking.create({
    studentId,
    libraryId,
    seatId,
    seatNumber: seat.seatNumber,
    bookingType,
    bookingDate: start,
    expiryDate: end,
    totalFee,
    status: 'pending'
  });

  // Rule 1: Offline payment only
  await Payment.create({
    bookingId: booking._id,
    studentId,
    libraryId,
    amount: totalFee,
    status: 'pending'
  });

  return booking;
};

export const cancelBooking = async (bookingId, userId, role) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  if (role === 'student' && booking.studentId.toString() !== userId) {
    const error = new Error('Unauthorized to cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'cancelled') {
    const error = new Error('Booking is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === 'expired') {
    const error = new Error('Cannot cancel an expired booking');
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'cancelled';
  await booking.save();

  // Mark associated offline payment as failed
  await Payment.findOneAndUpdate(
    { bookingId: booking._id },
    { status: 'failed' }
  );

  return booking;
};

export default {
  createBooking,
  cancelBooking
};
