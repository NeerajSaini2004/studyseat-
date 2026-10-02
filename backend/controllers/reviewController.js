import Review from '../models/Review.js';
import Library from '../models/Library.js';

export const createReview = async (req, res, next) => {
  try {
    const { libraryId, rating, comment } = req.body;
    const studentId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'A valid rating between 1 and 5 is required.'
      });
    }

    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({
        status: 'error',
        message: 'Library branch not found.'
      });
    }

    // Check if the student already left a review for this branch
    const existingReview = await Review.findOne({ studentId, libraryId });
    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this library branch.'
      });
    }

    const review = await Review.create({
      studentId,
      libraryId,
      rating,
      comment
    });

    // Update Average Rating on the Library collection
    const reviews = await Review.find({ libraryId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Library.findByIdAndUpdate(libraryId, {
      rating: Math.round(avgRating * 10) / 10
    });

    res.status(201).json({
      status: 'success',
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

export const listForLibrary = async (req, res, next) => {
  try {
    const { libraryId } = req.params;
    const reviews = await Review.find({ libraryId })
      .populate('studentId', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    next(error);
  }
};
