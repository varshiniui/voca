'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

function HistoryIcon({ hasNotes }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      {hasNotes && <circle cx="19" cy="5" r="4" fill="var(--plum)" stroke="none"/>}
    </svg>
  )
}

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
      setHasRecorded(true)
      setStep(1)
      setTimeout(() => setStep(2), 7000)
      setTimeout(() => setStep(3), 14000)
    } else {
      setTimeout(() => setStep(0), 300)
    }
  }

  const handleResults = (data) => {
    setResults(data)
    if (data) setNoteCount(n => n + 1)
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .page {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          flex-direction: column;
        }

        /* ── NAV ── */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--cream);
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-style: italic;
          font-weight: 500;
          color: var(--plum);
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: white;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--text2);
          cursor: pointer;
          transition: all 0.15s;
        }
        .nav-btn:hover { border-color: var(--plum-lt); color: var(--plum); }
        .badge {
          min-width: 15px;
          height: 15px;
          border-radius: 99px;
          padding: 0 4px;
          background: var(--plum);
          color: white;
          font-size: 9px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* ── HERO STRIP ── */
        .hero-strip {
          background: var(--plum);
          padding: 28px 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .hero-strip::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .hero-eyebrow {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--plum-lt);
          font-weight: 600;
        }
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(30px, 8vw, 44px);
          font-weight: 400;
          color: white;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .hero-sub {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(14px, 3.5vw, 18px);
          color: rgba(255,255,255,0.6);
          font-style: italic;
        }
        .hero-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 4px;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          font-size: 10px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
          letter-spacing: 0.03em;
        }

        /* ── BODY ── */
        .body {
          flex: 1;
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
          padding: 20px 16px 60px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ── RECORDER CARD ── */
        .rec-card {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 24px 20px;
          box-shadow: 0 2px 16px rgba(74,45,78,0.07);
          position: relative;
          overflow: hidden;
        }
        .rec-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }

        /* ── LOADING CARD ── */
        .load-card {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
        }

        /* ── RESULT CARD ── */
        .result-wrap {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 2px 16px rgba(74,45,78,0.07);
          position: relative;
          overflow: hidden;
        }
        .result-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }
        .result-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
        }
        .result-head-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .result-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--plum);
        }
        .result-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .view-all-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 11px;
          color: var(--plum-lt);
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          text-decoration: underline dotted;
          text-underline-offset: 3px;
          padding: 0;
        }

        @media (min-width: 600px) {
          .nav { padding: 18px 36px; }
          .hero-strip { padding: 36px 24px 30px; }
          .body { padding: 28px 24px 80px; }
          .rec-card { padding: 32px 28px; }
        }
      `}</style>

      <div className="page">

        {/* NAV */}
        <motion.header className="nav"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        >
          <span className="nav-logo">Voca</span>
          <button className="nav-btn" onClick={() => setHistoryOpen(true)}>
            <HistoryIcon hasNotes={noteCount > 0} />
            Notes
            {noteCount > 0 && <span className="badge">{noteCount}</span>}
          </button>
        </motion.header>

        {/* HERO STRIP */}
        <motion.div className="hero-strip"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="hero-eyebrow">Voice · AI · Clarity</p>
          <h1 className="hero-title">Speak your mind.</h1>
          <p className="hero-sub">Your words, beautifully organised.</p>
          <div className="hero-pills">
            {[['◎','Transcribe'],['◈','Summarise'],['◇','Actions']].map(([icon, label], i) => (
              <motion.span key={label} className="hero-pill"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                <span style={{ color: 'var(--plum-lt)', opacity: 0.8 }}>{icon}</span>
                {label}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* BODY */}
        <div className="body">

          {/* Recorder */}
          <motion.div className="rec-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <motion.div
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--plum)', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Working on your note…</span>
                </div>
                {['Transcribing your voice','Understanding your message','Organising your insights'].map((label, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6,
                    opacity: step === i+1 ? 1 : step > i+1 ? 0.3 : 0.15,
                    transition: 'opacity 0.5s',
                  }}>
                    <motion.div
                      animate={step === i+1 ? { scale: [1,1.6,1] } : {}}
                      transition={{ duration: 0.7, repeat: Infinity }}
                      style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: step > i+1 ? 'var(--plum-lt)' : step === i+1 ? 'var(--plum)' : 'var(--border2)',
                        transition: 'background 0.5s',
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: step === i+1 ? 500 : 400 }}>{label}</span>
                  </div>
                ))}
                <div style={{ height: 2, background: 'var(--border)', borderRadius: 99, marginTop: 12, overflow: 'hidden', position: 'relative' }}>
                  <motion.div
                    style={{ position: 'absolute', height: '100%', borderRadius: 99, background: 'var(--plum)', width: '40%' }}
                    animate={{ left: ['-40%','110%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-wrap"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.16,1,0.3,1] }}
              >
                <div className="result-head">
                  <div className="result-head-left">
                    <div className="result-dot" />
                    <span className="result-label">Note Summary</span>
                  </div>
                  <button className="view-all-btn" onClick={() => setHistoryOpen(true)}>
                    View all →
                  </button>
                </div>
                <ResultCard results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tagline */}
          <AnimatePresence>
            {!hasRecorded && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                style={{
                  textAlign: 'center', marginTop: 4,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 13, fontStyle: 'italic', color: 'var(--border2)',
                }}
              >
                Your voice, your words — always private.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}
