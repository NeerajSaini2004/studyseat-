import mongoose from 'mongoose';

// Nested Seat Schema (Embedded for fast layout reads and grid visualization)
const seatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: [true, 'Seat number is required'],
    trim: true,
  },
  seatType: {
    type: String,
    enum: ['standard', 'cubicle', 'discussion'],
    default: 'standard',
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available',
  },
});

const librarySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Library owner reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Library name is required'],
      trim: true,
      minlength: [3, 'Library name must be at least 3 characters'],
    },
    address: {
      type: String,
      required: [true, 'Library address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats capacity is required'],
      min: [0, 'Total seats cannot be negative'],
    },
    occupiedSeats: {
      type: Number,
      default: 0,
      min: [0, 'Occupied seats cannot be negative'],
    },
    fees: { // Map fees to hourly rate
      type: Number,
      required: [true, 'Hourly fee is required'],
      min: [0, 'Fees cannot be negative'],
    },
    monthlyFee: { // Monthly pass rate
      type: Number,
      min: [0, 'Monthly fee cannot be negative'],
    },
    openingTime: {
      type: String,
      required: [true, 'Opening time is required'], // Format "08:00"
    },
    closingTime: {
      type: String,
      required: [true, 'Closing time is required'], // Format "22:00"
    },
    facilities: {
      type: [String],
      default: [],
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    location: { // Kept for geospatial proximity checks (best practice)
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      },
    },
    seats: [seatSchema], // Keep embedded seats for FCFS layout management
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Rule 6: availableSeats = totalSeats - occupiedSeats (Computed dynamically, never entered manually)
librarySchema.virtual('availableSeats').get(function () {
  return Math.max(0, this.totalSeats - this.occupiedSeats);
});

// Geospatial index for geographic searches
librarySchema.index({ location: '2dsphere' });

// Ensure seat number uniqueness per library
librarySchema.index({ _id: 1, 'seats.seatNumber': 1 }, { unique: true, sparse: true });

const Library = mongoose.model('Library', librarySchema);
export default Library;
