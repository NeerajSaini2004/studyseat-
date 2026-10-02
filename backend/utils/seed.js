import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Library from '../models/Library.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import Review from '../models/Review.js';
import connectDb from './db.js';

const seedDatabase = async () => {
  try {
    console.log('Starting MongoDB database seeding (MVP Spec)...');
    await connectDb();

    // 1. Clean existing collections
    await User.deleteMany({});
    await Library.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing collections.');

    const hashedPassword = bcrypt.hashSync('password123', 10);

    // 2. Create Users
    const owner = await User.create({
      name: 'Alex Mercer',
      email: 'owner@studyseat.com',
      password: hashedPassword,
      role: 'owner',
      phone: '+14155552671',
      city: 'Silicon Valley',
      profileImage: '',
      isBlocked: false
    });

    const student = await User.create({
      name: 'Jane Doe',
      email: 'student@studyseat.com',
      password: hashedPassword,
      role: 'student',
      phone: '+14155559812',
      city: 'Silicon Valley',
      profileImage: '',
      isBlocked: false
    });

    const admin = await User.create({
      name: 'Admin Console',
      email: 'admin@studyseat.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+14155550000',
      city: 'Silicon Valley',
      profileImage: '',
      isBlocked: false
    });

    console.log('Seeded Users: owner@studyseat.com (Owner), student@studyseat.com (Student), admin@studyseat.com (Admin)');

    // 3. Create Library with Embedded Seats
    const seatsList = [
      { seatNumber: 'A1', seatType: 'cubicle', status: 'available' },
      { seatNumber: 'A2', seatType: 'cubicle', status: 'available' },
      { seatNumber: 'A3', seatType: 'cubicle', status: 'occupied' },
      { seatNumber: 'B1', seatType: 'standard', status: 'available' },
      { seatNumber: 'B2', seatType: 'standard', status: 'maintenance' },
      { seatNumber: 'C1', seatType: 'discussion', status: 'available' }
    ];

    const library = await Library.create({
      ownerId: owner._id,
      name: 'MindSpace Premium Library',
      address: '404 Coding Lane, Silicon Valley, CA',
      city: 'Silicon Valley',
      totalSeats: 20,
      occupiedSeats: 1, // Seat A3 is occupied
      fees: 5.00,
      openingTime: '08:00',
      closingTime: '22:00',
      facilities: ['High-Speed Wi-Fi', 'Air Conditioning', 'Power Outlets', 'Silent Zone', 'Cafeteria'],
      images: ['https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600'],
      rating: 4.8,
      isVerified: true,
      location: {
        type: 'Point',
        coordinates: [-122.1430, 37.4529]
      },
      seats: seatsList
    });

    console.log('Seeded Library: MindSpace Premium Library (dynamic availableSeats: ' + library.availableSeats + ')');

    // Find the seatId of A3 in the seeded library to reference it correctly
    const seatA3 = library.seats.find(s => s.seatNumber === 'A3');

    // 4. Create Booking & Payment (2-hour limit)
    const bookingDate = new Date();
    bookingDate.setHours(bookingDate.getHours() + 1);
    const expiryDate = new Date(bookingDate.getTime() + 2 * 60 * 60 * 1000); // exactly 2 hours later

    const booking = await Booking.create({
      studentId: student._id,
      libraryId: library._id,
      seatId: seatA3._id,
      seatNumber: 'A3',
      bookingDate,
      expiryDate,
      status: 'approved', // confirmed
      totalFee: 10.00 // 2 hours * $5.00
    });

    const payment = await Payment.create({
      bookingId: booking._id,
      studentId: student._id,
      libraryId: library._id,
      amount: 10.00,
      status: 'completed',
      paymentDate: new Date()
    });

    console.log('Seeded 2-hour Approved Booking and Payment for seat A3.');

    // 5. Seed Notification
    await Notification.create({
      userId: student._id,
      title: 'Booking Approved',
      message: 'Your booking for seat A3 at MindSpace Premium Library has been approved!',
      isRead: false
    });

    // 6. Seed Review
    await Review.create({
      studentId: student._id,
      libraryId: library._id,
      rating: 5,
      comment: 'Excellent silent study zone with high-speed internet. Highly recommended!'
    });

    console.log('Seeded Notification and Review.');
    console.log('Database seeding successfully completed.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
