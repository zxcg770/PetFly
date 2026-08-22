const regulationChecklists = require("../../config/regulationChecklists");
const { ask } = require("../../rag/ragChain");


// GET /api/regulations/checklist?country=china
// Layer 1 — static checklist, no AI

const getChecklist = (req, res) => {
  const country = req.query.country?.toLowerCase();

  if (!country) {
    return res.status(400).json({
      success: false,
      message: "Please provide a country query parameter. e.g. ?country=china",
    });
  }

  const checklist = regulationChecklists[country];

  if (!checklist) {
    return res.status(404).json({
      success: false,
      message: `No regulation data found for: ${country}. Supported: ${Object.keys(regulationChecklists).join(", ")}`,
    });
  }

  return res.status(200).json({ success: true, country, items: checklist });
};


// POST /api/regulations/ask
// Layer 2 — RAG: FAISS retrieve + Gemini generate
// read POST request body: { country: "china", question: "...", history: [...] }


const askRegulation = async (req, res) => {
  const { country, question, history = [] } = req.body;

  if (!country || !question) {
    return res.status(400).json({
      success: false,
      message: "Both 'country' and 'question' are required.",
    });
  }

  try {
    const { answer, sources } = await ask(country, question, history);
    return res.status(200).json({ success: true, answer, sources });
  } catch (err) {
    console.error("RAG ask error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve regulation answer. Please try again.",
    });
  }
};

module.exports = { getChecklist, askRegulation };