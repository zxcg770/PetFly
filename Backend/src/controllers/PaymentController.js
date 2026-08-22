const Payment = require('../models/Payment');
const Offer = require('../models/Offer');
const Request = require('../models/Request');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createTravelerPaymentIntent = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (offer.offerStatus !== 'accepted') {
      return res.status(400).json({ message: 'Cannot pay for an offer that has not been accepted' });
    }

    const existingPayment = await Payment.findOne({ offerId });
    if (existingPayment) return res.status(400).json({ message: 'Payment already made for this offer' });

    const request = await Request.findById(offer.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the pet owner can make this payment' });

    const totalAmount = offer.offerPrice + (offer.petTicketPrice || 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'eur',
      capture_method: 'manual',
      metadata: { offerId: offerId.toString() }
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createListingPaymentIntentOnly = async (req, res) => {
  try {
    const { budgetPrice } = req.body;
    if (!budgetPrice || budgetPrice <= 0)
      return res.status(400).json({ message: 'Budget price must be a positive number' });

    const commission = budgetPrice * 0.15;
    const postFee = commission < 6 ? 5 : commission;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(postFee * 100),
      currency: 'eur',
      metadata: { ownerId: req.user._id.toString() }
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, postFee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createListingPaymentIntent = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { budgetPrice } = req.body;

    if (!budgetPrice || budgetPrice <= 0)
      return res.status(400).json({ message: 'Budget price must be a positive number' });

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the pet owner can make this payment' });

    const commission = budgetPrice * 0.15;
    const postFee = commission < 6 ? 5 : commission;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(postFee * 100),
      currency: 'eur',
      metadata: { requestId: requestId.toString() }
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, postFee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createListingPayment = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the pet owner can make this payment' });

    const { budgetPrice, stripePaymentIntentId } = req.body;
    const commission = budgetPrice * 0.15;
    const postFee = commission < 6 ? 5 : commission;

    const payment = new Payment({
      requestId,
      offerId: null,
      payerId: req.user._id,
      paymentType: 'listing_fee',
      amount: budgetPrice,
      petTicketPrice: 0,
      postFee,
      totalAmount: postFee,
      stripePaymentIntentId: stripePaymentIntentId || null,
      paymentStatus: 'completed',
      paidAt: new Date()
    });

    await payment.save();

    await Request.findByIdAndUpdate(requestId, { status: 'open' });

    res.status(201).json({
      message: 'Payment successful',
      transactionId: payment.transactionId,
      totalAmount: payment.totalAmount,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTravelerPayment = async (req, res) => {
  try {
    const { offerId } = req.params;

    const { stripePaymentIntentId } = req.body;

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const existingPayment = await Payment.findOne({ offerId });
    if (existingPayment) return res.status(400).json({ message: 'Payment already made for this offer' });

    const request = await Request.findById(offer.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the pet owner can make this payment' });

    if (offer.offerStatus !== 'accepted') {
      return res.status(400).json({ message: 'Cannot pay for an offer that has not been accepted' });
    }

    const totalAmount = offer.offerPrice + (offer.petTicketPrice || 0);

    const payment = new Payment({
      requestId: offer.requestId,
      offerId,
      payerId: req.user._id,
      paymentType: 'traveler_payment',
      amount: offer.offerPrice,
      petTicketPrice: offer.petTicketPrice,
      totalAmount,
      stripePaymentIntentId: stripePaymentIntentId || null,
      paymentStatus: 'held',
      paidAt: new Date()
    });

    await payment.save();

    await Request.findByIdAndUpdate(offer.requestId, { status: 'accepted' });

    res.status(201).json({
      message: 'Payment successful - funds held until delivery',
      transactionId: payment.transactionId,
      totalAmount: payment.totalAmount,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const releasePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.paymentStatus !== 'held') {
      return res.status(400).json({ message: 'Payment is not in held status' });
    }

    payment.paymentStatus = 'completed';
    await payment.save();

    res.status(200).json({
      message: 'Payment released to traveler',
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPaymentByRequest = async (req, res) => {
  try {
    const payment = await Payment.findOne({ requestId: req.params.requestId })
      .populate('offerId')
      .populate('payerId', 'firstName lastName');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createListingPaymentIntentOnly,
  createTravelerPaymentIntent,
  createListingPaymentIntent,
  createListingPayment,
  createTravelerPayment,
  releasePayment,
  getPaymentByRequest
};