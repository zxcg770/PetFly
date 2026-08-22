# PetFly RAG — Regulation Q&A

Answers user questions about pet import regulations using Retrieval-Augmented Generation (RAG). Regulation documents are stored as Markdown files, chunked and embedded into a FAISS vector index, and queried at runtime using Google Gemini.

---

## How it works

```
regulations/*.md
      │
      ▼
ingestRegulations.js
  - Splits each .md file into ~500-character chunks (50-char overlap)
  - Embeds every chunk via Gemini (gemini-embedding-001, 3072-dim)
  - Saves vectors to faiss_index (binary)
  - Saves chunk text + metadata to faiss_chunks.json
      │
      ▼
ragChain.js  (loaded once at server startup)
  - Loads faiss_index and faiss_chunks.json into memory
  - ask(country, question, history):
      1. Embeds the user's question
      2. Searches FAISS for the top 4 most similar chunks
      3. Filters chunks by country
      4. Sends chunks as context to gemini-2.5-flash in a chat session
      5. Returns { answer, sources }
```

---

## File structure

```
rag/
├── regulations/          # Source regulation documents (one per country)
│   ├── china_import.md
│   ├── germany_import.md
│   └── turkey_import.md
├── scripts/
│   └── ingestRegulations.js   # Run locally to rebuild the index
├── ragChain.js           # Runtime: query the index and call Gemini
├── faiss_index           # Binary FAISS index (committed, do not edit)
└── faiss_chunks.json     # Chunk text + metadata (committed, do not edit)
```

---

## Setup

Each developer needs their own Gemini API key. Add it to `Backend/.env`:

```
GEMINI_API_KEY=your_google_gemini_api_key
```

See `.env.example` for the full list of required environment variables.

---

## Running with Docker

The pre-built FAISS index (`faiss_index`, `faiss_chunks.json`) is committed to the repo, so no ingestion step is needed after a fresh clone. Just start the stack:

```bash
cd Backend
docker compose up -d --build
```

The backend container loads the index automatically on startup. `GEMINI_API_KEY` is picked up from your `.env` via `docker-compose.yml`.

---

## Running ingestion

Only needed when a `.md` regulation file is added or updated. Run **locally** from the `Backend` directory (not inside Docker):

```bash
node rag/scripts/ingestRegulations.js
```

This overwrites `faiss_index` and `faiss_chunks.json`. Commit both files afterwards so the Docker build picks up the new index.

---

## Adding a new country

1. Create `rag/regulations/<country>_import.md` with the regulation content.
2. Also add the country's static checklist to `config/regulationChecklists.js`.
3. Re-run ingestion: `node rag/scripts/ingestRegulations.js`
4. Commit `faiss_index` and `faiss_chunks.json`.

The country name is derived automatically from the filename (e.g. `france_import.md` → `"france"`).
