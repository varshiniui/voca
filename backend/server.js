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
  origin: ['http://localhost:3000','https://voca-amber.vercel.app',/\.vercel\.app$/],
  credentials: true
}));
app.use(express.json());

/* ── UPLOAD FOLDER ── */
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

/* ── HELPERS ── */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isQuotaError = err =>
  err?.message?.includes('429') ||
  err?.message?.includes('quota') ||
  err?.message?.includes('RESOURCE_EXHAUSTED');

async function summarizeWithGemini(transcription) {
  const prompt = `Analyze this voice note and return ONLY valid JSON, no markdown.

Transcription: "${transcription}"

Return exactly:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1","point 2","point 3"],
  "actionItems": ["action 1","action 2"],
  "mood": "one word e.g. Focused",
  "wordCount": ${transcription.split(/\s+/).length}
}`;

  const response = await ai.models.generateContent({ model:"gemini-2.0-flash", contents:prompt });
  let text = response.text.trim()
    .replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();

  let parsed;
  try { parsed = JSON.parse(text); }
  catch { parsed = { summary: text.slice(0,300)||"No summary.", keyPoints:[], actionItems:[], mood:"Casual" }; }
  parsed.wordCount = parsed.wordCount || transcription.split(/\s+/).length;
  return parsed;
}

async function summarizeWithRetry(transcription, retries=2) {
  for (let i=0; i<=retries; i++) {
    try { return await summarizeWithGemini(transcription); }
    catch (err) {
      if (isQuotaError(err) && i<retries) { await sleep(20000); continue; }
      if (isQuotaError(err)) {
        const e = new Error('AI quota reached — try again in 30s.'); e.statusCode=429; throw e;
      }
      throw err;
    }
  }
}

async function transcribeAudio(filePath, language) {
  try {
    const opts = { file: fs.createReadStream(filePath), model:"whisper-large-v3" };
    if (language) opts.language = language;
    return (await groq.audio.transcriptions.create(opts)).text;
  } catch (err) { console.warn("Groq failed, trying AssemblyAI:", err.message); }
  const opts = { audio: filePath };
  if (language) opts.language_code = language;
  return (await assembly.transcripts.transcribe(opts)).text;
}

/* ═══════════════ ROUTES ═══════════════ */

// Audio → text only
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error:"No audio file" });
  try {
    const transcription = await transcribeAudio(req.file.path, req.body.language||null);
    res.json({ success:true, transcription });
  } catch (err) {
    res.status(500).json({ error:"Transcription failed", details:err.message });
  } finally { fs.unlink(req.file.path, ()=>{}); }
});

// Audio → transcribe + summarize + save
app.post("/api/summarize", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error:"No audio file" });
  try {
    const transcription = await transcribeAudio(req.file.path, req.body.language||null);
    if (!transcription?.trim()) return res.status(400).json({ error:"No speech detected." });

    const summary = await summarizeWithRetry(transcription);
    const db = await pool.query(
      `INSERT INTO notes (transcription,summary,"keyPoints","actionItems",mood,"wordCount",language)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,"createdAt"`,
      [transcription, summary.summary,
       JSON.stringify(summary.keyPoints||[]), JSON.stringify(summary.actionItems||[]),
       summary.mood, summary.wordCount, req.body.language||'en']
    );
    res.json({ success:true, id:db.rows[0].id, timestamp:db.rows[0].createdAt, transcription, ...summary });
  } catch (err) {
    res.status(err.statusCode||500).json({ error:err.message });
  } finally { fs.unlink(req.file.path, ()=>{}); }
});

// Text → summarize + save  ← THIS WAS MISSING, fixes "review transcript" flow
app.post("/api/summarize-text", async (req, res) => {
  const { transcription, language } = req.body;
  if (!transcription?.trim()) return res.status(400).json({ error:"No transcription provided" });
  try {
    const summary = await summarizeWithRetry(transcription);
    const db = await pool.query(
      `INSERT INTO notes (transcription,summary,"keyPoints","actionItems",mood,"wordCount",language)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,"createdAt"`,
      [transcription, summary.summary,
       JSON.stringify(summary.keyPoints||[]), JSON.stringify(summary.actionItems||[]),
       summary.mood, summary.wordCount, language||'en']
    );
    res.json({ success:true, id:db.rows[0].id, timestamp:db.rows[0].createdAt, transcription, ...summary });
  } catch (err) {
    res.status(err.statusCode||500).json({ error:err.message });
  }
});

app.get("/api/notes", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,transcription,summary,"keyPoints","actionItems",mood,"wordCount",language,"createdAt"
       FROM notes ORDER BY "createdAt" DESC LIMIT 50`
    );
    res.json({ success:true, notes: r.rows.map(n=>({
      ...n,
      keyPoints:   JSON.parse(n.keyPoints  ||'[]'),
      actionItems: JSON.parse(n.actionItems||'[]'),
    }))});
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.delete("/api/notes/:id", async (req,res) => {
  try { await pool.query(`DELETE FROM notes WHERE id=$1`,[req.params.id]); res.json({success:true}); }
  catch (err) { res.status(500).json({error:err.message}); }
});

app.delete("/api/notes", async (req,res) => {
  try { await pool.query(`DELETE FROM notes`); res.json({success:true}); }
  catch (err) { res.status(500).json({error:err.message}); }
});

app.get("/health", async (req,res) => {
  try {
    const r = await pool.query(`SELECT COUNT(*) FROM notes`);
    res.json({ status:"Voca alive", notes:parseInt(r.rows[0].count) });
  } catch (err) { res.status(500).json({error:err.message}); }
});

app.get("/", (req,res) => res.send("Voca Backend running 🚀"));

process.on('unhandledRejection', err => console.error('Unhandled:', err));
process.on('uncaughtException',  err => console.error('Uncaught:',  err));

app.listen(PORT, "0.0.0.0", () => console.log(`Voca server on port ${PORT}`));