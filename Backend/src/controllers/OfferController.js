const Offer = require('../models/Offer');
const Payment = require('../models/Payment');
const Request = require('../models/Request');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createOffer = async (req, res) => {
  try {
    const { offerPrice, petTicketPrice } = req.body;
    const paramId = req.params.requestId;

    let requestObjectId = paramId;
    if (/^\d{8}$/.test(paramId)) {
      const found = await Request.findOne({ shortId: paramId }, '_id owner');
      if (!found) return res.status(404).json({ message: 'Request not found' });
      requestObjectId = found._id;
      if (found.owner.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "You can't send an offer to your own post." });
      }
    } else {
      const found = await Request.findById(requestObjectId, 'owner');
      if (found && found.owner.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "You can't send an offer to your own post." });
      }
    }

    const acceptedOffer = await Offer.findOne({ requestId: requestObjectId, offerStatus: 'accepted' });
    if (acceptedOffer) {
      return res.status(400).json({ message: 'This request already has an accepted offer.' });
    }

    const offer = new Offer({
      requestId: requestObjectId,
      travelerId: req.user._id,
      offerPrice,
      petTicketPrice,
      offerStatus: 'pending'
    });

    await offer.save();
    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('travelerId', 'firstName lastName avgRating isVerified')
      .populate({
        path: 'requestId',
        populate: [
          { path: 'owner', select: 'firstName lastName isVerified' },
          { path: 'pet', select: 'name type breed' }
        ]
      });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOffersByRequest = async (req, res) => {
  try {
    const offers = await Offer.find({ requestId: req.params.requestId })
      .populate('travelerId', 'firstName lastName avgRating isVerified');
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (req.body.offerPrice) offer.offerPrice = req.body.offerPrice;
    if (req.body.petTicketPrice) offer.petTicketPrice = req.body.petTicketPrice;

    await offer.save();
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    offer.offerStatus = 'accepted';
    offer.tripStatus = 'BookingConfirmed';
    offer.acceptedAt = new Date();
    await offer.save();

    await Offer.updateMany(
      { requestId: offer.requestId, _id: { $ne: offer._id }, offerStatus: { $in: ['pending', 'open'] } },
      { $set: { offerStatus: 'declined' } }
    );

    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    offer.offerStatus = 'declined';
    await offer.save();
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    await offer.deleteOne();
    res.status(200).json({ message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ travelerId: req.user._id })
      .populate({
        path: 'requestId',
        populate: [
          { path: 'owner', select: 'firstName lastName avgRating' },
          { path: 'pet',   select: 'name type breed image photos' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


const updateTripStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (offer.offerStatus !== 'accepted') {
      return res.status(400).json({ message: 'Trip status can only be updated for accepted offers' });
    }

    if (offer.travelerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the traveler can update the trip status' });
    }

    const { tripStatus } = req.body;
    if (tripStatus === 'Delivered') {
      return res.status(400).json({ message: 'Use the confirm delivery endpoint to mark as Delivered' });
    }

    offer.tripStatus = tripStatus;
    await offer.save();
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmDelivery = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (offer.offerStatus !== 'accepted') {
      return res.status(400).json({ message: 'Offer is not accepted' });
    }

    const request = await Request.findById(offer.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the pet owner can confirm delivery' });

    offer.tripStatus = 'Delivered';
    offer.offerStatus = 'completed';
    await offer.save();

    request.status = 'completed';
    await request.save();

    const payment = await Payment.findOne({ offerId: offer._id, paymentStatus: 'held' });
    if (payment) {
      if (payment.stripePaymentIntentId) {
        await stripe.paymentIntents.capture(payment.stripePaymentIntentId);
      }
      payment.paymentStatus = 'completed';
      await payment.save();
    }

    res.status(200).json({ message: 'Delivery confirmed and payment released', offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOffer,
  getOfferById,
  getOffersByRequest,
  updateOffer,
  acceptOffer,
  rejectOffer,
  deleteOffer,
  getMyOffers,
  updateTripStatus,
  confirmDelivery,
};