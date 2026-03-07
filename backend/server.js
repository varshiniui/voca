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
        keypoints     TEXT,
        actionitems   TEXT,
        mood          TEXT,
        wordcount     INTEGER,
        language      TEXT DEFAULT 'en',
        createdat     TIMESTAMP DEFAULT NOW()
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
   SUMMARIZE
══════════════════════════════════════ */

const PROMPT = (text) =>
`You are a note summarizer. Return ONLY valid JSON, no markdown, no extra text.

Voice note: "${text}"

JSON format:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1","point 2","point 3"],
  "actionItems": ["action 1","action 2"],
  "mood": "one word e.g. Focused",
  "wordCount": ${text.split(/\s+/).length}
}`;

function parseJSON(raw) {
  const clean = (raw||'').trim()
    .replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();
  try { return JSON.parse(clean); } catch { return null; }
}

const isQuota = err =>
  (err?.message||'').includes('429') ||
  (err?.message||'').includes('quota') ||
  (err?.message||'').includes('rate_limit') ||
  (err?.message||'').includes('RESOURCE_EXHAUSTED') ||
  (err?.status === 429);

const isDecommissioned = err =>
  (err?.message||'').includes('decommissioned') ||
  (err?.message||'').includes('model_decommissioned') ||
  (err?.message||'').includes('no longer supported');

// Active Groq models only — gemma2-9b-it was decommissioned March 2025
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',  // Best quality, high RPM
  'llama-3.1-8b-instant',     // Fast, high RPM fallback
  'llama3-8b-8192',           // Standard fallback
];

async function summarizeGroq(transcription) {
  for (const model of GROQ_MODELS) {
    try {
      console.log(`Trying Groq model: ${model}`);
      const resp = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Return ONLY valid JSON. No markdown. No explanation.' },
          { role: 'user',   content: PROMPT(transcription) }
        ],
        temperature: 0.2,
        max_tokens: 500,
      });
      const parsed = parseJSON(resp.choices[0].message.content);
      if (parsed) {
        parsed.wordCount = parsed.wordCount || transcription.split(/\s+/).length;
        console.log(`Success with model: ${model}`);
        return parsed;
      }
    } catch (err) {
      if (isQuota(err) || isDecommissioned(err)) {
        console.warn(`${model} unavailable (${isDecommissioned(err)?'decommissioned':'quota'}), trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw Object.assign(new Error('all_groq_quota'), { allQuota: true });
}

async function summarizeGemini(transcription) {
  const resp = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: PROMPT(transcription)
  });
  const parsed = parseJSON(resp.text);
  if (!parsed) throw new Error('Gemini returned invalid JSON');
  parsed.wordCount = parsed.wordCount || transcription.split(/\s+/).length;
  return parsed;
}

// Build a basic summary without any AI if everything is quota-limited
function fallbackSummary(transcription) {
  const words     = transcription.trim().split(/\s+/);
  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return {
    summary:     sentences.slice(0,2).join('. ').trim() + '.' || transcription.slice(0,200),
    keyPoints:   sentences.slice(0,3).map(s => s.trim()).filter(Boolean),
    actionItems: [],
    mood:        'Casual',
    wordCount:   words.length,
    _fallback:   true,
  };
}

async function summarize(transcription) {
  // 1. Try all Groq models
  try {
    return await summarizeGroq(transcription);
  } catch (err) {
    if (!err.allQuota) throw err;
    console.warn('All Groq models quota-limited, trying Gemini...');
  }

  // 2. Try Gemini
  try {
    return await summarizeGemini(transcription);
  } catch (err) {
    if (isQuota(err)) {
      console.warn('Gemini also quota-limited, using fallback summary');
      // 3. Basic fallback — always works, no AI needed
      return fallbackSummary(transcription);
    }
    throw err;
  }
}

/* ══════════════════════════════════════
   TRANSCRIBE
══════════════════════════════════════ */

async function transcribeAudio(filePath, language) {
  try {
    const opts = { file: fs.createReadStream(filePath), model: 'whisper-large-v3' };
    if (language) opts.language = language;
    return (await groq.audio.transcriptions.create(opts)).text;
  } catch (err) {
    console.warn('Groq transcription failed, trying AssemblyAI:', err.message);
  }
  const opts = { audio: filePath };
  if (language) opts.language_code = language;
  return (await assembly.transcripts.transcribe(opts)).text;
}

/* ══════════════════════════════════════
   ROUTES
══════════════════════════════════════ */

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file' });
  try {
    const transcription = await transcribeAudio(req.file.path, req.body.language || null);
    res.json({ success: true, transcription });
  } catch (err) {
    res.status(500).json({ error: 'Transcription failed', details: err.message });
  } finally { fs.unlink(req.file.path, () => {}); }
});

app.post('/api/summarize', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file' });
  try {
    const transcription = await transcribeAudio(req.file.path, req.body.language || null);
    if (!transcription?.trim()) return res.status(400).json({ error: 'No speech detected.' });

    const summary = await summarize(transcription);
    const db = await pool.query(
      `INSERT INTO notes (transcription,summary,keypoints,actionitems,mood,wordcount,language)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,createdat`,
      [transcription, summary.summary,
       JSON.stringify(summary.keyPoints   || []),
       JSON.stringify(summary.actionItems || []),
       summary.mood, summary.wordCount, req.body.language || 'en']
    );
    res.json({ success:true, id:db.rows[0].id, timestamp:db.rows[0].createdat, transcription, ...summary });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message });
  } finally { fs.unlink(req.file.path, () => {}); }
});

app.post('/api/summarize-text', async (req, res) => {
  const { transcription, language } = req.body;
  if (!transcription?.trim()) return res.status(400).json({ error: 'No transcription provided' });
  try {
    const summary = await summarize(transcription);
    const db = await pool.query(
      `INSERT INTO notes (transcription,summary,keypoints,actionitems,mood,wordcount,language)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,createdat`,
      [transcription, summary.summary,
       JSON.stringify(summary.keyPoints   || []),
       JSON.stringify(summary.actionItems || []),
       summary.mood, summary.wordCount, language || 'en']
    );
    res.json({ success:true, id:db.rows[0].id, timestamp:db.rows[0].createdat, transcription, ...summary });
  } catch (err) {
    console.error('Summarize-text error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,transcription,summary,keypoints,actionitems,mood,wordcount,language,createdat
       FROM notes ORDER BY createdat DESC LIMIT 50`
    );
    res.json({ success:true, notes: r.rows.map(n => ({
      ...n,
      keyPoints:   JSON.parse(n.keypoints   || '[]'),
      actionItems: JSON.parse(n.actionitems || '[]'),
      wordCount:   n.wordcount,
      createdAt:   n.createdat,
    }))});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/notes/:id', async (req,res) => {
  try { await pool.query(`DELETE FROM notes WHERE id=$1`,[req.params.id]); res.json({success:true}); }
  catch (err) { res.status(500).json({error:err.message}); }
});

app.delete('/api/notes', async (req,res) => {
  try { await pool.query(`DELETE FROM notes`); res.json({success:true}); }
  catch (err) { res.status(500).json({error:err.message}); }
});

app.get('/health', async (req,res) => {
  try {
    const r = await pool.query(`SELECT COUNT(*) FROM notes`);
    res.json({ status:'Voca alive', notes:parseInt(r.rows[0].count) });
  } catch (err) { res.status(500).json({error:err.message}); }
});

app.get('/', (req,res) => res.send('Voca Backend running 🚀'));

process.on('unhandledRejection', err => console.error('Unhandled:', err));
process.on('uncaughtException',  err => console.error('Uncaught:',  err));

app.listen(PORT, '0.0.0.0', () => console.log(`Voca server on port ${PORT}`));