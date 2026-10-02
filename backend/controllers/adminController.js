import User from '../models/User.js';
import Library from '../models/Library.js';
import Booking from '../models/Booking.js';

export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalLibraries = await Library.countDocuments({});
    const totalBookings = await Booking.countDocuments({});

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalLibraries,
        totalBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyLibrary = async (req, res, next) => {
  try {
    const { libraryId } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isVerified status must be a boolean.'
      });
    }

    const library = await Library.findByIdAndUpdate(
      libraryId,
      { isVerified },
      { new: true }
    );

    if (!library) {
      return res.status(404).json({
        status: 'error',
        message: 'Library branch not found.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Library branch verification set to ${isVerified}`,
      data: { library }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBlockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isBlocked status must be a boolean.'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User account not found.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `User account blocked state set to ${isBlocked}`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
