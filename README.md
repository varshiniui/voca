# Voca — AI Voice Note Summarizer

> Record your voice. Get a smart summary, key points, and action items — instantly.

![Voca](https://voca-amber.vercel.app/og.png)

**Live Demo → [voca-amber.vercel.app](https://voca-amber.vercel.app)**

---

## What is Voca?

Voca is a full-stack AI voice note app. You speak, it listens — then transcribes your audio, summarises the content, extracts key points and action items, and detects the mood of your note. Everything happens in seconds.

Built as a portfolio project to demonstrate real-world full-stack development with multiple AI APIs, a production PostgreSQL database, and a polished, animated frontend.

---

## Features

- 🎙️ **Voice recording** — record directly in the browser with live waveform visualisation
- ✍️ **AI transcription** — Groq Whisper converts speech to text with language detection
- 🧠 **AI summarisation** — Gemini / LLaMA generates a summary, key points, and action items
- 😌 **Mood detection** — classifies the tone of your note (Focused, Excited, Casual, etc.)
- 📝 **Transcript editing** — review and edit before summarising
- 📋 **Copy to clipboard** — copy the full note as formatted text
- 📄 **Export PDF** — download a beautifully formatted PDF of the note
- 🗂️ **Notes history** — all notes saved to PostgreSQL and accessible in a side panel
- 🌐 **7 languages** — English, Tamil, Hindi, Malayalam, Spanish, French, Auto-detect
- ✨ **Try Demo** — three sample notes for recruiters to preview the full experience without recording

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| [Next.js 14](https://nextjs.org) | React framework, App Router |
| [Framer Motion](https://www.framer.com/motion/) | Animations and transitions |
| [Lucide React](https://lucide.dev) | Icons |
| Vercel | Deployment |

### Backend
| Tool | Purpose |
|---|---|
| [Node.js](https://nodejs.org) + [Express](https://expressjs.com) | REST API server |
| [Groq](https://groq.com) — Whisper Large v3 | Audio transcription |
| [AssemblyAI](https://www.assemblyai.com) | Transcription fallback |
| [Groq](https://groq.com) — LLaMA 3.3 70B | AI summarisation (primary) |
| [Google Gemini](https://deepmind.google/technologies/gemini/) 2.0 Flash | AI summarisation (fallback) |
| [PostgreSQL](https://www.postgresql.org) | Notes storage |
| Railway | Backend + database hosting |

### Architecture
```
Browser
  │
  ├── records audio (Web Audio API + MediaRecorder)
  │
  └── POST /api/summarize  ──►  Express server
                                    │
                                    ├── Groq Whisper  (transcription)
                                    │   └── AssemblyAI (fallback)
                                    │
                                    ├── Groq LLaMA    (summarisation)
                                    │   └── Gemini     (fallback)
                                    │   └── Basic NLP  (last resort)
                                    │
                                    └── PostgreSQL     (save note)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Railway, Supabase, or local)
- API keys for Groq, AssemblyAI, and Google Gemini

### 1. Clone the repo
```bash
git clone https://github.com/varshiniui/voca.git
cd voca
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/dbname
GROQ_API_KEY=your_groq_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Start the server:
```bash
node server.js
```

### 3. Set up the frontend
```bash
cd frontend
npm install
```

Create a `.env.local` file:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/summarize` | Upload audio → transcribe + summarise + save |
| `POST` | `/api/transcribe` | Upload audio → transcribe only |
| `POST` | `/api/summarize-text` | Summarise from existing transcript text |
| `GET` | `/api/notes` | Fetch all saved notes (latest 50) |
| `DELETE` | `/api/notes/:id` | Delete a single note |
| `DELETE` | `/api/notes` | Clear all notes |
| `GET` | `/health` | Server health check |

### Example response — `/api/summarize`
```json
{
  "success": true,
  "id": 42,
  "timestamp": "2026-03-07T14:32:00.000Z",
  "transcription": "Today I worked on the backend API...",
  "summary": "Worked on the backend API today, focusing on the summarization pipeline.",
  "keyPoints": [
    "Built the summarization endpoint",
    "Added fallback model support"
  ],
  "actionItems": [
    "Write unit tests for the API",
    "Deploy to Railway"
  ],
  "mood": "Focused",
  "wordCount": 38
}
```

---

## AI Fallback Chain

Voca is resilient — if one AI provider hits a rate limit, it automatically tries the next:

```
Groq LLaMA 3.3 70B  →  Groq LLaMA 3.1 8B  →  Groq LLaMA3 8B  →  Gemini 2.0 Flash  →  Basic NLP fallback
```

This means the app always returns a result, even under heavy load.

---

## Project Structure

```
voca/
├── frontend/
│   └── app/
│       ├── page.jsx              # Main page — hero, recorder, results
│       ├── layout.jsx            # Root layout + font loading
│       ├── globals.css           # Minimal reset only
│       └── components/
│           ├── Recorder.jsx      # Mic orb, waveform, language picker
│           ├── ResultCard.jsx    # Summary, key points, copy, export PDF
│           └── HistoryPanel.jsx  # Slide-out notes history panel
│
└── backend/
    └── server.js                 # Express API + AI pipeline + DB
```

---

## Deployment

### Frontend — Vercel
1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set environment variable: `NEXT_PUBLIC_BACKEND_URL`
4. Deploy

### Backend — Railway
1. Create a new project at [railway.app](https://railway.app)
2. Add a PostgreSQL database
3. Deploy the backend service from the `/backend` folder
4. Set all four environment variables in Railway's Variables tab

---

## Mobile App

A React Native (Expo) mobile version is also included in `VocaMobile/`.

```bash
cd VocaMobile
npx expo start
```

Scan the QR code with the Expo Go app. Connects to the same Railway backend.

---

## Screenshots

| Recording | Summary | History |
|---|---|---|
| Live waveform visualiser | Sage green sticky note card | Slide-out notes panel |

---

## What I Learned

- Chaining multiple AI APIs with graceful fallbacks
- Handling audio in the browser with `MediaRecorder` and `Web Audio API`
- Building animated UIs with Framer Motion
- PostgreSQL on Railway with connection pooling
- Deploying a split frontend/backend architecture across Vercel + Railway

---

## Author

**Varshini** — [GitHub](https://github.com/varshiniui)

Built for internship portfolio · March 2026

---

## License

MIT