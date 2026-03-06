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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const assembly = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

  // fixes ECONNRESET with Railway
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000
});

pool.on("error", (err) => {
  console.error("Unexpected DB error:", err);
});

/* =========================
   INIT DATABASE
========================= */

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
    console.error("Database init error:", err);
  }
}

initDB();

/* =========================
   FILE UPLOAD
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

/* =========================
   GEMINI SUMMARIZER
========================= */

async function summarizeWithGemini(transcription) {

  const prompt = `
Analyze this voice note transcription and return JSON.

${transcription}

Return format:

{
 "summary":"short summary",
 "keyPoints":["point1","point2"],
 "actionItems":["task1","task2"],
 "mood":"one word mood",
 "wordCount":0
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt
  });

  let text = response.text.trim();

  // remove markdown formatting if Gemini adds it
  text = text
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "");

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (err) {

    parsed = {
      summary: text,
      keyPoints: [],
      actionItems: [],
      mood: "unknown"
    };

  }

  parsed.wordCount =
    parsed.wordCount || transcription.split(/\s+/).length;

  return parsed;
}

/* =========================
   TRANSCRIBE
========================= */

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {

  if (!req.file)
    return res.status(400).json({ error: "No audio file" });

  const filePath = req.file.path;

  try {

    let transcription = "";

    try {

      const fileStream = fs.createReadStream(filePath);

      const result = await groq.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-large-v3"
      });

      transcription = result.text;

    } catch (err) {

      const transcript = await assembly.transcripts.transcribe({
        audio: filePath
      });

      transcription = transcript.text;
    }

    res.json({ success: true, transcription });

  } catch (err) {

    res.status(500).json({ error: err.message });

  } finally {

    fs.unlink(filePath, () => {});
  }
});

/* =========================
   SUMMARIZE
========================= */

app.post("/api/summarize", upload.single("audio"), async (req, res) => {

  if (!req.file)
    return res.status(400).json({ error: "No audio file" });

  const filePath = req.file.path;

  try {

    let transcription = "";

    try {

      const fileStream = fs.createReadStream(filePath);

      const result = await groq.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-large-v3"
      });

      transcription = result.text;

    } catch (err) {

      const transcript = await assembly.transcripts.transcribe({
        audio: filePath
      });

      transcription = transcript.text;
    }

    const summary = await summarizeWithGemini(transcription);

    const db = await pool.query(
      `INSERT INTO notes
      (transcription,summary,keyPoints,actionItems,mood,wordCount)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id`,
      [
        transcription,
        summary.summary,
        JSON.stringify(summary.keyPoints),
        JSON.stringify(summary.actionItems),
        summary.mood,
        summary.wordCount
      ]
    );

    res.json({
      success: true,
      id: db.rows[0].id,
      transcription,
      ...summary
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  } finally {

    fs.unlink(filePath, () => {});
  }
});

/* =========================
   GET NOTES
========================= */

app.get("/api/notes", async (req, res) => {

  try {

    const result = await pool.query(
      `SELECT * FROM notes ORDER BY "createdAt" DESC LIMIT 50`
    );

    const notes = result.rows.map(n => ({

      ...n,

      keyPoints: JSON.parse(n.keypoints || "[]"),

      actionItems: JSON.parse(n.actionitems || "[]")

    }));

    res.json({ success: true, notes });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", async (req, res) => {

  try {

    const result = await pool.query(`SELECT COUNT(*) FROM notes`);

    res.json({
      status: "Voca alive",
      notes: result.rows[0].count
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {

  console.log(`Server running on ${PORT}`);

});