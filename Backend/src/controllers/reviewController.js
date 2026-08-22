const Review = require('../models/Review');
const Offer = require('../models/Offer');
const Request = require('../models/Request');
const User = require('../models/User');

function cleanQuickTags(quickTags) {
  return quickTags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const createReview = async (req, res) => {
  try {
    const { rating, reviewText = '', quickTags = [] } = req.body;
    const parsedRating = Number(rating);
    const cleanedReviewText =
      typeof reviewText === 'string' ? reviewText.trim() : '';

    if (rating === undefined || rating === null) {
      return res.status(400).json({ message: 'rating is required' });
    }

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'rating must be an integer from 1 to 5' });
    }

    if (!Array.isArray(quickTags)) {
      return res.status(400).json({ message: 'quickTags must be an array' });
    }

    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.offerStatus !== 'completed' || offer.tripStatus !== 'Delivered') {
      return res.status(400).json({
        message: 'Reviews can only be created after delivery is confirmed',
      });
    }

    const request = await Request.findById(offer.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the pet owner can review this traveler' });
    }

    const review = await Review.create({
      offerId: offer._id,
      requestId: request._id,
      reviewerId: req.user._id,
      revieweeId: offer.travelerId,
      rating: parsedRating,
      reviewText: cleanedReviewText,
      quickTags: cleanQuickTags(quickTags),
    });

    const travelerReviews = await Review.find({ revieweeId: offer.travelerId });
    const ratingTotal = travelerReviews.reduce((sum, currentReview) => sum + currentReview.rating, 0);
    const avgRating = travelerReviews.length > 0 ? ratingTotal / travelerReviews.length : 0;

    await User.findByIdAndUpdate(offer.travelerId, { avgRating });

    return res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      const existingOffer = await Offer.findById(req.params.offerId);
      const existingReview = existingOffer
        ? await Review.findOne({
            offerId: existingOffer._id,
            reviewerId: req.user._id,
            revieweeId: existingOffer.travelerId,
          })
        : null;

      return res.status(200).json({
        message: 'A review already exists for this completed offer',
        alreadyExists: true,
        review: existingReview,
      });
    }

    return res.status(500).json({ message: 'Could not create review' });
  }
};

const getTravelerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      revieweeId: req.params.travelerId,
    })
      .populate('reviewerId', 'firstName lastName profilePhoto')
      .populate({
        path: 'requestId',
        populate: { path: 'pet', select: 'name type breed' },
      })
      .sort({ createdAt: -1 });

    const reviewCount = reviews.length;
    const ratingTotal = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviewCount > 0 ? ratingTotal / reviewCount : 0;

    return res.json({
      averageRating,
      reviewCount,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load traveler reviews' });
  }
};

const getOfferReviewStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const review = await Review.findOne({
      offerId: offer._id,
      reviewerId: req.user._id,
      revieweeId: offer.travelerId,
    });

    return res.json({
      hasReview: Boolean(review),
      review,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not check review status' });
  }
};

module.exports = {
  createReview,
  getTravelerReviews,
  getOfferReviewStatus,
};
