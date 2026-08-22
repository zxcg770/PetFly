const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    transportRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index(
  { transportRequestId: 1, ownerId: 1, travelerId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
