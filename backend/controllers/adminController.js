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

const getPageOptions = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

export const getLibraries = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPageOptions(req.query);
    const [libraries, total] = await Promise.all([
      Library.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Library.countDocuments({})
    ]);

    res.status(200).json({
      status: 'success',
      results: libraries.length,
      data: {
        libraries,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPageOptions(req.query);
    const [users, total] = await Promise.all([
      User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({})
    ]);

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
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

    const targetUser = await User.findById(userId).select('-password');

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User account not found.'
      });
    }

    if (targetUser.role === 'admin' || targetUser._id.toString() === req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin accounts cannot be blocked.'
      });
    }

    targetUser.isBlocked = isBlocked;
    const user = await targetUser.save();

    res.status(200).json({
      status: 'success',
      message: `User account blocked state set to ${isBlocked}`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
