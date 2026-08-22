const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createOffer, getOfferById, getOffersByRequest, updateOffer, acceptOffer, rejectOffer, deleteOffer, getMyOffers, updateTripStatus, confirmDelivery } = require('../controllers/OfferController');
// TODO: replace with actual path once auth middleware is implemented by teammate
const { verifyToken } = require('../middleware/authMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const offerValidation = [
  body('offerPrice').isInt({ gt: 0 }).withMessage('Offer price must be a positive whole number'),
  body('petTicketPrice').optional().isInt({ min: 0 }).withMessage('Pet ticket price must be a non-negative whole number'),
];

router.post('/requests/:requestId/offers', verifyToken, offerValidation, validate, createOffer);
router.get('/requests/:requestId/offers', getOffersByRequest);
router.put('/offers/:id', verifyToken, offerValidation, validate, updateOffer);
router.put('/offers/:id/accept', verifyToken, acceptOffer);
router.put('/offers/:id/reject', verifyToken, rejectOffer);
router.delete('/offers/:id', verifyToken, deleteOffer);
router.get('/offers/my', verifyToken, getMyOffers);
router.get('/offers/:id', verifyToken, getOfferById);
router.put('/offers/:id/trip-status', verifyToken, body('tripStatus').isIn(['BookingConfirmed', 'Pickup', 'InFlight', 'Landed']).withMessage('Invalid trip status'), validate, updateTripStatus);
router.put('/offers/:id/confirm-delivery', verifyToken, confirmDelivery);

module.exports = router;
