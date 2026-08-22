const express = require('express');
const {
  createReview,
  getTravelerReviews,
  getOfferReviewStatus,
} = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/offers/:offerId', verifyToken, createReview);
router.get('/travelers/:travelerId', getTravelerReviews);
router.get('/offers/:offerId/status', verifyToken, getOfferReviewStatus);

module.exports = router;
