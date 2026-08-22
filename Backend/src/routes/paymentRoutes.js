const express = require('express');
const router = express.Router();
const { createListingPaymentIntentOnly, createTravelerPaymentIntent, createListingPaymentIntent, createListingPayment, createTravelerPayment, releasePayment, getPaymentByRequest } = require('../controllers/PaymentController');
// TODO: replace with actual path once auth middleware is implemented by teammate
const { verifyToken } = require('../middleware/authMiddleware');


router.post('/payments/intent/:offerId', verifyToken, createTravelerPaymentIntent);
router.post('/payments/listing-intent', verifyToken, createListingPaymentIntentOnly);
router.post('/payments/listing-intent/:requestId', verifyToken, createListingPaymentIntent);
router.post('/payments/listing/:requestId', verifyToken, createListingPayment);
router.post('/payments/traveler/:offerId', verifyToken, createTravelerPayment);
router.put('/payments/:id/release', verifyToken, releasePayment);
router.get('/payments/request/:requestId', verifyToken, getPaymentByRequest);

module.exports = router;
