'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

/* ── tiny floating petal component ── */
function Petal({ emoji, style }) {
  return <div className="petal" style={style}>{emoji}</div>
}

const PETALS = ['🌸','🌷','✿','❀','🍃','🌿','💮','🫧']

export default function Home() {
  const [results, setResults]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [step, setStep]               = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [noteCount, setNoteCount]     = useState(0)
  const [petals, setPetals]           = useState([])

  /* generate falling petals once on mount */
  useEffect(() => {
    const items = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: PETALS[i % PETALS.length],
      style: {
        left:             `${Math.random() * 100}%`,
        fontSize:         `${10 + Math.random() * 12}px`,
        animationDuration:`${6 + Math.random() * 10}s`,
        animationDelay:   `${Math.random() * 8}s`,
        opacity:          0,
      },
    }))
    setPetals(items)
  }, [])

  const handleLoading = (v) => {
    setLoading(v)
    if (v) {
      setHasRecorded(true); setStep(1)
      setTimeout(() => setStep(2), 7000)
      setTimeout(() => setStep(3), 14000)
    } else { setTimeout(() => setStep(0), 300) }
  }

  const handleResults = (data) => {
    setResults(data)
    if (data) setNoteCount(n => n + 1)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,600&family=Caveat:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

        /* ── Layout ── */
        .page {
          min-height: 100vh;
          background: #fef6f0;
          font-family: 'Lato', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Watercolour blobs ── */
        .blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(60px);
          animation: blobDrift ease-in-out infinite;
        }
        .blob-rose    { width:420px;height:420px;top:-120px;right:-100px;background:rgba(244,167,185,0.22);animation-duration:14s; }
        .blob-peach   { width:300px;height:300px;bottom:0;left:-80px;background:rgba(249,196,154,0.18);animation-duration:18s;animation-direction:reverse; }
        .blob-sage    { width:260px;height:260px;top:40%;right:-60px;background:rgba(168,197,160,0.15);animation-duration:20s;animation-delay:4s; }
        .blob-lav     { width:200px;height:200px;top:20%;left:5%;background:rgba(196,176,216,0.15);animation-duration:16s;animation-delay:2s; }

        @keyframes blobDrift {
          0%,100% { transform:translate(0,0) scale(1); }
          33%     { transform:translate(-18px,14px) scale(1.04); }
          66%     { transform:translate(12px,-10px) scale(0.96); }
        }

        /* ── Nav ── */
        .nav {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
          background: rgba(254,246,240,0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(244,167,185,0.2);
        }

        /* ── Logo ── */
        .logo-wrap { display:flex; align-items:center; gap:8px; }
        .logo-icon {
          width:34px; height:34px; border-radius:50%;
          background: linear-gradient(135deg,#f4a7b9,#f9c49a);
          display:flex; align-items:center; justify-content:center;
          font-size:16px; box-shadow:0 3px 14px rgba(244,167,185,0.4);
          animation: floatSlow 3s ease-in-out infinite;
        }
        .logo-text {
          font-family:'Playfair Display',serif;
          font-style:italic;
          font-size:22px;
          color:#3d2a1e;
          letter-spacing:-0.01em;
        }
        .logo-text span {
          background: linear-gradient(135deg,#d4728a,#f9c49a);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
        }

        /* ── Notes button ── */
        .notes-btn {
          display:flex; align-items:center; gap:7px;
          padding:8px 18px;
          background:white;
          border:1.5px solid rgba(244,167,185,0.4);
          border-radius:99px;
          font-family:'Lato',sans-serif;
          font-size:13px; font-weight:700;
          color:#d4728a;
          cursor:pointer;
          box-shadow:0 2px 14px rgba(212,114,138,0.12);
          transition:all 0.25s;
          position:relative;
        }
        .notes-btn:hover {
          border-color:#f4a7b9;
          box-shadow:0 5px 22px rgba(212,114,138,0.2);
          transform:translateY(-2px);
        }
        .badge {
          min-width:18px; height:18px; border-radius:99px; padding:0 5px;
          background:linear-gradient(135deg,#d4728a,#f9c49a);
          color:white; font-size:9px; font-weight:800;
          display:inline-flex; align-items:center; justify-content:center;
        }

        /* ── Body ── */
        .body {
          position:relative; z-index:1;
          max-width:540px; margin:0 auto;
          padding:28px 20px 100px;
          display:flex; flex-direction:column; gap:20px;
        }

        /* ── Hero ── */
        .hero { text-align:center; padding:8px 0 6px; }

        .hero-tag {
          display:inline-flex; align-items:center; gap:7px;
          padding:6px 18px; border-radius:99px; margin-bottom:20px;
          background:linear-gradient(135deg,rgba(244,167,185,0.15),rgba(249,196,154,0.15));
          border:1.5px solid rgba(244,167,185,0.35);
          font-family:'Caveat',cursive;
          font-size:15px; font-weight:600; color:#d4728a;
        }

        .hero h1 {
          font-family:'Playfair Display',serif;
          font-size:clamp(32px,9vw,52px);
          font-weight:500;
          line-height:1.15;
          color:#3d2a1e;
          letter-spacing:-0.02em;
          margin-bottom:14px;
        }
        .hero h1 em {
          font-style:italic;
          background:linear-gradient(135deg,#d4728a 0%,#f9c49a 50%,#a8c5a0 100%);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          background-size:200% 100%;
          animation:shimmer 4s linear infinite;
        }
        @keyframes shimmer {
          0%  { background-position:-200% center; }
          100%{ background-position: 200% center; }
        }

        .hero-sub {
          font-size:15px; color:#b08878;
          font-family:'Caveat',cursive;
          font-weight:500; line-height:1.6; margin-bottom:20px;
          letter-spacing:0.01em;
        }

        /* ── Pill tags ── */
        .pills { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
        .pill {
          display:inline-flex; align-items:center; gap:5px;
          padding:6px 16px; border-radius:99px;
          font-family:'Caveat',cursive;
          font-size:14px; font-weight:600;
          cursor:default;
          transition:all 0.2s;
        }
        .pill:hover { transform:translateY(-3px) rotate(-1deg); }
        .pill-rose   { background:#fdeef3; color:#d4728a; border:1.5px solid #fbd5df; }
        .pill-peach  { background:#fef4ec; color:#c47d40; border:1.5px solid #fde8d0; }
        .pill-sage   { background:#eef6ec; color:#5a8a52; border:1.5px solid #d6e9d2; }
        .pill-lav    { background:#f2eef8; color:#7a5c9a; border:1.5px solid #ede5f5; }

        /* ── Journal card ── */
        .journal-card {
          background:white;
          border:1.5px solid rgba(244,167,185,0.25);
          border-radius:28px;
          padding:clamp(24px,5vw,36px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.9) inset,
            0 6px 32px rgba(212,114,138,0.10),
            0 2px 6px rgba(212,114,138,0.06);
          position:relative; overflow:hidden;
        }
        /* coloured top rule */
        .journal-card::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,#f4a7b9,#f9c49a,#a8c5a0,#c4b0d8,#f4a7b9);
          background-size:300% 100%;
          animation:shimmer 5s linear infinite;
        }
        /* subtle ruled lines inside card */
        .journal-card::after {
          content:'';
          position:absolute; inset:0;
          pointer-events:none;
          background-image:repeating-linear-gradient(
            transparent, transparent 31px,
            rgba(244,167,185,0.08) 31px, rgba(244,167,185,0.08) 32px
          );
          border-radius:28px;
        }

        /* ── Loading card ── */
        .load-card {
          background:white;
          border:1.5px solid rgba(244,167,185,0.22);
          border-radius:22px; padding:22px 24px;
          box-shadow:0 4px 22px rgba(212,114,138,0.09);
        }
        .load-label {
          font-family:'Playfair Display',serif;
          font-style:italic;
          font-size:15px; color:#3d2a1e; font-weight:400;
        }
        .step-label {
          font-family:'Caveat',cursive;
          font-size:14px; color:#7a5c4f; font-weight:500;
        }

        /* ── Result card wrapper ── */
        .result-wrap {
          background:white;
          border:1.5px solid rgba(244,167,185,0.22);
          border-radius:24px; padding:24px;
          box-shadow:0 6px 30px rgba(212,114,138,0.10);
          position:relative; overflow:hidden;
        }
        .result-wrap::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,#d4728a,#f9c49a,#a8c5a0);
        }

        /* ── Footer whisper ── */
        .whisper {
          text-align:center;
          font-family:'Caveat',cursive;
          font-size:14px; color:#b08878; font-weight:500;
        }

        @media(min-width:560px){
          .nav  { padding:16px 36px; }
          .body { padding:36px 28px 100px; }
        }
      `}</style>

      <div className="page">
        {/* Watercolour blobs */}
        <div className="blob blob-rose" />
        <div className="blob blob-peach" />
        <div className="blob blob-sage" />
        <div className="blob blob-lav" />

        {/* Falling petals */}
        {petals.map(p => <Petal key={p.id} emoji={p.emoji} style={p.style} />)}

        {/* ── NAV ── */}
        <motion.header className="nav"
          initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5 }}
        >
          <div className="logo-wrap">
            <div className="logo-icon">🎙</div>
            <span className="logo-text">V<span>oca</span></span>
          </div>

          <button className="notes-btn" onClick={() => setHistoryOpen(true)}>
            📖 My Notes
            {noteCount > 0 && (
              <motion.span className="badge"
                initial={{ scale:0 }} animate={{ scale:1 }}
                transition={{ type:'spring', stiffness:500 }}
              >{noteCount}</motion.span>
            )}
          </button>
        </motion.header>

        <div className="body">

          {/* ── HERO ── */}
          <motion.div className="hero"
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.1 }}
          >
            <div className="hero-tag">✨ your little voice journal</div>

            <h1>
              Speak your mind.<br/>
              <em>We'll handle the rest.</em>
            </h1>

            <p className="hero-sub">
              record a thought · get a beautiful summary · keep your day
            </p>

            <div className="pills">
              {[
                ['🎙','Record','pill-rose'],
                ['✍️','Transcribe','pill-peach'],
                ['✨','Summarise','pill-sage'],
                ['✅','Actions','pill-lav'],
              ].map(([icon, label, cls], i) => (
                <motion.span key={label}
                  className={`pill ${cls}`}
                  initial={{ opacity:0, y:10, rotate:-3 }}
                  animate={{ opacity:1, y:0, rotate:0 }}
                  transition={{ delay:0.5 + i*0.09, type:'spring', stiffness:280 }}
                >
                  {icon} {label}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* ── RECORDER CARD ── */}
          <motion.div className="journal-card"
            initial={{ opacity:0, y:24, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            transition={{ duration:0.6, delay:0.25, type:'spring', stiffness:170 }}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* ── LOADING ── */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity:0, y:10, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, scale:0.97 }}
                transition={{ duration:0.3 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  {/* spinning rose loader */}
                  <motion.div
                    animate={{ rotate:360 }}
                    transition={{ duration:1.2, repeat:Infinity, ease:'linear' }}
                    style={{
                      width:18, height:18, borderRadius:'50%',
                      border:'2.5px solid #fbd5df',
                      borderTop:'2.5px solid #d4728a',
                      flexShrink:0,
                    }}
                  />
                  <span className="load-label">Writing your note… 🌸</span>
                </div>

                {[
                  ['🎙','Listening to your voice'],
                  ['🧠','Understanding the meaning'],
                  ['📝','Composing your summary'],
                ].map(([icon, label], i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:10, marginBottom:7,
                    opacity: step===i+1 ? 1 : step>i+1 ? 0.3 : 0.15,
                    transition:'opacity 0.5s',
                  }}>
                    <motion.span
                      animate={step===i+1 ? { scale:[1,1.5,1] } : {}}
                      transition={{ duration:0.7, repeat:Infinity }}
                      style={{ fontSize:14 }}
                    >{icon}</motion.span>
                    <span className="step-label" style={{
                      fontWeight: step===i+1 ? 600 : 500,
                      color: step===i+1 ? '#d4728a' : '#b08878',
                    }}>{label}</span>
                    {step>i+1 && <span style={{ marginLeft:'auto', fontSize:13, color:'#a8c5a0' }}>✓</span>}
                  </div>
                ))}

                {/* progress worm */}
                <div style={{ height:3, background:'#fde8d0', borderRadius:99, marginTop:16, overflow:'hidden', position:'relative' }}>
                  <motion.div
                    style={{ position:'absolute', height:'100%', borderRadius:99, width:'40%',
                      background:'linear-gradient(90deg,#d4728a,#f9c49a)' }}
                    animate={{ left:['-40%','110%'] }}
                    transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RESULTS ── */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-wrap"
                initial={{ opacity:0, y:18, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.45, type:'spring', stiffness:190 }}
              >
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:18, paddingBottom:14,
                  borderBottom:'1.5px solid #fde8d0',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>🌸</span>
                    <span style={{
                      fontFamily:"'Playfair Display',serif",
                      fontStyle:'italic', fontSize:14,
                      color:'#3d2a1e', fontWeight:400,
                    }}>your note summary</span>
                  </div>
                  <button onClick={() => setHistoryOpen(true)} style={{
                    background:'linear-gradient(135deg,rgba(212,114,138,0.08),rgba(249,196,154,0.08))',
                    border:'1.5px solid rgba(212,114,138,0.18)',
                    borderRadius:99, padding:'4px 14px', cursor:'pointer',
                    fontFamily:"'Caveat',cursive", fontSize:13,
                    color:'#d4728a', fontWeight:600,
                  }}>All notes →</button>
                </div>
                <ResultCard results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FOOTER ── */}
          <AnimatePresence>
            {!hasRecorded && (
              <motion.p className="whisper"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ delay:1.4, duration:0.9 }}
              >
                🔒 your recordings are never stored
              </motion.p>
            )}
          </AnimatePresence>

        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}