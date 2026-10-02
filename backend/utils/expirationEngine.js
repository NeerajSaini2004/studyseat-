import Booking from '../models/Booking.js';

export const checkExpiredBookings = async () => {
  try {
    const now = new Date();
    
    // Find all expired bookings that need to be updated
    const expiredBookings = await Booking.find({
      status: { $in: ['pending', 'approved'] },
      expiryDate: { $lte: now }
    });

    if (expiredBookings.length > 0) {
      const bookingIds = expiredBookings.map(b => b._id);
      
      // Update booking statuses
      const result = await Booking.updateMany(
        { _id: { $in: bookingIds } },
        { $set: { status: 'expired' } }
      );

      // Revert seats for each expired booking
      for (const booking of expiredBookings) {
        if (booking.status === 'approved') {
          await import('../models/Library.js').then(async ({ default: Library }) => {
             await Library.updateOne(
               { _id: booking.libraryId, "seats._id": booking.seatId },
               { 
                 $set: { "seats.$.status": "available" },
                 $inc: { occupiedSeats: -1 } 
               }
             );
          });
        }
      }

      console.log(`[Expiration Engine] Automatically expired ${result.modifiedCount} reservations at ${now.toISOString()}`);
    }
  } catch (error) {
    console.error('[Expiration Engine] Failure checking expired reservations:', error);
  }
};

// Middleware to clean up expired bookings on request load to guarantee fresh checks
export const checkExpiredMiddleware = async (req, res, next) => {
  await checkExpiredBookings();
  next();
};
