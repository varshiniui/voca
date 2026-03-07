// server.js — Voca Backend (Stable)

const express = require("express");
const multer  = require("multer");
const cors    = require("cors");
const dotenv  = require("dotenv");
const fs      = require("fs");
const path    = require("path");
const { Pool }= require("pg");

dotenv.config();

const { GoogleGenAI } = require("@google/genai");
const Groq            = require("groq-sdk");
const { AssemblyAI }  = require("assemblyai");

const ai       = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq     = new Groq({ apiKey: process.env.GROQ_API_KEY });
const assembly = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000','https://voca-amber.vercel.app',/\.vercel\.app$/],
  credentials: true
}));
app.use(express.json());

/* ── UPLOADS ── */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

/* ── DATABASE ── */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 20000
});
pool.on("error", err => console.error("DB error:", err));

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id            SERIAL PRIMARY KEY,
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
  } catch (err) { console.error("DB init error:", err); }
}
initDB();

/* ── FILE UPLOAD ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

/* ══════════════════════════════════════
   SUMMARIZE — Groq first, Gemini fallback
══════════════════════════════════════ */

const SUMMARY_PROMPT = (text) => `Analyze this voice note and return ONLY valid JSON, no markdown, no explanation.

Transcription: "${text}"

Return exactly this structure:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "mood": "one word e.g. Focused, Casual, Excited, Reflective",
  "wordCount": ${text.split(/\s+/).length}
}`;

function parseJSON(raw) {
  const clean = raw.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(clean); } catch { return null; }
}

// PRIMARY: Groq llama3 — fast, generous free tier
async function summarizeWithGroq(transcription) {
  const resp = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: "You are a note-taking assistant. Always respond with valid JSON only. No markdown, no explanation." },
      { role: "user",   content: SUMMARY_PROMPT(transcription) }
    ],
    temperature: 0.3,
    max_tokens: 600,
  });

  const parsed = parseJSON(resp.choices[0].message.content);
  if (!parsed) throw new Error("Groq returned invalid JSON");
  parsed.wordCount = parsed.wordCount || transcription.split(/\s+/).length;
  return parsed;
}

// FALLBACK: Gemini
async function summarizeWithGemini(transcription) {
  const resp = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: SUMMARY_PROMPT(transcription)
  });
  const parsed = parseJSON(resp.text);
  if (!parsed) throw new Error("Gemini returned invalid JSON");
  parsed.wordCount = parsed.wordCount || transcription.split(/\s+/).length;
  return parsed;
}

// Try Groq → fallback to Gemini
async function summarize(transcription) {
  try {
    console.log("Summarizing with Groq...");
    return await summarizeWithGroq(transcription);
  } catch (err) {
    console.warn("Groq summarize failed, trying Gemini:", err.message);
    try {
      return await summarizeWithGemini(transcription);
    } catch (err2) {
      const isQuota = err2?.message?.includes('429') ||
                      err2?.message?.includes('quota') ||
                      err2?.message?.includes('RESOURCE_EXHAUSTED');
      const e = new Error(isQuota
        ? 'AI quota reached — try again in 30s.'
        : `Summarization failed: ${err2.message}`);
      e.statusCode = isQuota ? 429 : 500;
      throw e;
    }
  }
}

/* ══════════════════════════════════════
   TRANSCRIBE — Groq Whisper first, AssemblyAI fallback
══════════════════════════════════════ */

async function transcribeAudio(filePath, language) {
  try {
    const opts = { file: fs.createReadStream(filePath), model: "whisper-large-v3" };
    if (language) opts.language = language;
    const r = await groq.audio.transcriptions.create(opts);
    return r.text;
  } catch (err) {
    console.warn("Groq transcription failed, trying AssemblyAI:", err.message);
  }
  const opts = { audio: filePath };
  if (language) opts.language_code = language;
  const r = await assembly.transcripts.transcribe(opts);
  return r.text;
}

/* ══════════════════════════════════════
   ROUTES
══════════════════════════════════════ */

// Audio → text only
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file" });
  try {
    const transcription = await transcribeAudio(req.file.path, req.body.language || null);
    res.json({ success: true, transcription });
  } catch (err) {
    console.error("Transcribe error:", err);
    res.status(500).json({ error: "Transcription failed", details: err.message });
  } finally { fs.unlink(req.file.path, () => {}); }
});

// Audio → transcribe + summarize + save
app.post("/api/summarize", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file" });
  try {
    const transcription = await transcribeAudio(req.file.path, req.body.language || null);
    if (!transcription?.trim()) return res.status(400).json({ error: "No speech detected." });

    const summary = await summarize(transcription);
    const db = await pool.query(
      `INSERT INTO notes (transcription,summary,"keyPoints","actionItems",mood,"wordCount",language)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,"createdAt"`,
      [transcription, summary.summary,
       JSON.stringify(summary.keyPoints   || []),
       JSON.stringify(summary.actionItems || []),
       summary.mood, summary.wordCount, req.body.language || 'en']
    );
    res.json({ success: true, id: db.rows[0].id, timestamp: db.rows[0].createdAt, transcription, ...summary });
  } catch (err) {
    console.error("Summarize error:", err);
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally { fs.unlink(req.file.path, () => {}); }
});

// Text → summarize + save  (used after "review transcript" edit)
app.post("/api/summarize-text", async (req, res) => {
  const { transcription, language } = req.body;
  if (!transcription?.trim()) return res.status(400).json({ error: "No transcription provided" });
  try {
    const summary = await summarize(transcription);
    const db = await pool.query(
      `INSERT INTO notes (transcription,summary,"keyPoints","actionItems",mood,"wordCount",language)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,"createdAt"`,
      [transcription, summary.summary,
       JSON.stringify(summary.keyPoints   || []),
       JSON.stringify(summary.actionItems || []),
       summary.mood, summary.wordCount, language || 'en']
    );
    res.json({ success: true, id: db.rows[0].id, timestamp: db.rows[0].createdAt, transcription, ...summary });
  } catch (err) {
    console.error("Summarize-text error:", err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Get notes
app.get("/api/notes", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,transcription,summary,"keyPoints","actionItems",mood,"wordCount",language,"createdAt"
       FROM notes ORDER BY "createdAt" DESC LIMIT 50`
    );
    res.json({ success: true, notes: r.rows.map(n => ({
      ...n,
      keyPoints:   JSON.parse(n.keyPoints   || '[]'),
      actionItems: JSON.parse(n.actionItems || '[]'),
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/notes/:id", async (req, res) => {
  try { await pool.query(`DELETE FROM notes WHERE id=$1`, [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/notes", async (req, res) => {
  try { await pool.query(`DELETE FROM notes`); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/health", async (req, res) => {
  try {
    const r = await pool.query(`SELECT COUNT(*) FROM notes`);
    res.json({ status: "Voca alive", notes: parseInt(r.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/", (req, res) => res.send("Voca Backend running 🚀"));

process.on('unhandledRejection', err => console.error('Unhandled:', err));
process.on('uncaughtException',  err => console.error('Uncaught:',  err));

app.listen(PORT, "0.0.0.0", () => console.log(`Voca server on port ${PORT}`));