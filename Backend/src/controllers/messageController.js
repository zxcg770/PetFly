const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Request = require('../models/Request');

const createConversation = async (req, res) => {
  try {
    const { transportRequestId } = req.body;
    const travelerId = req.user._id;

    if (!transportRequestId) {
      return res.status(400).json({
        message: 'transportRequestId is required',
      });
    }

    const query = /^\d{8}$/.test(transportRequestId)
      ? { shortId: transportRequestId }
      : { _id: transportRequestId };
    const transportRequest = await Request.findOne(query);

    if (!transportRequest) {
      return res.status(404).json({ message: 'Transport request not found' });
    }

    const ownerId = transportRequest.owner;
    const requestObjectId = transportRequest._id;

    if (ownerId.toString() === travelerId.toString()) {
      return res.status(400).json({
        message: 'Owners cannot start a traveler conversation for their own request',
      });
    }

    let conversation = await Conversation.findOne({
      transportRequestId: requestObjectId,
      ownerId,
      travelerId,
    });

    if (conversation) {
      conversation.deletedFor = conversation.deletedFor.filter(
        (userId) => userId.toString() !== travelerId.toString()
      );
      await conversation.save();
    } else {
      conversation = await Conversation.create({
        transportRequestId: requestObjectId,
        ownerId,
        travelerId,
      });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: 'Could not create conversation' });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversations = await Conversation.find({
      deletedFor: { $ne: currentUserId },
      $or: [
        { ownerId: currentUserId },
        { travelerId: currentUserId },
      ],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('ownerId', 'firstName lastName email avgRating isVerified')
      .populate('travelerId', 'firstName lastName email avgRating isVerified')
      .populate({
        path: 'transportRequestId',
        populate: [
          { path: 'pet' },
          { path: 'owner', select: 'firstName lastName email avgRating isVerified' },
        ],
      })
      .lean();

    const conversationsWithUnreadCounts = await Promise.all(
      conversations.map(async (conversation) => {
        const [unreadCount, lastMessage] = await Promise.all([
          Message.countDocuments({
            conversationId: conversation._id,
            senderId: { $ne: currentUserId },
            readAt: null,
          }),
          Message.findOne({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .select('senderId text createdAt readAt')
            .populate('senderId', 'firstName lastName email')
            .lean(),
        ]);

        return {
          ...conversation,
          unreadCount,
          lastMessage,
        };
      })
    );

    return res.json(conversationsWithUnreadCounts);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load conversations' });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      deletedFor: { $ne: req.user._id },
      $or: [
        { ownerId: req.user._id },
        { travelerId: req.user._id },
      ],
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName lastName email')
      .populate('offerId', 'offerPrice petTicketPrice offerStatus');

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: 'Could not load messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const text = req.body.text;
    const offerId = req.body.offerId;
    const trimmedText = typeof text === 'string' ? text.trim() : '';

    if (!trimmedText) {
      return res.status(400).json({ message: 'text is required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      deletedFor: { $ne: req.user._id },
      $or: [
        { ownerId: req.user._id },
        { travelerId: req.user._id },
      ],
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      text: trimmedText,
      offerId: offerId || null,
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.deletedFor = [];
    await conversation.save();

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ message: 'Could not send message' });
  }
};

const markConversationRead = async (req, res) => {
  try {
    const readerId = req.user._id;
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      deletedFor: { $ne: readerId },
      $or: [
        { ownerId: readerId },
        { travelerId: readerId },
      ],
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const result = await Message.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: readerId },
        readAt: null,
      },
      {
        readAt: new Date(),
      }
    );

    return res.json({ updatedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ message: 'Could not mark messages as read' });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      $or: [
        { ownerId: currentUserId },
        { travelerId: currentUserId },
      ],
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await Conversation.updateOne(
      { _id: conversation._id },
      { $addToSet: { deletedFor: currentUserId } }
    );

    return res.json({ message: 'Conversation deleted for current user' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete conversation' });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  deleteConversation,
};
