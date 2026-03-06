'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

const sp = { type: 'spring', stiffness: 300, damping: 28 }

const STEPS = [
  ['Transcribing audio',     '#7aab8a'],
  ['Understanding context',  '#d4a853'],
  ['Composing summary',      '#e8714a'],
]

export default function Home() {
  const [results,     setResults]     = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [step,        setStep]        = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [noteCount,   setNoteCount]   = useState(0)

  const handleLoading = (v) => {
    setLoading(v)
    if (v) {
      setHasRecorded(true); setStep(1)
      setTimeout(() => setStep(2), 7000)
      setTimeout(() => setStep(3), 14000)
    } else setTimeout(() => setStep(0), 300)
  }
  const handleResults = (data) => {
    setResults(data)
    if (data) setNoteCount(n => n + 1)
  }

  return (
    <>
      <style>{`
        /* ── App shell ── */
        .app {
          min-height: 100vh;
          background: #0f0e0c;
          display: flex; flex-direction: column;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Top nav ── */
        .nav {
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,14,12,0.95);
          backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 100;
          flex-shrink: 0;
        }
        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 900; font-style: italic;
          color: #f5efe6; letter-spacing: -.02em;
          display: flex; align-items: center; gap: 6px;
        }
        .nav-logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #e8714a;
          box-shadow: 0 0 8px rgba(232,113,74,0.6);
        }
        .nav-ticker {
          flex: 1; overflow: hidden; margin: 0 32px;
          mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
        }
        .nav-ticker-track {
          display: flex; width: max-content;
          animation: marquee 24s linear infinite;
        }
        .nav-ticker-item {
          font-size: 10px; font-weight: 500; letter-spacing: .16em;
          text-transform: uppercase; color: rgba(245,239,230,0.3);
          padding: 0 20px; white-space: nowrap;
          display: flex; align-items: center; gap: 12px;
        }
        .nav-ticker-sep { width: 3px; height: 3px; border-radius: 50%; background: #e8714a; opacity: .6; }
        .nav-hist {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; cursor: pointer; flex-shrink: 0;
          transition: all .2s; position: relative;
        }
        .nav-hist:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .nav-hist-badge {
          position: absolute; top: -5px; right: -5px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #e8714a; border: 1.5px solid #0f0e0c;
          font-size: 7px; font-weight: 700; color: white;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Main content ── */
        .main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr;
          max-width: 520px;
          width: 100%;
          margin: 0 auto;
          padding: 28px 20px 60px;
          gap: 20px;
        }

        /* ── Hero card ── */
        .hero {
          border-radius: 20px;
          padding: 32px 28px;
          position: relative; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          transition: background 0.6s ease;
        }
        .hero-gradient {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 80% 0%, rgba(232,113,74,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 10% 100%, rgba(212,168,83,0.1) 0%, transparent 50%);
        }
        .hero-label {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
          color: rgba(245,239,230,0.4); margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .hero-label-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #e8714a;
        }
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 5vw, 32px);
          font-weight: 900; line-height: 1.15;
          color: #f5efe6; letter-spacing: -.02em;
          margin-bottom: 10px;
          position: relative; z-index: 1;
        }
        .hero-title em { font-style: italic; color: #e8714a; }
        .hero-sub {
          font-size: 13.5px; color: rgba(245,239,230,0.45);
          font-weight: 400; line-height: 1.6;
          position: relative; z-index: 1;
        }

        /* ── Section label ── */
        .sec-label {
          font-size: 9.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
          color: rgba(245,239,230,0.3);
          display: flex; align-items: center; gap: 10px;
        }
        .sec-label::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.06);
        }

        /* ── Recorder card ── */
        .rec-card {
          background: #181714;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 24px;
          position: relative; overflow: hidden;
        }
        .rec-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #e8714a, #d4a853, #7aab8a, #6499b8, #e8714a);
          background-size: 200% 100%;
          animation: gradientShift 4s ease infinite;
        }

        /* ── Loading card ── */
        .load-card {
          background: #181714;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 26px 24px;
        }
        .load-head {
          display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-style: italic; font-weight: 700; color: #f5efe6;
        }
        .spin-ring {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.08);
          border-top: 2px solid #e8714a;
          animation: spin 1s linear infinite; flex-shrink: 0;
        }
        .lstep {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px; margin-bottom: 6px;
          border: 1px solid transparent;
          transition: all .35s ease;
        }
        .lstep.active {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
          transform: translateX(3px);
        }
        .lstep.done  { opacity: .3; }
        .lstep.idle  { opacity: .12; }
        .ldot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ltxt { font-size: 12.5px; font-weight: 500; color: #c8bfb0; }
        .lchk { margin-left: auto; font-size: 11px; font-weight: 700; color: #7aab8a; }
        .prog {
          height: 2px; background: rgba(255,255,255,0.06);
          border-radius: 99px; overflow: hidden; position: relative; margin-top: 18px;
        }
        .prog-fill {
          position: absolute; height: 100%; width: 40%; border-radius: 99px;
          background: linear-gradient(90deg, #e8714a, #d4a853, #7aab8a);
          animation: worm 2s ease-in-out infinite;
        }

        /* ── Result card ── */
        .result-card {
          background: #181714;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
          position: relative;
        }
        .result-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #e8714a, #d4a853, #7aab8a, #6499b8, #e8714a);
          background-size: 200% 100%; animation: gradientShift 4s ease infinite;
        }
        .result-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .result-head-label {
          font-size: 9.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
          color: rgba(245,239,230,0.35);
          display: flex; align-items: center; gap: 8px;
        }
        .result-head-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #7aab8a;
          box-shadow: 0 0 6px rgba(122,171,138,0.5);
        }
        .result-head-btn {
          font-size: 11px; font-weight: 600; color: rgba(245,239,230,0.4);
          background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 99px;
          padding: 4px 12px; cursor: pointer; transition: all .2s;
          font-family: 'DM Sans', sans-serif;
        }
        .result-head-btn:hover { color: #f5efe6; border-color: rgba(255,255,255,0.25); }

        /* ── Another note btn ── */
        .another-btn {
          width: 100%; padding: 14px; border-radius: 14px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(245,239,230,0.5); cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: .04em; transition: all .2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .another-btn:hover { border-color: rgba(255,255,255,0.22); color: #f5efe6; background: rgba(255,255,255,0.04); }

        /* ── Feature tags ── */
        .tags {
          display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
        }
        .tag {
          font-size: 11px; font-weight: 500;
          color: rgba(245,239,230,0.35);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 99px; padding: 6px 14px;
          transition: all .2s; cursor: default;
          background: rgba(255,255,255,0.02);
        }
        .tag:hover { color: rgba(245,239,230,0.7); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); }

        /* ══════════════════════
           DESKTOP ≥ 900px
        ══════════════════════ */
        @media (min-width: 900px) {
          .main {
            max-width: 1100px;
            grid-template-columns: 420px 1fr;
            grid-template-rows: auto;
            gap: 28px;
            padding: 40px 48px 72px;
            align-items: start;
          }
          .hero {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            padding: 36px 40px;
            gap: 40px;
          }
          .hero-text { grid-column: 1; }
          .hero-stats {
            display: flex !important;
            grid-column: 2;
          }
          .left-col {
            grid-column: 1;
            display: flex; flex-direction: column; gap: 20px;
          }
          .right-col {
            grid-column: 2;
            display: flex; flex-direction: column; gap: 20px;
          }
          .mobile-only { display: none !important; }
          .tags { justify-content: flex-start; }
        }

        @media (max-width: 899px) {
          .hero-stats { display: none; }
          .left-col, .right-col { display: contents; }
          .desktop-only { display: none !important; }
        }

        /* ── Hero stats (desktop only) ── */
        .hero-stats {
          display: none;
          flex-direction: column; gap: 12px; flex-shrink: 0;
        }
        .stat-item {
          text-align: right;
        }
        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 900; color: #e8714a;
          line-height: 1;
        }
        .stat-label {
          font-size: 10px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(245,239,230,0.3); margin-top: 2px;
        }
        .stat-divider {
          height: 1px; background: rgba(255,255,255,0.07); margin: 4px 0;
        }

        /* ── Ambient glow on bg ── */
        .glow-blob {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
          filter: blur(80px); opacity: 0.06;
        }
      `}</style>

      {/* Ambient glows */}
      <div className="glow-blob" style={{ width:400, height:400, background:'#e8714a', top:-100, right:-100 }} />
      <div className="glow-blob" style={{ width:300, height:300, background:'#d4a853', bottom:100, left:-80 }} />

      <div className="app">
        {/* ── Nav ── */}
        <nav className="nav">
          <div className="nav-logo">
            <span>Voca</span>
            <span className="nav-logo-dot" />
          </div>

          <div className="nav-ticker">
            <div className="nav-ticker-track">
              {['Record','Transcribe','Summarise','Action Items','Private','Fast','Record','Transcribe','Summarise','Action Items','Private','Fast'].map((t, i) => (
                <span key={i} className="nav-ticker-item">
                  {t}<span className="nav-ticker-sep"/>
                </span>
              ))}
            </div>
          </div>

          <motion.button className="nav-hist" onClick={() => setHistoryOpen(true)} whileTap={{ scale: .9 }}>
            📋
            {noteCount > 0 && <span className="nav-hist-badge">{noteCount}</span>}
          </motion.button>
        </nav>

        {/* ── Main ── */}
        <div className="main" style={{ position: 'relative', zIndex: 1 }}>

          {/* Hero — spans full width on desktop */}
          <motion.div
            className="hero"
            style={{
              background: loading
                ? 'linear-gradient(135deg, #1e1a2e 0%, #181714 100%)'
                : results
                  ? 'linear-gradient(135deg, #141e18 0%, #181714 100%)'
                  : 'linear-gradient(135deg, #1e1710 0%, #181714 100%)',
            }}
            layout transition={sp}
          >
            <div className="hero-gradient" />
            <div className="hero-text">
              <div className="hero-label">
                <span className="hero-label-dot" />
                {loading ? 'Processing' : results ? 'Complete' : 'Voice Journal'}
              </div>
              <h1 className="hero-title">
                {loading
                  ? <>Working on<br/><em>your note…</em></>
                  : results
                    ? <>Your note,<br/><em>summarised.</em></>
                    : <>Speak your mind.<br/><em>We'll handle the rest.</em></>
                }
              </h1>
              <p className="hero-sub">
                {loading
                  ? 'AI is transcribing and analysing your voice note.'
                  : results
                    ? 'Review your summary, key points, and action items below.'
                    : 'Record a voice note and get an instant AI-powered summary.'}
              </p>
            </div>

            {/* Desktop stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-num">{noteCount}</div>
                <div className="stat-label">Notes today</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-num" style={{ color: '#7aab8a', fontSize: 20 }}>AI</div>
                <div className="stat-label">Powered</div>
              </div>
            </div>
          </motion.div>

          {/* Left col (desktop) / natural flow (mobile) */}
          <div className="left-col">

            {/* Recorder */}
            {!results && (
              <>
                <div className="sec-label mobile-only" style={{ display: 'flex' }}>Record</div>
                <div className="rec-card">
                  <Recorder onResults={handleResults} onLoading={handleLoading} />
                </div>
              </>
            )}

            {/* Feature tags */}
            {!hasRecorded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .4, ...sp }}
                className="tags"
              >
                {['🎙 Record','✍️ Transcribe','✨ Summarise','✅ Actions','🔒 Private'].map(t => (
                  <motion.span key={t} className="tag" whileHover={{ y: -1 }}>{t}</motion.span>
                ))}
              </motion.div>
            )}

            {/* Recorder on desktop right side after result */}
            {results && !loading && (
              <div className="desktop-only rec-card" style={{ display: 'none' }}>
                <Recorder onResults={handleResults} onLoading={handleLoading} />
              </div>
            )}
          </div>

          {/* Right col (desktop) / natural flow (mobile) */}
          <div className="right-col">

            {/* Desktop: show recorder here */}
            {!results && (
              <div className="desktop-only">
                <div className="sec-label" style={{ marginBottom: 12 }}>
                  <span>Record a note</span>
                </div>
              </div>
            )}

            {/* Loading */}
            <AnimatePresence>
              {loading && (
                <motion.div className="load-card"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }} transition={sp}
                >
                  <div className="load-head">
                    <div className="spin-ring" />
                    Analysing your note
                  </div>
                  {STEPS.map(([label, col], i) => (
                    <div key={i} className={`lstep ${step === i+1 ? 'active' : step > i+1 ? 'done' : 'idle'}`}>
                      <motion.div className="ldot"
                        style={{ background: step >= i+1 ? col : 'rgba(255,255,255,0.15)' }}
                        animate={step === i+1 ? { scale: [1, 1.6, 1] } : {}}
                        transition={{ duration: .8, repeat: Infinity }}
                      />
                      <span className="ltxt">{label}</span>
                      {step > i+1 && <span className="lchk">✓</span>}
                    </div>
                  ))}
                  <div className="prog"><div className="prog-fill" /></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {results && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={sp}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div className="result-card">
                    <div className="result-head">
                      <span className="result-head-label">
                        <span className="result-head-dot" />
                        Summary
                      </span>
                      <button className="result-head-btn" onClick={() => setHistoryOpen(true)}>
                        All notes →
                      </button>
                    </div>
                    <div style={{ padding: '20px 24px 24px' }}>
                      <ResultCard results={results} />
                    </div>
                  </div>

                  <motion.button className="another-btn" whileTap={{ scale: .98 }}
                    onClick={() => { setResults(null); setHasRecorded(false) }}>
                    ← Record another note
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}