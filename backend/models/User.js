import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: { // Hashed password storage
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'owner', 'admin'], // Added admin support as per roles
        message: '{VALUE} is not a valid user role',
      },
      required: [true, 'User role is required'],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        'Please provide a valid phone number (E.164 format)',
      ],
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Virtual for linking User Bookings easily in queries
userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'studentId',
});

const User = mongoose.model('User', userSchema);
export default User;
