const express = require('express');
const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  deleteConversation,
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/conversations', verifyToken, createConversation);
router.get('/conversations', verifyToken, getConversations);
router.get('/conversations/:conversationId/messages', verifyToken, getMessages);
router.post('/conversations/:conversationId/messages', verifyToken, sendMessage);
router.patch('/conversations/:conversationId/read', verifyToken, markConversationRead);
router.delete('/conversations/:conversationId', verifyToken, deleteConversation);

module.exports = router;
