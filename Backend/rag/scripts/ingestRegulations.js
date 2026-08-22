// run once for loading, chunking and emdedding the regulations into FAISS.
// Re-run if you update the .md files.
require("dotenv").config();

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { IndexFlatL2 } = require("faiss-node");
const path = require("path");
const fs = require("fs");

// config 
const REGULATIONS_DIR = path.join(__dirname, "../regulations");
const FAISS_INDEX_PATH = path.join(__dirname, "../faiss_index");
const CHUNKS_PATH = path.join(__dirname, "../faiss_chunks.json");

// embed using Google Gemini embedding model (gemini-embedding-001)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function embedTexts(texts) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" }, { apiVersion: "v1" });
  const vectors = [];

  for (const text of texts) {
    const result = await model.embedContent(text);
    vectors.push(result.embedding.values);
  }

  return vectors;
}

// read and chunk the .md files
async function ingest() {
  console.log("Starting ingestion...\n");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const files = fs.readdirSync(REGULATIONS_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} files: ${files.join(", ")}\n`);

  let allChunks = [];

  for (const file of files) {
    const country = file.replace("_import.md", "").toLowerCase();
    const content = fs.readFileSync(path.join(REGULATIONS_DIR, file), "utf-8");

    //Wraps the text in a LangChain Document object. 
    const rawDoc = new Document({
      pageContent: content,
      metadata: { country, source: file },
    });

    const chunks = await splitter.splitDocuments([rawDoc]);
    console.log(`${file}: ${chunks.length} chunks`);
    allChunks = [...allChunks, ...chunks];
  }

  console.log(`\nTotal chunks: ${allChunks.length}`);
  console.log("Embedding with Google Gemini...\n");

  //Gemini embedds the chunks into vectors
  const vectors = await embedTexts(allChunks.map((c) => c.pageContent));

  // FAISS index — stores vectors in memory, saves to disk
  const dimension = vectors[0].length;
  console.log(`Embedding dimension: ${dimension}`);

  const index = new IndexFlatL2(dimension);
  //add all vectors to the FAISS index
  index.add(vectors.flat());

  // Save FAISS index to disk
  index.write(FAISS_INDEX_PATH);
  console.log(`FAISS index saved to: ${FAISS_INDEX_PATH}`);

  // Save chunk texts + metadata as JSON (FAISS only stores vectors, not text)
  const chunksData = allChunks.map((c, i) => ({
    id: i,
    text: c.pageContent,
    country: c.metadata.country,
    source: c.metadata.source,
  }));
  fs.writeFileSync(CHUNKS_PATH, JSON.stringify(chunksData, null, 2));
  console.log(`Chunks metadata saved to: ${CHUNKS_PATH}`);

  console.log(`\nDone. ${allChunks.length} chunks stored in FAISS.`);
}

ingest().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});