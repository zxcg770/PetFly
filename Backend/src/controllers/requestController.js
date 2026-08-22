const Request = require('../models/Request');
const Offer = require('../models/Offer');

const createRequest = async (req, res) => {
  try {
    const { pet, from, to, departureDate, returnDate, flexibleDates, preferredAirline, price, status } = req.body;
    const request = await Request.create({
      pet,
      owner: req.user._id,
      from,
      to,
      departureDate,
      returnDate,
      flexibleDates,
      preferredAirline,
      price,
      status: status === 'open' ? 'open' : 'pending',
    });
    const populated = await Request.findById(request._id).populate('pet');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /requests — browse all open requests with optional filters
const getRequests = async (req, res) => {
  try {
    const { from, to, petType, sort } = req.query;
    const filter = { status: 'open' };

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'pets',
          localField: 'pet',
          foreignField: '_id',
          as: 'pet',
        },
      },
      { $unwind: '$pet' },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner',
        },
      },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'owner.password': 0,
        },
      },
    ];

    if (from) pipeline.splice(1, 0, { $match: { from: { $regex: from, $options: 'i' } } });
    if (to) pipeline.splice(1, 0, { $match: { to: { $regex: to, $options: 'i' } } });
    if (petType) {
      pipeline.push({ $match: { 'pet.type': petType } });
    }

    const sortMap = {
      highest_pay: { price: -1 },
      soonest: { departureDate: 1 },
      newest: { createdAt: -1 },
    };
    pipeline.push({ $sort: sortMap[sort] || sortMap.newest });

    const requests = await Request.aggregate(pipeline);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const id = req.params.id;
    const query = /^\d{8}$/.test(id) ? { shortId: id } : { _id: id };
    const request = await Request.findOne(query)
      .populate({ path: 'pet' })
      .populate('owner', '-password');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ owner: req.user._id })
      .populate('pet')
      .sort({ createdAt: -1 })
      .lean();

    const requestIds = requests.map((r) => r._id);
    const offers = await Offer.find({ requestId: { $in: requestIds } })
      .populate('travelerId', 'firstName lastName')
      .lean();

    const offerMap = {};
    for (const offer of offers) {
      if (!offerMap[offer.requestId]) offerMap[offer.requestId] = [];
      offerMap[offer.requestId].push(offer);
    }

    const result = requests.map((r) => {
      const reqOffers = (offerMap[r._id] || []).filter(o => o.travelerId?._id?.toString() !== r.owner?.toString());
      const accepted = reqOffers.find((o) => o.offerStatus === 'accepted');
      return {
        ...r,
        offerCount: reqOffers.length,
        acceptedTraveler: accepted
          ? { firstName: accepted.travelerId?.firstName, lastName: accepted.travelerId?.lastName }
          : null,
        acceptedOfferId: accepted ? accepted._id : null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteRequest,
};
