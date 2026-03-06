'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] },
})

const stagger = { animate: { transition: { staggerChildren: 0.1 } } }
const item = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } }
}

function InkUnderline() {
  return (
    <svg viewBox="0 0 300 12" style={{ position:'absolute', bottom:-6, left:0, width:'100%', overflow:'visible', pointerEvents:'none' }}>
      <motion.path
        d="M 0 8 C 50 3, 100 11, 150 7 C 200 3, 250 10, 300 6"
        fill="none" stroke="var(--plum-lt)" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  )
}

// History icon — a small stack of pages
function HistoryIcon({ hasNotes }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9"  x2="8" y2="9"/>
      {hasNotes && <circle cx="19" cy="5" r="4" fill="var(--plum)" stroke="none"/>}
    </svg>
  )
}

export default function Home() {
  const [results, setResults]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [step, setStep]             = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [noteCount, setNoteCount]   = useState(0)

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
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>

      {/* Warm radial glow */}
      <div style={{
        position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: '80vw', height: '50vh', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,130,90,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Paper noise texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
      }} />

      {/* ── NAV ── */}
      <motion.header
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 40px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <motion.span
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26, fontWeight: 500, fontStyle: 'italic',
            color: 'var(--plum)', letterSpacing: '0.02em',
          }}
        >
          Voca
        </motion.span>

        {/* History button */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={() => setHistoryOpen(true)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          title="View saved notes"
          style={{
            position: 'relative',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 10, padding: '7px 9px',
            cursor: 'pointer', color: 'var(--text2)',
            display: 'flex', alignItems: 'center', gap: 7,
            fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 500,
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--plum-lt)'; e.currentTarget.style.color = 'var(--plum)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
        >
          <HistoryIcon hasNotes={noteCount > 0} />
          <span>Notes</span>
          {noteCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              style={{
                minWidth: 16, height: 16, borderRadius: 99, padding: '0 4px',
                background: 'var(--plum)', color: 'white',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {noteCount}
            </motion.span>
          )}
        </motion.button>
      </motion.header>

      {/* ── CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 540, margin: '0 auto', padding: '48px 24px 100px' }}>

        {/* Hero */}
        <motion.div variants={stagger} initial="initial" animate="animate"
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <motion.p variants={item} style={{
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--plum-lt)', fontWeight: 600, marginBottom: 18,
          }}>
            Voice · Intelligence · Clarity
          </motion.p>

          <motion.div variants={item} style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 52, fontWeight: 400, color: 'var(--text)',
              lineHeight: 1.1, letterSpacing: '-0.015em',
            }}>
              Speak your mind.
            </h1>
            <InkUnderline />
          </motion.div>

          <motion.p variants={item} style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22, fontWeight: 400, color: 'var(--plum2)',
            fontStyle: 'italic', letterSpacing: '0.01em', marginBottom: 20,
          }}>
            Your words, beautifully organised.
          </motion.p>

          <motion.div variants={item} style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[{ icon: '◎', text: 'Transcribe' }, { icon: '◈', text: 'Summarise' }, { icon: '◇', text: 'Action Items' }].map((f, i) => (
              <motion.span key={f.text}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 99,
                  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.6)',
                  fontSize: 11, color: 'var(--text2)', fontWeight: 500, letterSpacing: '0.04em',
                }}
              >
                <span style={{ color: 'var(--plum-lt)', fontSize: 10 }}>{f.icon}</span>
                {f.text}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Recorder card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--paper)', border: '1px solid var(--border)',
            borderRadius: 22, padding: '40px 36px', marginBottom: 14,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(74,45,78,0.06)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          }} />
          <Recorder onResults={handleResults} onLoading={handleLoading} />
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              style={{
                background: 'var(--paper)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '24px 28px', marginBottom: 14,
                boxShadow: '0 2px 16px rgba(74,45,78,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <motion.div
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--plum)', flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Working on your note…</span>
              </div>
              {['Transcribing your voice', 'Understanding your message', 'Organising your insights'].map((label, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                  opacity: step === i + 1 ? 1 : step > i + 1 ? 0.3 : 0.18,
                  transition: 'opacity 0.5s',
                }}>
                  <motion.div
                    animate={step === i + 1 ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    style={{
                      width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                      background: step > i + 1 ? 'var(--plum-lt)' : step === i + 1 ? 'var(--plum)' : 'var(--border2)',
                      transition: 'background 0.5s',
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: step === i + 1 ? 500 : 400 }}>{label}</span>
                </div>
              ))}
              <div style={{ height: 2, background: 'var(--border)', borderRadius: 99, marginTop: 16, overflow: 'hidden', position: 'relative' }}>
                <motion.div
                  style={{ position: 'absolute', height: '100%', borderRadius: 99, background: 'var(--plum)', width: '40%' }}
                  animate={{ left: ['-40%', '110%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'var(--paper)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '28px',
                boxShadow: '0 4px 24px rgba(74,45,78,0.07)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
              }} />
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--plum)' }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                    Note Summary
                  </span>
                </div>
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  onClick={() => setHistoryOpen(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: 'var(--plum-lt)', fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500, textDecoration: 'underline', textDecorationStyle: 'dotted',
                    textUnderlineOffset: 3,
                  }}
                >
                  View all notes →
                </motion.button>
              </div>
              <ResultCard results={results} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom tagline */}
        <AnimatePresence>
          {!hasRecorded && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              style={{
                textAlign: 'center', marginTop: 36,
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 13, fontStyle: 'italic', color: 'var(--border2)', letterSpacing: '0.04em',
              }}
            >
              Your voice, your words — always private.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* History panel */}
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  )
}