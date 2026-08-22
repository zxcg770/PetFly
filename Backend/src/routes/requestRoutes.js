const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteRequest,
} = require('../controllers/requestController');
const { verifyToken } = require('../middleware/authMiddleware');

// Browse all open requests (public) — supports ?from=&to=&petType=&sort=
router.get('/', getRequests);
router.get('/me', verifyToken, getMyRequests);
router.get('/:id', getRequestById);
router.post('/', verifyToken, createRequest);
router.put('/:id', verifyToken, updateRequest);
router.delete('/:id', verifyToken, deleteRequest);

module.exports = router;
