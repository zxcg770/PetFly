const mongoose = require('mongoose');

function generateShortId() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

const requestSchema = new mongoose.Schema({
  shortId: { type: String, unique: true, default: generateShortId },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureDate: { type: Date, required: true },
  returnDate: { type: Date },
  flexibleDates: { type: Boolean, default: false },
  preferredAirline: { type: String },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'open', 'accepted', 'completed'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
