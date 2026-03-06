'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

function HistoryIcon({ hasNotes }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
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
      {/* Inline responsive styles */}
      <style>{`
        .voca-wrap {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          flex-direction: column;
        }
        .voca-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--cream);
          z-index: 20;
        }
        .voca-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 16px 60px;
          gap: 14px;
        }
        .voca-hero {
          text-align: center;
          padding: 8px 0 4px;
        }
        .voca-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 8vw, 48px);
          font-weight: 400;
          color: var(--text);
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }
        .voca-hero p {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(15px, 4vw, 20px);
          color: var(--plum2);
          font-style: italic;
          margin-bottom: 12px;
        }
        .voca-pills {
          display: flex;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .voca-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 11px;
          border-radius: 99px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.7);
          font-size: 11px;
          color: var(--text2);
          font-weight: 500;
        }
        .voca-card {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: clamp(20px, 5vw, 32px);
          box-shadow: 0 2px 20px rgba(74,45,78,0.07);
          position: relative;
          overflow: hidden;
        }
        .voca-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }
        .notes-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: white;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--text2);
          transition: all 0.15s;
        }
        .notes-btn:hover { border-color: var(--plum-lt); color: var(--plum); }
        .result-card {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: clamp(18px, 4vw, 28px);
          box-shadow: 0 2px 20px rgba(74,45,78,0.07);
          position: relative;
          overflow: hidden;
        }
        .result-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }
        .loading-card {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px 22px;
          box-shadow: 0 2px 16px rgba(74,45,78,0.05);
        }
        @media (min-width: 600px) {
          .voca-body { padding: 40px 24px 80px; gap: 16px; }
          .voca-nav { padding: 20px 40px; }
          .voca-hero { padding: 12px 0 8px; }
        }
      `}</style>

      <div className="voca-wrap">

        {/* NAV */}
        <motion.nav className="voca-nav"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        >
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24, fontWeight: 500, fontStyle: 'italic', color: 'var(--plum)',
          }}>Voca</span>

          <button className="notes-btn" onClick={() => setHistoryOpen(true)}>
            <HistoryIcon hasNotes={noteCount > 0} />
            Notes
            {noteCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                style={{
                  minWidth: 16, height: 16, borderRadius: 99, padding: '0 4px',
                  background: 'var(--plum)', color: 'white',
                  fontSize: 9, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >{noteCount}</motion.span>
            )}
          </button>
        </motion.nav>

        {/* BODY */}
        <div className="voca-body">

          {/* Hero */}
          <motion.div className="voca-hero"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1>Speak your mind.</h1>
            <p>Your words, beautifully organised.</p>
            <div className="voca-pills">
              {[['◎','Transcribe'],['◈','Summarise'],['◇','Actions']].map(([icon, label], i) => (
                <motion.span key={label} className="voca-pill"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <span style={{ color: 'var(--plum-lt)', fontSize: 9 }}>{icon}</span>
                  {label}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Recorder */}
          <motion.div className="voca-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div className="loading-card"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
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
                      style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, transition: 'background 0.5s',
                        background: step > i+1 ? 'var(--plum-lt)' : step === i+1 ? 'var(--plum)' : 'var(--border2)',
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
              <motion.div className="result-card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--plum)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                      Note Summary
                    </span>
                  </div>
                  <button onClick={() => setHistoryOpen(true)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontSize: 11, color: 'var(--plum-lt)', fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500, textDecoration: 'underline dotted', textUnderlineOffset: 3,
                  }}>
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