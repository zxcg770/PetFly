const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  travelerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offerPrice: {
    type: Number,
    required: true
  },
  petTicketPrice: {
    type: Number,
    default: 0
  },
  offerStatus: {
    type: String,
    enum: ['open', 'pending', 'accepted', 'cancelled', 'declined', 'completed'],
    default: 'pending'
  },
  tripStatus: {
    type: String,
    enum: ['BookingConfirmed', 'Pickup', 'InFlight', 'Landed', 'Delivered'],
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);