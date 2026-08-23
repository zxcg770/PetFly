# 🐾 PetFly

**A two-sided marketplace that connects pet owners with air travelers who accompany their pets on international flights.**

Relocating with a pet across borders is expensive and bureaucratic — cargo shipping is stressful for the animal, and the import paperwork differs by country. PetFly lets a pet owner post a transport request for a route (e.g. *Shanghai → Munich*), and travelers already flying that route make offers to bring the pet along in-cabin. Payments are held in escrow until delivery, the two sides chat in-app, and an AI assistant answers country-specific pet-import questions.

> Built as a team project for the **Software Engineering for Business Applications (SEBA) Master** course at TU Munich.

---

## ✨ Features

- **Authentication** — JWT-based register / login, with a security-question password-reset flow (`bcrypt`-hashed credentials).
- **Pet profiles** — owners register pets with breed, weight, age, photos and notes.
- **Transport requests** — a multi-step flow to post a route, dates, preferred airline and price; each request carries a state machine (`pending → open → accepted → completed`).
- **Browse & search** — travelers browse *open* requests, filter by origin / destination / pet type, and sort by soonest, newest or highest pay (MongoDB aggregation pipeline).
- **Offers** — travelers send offers on a request; the owner reviews and accepts one.
- **Escrow payments (Stripe)** — listing fees and traveler payments run through Stripe. Money is *held* until the trip completes; two background jobs auto-revert unpaid accepted offers after 10 min and auto-refund listing fees for requests that expire unmatched.
- **In-app messaging** — per-request conversations between owner and traveler.
- **Reviews & ratings** — both sides rate each other after a completed trip; user `avgRating` is aggregated.
- **AI regulation assistant (RAG)** — a two-layer helper for "what do I need to bring a pet into country X":
  - *Layer 1* — instant static checklist (no LLM cost).
  - *Layer 2* — Retrieval-Augmented Generation: regulation docs are chunked and embedded into a **FAISS** index, the top-k relevant chunks are retrieved and filtered by country, then answered by **Google Gemini** with the retrieved context.

---

## 🛠 Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| **Frontend** | React 19 (CRA), React Router 7, Tailwind CSS, Axios, Stripe.js, react-toastify |
| **Backend**  | Node.js, Express 5, MongoDB (Mongoose), JWT, bcrypt, express-validator |
| **Payments** | Stripe |
| **AI / RAG** | Google Gemini (`gemini-2.5-flash` + `gemini-embedding-001`), LangChain text-splitters, FAISS (`faiss-node`) |
| **Media**    | Cloudinary (image uploads via multer) |
| **Infra**    | Docker + docker-compose |

---

## 🧭 Architecture

```
                 ┌──────────────────────────┐
                 │   React SPA (Frontend)   │
                 │  pages / components /     │
                 │  AuthContext / axios API  │
                 └────────────┬─────────────┘
                              │  REST (JSON, JWT in header)
                              ▼
                 ┌──────────────────────────┐
                 │   Express REST API        │
                 │  routes → controllers →   │
                 │  Mongoose models          │
                 │                           │
                 │  • auth / users / pets    │
                 │  • requests / offers      │
                 │  • payments (Stripe)      │
                 │  • messages / reviews     │
                 │  • regulations (RAG)      │
                 │  • background jobs        │
                 └───────┬──────────┬────────┘
                         │          │
              ┌──────────▼───┐   ┌──▼──────────────────┐
              │  MongoDB     │   │  RAG pipeline        │
              │  (Mongoose)  │   │  FAISS index +       │
              │  8 models    │   │  Gemini (retrieve →  │
              └──────────────┘   │  generate)           │
                                 └──────────────────────┘
```

**Data models (8):** `User`, `Pet`, `Request`, `Offer`, `Payment`, `Conversation`, `Message`, `Review`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB database — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- (Optional, for full features) a Google Gemini API key, Stripe test keys, Cloudinary account

### 1. Backend

```bash
cd Backend
cp .env.example .env      # then fill in your own values
npm install
npm run seed              # loads demo data (users, pets, requests, offers, chats, reviews)
npm run dev               # starts the API on http://localhost:5001
```

Minimum env vars needed to boot: `MONGO_URI` and `JWT_SECRET`.
`GEMINI_API_KEY` enables the AI assistant; `STRIPE_SECRET_KEY` enables payments; Cloudinary vars enable image upload. Features degrade gracefully if a key is absent.

### 2. Frontend

```bash
cd Frontend
cp .env.example .env      # REACT_APP_API_URL defaults to http://localhost:5001/api
npm install
npm start                 # starts the app on http://localhost:3000
```

### 3. Log in with a demo account

After seeding, log in with any seeded user — password **`Password1`**:

| Email | Role in the demo |
|-------|------------------|
| `ana@petfly.dev`  | Owner with an in-flight trip + active chat |
| `hiro@petfly.dev` | Verified traveler, 5.0 rating |
| `chen@petfly.dev` | Owner with an open request that has 2 offers |

### Run with Docker (backend)

```bash
cd Backend
docker compose up -d --build
```

The pre-built FAISS index is committed, so the RAG feature works after a fresh clone without a re-ingestion step (just supply `GEMINI_API_KEY`).

---

## 📁 Project Structure

```
SEBA/
├── Backend/
│   ├── src/
│   │   ├── controllers/    # request handlers
│   │   ├── models/         # Mongoose schemas (8)
│   │   ├── routes/         # Express routers
│   │   ├── middleware/     # JWT auth
│   │   └── seed.js         # demo data seeder
│   ├── rag/                # FAISS index, ingestion, RAG chain
│   ├── config/             # static regulation checklists
│   ├── server.js           # app entry + background jobs
│   └── docker-compose.yml
└── Frontend/
    └── src/
        ├── pages/          # route-level screens
        ├── components/     # reusable UI
        ├── context/        # AuthContext
        └── api/            # axios API layer
```

---

## 👥 Team & My Role

This was a team project (SEBA Master, Team 9). My primary contributions:

- **Pet profiles** — schema, API and UI for registering and managing pets.
- **Transport requests** — the request data model and CRUD API.
- **Create-request flow** — the multi-step form (pet → route/dates → listing), including validation and front-end/back-end integration.
- **Browse page** — the open-requests listing with filtering and sorting.

Other team members led the **Stripe payment flow** and the **AI regulation assistant (RAG)**.

---

## 📝 Notes

- The original course database is no longer used; a seed script (`npm run seed`) provisions a fresh, self-consistent demo dataset so the app runs end-to-end out of the box.
- No secrets are committed. Copy `.env.example` to `.env` and supply your own credentials.

---

## 📸 Screenshots

| Browse Requests | My Request Detail |
|---|---|
| <img width="1389" height="909" alt="Image" src="https://github.com/user-attachments/assets/b920b97a-1a70-409c-bf70-6e6f8d4d9710" /> | <img width="1389" height="909" alt="Image" src="https://github.com/user-attachments/assets/a6e6b4e3-33ce-4e9d-ac4b-48c1b2de8045" /> |

| Message Communication | AI Regulation Assistant |
|---|---|
| <img width="1389" height="909" alt="Image" src="https://github.com/user-attachments/assets/384fb07b-82f5-4249-b827-9f6b20a549a7" /> | <img width="1389" height="909" alt="Image" src="https://github.com/user-attachments/assets/3923cf79-4497-45da-a13a-d1b4fb082425" /> |