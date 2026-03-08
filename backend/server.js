// server.js — Voca Backend (Stable + PIN Auth)

const express = require("express");
const multer  = require("multer");
const cors    = require("cors");
const dotenv  = require("dotenv");
const fs      = require("fs");
const path    = require("path");
const crypto  = require("crypto");
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
    // notes table with user_id column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id            SERIAL PRIMARY KEY,
        user_id       TEXT NOT NULL DEFAULT 'legacy',
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
    // Add user_id to existing table if missing (migration)
    await pool.query(`
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'legacy'
    `);
    // users table — stores device_id + hashed PIN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        device_id  TEXT PRIMARY KEY,
        pin_hash   TEXT NOT NULL,
        createdat  TIMESTAMP DEFAULT NOW()
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

/* ── PIN HELPERS ── */
const hashPIN = (pin) => crypto.createHash('sha256').update(pin + 'voca_salt_2026').digest('hex')

/* ── AUTH MIDDLEWARE ── */
// Reads x-device-id + x-pin-hash headers, sets req.userId or returns 401
async function requireAuth(req, res, next) {
  const deviceId = req.headers['x-device-id']
  const pinHash  = req.headers['x-pin-hash']
  if (!deviceId || !pinHash) return res.status(401).json({ error: 'Missing auth headers' })
  try {
    const r = await pool.query('SELECT pin_hash FROM users WHERE device_id=$1', [deviceId])
    if (r.rows.length === 0) return res.status(401).json({ error: 'Device not registered' })
    if (r.rows[0].pin_hash !== pinHash) return res.status(401).json({ error: 'Wrong PIN' })
    req.userId = deviceId
    next()
  } catch(err) { res.status(500).json({ error: err.message }) }
}

/* ══════════════════════════════════════
   PIN ROUTES
══════════════════════════════════════ */

// Check if device has a PIN set
app.get('/api/auth/status', async (req, res) => {
  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.json({ registered: false })
  try {
    const r = await pool.query('SELECT device_id FROM users WHERE device_id=$1', [deviceId])
    res.json({ registered: r.rows.length > 0 })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// Register a new PIN for a device
app.post('/api/auth/register', async (req, res) => {
  const { deviceId, pin } = req.body
  if (!deviceId || !pin || pin.length !== 4 || !/^\d{4}$/.test(pin))
    return res.status(400).json({ error: 'Invalid PIN — must be 4 digits' })
  try {
    // Check not already registered
    const existing = await pool.query('SELECT device_id FROM users WHERE device_id=$1', [deviceId])
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Device already registered' })
    const pinHash = hashPIN(pin)
    await pool.query('INSERT INTO users (device_id, pin_hash) VALUES ($1,$2)', [deviceId, pinHash])
    res.json({ success: true, pinHash })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// Verify PIN — returns pinHash to store in localStorage
app.post('/api/auth/verify', async (req, res) => {
  const { deviceId, pin } = req.body
  if (!deviceId || !pin) return res.status(400).json({ error: 'Missing fields' })
  try {
    const r = await pool.query('SELECT pin_hash FROM users WHERE device_id=$1', [deviceId])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Device not found' })
    const pinHash = hashPIN(pin)
    if (r.rows[0].pin_hash !== pinHash) return res.status(401).json({ error: 'Wrong PIN' })
    res.json({ success: true, pinHash })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// Change PIN
app.post('/api/auth/change-pin', async (req, res) => {
  const { deviceId, oldPin, newPin } = req.body
  if (!deviceId || !oldPin || !newPin || !/^\d{4}$/.test(newPin))
    return res.status(400).json({ error: 'Invalid request' })
  try {
    const r = await pool.query('SELECT pin_hash FROM users WHERE device_id=$1', [deviceId])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Device not found' })
    if (r.rows[0].pin_hash !== hashPIN(oldPin)) return res.status(401).json({ error: 'Wrong current PIN' })
    await pool.query('UPDATE users SET pin_hash=$1 WHERE device_id=$2', [hashPIN(newPin), deviceId])
    res.json({ success: true, pinHash: hashPIN(newPin) })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

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

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
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
        console.warn(`${model} unavailable, trying next...`);
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

function fallbackSummary(transcription) {
  const words     = transcription.trim().split(/\s+/);
  const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return {
    summary:     sentences.slice(0,2).join('. ').trim() + '.',
    keyPoints:   sentences.slice(0,3).map(s => s.trim()).filter(Boolean),
    actionItems: [],
    mood:        'Casual',
    wordCount:   words.length,
    _fallback:   true,
  };
}

async function summarize(transcription) {
  try { return await summarizeGroq(transcription); }
  catch (err) {
    if (!err.allQuota) throw err;
    console.warn('All Groq models quota-limited, trying Gemini...');
  }
  try { return await summarizeGemini(transcription); }
  catch (err) {
    if (isQuota(err)) { return fallbackSummary(transcription); }
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

app.post('/api/summarize', upload.single('audio'), requireAuth, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file' });
  try {
    const transcription = await transcribeAudio(req.file.path, req.body.language || null);
    if (!transcription?.trim()) return res.status(400).json({ error: 'No speech detected.' });
    const summary = await summarize(transcription);
    const db = await pool.query(
      `INSERT INTO notes (user_id,transcription,summary,keypoints,actionitems,mood,wordcount,language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,createdat`,
      [req.userId, transcription, summary.summary,
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

app.post('/api/summarize-text', requireAuth, async (req, res) => {
  const { transcription, language } = req.body;
  if (!transcription?.trim()) return res.status(400).json({ error: 'No transcription provided' });
  try {
    const summary = await summarize(transcription);
    const db = await pool.query(
      `INSERT INTO notes (user_id,transcription,summary,keypoints,actionitems,mood,wordcount,language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,createdat`,
      [req.userId, transcription, summary.summary,
       JSON.stringify(summary.keyPoints   || []),
       JSON.stringify(summary.actionItems || []),
       summary.mood, summary.wordCount, language || 'en']
    );
    res.json({ success:true, id:db.rows[0].id, timestamp:db.rows[0].createdat, transcription, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id,transcription,summary,keypoints,actionitems,mood,wordcount,language,createdat
       FROM notes WHERE user_id=$1 ORDER BY createdat DESC LIMIT 50`,
      [req.userId]
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

app.delete('/api/notes/:id', requireAuth, async (req,res) => {
  try {
    await pool.query(`DELETE FROM notes WHERE id=$1 AND user_id=$2`, [req.params.id, req.userId]);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/notes', requireAuth, async (req,res) => {
  try {
    await pool.query(`DELETE FROM notes WHERE user_id=$1`, [req.userId]);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/health', async (req,res) => {
  try {
    const r = await pool.query(`SELECT COUNT(*) FROM notes`);
    res.json({ status:'Voca alive', notes:parseInt(r.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/', (req,res) => res.send('Voca Backend running 🚀'));

process.on('unhandledRejection', err => console.error('Unhandled:', err));
process.on('uncaughtException',  err => console.error('Uncaught:',  err));

app.listen(PORT, '0.0.0.0', () => console.log(`Voca server on port ${PORT}`));