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

/* ── ENSURE UPLOADS FOLDER EXISTS ─────────────────────── */

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ── MIDDLEWARE ───────────────────────────────────────── */

app.use(cors());
app.use(express.json());

/* ── DATABASE SETUP (PostgreSQL) ───────────────────────── */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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

/* ── FILE UPLOAD ───────────────────────────────────────── */

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

/* ── NOTES ROUTES ─────────────────────────────────────── */

app.get('/api/notes', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM notes ORDER BY "createdAt" DESC LIMIT 50`);
    const notes = result.rows.map(n => ({
      ...n,
      keyPoints:   JSON.parse(n.keypoints || '[]'),
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

/* ── SUMMARIZE TEXT ───────────────────────────────────── */

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
        new Date()
      ]
    );

    res.json({ success: true, id: result.rows[0].id, transcription, ...summary });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ── HEALTH ───────────────────────────────────────────── */

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM notes`);
    res.json({
      status: 'Voca alive!',
      notes: result.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ status: "DB Error", error: err.message });
  }
});

/* ── GLOBAL ERROR HANDLER ─────────────────────────────── */

process.on('unhandledRejection', (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on('uncaughtException', (err) => {
  console.error("Uncaught Exception:", err);
});
app.get('/', (req, res) => {
  res.send("Voca Backend is running 🚀");
});
/* ── START SERVER ─────────────────────────────────────── */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Voca backend running on port ${PORT}`);
});