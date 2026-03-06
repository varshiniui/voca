'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

/* Spring presets */
const spring = { type: 'spring', stiffness: 260, damping: 22 }
const springFast = { type: 'spring', stiffness: 380, damping: 28 }

export default function Home() {
  const [results, setResults]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [step, setStep]               = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [noteCount, setNoteCount]     = useState(0)

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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

        .page {
          min-height: 100vh;
          background: #f7f3ff;
          font-family: 'Syne', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Big bold background blobs — one per brand colour ── */
        .blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(80px);
        }
        .blob-a { width:500px;height:500px;top:-160px;right:-140px;  background:#ffe566;opacity:0.22; }
        .blob-b { width:400px;height:400px;bottom:-80px;left:-120px; background:#6edfc8;opacity:0.18; }
        .blob-c { width:320px;height:320px;top:38%;left:55%;          background:#ff7b6b;opacity:0.13; }
        .blob-d { width:280px;height:280px;top:12%;left:-60px;        background:#c9b8ff;opacity:0.20; }

        /* ── Marquee ticker ── */
        .ticker-wrap {
          overflow: hidden;
          border-top: 2px solid #1a1028;
          border-bottom: 2px solid #1a1028;
          background: #1a1028;
          padding: 10px 0;
          position: relative;
          z-index: 2;
        }
        .ticker-inner {
          display: flex;
          width: max-content;
          animation: marquee 18s linear infinite;
        }
        .ticker-item {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #f7f3ff;
          padding: 0 32px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ticker-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        /* ── Nav ── */
        .nav {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 28px;
          background: rgba(247,243,255,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 2px solid #1a1028;
        }

        .logo {
          font-family: 'Instrument Serif', serif;
          font-style: italic;
          font-size: 26px;
          color: #1a1028;
          letter-spacing: -0.02em;
        }
        .logo b {
          font-style: normal;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          background: #ffe566;
          padding: 1px 6px;
          border-radius: 6px;
          color: #1a1028;
          font-size: 14px;
          vertical-align: middle;
          margin-left: 6px;
          letter-spacing: 0.04em;
        }

        .nav-right { display: flex; align-items: center; gap: 12px; }

        .notes-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 20px;
          background: #1a1028;
          border: 2px solid #1a1028;
          border-radius: 99px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          color: #f7f3ff;
          cursor: pointer;
          transition: all 0.18s;
          letter-spacing: 0.02em;
        }
        .notes-btn:hover {
          background: #ffe566;
          color: #1a1028;
          border-color: #1a1028;
          transform: translateY(-2px);
          box-shadow: 3px 3px 0 #1a1028;
        }
        .badge {
          min-width: 18px; height: 18px;
          border-radius: 99px; padding: 0 5px;
          background: #ff7b6b;
          color: white; font-size: 9px; font-weight: 800;
          display: inline-flex; align-items: center; justify-content: center;
        }

        /* ── Body ── */
        .body {
          position: relative; z-index: 1;
          max-width: 560px; margin: 0 auto;
          padding: 40px 22px 100px;
          display: flex; flex-direction: column; gap: 20px;
        }

        /* ── Hero ── */
        .hero { text-align: center; padding: 4px 0 8px; }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 18px;
          background: #ffe566;
          border: 2px solid #1a1028;
          border-radius: 99px;
          margin-bottom: 22px;
          font-size: 11px; font-weight: 800;
          color: #1a1028;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          box-shadow: 3px 3px 0 #1a1028;
        }

        .hero h1 {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(38px, 10vw, 58px);
          font-weight: 400;
          line-height: 1.12;
          color: #1a1028;
          letter-spacing: -0.025em;
          margin-bottom: 16px;
        }
        .hero h1 em {
          font-style: italic;
          color: #7c5cbf;
        }

        .hero-sub {
          font-size: 14px;
          color: #4a3f60;
          font-weight: 500;
          line-height: 1.7;
          margin-bottom: 24px;
          letter-spacing: 0.01em;
        }

        /* ── Feature pills ── */
        .pills { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 16px;
          border: 2px solid #1a1028;
          border-radius: 99px;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.04em;
          cursor: default;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .pill:hover {
          transform: translateY(-3px);
          box-shadow: 3px 3px 0 #1a1028;
        }
        .pill-a { background: #ffe4e0; color: #1a1028; }
        .pill-b { background: #fff9d6; color: #1a1028; }
        .pill-c { background: #d6f5ef; color: #1a1028; }
        .pill-d { background: #ede8ff; color: #1a1028; }

        /* ── Main recorder card ── */
        .rec-card {
          background: white;
          border: 2px solid #1a1028;
          border-radius: 28px;
          padding: clamp(26px,5vw,38px);
          box-shadow: 6px 6px 0 #1a1028;
          position: relative; overflow: hidden;
        }
        /* thick colour stripe top */
        .rec-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg, #ff7b6b, #ffe566, #6edfc8, #c9b8ff, #ff7b6b);
          background-size: 300% 100%;
          animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 300% center; }
        }

        /* ── Loading card ── */
        .load-card {
          background: white;
          border: 2px solid #1a1028;
          border-radius: 22px;
          padding: 24px 26px;
          box-shadow: 4px 4px 0 #1a1028;
        }

        /* ── Result wrapper ── */
        .result-wrap {
          background: white;
          border: 2px solid #1a1028;
          border-radius: 24px;
          padding: 26px;
          box-shadow: 5px 5px 0 #1a1028;
          position: relative; overflow: hidden;
        }
        .result-wrap::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #ff7b6b, #ffe566, #6edfc8, #c9b8ff);
        }

        /* ── Footer ── */
        .footer-note {
          text-align: center;
          font-size: 12px;
          color: #9585b0;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        @media(min-width:560px){
          .nav  { padding: 18px 40px; }
          .body { padding: 44px 32px 100px; }
        }
      `}</style>

      <div className="page">
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
        <div className="blob blob-d" />

        {/* ── TICKER ── */}
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {[...Array(2)].map((_, rep) =>
              ['Record your thought', 'Transcribe instantly', 'Smart summary', 'Action items', 'Multi-language'].map((t, i) => (
                <span key={`${rep}-${i}`} className="ticker-item">
                  {t}
                  <span className="ticker-dot" style={{
                    background: ['#ffe566','#6edfc8','#ff7b6b','#c9b8ff','#74c7f5'][i]
                  }} />
                </span>
              ))
            )}
          </div>
        </div>

        {/* ── NAV ── */}
        <motion.header className="nav"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="logo">
            Voca <b>AI</b>
          </span>

          <div className="nav-right">
            <motion.button
              className="notes-btn"
              onClick={() => setHistoryOpen(true)}
              whileTap={{ scale: 0.95 }}
            >
              My Notes
              {noteCount > 0 && (
                <motion.span className="badge"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={springFast}
                >{noteCount}</motion.span>
              )}
            </motion.button>
          </div>
        </motion.header>

        <div className="body">

          {/* ── HERO ── */}
          <motion.div className="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            <div className="hero-eyebrow">
              <span style={{ width:7,height:7,borderRadius:'50%',background:'#ff7b6b',display:'inline-block' }}/>
              AI-powered voice notes
            </div>

            <h1>
              Speak your mind.<br />
              <em>We'll handle the rest.</em>
            </h1>

            <p className="hero-sub">
              Record · Transcribe · Summarise · Done.
            </p>

            <div className="pills">
              {[
                ['Record',     'pill-a'],
                ['Transcribe', 'pill-b'],
                ['Summarise',  'pill-c'],
                ['Actions',    'pill-d'],
              ].map(([label, cls], i) => (
                <motion.span key={label}
                  className={`pill ${cls}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.08, ...spring }}
                >
                  {label}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* ── RECORDER CARD ── */}
          <motion.div
            className="rec-card"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.22, ...spring }}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* ── LOADING ── */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2.5px solid #ede8ff',
                      borderTop: '2.5px solid #7c5cbf',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:'#1a1028' }}>
                    Working on it…
                  </span>
                </div>

                {[
                  ['Transcribing your voice',   '#ffe4e0', '#ff7b6b'],
                  ['Understanding your message','#fff9d6', '#c49a00'],
                  ['Writing your summary',      '#d6f5ef', '#2a9d8f'],
                ].map(([label, bg, col], i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:10, marginBottom:8,
                    opacity: step === i+1 ? 1 : step > i+1 ? 0.35 : 0.18,
                    transition: 'opacity 0.4s',
                  }}>
                    <div style={{
                      width:8, height:8, borderRadius:'50%', flexShrink:0,
                      background: step > i+1 ? col : step === i+1 ? col : '#e8e0f5',
                      transition: 'background 0.4s',
                    }}/>
                    <span style={{
                      fontFamily:"'Syne',sans-serif",
                      fontSize:13, fontWeight: step === i+1 ? 700 : 500,
                      color: step === i+1 ? '#1a1028' : '#9585b0',
                    }}>{label}</span>
                    {step > i+1 && (
                      <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'#2a9d8f' }}>done</span>
                    )}
                  </div>
                ))}

                <div style={{ height:4, background:'#ede8ff', borderRadius:99, marginTop:18, overflow:'hidden', position:'relative' }}>
                  <motion.div
                    style={{
                      position:'absolute', height:'100%', borderRadius:99, width:'40%',
                      background:'linear-gradient(90deg,#c9b8ff,#ff7b6b)',
                    }}
                    animate={{ left:['-40%','110%'] }}
                    transition={{ duration:1.7, repeat:Infinity, ease:'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RESULTS ── */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-wrap"
                initial={{ opacity:0, y:20, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.4, ...spring }}
              >
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:20, paddingBottom:16,
                  borderBottom:'2px solid #1a1028',
                }}>
                  <span style={{
                    fontFamily:"'Syne',sans-serif",
                    fontWeight:800, fontSize:12,
                    letterSpacing:'0.1em', textTransform:'uppercase',
                    color:'#1a1028',
                  }}>
                    Note Summary
                  </span>
                  <button onClick={() => setHistoryOpen(true)} style={{
                    background:'#ffe566',
                    border:'2px solid #1a1028',
                    borderRadius:99,
                    padding:'4px 14px',
                    cursor:'pointer',
                    fontFamily:"'Syne',sans-serif",
                    fontSize:12, fontWeight:700,
                    color:'#1a1028',
                    boxShadow:'2px 2px 0 #1a1028',
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
                  >
                    All notes →
                  </button>
                </div>
                <ResultCard results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FOOTER ── */}
          <AnimatePresence>
            {!hasRecorded && (
              <motion.p className="footer-note"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ delay:1.3, duration:0.8 }}
              >
                Your recordings are never stored
              </motion.p>
            )}
          </AnimatePresence>

        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}