'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

const sp = { type: 'spring', stiffness: 340, damping: 30 }

const STEPS = [
  { label: 'Listening to your voice',  color: '#f0765a', icon: '🎙' },
  { label: 'Reading between the lines', color: '#d4922a', icon: '✨' },
  { label: 'Writing your summary',      color: '#6baa7e', icon: '📝' },
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
      setTimeout(() => setStep(2), 6000)
      setTimeout(() => setStep(3), 13000)
    } else setTimeout(() => setStep(0), 400)
  }
  const handleResults = (data) => {
    setResults(data)
    if (data) setNoteCount(n => n + 1)
  }

  return (
    <>
      <style>{`
        /* ═══ APP SHELL ═══ */
        .app {
          min-height: 100vh;
          background: var(--bg);
          display: flex; flex-direction: column;
          font-family: var(--font-body);
          position: relative;
        }

        /* ── Texture overlay ── */
        .app::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(240,118,90,0.06) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(107,170,126,0.07) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(212,146,42,0.04) 0%, transparent 60%);
        }

        /* ═══ NAV ═══ */
        .nav {
          position: sticky; top: 0; z-index: 100;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          background: rgba(253,246,238,0.88);
          backdrop-filter: blur(16px);
          border-bottom: 1.5px solid var(--border2);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
        }
        .nav-logo-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--coral);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          box-shadow: 0 3px 10px rgba(240,118,90,0.35);
          animation: float 3s ease-in-out infinite;
        }
        .nav-logo-text {
          font-family: var(--font-display);
          font-size: 20px; font-weight: 600;
          color: var(--ink); letter-spacing: -.01em;
        }
        .nav-logo-text em {
          font-style: italic; color: var(--coral);
        }
        .nav-ticker {
          flex: 1; overflow: hidden; margin: 0 24px;
          mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
        }
        .nav-ticker-track {
          display: flex; width: max-content;
          animation: marquee 22s linear infinite;
        }
        .nav-ticker-item {
          font-size: 10.5px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--ink3);
          padding: 0 18px; white-space: nowrap;
          display: flex; align-items: center; gap: 10px;
        }
        .nav-ticker-sep {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--coral2);
        }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .nav-hist {
          width: 38px; height: 38px; border-radius: 12px;
          background: var(--card);
          border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer; position: relative;
          transition: all .2s; box-shadow: var(--shadow);
        }
        .nav-hist:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(45,32,22,0.14);
          border-color: rgba(240,118,90,0.3);
        }
        .nav-badge {
          position: absolute; top: -5px; right: -5px;
          width: 17px; height: 17px; border-radius: 50%;
          background: var(--coral); border: 2px solid var(--bg);
          font-size: 7px; font-weight: 800; color: white;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-body);
        }

        /* ═══ MAIN GRID ═══ */
        .main {
          flex: 1; position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr;
          max-width: 480px; width: 100%; margin: 0 auto;
          padding: 24px 16px 72px; gap: 16px;
        }

        /* ═══ HERO CARD ═══ */
        .hero-card {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: var(--r2);
          padding: 24px 22px;
          box-shadow: var(--shadow);
          position: relative; overflow: hidden;
        }
        .hero-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--coral), var(--amber), var(--sage), var(--sky), var(--lilac), var(--coral));
          background-size: 200% 100%;
          animation: gradShift 5s ease infinite;
        }
        .hero-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 11px; border-radius: 99px;
          background: var(--coral-bg);
          border: 1px solid rgba(240,118,90,0.2);
          font-size: 10px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: var(--coral);
          margin-bottom: 12px;
        }
        .hero-chip-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--coral);
          animation: pulse-soft 2s ease-in-out infinite;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 600; line-height: 1.25;
          color: var(--ink); letter-spacing: -.01em;
          margin-bottom: 8px;
        }
        .hero-title em { font-style: italic; color: var(--coral); }
        .hero-sub {
          font-size: 13.5px; color: var(--ink3);
          font-weight: 400; line-height: 1.65;
        }

        /* ═══ SECTION LABEL ═══ */
        .sec-label {
          font-size: 10px; font-weight: 800; letter-spacing: .12em;
          text-transform: uppercase; color: var(--ink4);
          display: flex; align-items: center; gap: 10px;
          padding-left: 2px;
        }
        .sec-label::after {
          content: ''; flex: 1; height: 1.5px;
          background: var(--border2); border-radius: 99px;
        }

        /* ═══ RECORDER CARD ═══ */
        .rec-card {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: var(--r2);
          padding: 28px 22px;
          box-shadow: var(--shadow);
          position: relative; overflow: hidden;
        }

        /* ═══ LOADING CARD ═══ */
        .load-card {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: var(--r2);
          padding: 24px 22px;
          box-shadow: var(--shadow);
        }
        .load-title {
          font-family: var(--font-display);
          font-size: 16px; font-style: italic; font-weight: 600;
          color: var(--ink); margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .load-dots {
          display: flex; gap: 4px; align-items: center;
        }
        .load-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--coral);
          animation: dotBounce 1.4s ease-in-out infinite;
        }
        .load-dot:nth-child(1){animation-delay:.0s}
        .load-dot:nth-child(2){animation-delay:.16s}
        .load-dot:nth-child(3){animation-delay:.32s}

        .lstep {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 14px; margin-bottom: 7px;
          border: 1.5px solid transparent;
          transition: all .3s ease;
          font-size: 13px; font-weight: 600; color: var(--ink3);
        }
        .lstep.active {
          background: var(--card2);
          border-color: var(--border);
          color: var(--ink);
          transform: translateX(3px);
          box-shadow: var(--shadow);
        }
        .lstep.done  { opacity: .35; }
        .lstep.idle  { opacity: .2; }
        .lstep-icon  { font-size: 16px; flex-shrink: 0; }
        .lstep-dot {
          width: 8px; height: 8px; border-radius: 50%;
          flex-shrink: 0; margin-left: auto;
          transition: background .3s;
        }
        .lstep-check { margin-left: auto; color: var(--sage); font-weight: 800; font-size: 12px; }
        .prog {
          height: 3px; background: var(--border2);
          border-radius: 99px; overflow: hidden; position: relative; margin-top: 18px;
        }
        .prog-fill {
          position: absolute; height: 100%; width: 40%; border-radius: 99px;
          background: linear-gradient(90deg, var(--coral), var(--amber), var(--sage));
          animation: worm 2s ease-in-out infinite;
        }

        /* ═══ RESULT AREA ═══ */
        .result-wrap {
          display: flex; flex-direction: column; gap: 12px;
        }
        .result-card {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: var(--r2);
          overflow: hidden;
          box-shadow: var(--shadow);
          position: relative;
        }
        .result-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--coral), var(--amber), var(--sage), var(--sky), var(--lilac), var(--coral));
          background-size: 200% 100%;
          animation: gradShift 5s ease infinite;
        }
        .result-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px 14px;
          border-bottom: 1.5px solid var(--border2);
        }
        .result-head-label {
          display: flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 800; letter-spacing: .12em;
          text-transform: uppercase; color: var(--ink3);
        }
        .result-head-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--sage);
          box-shadow: 0 0 0 3px var(--sage-bg);
        }
        .result-head-btn {
          font-size: 11.5px; font-weight: 700; color: var(--ink3);
          background: var(--bg2); border: 1.5px solid var(--border);
          border-radius: 99px; padding: 4px 14px; cursor: pointer;
          transition: all .18s; font-family: var(--font-body);
        }
        .result-head-btn:hover {
          background: var(--coral-bg); border-color: rgba(240,118,90,0.3);
          color: var(--coral);
        }

        /* ═══ FEATURE TAGS ═══ */
        .tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag {
          font-size: 11.5px; font-weight: 700;
          color: var(--ink3); border: 1.5px solid var(--border);
          border-radius: 99px; padding: 6px 14px;
          background: var(--card);
          transition: all .2s; cursor: default;
          box-shadow: 0 1px 4px rgba(45,32,22,0.05);
        }
        .tag:hover {
          border-color: var(--coral2);
          background: var(--coral-bg);
          color: var(--coral);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(240,118,90,0.15);
        }

        /* ═══ ANOTHER BTN ═══ */
        .another-btn {
          width: 100%; padding: 13px; border-radius: var(--r);
          background: var(--card); border: 1.5px dashed var(--border);
          color: var(--ink3); cursor: pointer;
          font-family: var(--font-body); font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .2s;
        }
        .another-btn:hover {
          border-color: var(--coral2); color: var(--coral);
          background: var(--coral-bg); transform: translateY(-1px);
        }

        /* ═══ DESKTOP ≥ 900px ═══ */
        @media (min-width: 900px) {
          .main {
            max-width: 1080px;
            grid-template-columns: 420px 1fr;
            padding: 36px 48px 72px;
            gap: 24px;
            align-items: start;
          }
          .hero-card { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 40px; }
          .hero-text  { flex: 1; }
          .hero-stats { display: flex !important; }
          .left-col   { grid-column: 1; display: flex; flex-direction: column; gap: 16px; }
          .right-col  { grid-column: 2; display: flex; flex-direction: column; gap: 16px; }
          .mobile-only { display: none !important; }
          .tags { justify-content: flex-start; }
        }

        @media (max-width: 899px) {
          .hero-stats  { display: none; }
          .left-col, .right-col { display: contents; }
          .desktop-only { display: none !important; }
          .tags { justify-content: center; }
        }

        /* ── Desktop stats ── */
        .hero-stats {
          display: none;
          flex-direction: column; align-items: flex-end; gap: 16px; flex-shrink: 0;
        }
        .stat-bubble {
          text-align: right; padding: 12px 18px;
          background: var(--bg2); border: 1.5px solid var(--border);
          border-radius: var(--r); box-shadow: var(--shadow);
        }
        .stat-num {
          font-family: var(--font-display);
          font-size: 26px; font-weight: 600; color: var(--coral);
          font-style: italic; line-height: 1;
        }
        .stat-lbl {
          font-size: 9.5px; font-weight: 800; letter-spacing: .1em;
          text-transform: uppercase; color: var(--ink4); margin-top: 3px;
        }
      `}</style>

      <div className="app">
        {/* ── Nav ── */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="nav-logo-icon">🎙</div>
            <span className="nav-logo-text">Vo<em>ca</em></span>
          </div>

          <div className="nav-ticker">
            <div className="nav-ticker-track">
              {['Record', 'Transcribe', 'Summarise', 'Action Items', 'Private', 'Fast', 'Record', 'Transcribe', 'Summarise', 'Action Items', 'Private', 'Fast'].map((t, i) => (
                <span key={i} className="nav-ticker-item">
                  {t} <span className="nav-ticker-sep" />
                </span>
              ))}
            </div>
          </div>

          <div className="nav-right">
            <motion.button className="nav-hist" onClick={() => setHistoryOpen(true)} whileTap={{ scale: .9 }}>
              📋
              {noteCount > 0 && <span className="nav-badge">{noteCount}</span>}
            </motion.button>
          </div>
        </nav>

        {/* ── Main ── */}
        <div className="main">

          {/* Hero */}
          <motion.div className="hero-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .05 }}>
            <div className="hero-text">
              <div className="hero-chip">
                <span className="hero-chip-dot" />
                {loading ? 'Working on it…' : results ? 'Done!' : 'Voice Journal'}
              </div>
              <h1 className="hero-title">
                {loading
                  ? <>Just a moment,<br /><em>we're on it!</em></>
                  : results
                    ? <>Here's your<br /><em>summary ✨</em></>
                    : <>Speak your mind,<br /><em>we'll sort it out.</em></>
                }
              </h1>
              <p className="hero-sub">
                {loading
                  ? 'AI is reading your voice note carefully.'
                  : results
                    ? 'Your note is summarised below. Review and export!'
                    : 'Record a voice note and get a clean AI summary in seconds.'}
              </p>
            </div>

            {/* Desktop counter */}
            <div className="hero-stats">
              <div className="stat-bubble">
                <div className="stat-num">{noteCount}</div>
                <div className="stat-lbl">Notes today</div>
              </div>
              <div className="stat-bubble" style={{ borderColor: 'rgba(107,170,126,0.3)', background: 'var(--sage-bg)' }}>
                <div className="stat-num" style={{ color: 'var(--sage)', fontSize: 18 }}>AI ✓</div>
                <div className="stat-lbl">Powered</div>
              </div>
            </div>
          </motion.div>

          {/* Left col */}
          <div className="left-col">
            {!results && (
              <>
                <div className="sec-label mobile-only">Record</div>
                <motion.div className="rec-card"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...sp, delay: .1 }}>
                  <Recorder onResults={handleResults} onLoading={handleLoading} />
                </motion.div>
              </>
            )}

            {!hasRecorded && (
              <motion.div
                className="tags"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...sp, delay: .22 }}
              >
                {[
                  ['🎙', 'Record'],
                  ['✍️', 'Transcribe'],
                  ['✨', 'Summarise'],
                  ['✅', 'Actions'],
                  ['🔒', 'Private'],
                ].map(([icon, label]) => (
                  <motion.span key={label} className="tag" whileHover={{ y: -2 }}>
                    {icon} {label}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right col */}
          <div className="right-col">

            {/* Loading */}
            <AnimatePresence>
              {loading && (
                <motion.div className="load-card"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }} transition={sp}
                >
                  <div className="load-title">
                    Analysing your note
                    <div className="load-dots">
                      <div className="load-dot" />
                      <div className="load-dot" />
                      <div className="load-dot" />
                    </div>
                  </div>
                  {STEPS.map(({ label, color, icon }, i) => (
                    <div key={i} className={`lstep ${step === i+1 ? 'active' : step > i+1 ? 'done' : 'idle'}`}>
                      <span className="lstep-icon">{icon}</span>
                      <span>{label}</span>
                      {step === i+1 && (
                        <motion.div className="lstep-dot"
                          style={{ background: color }}
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: .8, repeat: Infinity }}
                        />
                      )}
                      {step > i+1 && <span className="lstep-check">✓</span>}
                    </div>
                  ))}
                  <div className="prog"><div className="prog-fill" /></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {results && !loading && (
                <motion.div className="result-wrap"
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={sp}
                >
                  {/* Desktop: also show recorder */}
                  <div className="desktop-only rec-card" style={{ display: 'none' }}>
                    <Recorder onResults={handleResults} onLoading={handleLoading} />
                  </div>

                  <div className="result-card">
                    <div className="result-head">
                      <span className="result-head-label">
                        <span className="result-head-dot" />
                        Your Summary
                      </span>
                      <button className="result-head-btn" onClick={() => setHistoryOpen(true)}>
                        All notes →
                      </button>
                    </div>
                    <div style={{ padding: '20px 20px 24px' }}>
                      <ResultCard results={results} />
                    </div>
                  </div>

                  <motion.button className="another-btn" whileTap={{ scale: .98 }}
                    onClick={() => { setResults(null); setHasRecorded(false) }}>
                    + Record another note
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