import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    libraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
      required: [true, 'Library reference is required'],
      index: true,
    },
    seatId: {
      type: mongoose.Schema.Types.ObjectId, // Links to embedded seat inside Library
      required: [true, 'Seat reference is required'],
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
    },
    bookingType: {
      type: String,
      enum: ['hourly', 'monthly'],
      default: 'hourly',
    },
    bookingDate: { // Replaces startTime
      type: Date,
      required: [true, 'Booking date/time is required'],
      default: Date.now,
    },
    expiryDate: { // Replaces endTime. Capped strictly at 2 hours from bookingDate as per MVP
      type: Date,
      required: [true, 'Expiry date/time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    totalFee: {
      type: Number,
      required: [true, 'Total fee is required'],
      min: [0, 'Total fee cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Enforce Rule 2 (Reservation automatically expires)
bookingSchema.pre('validate', function (next) {
  if (this.bookingDate && !this.expiryDate) {
    if (this.bookingType === 'monthly') {
      // Monthly pass lasts exactly 30 days
      this.expiryDate = new Date(this.bookingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Hourly pass automatically expires after 2 hours
      this.expiryDate = new Date(this.bookingDate.getTime() + 2 * 60 * 60 * 1000);
    }
  }
  next();
});

// Compound Index to prevent double booking on the same seat
bookingSchema.index(
  { libraryId: 1, seatNumber: 1, bookingDate: 1, expiryDate: 1 },
  { name: 'prevent_seat_double_booking' }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
