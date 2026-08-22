// src/routes/regulationRoutes.js

const express = require("express");
const router = express.Router();
const { getChecklist, askRegulation } = require("../controllers/regulationController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/regulations/checklist?country=china  — static, no AI, public
router.get("/checklist", getChecklist);

// POST /api/regulations/ask  — RAG: FAISS + Gemini, requires login
router.post("/ask", verifyToken, askRegulation);

module.exports = router;