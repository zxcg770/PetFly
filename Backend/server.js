const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const reviewRoutes = require('./src/routes/reviewRoutes');
require('dotenv').config();

const offerRoutes = require('./src/routes/offerRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const regulationRoutes = require('./src/routes/regulationRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const petRoutes = require('./src/routes/petRoutes');
const requestRoutes = require('./src/routes/requestRoutes');

// Register routes with /api/auth and /api/users prefixes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/requests', requestRoutes);
app.use("/api/regulations", regulationRoutes);

app.get('/', (req, res) => res.json({ message: 'PetFly API running' }));
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 3000;

mongoose.connection.on('error', () => { });

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/petfly')
  .then(() => console.log('MongoDB connected'))
  .catch(() => console.log('MongoDB not running - thats ok for now'));

app.use('/api', offerRoutes);
app.use('/api', paymentRoutes);

app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const Offer = require('./src/models/Offer');
const Payment = require('./src/models/Payment');
const Request = require('./src/models/Request');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

setInterval(async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const expiredOffers = await Offer.find({
      offerStatus: 'accepted',
      acceptedAt: { $lt: tenMinutesAgo }
    });

    for (const offer of expiredOffers) {
      const payment = await Payment.findOne({ offerId: offer._id });
      if (!payment) {
        offer.offerStatus = 'pending';
        offer.tripStatus = null;
        offer.acceptedAt = null;
        await offer.save();
        console.log(`Offer ${offer._id} expired — no payment within 10 minutes`);
      }
    }
  } catch (err) {
    console.error('Offer expiry check failed:', err.message);
  }
}, 60 * 1000);

// Daily: refund listing fee for open requests past departure date with no accepted offer
setInterval(async () => {
  try {
    const now = new Date();
    const expiredRequests = await Request.find({
      status: 'open',
      departureDate: { $lt: now },
    });

    for (const req of expiredRequests) {
      const anyOffer = await Offer.findOne({ requestId: req._id });
      if (anyOffer) continue;

      const payment = await Payment.findOne({
        requestId: req._id,
        paymentType: 'listing_fee',
        paymentStatus: 'completed',
      });

      if (payment && payment.stripePaymentIntentId) {
        try {
          await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
          payment.paymentStatus = 'refunded';
          await payment.save();
          req.status = 'cancelled';
          await req.save();
          console.log(`Refunded listing fee for request ${req._id}`);
        } catch (refundErr) {
          console.error(`Refund failed for request ${req._id}:`, refundErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Listing fee refund check failed:', err.message);
  }
}, 24 * 60 * 60 * 1000);
