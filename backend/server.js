// server.js — Voca Backend (PostgreSQL Version)

const express  = require('express');
const multer   = require('multer');
const cors     = require('cors');
const dotenv   = require('dotenv');
const fs       = require('fs');
const path     = require('path');
const { Pool } = require('pg');

dotenv.config();

const { GoogleGenAI } = require('@google/genai');
const Groq            = require('groq-sdk');
const { AssemblyAI }  = require('assemblyai');

const ai       = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq     = new Groq({ apiKey: process.env.GROQ_API_KEY });
const assembly = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── ENSURE UPLOADS FOLDER EXISTS ── */

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

/* ── MIDDLEWARE ── */

app.use(cors());
app.use(express.json());

/* ── DATABASE SETUP ── */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        transcription TEXT NOT NULL,
        summary TEXT,
        keyPoints TEXT,
        actionItems TEXT,
        mood TEXT,
        wordCount INTEGER,
        language TEXT DEFAULT 'en',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database ready");
  } catch (err) {
    console.error("DB Init Error:", err.message);
  }
}

initDB();

/* ── FILE UPLOAD ── */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(webm|wav|mp3|ogg|m4a)$/))
      cb(null, true);
    else cb(new Error('Audio files only'), false);
  },
  limits: { fileSize: 25 * 1024 * 1024 },
});

/* ── GEMINI SUMMARIZE HELPER ── */

async function summarizeWithGemini(transcription) {
  const prompt = `
You are a smart note-taking assistant. Analyse this voice note transcription and return ONLY valid JSON (no markdown, no explanation).

Transcription: "${transcription}"

Return exactly this structure:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "mood": "one word mood/tone e.g. Focused, Reflective, Excited",
  "wordCount": 42
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  let text = response.text.trim();
  // strip markdown code fences if present
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  const parsed = JSON.parse(text);
  parsed.wordCount = parsed.wordCount || transcription.split(/\s+/).length;
  return parsed;
}

/* ── TRANSCRIBE (audio → text) ── */

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const filePath = req.file.path;

  try {
    // Try Groq first (fast), fall back to AssemblyAI
    let transcription = '';

    try {
      const fileStream = fs.createReadStream(filePath);
      const result = await groq.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-large-v3',
        language: req.body.language || undefined,
      });
      transcription = result.text;
    } catch (groqErr) {
      console.warn('Groq failed, trying AssemblyAI:', groqErr.message);
      const transcript = await assembly.transcripts.transcribe({
        audio: filePath,
        language_code: req.body.language || 'en',
      });
      transcription = transcript.text;
    }

    res.json({ success: true, transcription });

  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err.message, details: err.message });
  } finally {
    // clean up uploaded file
    fs.unlink(filePath, () => {});
  }
});

/* ── SUMMARIZE (audio → transcribe → summarize in one shot) ── */

app.post('/api/summarize', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const filePath = req.file.path;

  try {
    // Step 1: Transcribe
    let transcription = '';

    try {
      const fileStream = fs.createReadStream(filePath);
      const result = await groq.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-large-v3',
        language: req.body.language || undefined,
      });
      transcription = result.text;
    } catch (groqErr) {
      console.warn('Groq failed, trying AssemblyAI:', groqErr.message);
      const transcript = await assembly.transcripts.transcribe({
        audio: filePath,
        language_code: req.body.language || 'en',
      });
      transcription = transcript.text;
    }

    if (!transcription?.trim()) {
      return res.status(400).json({ error: 'Could not transcribe audio — was the recording too short?' });
    }

    // Step 2: Summarize
    const summary = await summarizeWithGemini(transcription);

    // Step 3: Save to DB
    const result = await pool.query(
      `INSERT INTO notes 
      (transcription, summary, keyPoints, actionItems, mood, wordCount, language, createdAt)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id`,
      [
        transcription,
        summary.summary,
        JSON.stringify(summary.keyPoints),
        JSON.stringify(summary.actionItems),
        summary.mood,
        summary.wordCount,
        req.body.language || 'en',
        new Date(),
      ]
    );

    res.json({ success: true, id: result.rows[0].id, transcription, ...summary });

  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message, details: err.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
});

/* ── SUMMARIZE TEXT (transcript → summarize) ── */

app.post('/api/summarize-text', async (req, res) => {
  const { transcription, language } = req.body;
  if (!transcription?.trim())
    return res.status(400).json({ error: 'No transcription provided' });

  try {
    const summary = await summarizeWithGemini(transcription);

    const result = await pool.query(
      `INSERT INTO notes 
      (transcription, summary, keyPoints, actionItems, mood, wordCount, language, createdAt)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id`,
      [
        transcription,
        summary.summary,
        JSON.stringify(summary.keyPoints),
        JSON.stringify(summary.actionItems),
        summary.mood,
        summary.wordCount,
        language || 'en',
        new Date(),
      ]
    );

    res.json({ success: true, id: result.rows[0].id, transcription, ...summary });

  } catch (err) {
    console.error('Summarize-text error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ── NOTES ROUTES ── */

app.get('/api/notes', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM notes ORDER BY "createdAt" DESC LIMIT 50`);
    const notes = result.rows.map(n => ({
      ...n,
      keyPoints:   JSON.parse(n.keypoints   || '[]'),
      actionItems: JSON.parse(n.actionitems || '[]'),
    }));
    res.json({ success: true, notes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM notes WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/notes', async (req, res) => {
  try {
    await pool.query(`DELETE FROM notes`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── HEALTH ── */

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM notes`);
    res.json({ status: 'Voca alive!', notes: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ status: 'DB Error', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Voca Backend is running 🚀');
});

/* ── ERROR HANDLERS ── */

process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err));
process.on('uncaughtException',  err => console.error('Uncaught Exception:', err));

/* ── START ── */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Voca backend running on port ${PORT}`);
});