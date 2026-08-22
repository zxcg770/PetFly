/**
 * PetFly — Database Seed Script
 * -----------------------------------------------------------------------------
 * Populates a fresh MongoDB with a coherent set of demo data so the whole app
 * can be demoed end-to-end without manually registering users and creating
 * requests one by one.
 *
 * Usage (from the Backend directory):
 *     npm run seed
 *
 * It connects to MONGO_URI (falls back to local mongodb://127.0.0.1:27017/petfly),
 * WIPES the collections below, then re-inserts a fresh dataset.
 *
 * All demo users share the same password so you can log in as anyone:
 *     email:    (printed at the end)
 *     password: Password1
 * -----------------------------------------------------------------------------
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Pet = require('./models/Pet');
const Request = require('./models/Request');
const Offer = require('./models/Offer');
const Payment = require('./models/Payment');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Review = require('./models/Review');

const DEMO_PASSWORD = 'Password1'; // meets the register regex: 8+ chars, letter + digit
const oid = () => new mongoose.Types.ObjectId();
const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/**
 * Builds the full dataset as plain objects with pre-assigned _ids so that
 * cross-collection references (owner, pet, requestId, ...) line up exactly.
 * Returned so it can be reused by a verification harness without a live DB.
 */
async function buildSeedData() {
  const securityAnswerHash = await bcrypt.hash('fluffy', 10); // demo answer to all security questions

  // ---- Users -------------------------------------------------------------
  const U = {
    ana: oid(),
    ben: oid(),
    chen: oid(),
    deniz: oid(),
    elif: oid(),
    felix: oid(),
    grace: oid(),
    hiro: oid(),
  };

  const users = [
    { _id: U.ana,   firstName: 'Ana',   lastName: 'Keller',   email: 'ana@petfly.dev',   location: 'Munich, Germany',      about: 'Cat mom of two. Frequent flyer Munich–Istanbul.',        avgRating: 4.8, isVerified: true },
    { _id: U.ben,   firstName: 'Ben',   lastName: 'Wagner',   email: 'ben@petfly.dev',   location: 'Berlin, Germany',      about: 'Business traveler, happy to accompany pets on my routes.', avgRating: 4.6, isVerified: true },
    { _id: U.chen,  firstName: 'Chen',  lastName: 'Li',       email: 'chen@petfly.dev',  location: 'Shanghai, China',      about: 'Relocating to Germany, need to bring my corgi over.',     avgRating: 4.9, isVerified: true },
    { _id: U.deniz, firstName: 'Deniz', lastName: 'Yilmaz',   email: 'deniz@petfly.dev', location: 'Istanbul, Turkey',     about: 'Flying Istanbul–Munich monthly for work.',               avgRating: 4.5, isVerified: true },
    { _id: U.elif,  firstName: 'Elif',  lastName: 'Demir',    email: 'elif@petfly.dev',  location: 'Istanbul, Turkey',     about: 'Dog lover. First time using PetFly.',                     avgRating: 0,   isVerified: false },
    { _id: U.felix, firstName: 'Felix', lastName: 'Braun',    email: 'felix@petfly.dev', location: 'Frankfurt, Germany',   about: 'Student, travel a lot on a budget.',                      avgRating: 4.2, isVerified: false },
    { _id: U.grace, firstName: 'Grace', lastName: 'Wang',     email: 'grace@petfly.dev', location: 'Shanghai, China',      about: 'Moving back home, my cat comes with me.',                 avgRating: 4.7, isVerified: true },
    { _id: U.hiro,  firstName: 'Hiro',  lastName: 'Tanaka',   email: 'hiro@petfly.dev',  location: 'Munich, Germany',      about: 'Verified traveler, 20+ successful pet trips.',            avgRating: 5.0, isVerified: true },
  ].map((u) => ({
    ...u,
    password: DEMO_PASSWORD, // hashed by the User pre('save') hook on insert
    profileCompleted: true,
    securityQuestion: 'What was your childhood nickname?',
    securityAnswerHash,
  }));

  // ---- Pets --------------------------------------------------------------
  const P = { luna: oid(), max: oid(), mochi: oid(), rocky: oid(), bella: oid(), coco: oid() };
  const pets = [
    { _id: P.luna,  name: 'Luna',  type: 'Cat', breed: 'British Shorthair', weight: 4.2, age: 3, owner: U.ana,   notes: 'Calm, litter-trained, travels in a soft carrier.' },
    { _id: P.max,   name: 'Max',   type: 'Dog', breed: 'Corgi',             weight: 12,  age: 2, owner: U.chen,  notes: 'Friendly, microchipped, all vaccines up to date.' },
    { _id: P.mochi, name: 'Mochi', type: 'Cat', breed: 'Ragdoll',           weight: 5.1, age: 4, owner: U.grace, notes: 'Shy at first, needs a quiet cabin spot.' },
    { _id: P.rocky, name: 'Rocky', type: 'Dog', breed: 'Beagle',            weight: 10,  age: 5, owner: U.elif,  notes: 'Energetic, well-behaved on leash.' },
    { _id: P.bella, name: 'Bella', type: 'Dog', breed: 'French Bulldog',    weight: 9,   age: 3, owner: U.deniz, notes: 'Brachycephalic breed — needs airline pre-approval.' },
    { _id: P.coco,  name: 'Coco',  type: 'Cat', breed: 'Siamese',           weight: 3.8, age: 2, owner: U.felix, notes: 'Vocal but sweet.' },
  ];

  // ---- Requests ----------------------------------------------------------
  // Statuses cover the Browse page (open) + downstream flows (accepted/completed).
  const R = { r1: oid(), r2: oid(), r3: oid(), r4: oid(), r5: oid(), r6: oid(), r7: oid() };
  const requests = [
    // OPEN — these are what the Browse page shows
    { _id: R.r1, shortId: '10000001', pet: P.max,   owner: U.chen,  from: 'Shanghai, China',   to: 'Munich, Germany',    departureDate: days(21), returnDate: null,       flexibleDates: true,  preferredAirline: 'Lufthansa',       price: 320, status: 'open' },
    { _id: R.r2, shortId: '10000002', pet: P.mochi, owner: U.grace, from: 'Shanghai, China',   to: 'Frankfurt, Germany', departureDate: days(30), returnDate: null,       flexibleDates: false, preferredAirline: 'China Eastern',   price: 280, status: 'open' },
    { _id: R.r3, shortId: '10000003', pet: P.rocky, owner: U.elif,  from: 'Istanbul, Turkey',  to: 'Berlin, Germany',    departureDate: days(14), returnDate: null,       flexibleDates: true,  preferredAirline: 'Turkish Airlines', price: 210, status: 'open' },
    { _id: R.r4, shortId: '10000004', pet: P.coco,  owner: U.felix, from: 'Frankfurt, Germany', to: 'Istanbul, Turkey',  departureDate: days(25), returnDate: days(40),   flexibleDates: false, preferredAirline: 'Turkish Airlines', price: 190, status: 'open' },
    // ACCEPTED — has an accepted offer + held payment, drives the tracking flow
    { _id: R.r5, shortId: '10000005', pet: P.luna,  owner: U.ana,   from: 'Munich, Germany',   to: 'Istanbul, Turkey',   departureDate: days(7),  returnDate: null,       flexibleDates: false, preferredAirline: 'Turkish Airlines', price: 240, status: 'accepted' },
    // COMPLETED — full history + reviews
    { _id: R.r6, shortId: '10000006', pet: P.bella, owner: U.deniz, from: 'Istanbul, Turkey',  to: 'Munich, Germany',    departureDate: days(-20), returnDate: null,      flexibleDates: false, preferredAirline: 'Lufthansa',       price: 300, status: 'completed' },
    // PENDING — created but listing fee not yet paid (not visible on Browse)
    { _id: R.r7, shortId: '10000007', pet: P.max,   owner: U.chen,  from: 'Shanghai, China',   to: 'Berlin, Germany',    departureDate: days(45), returnDate: null,       flexibleDates: true,  preferredAirline: 'Air China',       price: 350, status: 'pending' },
  ];

  // ---- Offers ------------------------------------------------------------
  const O = { o1: oid(), o2: oid(), o3: oid(), o4: oid(), o5: oid() };
  const offers = [
    // pending offers on open request r1 (owner: chen)
    { _id: O.o1, requestId: R.r1, travelerId: U.ben,   offerPrice: 300, petTicketPrice: 120, offerStatus: 'pending', tripStatus: null },
    { _id: O.o2, requestId: R.r1, travelerId: U.hiro,  offerPrice: 320, petTicketPrice: 120, offerStatus: 'pending', tripStatus: null },
    // pending offer on open request r3 (owner: elif)
    { _id: O.o3, requestId: R.r3, travelerId: U.deniz, offerPrice: 200, petTicketPrice: 90,  offerStatus: 'pending', tripStatus: null },
    // accepted offer on r5 (owner: ana, traveler: hiro) — mid-trip
    { _id: O.o4, requestId: R.r5, travelerId: U.hiro,  offerPrice: 240, petTicketPrice: 110, offerStatus: 'accepted', tripStatus: 'InFlight', acceptedAt: days(-1) },
    // completed offer on r6 (owner: deniz, traveler: ben) — delivered
    { _id: O.o5, requestId: R.r6, travelerId: U.ben,   offerPrice: 300, petTicketPrice: 130, offerStatus: 'completed', tripStatus: 'Delivered', acceptedAt: days(-25) },
  ];

  // ---- Payments ----------------------------------------------------------
  const payments = [
    // listing fees paid by owners of open requests (that's why they're "open")
    { requestId: R.r1, payerId: U.chen,  paymentType: 'listing_fee',      amount: 15,  totalAmount: 15,  paymentStatus: 'completed', stripePaymentIntentId: 'pi_demo_r1', paidAt: days(-2) },
    { requestId: R.r3, payerId: U.elif,  paymentType: 'listing_fee',      amount: 15,  totalAmount: 15,  paymentStatus: 'completed', stripePaymentIntentId: 'pi_demo_r3', paidAt: days(-3) },
    // traveler payment held in escrow for the accepted trip r5
    { requestId: R.r5, offerId: O.o4, payerId: U.ana,   paymentType: 'traveler_payment', amount: 240, petTicketPrice: 110, postFee: 5, totalAmount: 355, paymentStatus: 'held',      stripePaymentIntentId: 'pi_demo_r5', paidAt: days(-1) },
    // completed payment released for finished trip r6
    { requestId: R.r6, offerId: O.o5, payerId: U.deniz, paymentType: 'traveler_payment', amount: 300, petTicketPrice: 130, postFee: 5, totalAmount: 435, paymentStatus: 'completed', stripePaymentIntentId: 'pi_demo_r6', paidAt: days(-24) },
  ];

  // ---- Conversations + Messages -----------------------------------------
  const C = { c1: oid(), c2: oid() };
  const conversations = [
    { _id: C.c1, transportRequestId: R.r5, ownerId: U.ana,   travelerId: U.hiro, lastMessageAt: days(-1) },
    { _id: C.c2, transportRequestId: R.r1, ownerId: U.chen,  travelerId: U.ben,  lastMessageAt: days(-2) },
  ];
  const messages = [
    { conversationId: C.c1, senderId: U.ana,   text: 'Hi Hiro! Thanks for accepting. Luna is a calm British Shorthair.', offerId: O.o4, readAt: days(-1) },
    { conversationId: C.c1, senderId: U.hiro,  text: 'No problem! I fly Munich–Istanbul often. She will be in the cabin with me.', offerId: O.o4, readAt: days(-1) },
    { conversationId: C.c1, senderId: U.ana,   text: 'Perfect. I will drop her off 3 hours before departure.', offerId: O.o4, readAt: null },
    { conversationId: C.c2, senderId: U.chen,  text: 'Hello Ben, Max is a 12kg corgi. Are you ok with a dog that size?', offerId: O.o1, readAt: days(-2) },
    { conversationId: C.c2, senderId: U.ben,   text: 'Yes, I have transported bigger dogs before. Let us align on the date.', offerId: O.o1, readAt: null },
  ];

  // ---- Reviews (for the completed trip r6) ------------------------------
  const reviews = [
    { offerId: O.o5, requestId: R.r6, reviewerId: U.deniz, revieweeId: U.ben, rating: 5, reviewText: 'Ben took great care of Bella. Smooth pickup and delivery!', quickTags: ['On time', 'Great communication', 'Gentle with pet'] },
    { offerId: O.o5, requestId: R.r6, reviewerId: U.ben, revieweeId: U.deniz, rating: 5, reviewText: 'Clear instructions and well-prepared paperwork. Easy trip.', quickTags: ['Well prepared', 'Friendly'] },
  ];

  return { users, pets, requests, offers, payments, conversations, messages, reviews, DEMO_PASSWORD };
}

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/petfly';
  await mongoose.connect(uri);
  console.log(`Connected to ${uri}`);

  const data = await buildSeedData();

  // Wipe existing data (idempotent re-seed)
  await Promise.all([
    User.deleteMany({}), Pet.deleteMany({}), Request.deleteMany({}),
    Offer.deleteMany({}), Payment.deleteMany({}), Conversation.deleteMany({}),
    Message.deleteMany({}), Review.deleteMany({}),
  ]);
  console.log('Cleared existing collections.');

  // Users via save() so the pre-save hook hashes passwords
  for (const u of data.users) await new User(u).save();
  await Pet.insertMany(data.pets);
  await Request.insertMany(data.requests);
  await Offer.insertMany(data.offers);
  await Payment.insertMany(data.payments);
  await Conversation.insertMany(data.conversations);
  await Message.insertMany(data.messages);
  await Review.insertMany(data.reviews);

  console.log('\nSeed complete:');
  console.log(`  Users:         ${data.users.length}`);
  console.log(`  Pets:          ${data.pets.length}`);
  console.log(`  Requests:      ${data.requests.length}  (${data.requests.filter(r => r.status === 'open').length} open on Browse)`);
  console.log(`  Offers:        ${data.offers.length}`);
  console.log(`  Payments:      ${data.payments.length}`);
  console.log(`  Conversations: ${data.conversations.length}`);
  console.log(`  Messages:      ${data.messages.length}`);
  console.log(`  Reviews:       ${data.reviews.length}`);
  console.log('\nDemo login — any of these emails, password "Password1":');
  console.log('  ana@petfly.dev   (owner, has an in-flight trip + chat)');
  console.log('  hiro@petfly.dev  (traveler, verified, 5.0 rating)');
  console.log('  chen@petfly.dev  (owner, open request with 2 offers)');

  await mongoose.disconnect();
  console.log('\nDisconnected. Done.');
}

// Only run main() when executed directly (so the harness can import buildSeedData)
if (require.main === module) {
  main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { buildSeedData };
