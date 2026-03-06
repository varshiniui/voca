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

const stagger = { animate: { transition: { staggerChildren: 0.08 } } }
const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
}

function InkUnderline() {
  return (
    <svg viewBox="0 0 300 12" style={{ position:'absolute', bottom:-4, left:0, width:'100%', overflow:'visible', pointerEvents:'none' }}>
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
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>

      {/* Warm glow */}
      <div style={{
        position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: '80vw', height: '50vh', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,130,90,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── NAV ── */}
      <motion.header
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <motion.span
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24, fontWeight: 500, fontStyle: 'italic',
            color: 'var(--plum)', letterSpacing: '0.02em',
          }}
        >
          Voca
        </motion.span>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={() => setHistoryOpen(true)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{
            position: 'relative',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 10, padding: '6px 10px',
            cursor: 'pointer', color: 'var(--text2)',
            display: 'flex', alignItems: 'center', gap: 6,
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
                minWidth: 15, height: 15, borderRadius: 99, padding: '0 3px',
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
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 540, margin: '0 auto',
        padding: 'clamp(16px, 4vw, 40px) clamp(16px, 5vw, 24px) 80px',
      }}>

        {/* Hero */}
        <motion.div variants={stagger} initial="initial" animate="animate"
          style={{ textAlign: 'center', marginBottom: 'clamp(20px, 5vw, 40px)' }}
        >
          <motion.p variants={item} style={{
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--plum-lt)', fontWeight: 600, marginBottom: 12,
          }}>
            Voice · Intelligence · Clarity
          </motion.p>

          <motion.div variants={item} style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(32px, 9vw, 52px)',
              fontWeight: 400, color: 'var(--text)',
              lineHeight: 1.1, letterSpacing: '-0.015em',
            }}>
              Speak your mind.
            </h1>
            <InkUnderline />
          </motion.div>

          <motion.p variants={item} style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(16px, 4vw, 22px)',
            fontWeight: 400, color: 'var(--plum2)',
            fontStyle: 'italic', letterSpacing: '0.01em', marginBottom: 14,
          }}>
            Your words, beautifully organised.
          </motion.p>

          <motion.div variants={item} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {[{ icon: '◎', text: 'Transcribe' }, { icon: '◈', text: 'Summarise' }, { icon: '◇', text: 'Action Items' }].map((f, i) => (
              <motion.span key={f.text}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99,
                  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.6)',
                  fontSize: 11, color: 'var(--text2)', fontWeight: 500,
                }}
              >
                <span style={{ color: 'var(--plum-lt)', fontSize: 9 }}>{f.icon}</span>
                {f.text}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Recorder card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--paper)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 'clamp(20px, 5vw, 36px)',
            marginBottom: 12,
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
                borderRadius: 16, padding: '20px 22px', marginBottom: 12,
                boxShadow: '0 2px 16px rgba(74,45,78,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <motion.div
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--plum)', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Working on your note…</span>
              </div>
              {['Transcribing your voice', 'Understanding your message', 'Organising your insights'].map((label, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7,
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
                  <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: step === i + 1 ? 500 : 400 }}>{label}</span>
                </div>
              ))}
              <div style={{ height: 2, background: 'var(--border)', borderRadius: 99, marginTop: 14, overflow: 'hidden', position: 'relative' }}>
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
                borderRadius: 16, padding: 'clamp(18px, 4vw, 28px)',
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
                marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
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

        {/* Tagline */}
        <AnimatePresence>
          {!hasRecorded && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              style={{
                textAlign: 'center', marginTop: 28,
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 13, fontStyle: 'italic', color: 'var(--border2)', letterSpacing: '0.04em',
              }}
            >
              Your voice, your words — always private.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  )
}