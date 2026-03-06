// server.js — Voca Backend (Stable)

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

dotenv.config();

const { GoogleGenAI } = require("@google/genai");
const Groq = require("groq-sdk");
const { AssemblyAI } = require("assemblyai");

const ai       = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq     = new Groq({ apiKey: process.env.GROQ_API_KEY });
const assembly = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://voca-amber.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

/* =========================
   UPLOAD FOLDER
========================= */

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

/* =========================
   DATABASE
========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000
});

pool.on("error", (err) => console.error("Unexpected DB error:", err));

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id          SERIAL PRIMARY KEY,
        transcription TEXT NOT NULL,
        summary       TEXT,
        "keyPoints"   TEXT,
        "actionItems" TEXT,
        mood          TEXT,
        "wordCount"   INTEGER,
        language      TEXT DEFAULT 'en',
        "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database ready");
  } catch (err) {
    console.error("Database init error:", err);
  }
}

initDB();

/* =========================
   FILE UPLOAD
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

/* =========================
   HELPERS
========================= */

const sleep = ms => new Promise(r => setTimeout(r, ms));

const isQuotaError = err =>
  err?.message?.includes('429') ||
  err?.message?.includes('quota') ||
  err?.message?.includes('RESOURCE_EXHAUSTED');

/* =========================
   GEMINI SUMMARIZER
========================= */

async function summarizeWithGemini(transcription) {
  const prompt = `Analyze this voice note transcription and return ONLY valid JSON, no markdown, no explanation.

Transcription: "${transcription}"

Return exactly this format:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "mood": "one word (e.g. Focused, Casual, Urgent, Excited, Reflective, Professional)",
  "wordCount": ${transcription.split(/\s+/).length}
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  let text = response.text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      summary:     text.slice(0, 300) || "Could not parse summary.",
      keyPoints:   [],
      actionItems: [],
      mood:        "Casual"
    };
  }

  parsed.wordCount = parsed.wordCount || transcription.split(/\s+/).length;
  return parsed;
}

async function summarizeWithRetry(transcription, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await summarizeWithGemini(transcription);
    } catch (err) {
      if (isQuotaError(err) && attempt < retries) {
        console.log(`Gemini quota hit, waiting 20s before retry ${attempt + 1}...`);
        await sleep(20000);
        continue;
      }
      // Re-throw with clean message
      if (isQuotaError(err)) {
        const e = new Error('Gemini quota reached — please wait a moment and try again.');
        e.statusCode = 429;
        throw e;
      }
      throw err;
    }
  }
}

/* =========================
   TRANSCRIBE HELPER
========================= */

async function transcribeAudio(filePath, language) {
  // Try Groq (Whisper) first
  try {
    const fileStream = fs.createReadStream(filePath);
    const opts = { file: fileStream, model: "whisper-large-v3" };
    if (language) opts.language = language;
    const result = await groq.audio.transcriptions.create(opts);
    return result.text;
  } catch (err) {
    console.warn("Groq failed, falling back to AssemblyAI:", err.message);
  }

  // Fallback to AssemblyAI
  const opts = { audio: filePath };
  if (language) opts.language_code = language;
  const transcript = await assembly.transcripts.transcribe(opts);
  return transcript.text;
}

/* =========================
   ROUTES
========================= */

// ── Transcribe only
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file" });
  const filePath = req.file.path;
  const language = req.body.language || null;

  try {
    const transcription = await transcribeAudio(filePath, language);
    res.json({ success: true, transcription });
  } catch (err) {
    console.error("Transcribe error:", err);
    res.status(500).json({ error: "Transcription failed", details: err.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
});

// ── Transcribe + Summarize
app.post("/api/summarize", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file" });
  const filePath = req.file.path;
  const language = req.body.language || null;

  try {
    // 1. Transcribe
    const transcription = await transcribeAudio(filePath, language);

    if (!transcription || transcription.trim().length < 3) {
      return res.status(400).json({ error: "Could not detect speech in audio." });
    }

    // 2. Summarize (with retry on quota error)
    const summary = await summarizeWithRetry(transcription);

    // 3. Save to DB
    const db = await pool.query(
      `INSERT INTO notes (transcription, summary, "keyPoints", "actionItems", mood, "wordCount", language)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, "createdAt"`,
      [
        transcription,
        summary.summary,
        JSON.stringify(summary.keyPoints   || []),
        JSON.stringify(summary.actionItems || []),
        summary.mood,
        summary.wordCount,
        language || 'en'
      ]
    );

    res.json({
      success:       true,
      id:            db.rows[0].id,
      timestamp:     db.rows[0].createdAt,
      transcription,
      ...summary
    });

  } catch (err) {
    console.error("Summarize error:", err);
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message, details: err.details });
  } finally {
    fs.unlink(filePath, () => {});
  }
});

// ── Get all notes
app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, transcription, summary, "keyPoints", "actionItems", mood, "wordCount", language, "createdAt"
       FROM notes
       ORDER BY "createdAt" DESC
       LIMIT 50`
    );

    const notes = result.rows.map(n => ({
      ...n,
      keyPoints:   JSON.parse(n.keyPoints   || '[]'),
      actionItems: JSON.parse(n.actionItems || '[]'),
    }));

    res.json({ success: true, notes });
  } catch (err) {
    console.error("Get notes error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Delete single note
app.delete("/api/notes/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM notes WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete all notes
app.delete("/api/notes", async (req, res) => {
  try {
    await pool.query(`DELETE FROM notes`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM notes`);
    res.json({ status: "Voca alive", notes: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START
========================= */

app.listen(PORT, "0.0.0.0", () => console.log(`Voca server on port ${PORT}`));