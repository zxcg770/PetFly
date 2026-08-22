//  builds the LangChain RAG chain
// Loads the FAISS index and chunk metadata from disk.
// Exposes one function: ask(country, question, history)
// Called by regulationController.js for every RAG request.

require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { IndexFlatL2 } = require("faiss-node");
const path = require("path");
const fs = require("fs");

// load FAISS index and chunk metadata from disk
const FAISS_INDEX_PATH = path.join(__dirname, "faiss_index");
const CHUNKS_PATH = path.join(__dirname, "faiss_chunks.json");
const TOP_K = 4; // number of chunks to retrieve per query

const index = IndexFlatL2.read(FAISS_INDEX_PATH);
const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf-8"));

console.log(`RAG ready: ${chunks.length} chunks loaded from FAISS.`);

// Gemini clients for embedding and generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Embed a single query string into a vector
async function embedQuery(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" }, { apiVersion: "v1" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Retrieve relevant chunks from FAISS

async function retrieve(country, question) {
  const queryVector = await embedQuery(question);
  // Search FAISS for the top K most similar vectors
  const { labels } = index.search(queryVector, TOP_K);

  // labels is a flat array of chunk indices — look them up in chunks JSON
  // Filter by country so we only return chunks from the relevant .md file
  return labels
    .filter((id) => id !== -1)
    .map((id) => chunks[id])
    .filter((chunk) => chunk.country === country.toLowerCase());
}

//  Generate answer using Gemini

async function ask(country, question, history = []) {
  // Step 1: retrieve relevant chunks
  const relevantChunks = await retrieve(country, question);

  if (relevantChunks.length === 0) {
    return {
      answer: `Sorry, I couldn't find regulation information for ${country}. Please check the official sources.`,
      sources: [],
    };
  }

  // Step 2: build context from retrieved chunks
  const context = relevantChunks.map((c) => c.text).join("\n\n---\n\n");

  // Step 3: build conversation history for Gemini
  // Gemini expects history as: [{ role: "user", parts: [...] }, { role: "model", parts: [...] }]
  const geminiHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Step 4: start a Gemini chat session with system context
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are a pet travel regulation expert for PetFly, a platform that connects pet owners with travelers who accompany their pets on international flights.
    
Answer the user's question based ONLY on the regulation information provided below. Be concise and clear. Highlight any specific deadlines, timelines, or costs. If the information is not in the context, say so honestly — do not guess.

REGULATION CONTEXT FOR ${country.toUpperCase()}:
${context}`,
  });

  const chat = model.startChat({ history: geminiHistory });

  // Step 5: send the question and get the answer
  const result = await chat.sendMessage(question);
  const answer = result.response.text();

  // also return the sources (chunk metadata) for reference
  return {
    answer,
    sources: [...new Set(relevantChunks.map((c) => c.source))],
  };
}

module.exports = { ask };