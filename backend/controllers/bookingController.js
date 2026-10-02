import { createBooking, cancelBooking } from '../services/bookingService.js';
import Booking from '../models/Booking.js';
import Library from '../models/Library.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

export const create = async (req, res, next) => {
  try {
    const { libraryId, seatId, startTime, endTime, bookingType } = req.body;
    const booking = await createBooking({
      studentId: req.user.id,
      libraryId,
      seatId,
      startTime,
      endTime,
      bookingType
    });

    res.status(201).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user.id, req.user.role);
    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    let bookings = [];

    if (req.user.role === 'student') {
      // Students view their own bookings
      bookings = await Booking.find({ studentId: req.user.id })
        .populate('libraryId', 'name address')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'owner') {
      // Owners view bookings for all their libraries
      const myLibraries = await Library.find({ ownerId: req.user.id }).select('_id');
      const libraryIds = myLibraries.map(lib => lib._id);

      bookings = await Booking.find({ libraryId: { $in: libraryIds } })
        .populate('studentId', 'name email')
        .populate('libraryId', 'name')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

// Owner approves booking request
export const approve = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if the library belongs to the owner
    const library = await Library.findOne({ _id: booking.libraryId, ownerId: req.user.id });
    if (!library) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: This library is not managed by you.'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot approve a booking that is currently ${booking.status}`
      });
    }

    // Check if the seat is already occupied by an overlapping approved booking
    // Add 1 min grace period
    const graceStart = new Date(booking.bookingDate.getTime() + 60000);
    const graceEnd = new Date(booking.expiryDate.getTime() - 60000);

    const overlappingBooking = await Booking.findOne({
      libraryId: booking.libraryId,
      seatId: booking.seatId,
      status: 'approved',
      bookingDate: { $lt: graceEnd },
      expiryDate: { $gt: graceStart }
    });

    if (overlappingBooking) {
      return res.status(409).json({
        status: 'error',
        message: 'Seat is already occupied during this time frame by another approved student.'
      });
    }

    booking.status = 'approved';
    await booking.save();

    // Lock the seat since it's now officially approved
    const seatIndex = library.seats.findIndex(s => s._id.toString() === booking.seatId.toString());
    if (seatIndex !== -1) {
      library.seats[seatIndex].status = 'occupied';
      library.occupiedSeats = (library.occupiedSeats || 0) + 1;
      await library.save();
    }

    // Mark associated offline payment as completed on approval
    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      { status: 'completed' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Booking approved successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// Owner rejects a pending booking request
export const reject = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ status: 'error', message: 'Booking not found' });
    }

    const library = await Library.findOne({ _id: booking.libraryId, ownerId: req.user.id });
    if (!library) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized: This library is not managed by you.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ status: 'error', message: `Cannot reject a booking that is currently ${booking.status}` });
    }

    booking.status = 'rejected';
    await booking.save();

    // In-app notification to student
    await Notification.create({
      userId: booking.studentId,
      title: 'Booking Rejected',
      message: `Your reservation at ${library.name} was rejected. Please try another seat.`,
      isRead: false
    });

    res.status(200).json({
      status: 'success',
      message: 'Booking rejected successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};
