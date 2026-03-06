'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

const sp = { type: 'spring', stiffness: 300, damping: 26 }

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

  const greetBg    = loading ? '#c9a7ff' : results ? '#85e89d' : '#ffd166'
  const greetBlob  = loading ? '#ffadd2' : results ? '#74c7f5' : '#ff8c69'

  return (
    <>
      <style>{`
        .page {
          max-width: 430px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #faf5eb;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Banner ── */
        .banner { overflow: hidden; background: #1a0f2e; padding: 9px 0 0; flex-shrink: 0; position: relative; }
        .banner::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(201,167,255,0.08) 50%, transparent 100%);
          pointer-events: none;
        }
        .b-track { display: flex; width: max-content; animation: marquee 22s linear infinite; }
        .b-item {
          font-family: 'Unbounded', sans-serif;
          font-size: 8.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
          color: #faf5eb; padding: 0 20px;
          display: flex; align-items: center; gap: 10px; white-space: nowrap;
        }
        .b-dot { width: 4px; height: 4px; border-radius: 50%; background: #c9a7ff; flex-shrink: 0; }
        .b-wave { display: block; width: 100%; height: 18px; }

        /* ── Top nav ── */
        .topnav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px 10px;
        }
        .logo {
          font-family: 'Unbounded', sans-serif;
          font-size: 22px; font-weight: 900; color: #1a0f2e;
          letter-spacing: -.04em;
          display: flex; align-items: center;
          filter: drop-shadow(2px 2px 0 rgba(26,15,46,0.12));
        }
        .logo-o {
          display: inline-block; width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #ff8c69, #ffd166);
          border: 2.5px solid #1a0f2e;
          box-shadow: 2px 2px 0 #1a0f2e;
          vertical-align: middle; margin: -2px -1px 0;
          transition: transform 0.3s ease;
        }
        .logo:hover .logo-o { transform: rotate(180deg) scale(1.1); }

        .hist-btn {
          width: 42px; height: 42px; border-radius: 14px;
          background: white;
          border: 2.5px solid #1a0f2e;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; cursor: pointer;
          box-shadow: 3px 3px 0 #1a0f2e;
          transition: all .15s;
          position: relative;
        }
        .hist-btn:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #1a0f2e; }
        .hist-btn:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a0f2e; }
        .hist-badge {
          position: absolute; top: -6px; right: -6px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #ff8c69; border: 2px solid #1a0f2e;
          font-family: 'Unbounded', sans-serif; font-size: 7px; font-weight: 900;
          color: white; display: flex; align-items: center; justify-content: center;
          box-shadow: 1px 1px 0 #1a0f2e;
        }

        /* ── Scroll body ── */
        .scroll {
          flex: 1; overflow-y: auto;
          padding: 2px 18px 48px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .scroll::-webkit-scrollbar { display: none; }

        /* ── Greeting card ── */
        .greet {
          border: 2.5px solid #1a0f2e;
          border-radius: 26px;
          padding: 22px 24px;
          position: relative; overflow: hidden;
          transition: background 0.5s ease;
          transform-style: preserve-3d;
        }
        .greet-inner { position: relative; z-index: 2; }
        .greet-blob {
          position: absolute; right: -28px; top: -28px;
          width: 130px; height: 130px; border-radius: 50%;
          opacity: .25; animation: blob 6s ease-in-out infinite;
          transition: background 0.5s;
        }
        .greet-blob2 {
          position: absolute; left: -20px; bottom: -28px;
          width: 90px; height: 90px; border-radius: 50%;
          opacity: .1; background: #1a0f2e;
          animation: blob 8s ease-in-out infinite reverse;
        }
        .greet-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: #1a0f2e; color: #faf5eb;
          border-radius: 99px; padding: 5px 14px;
          font-family: 'Unbounded', sans-serif;
          font-size: 7.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          margin-bottom: 12px;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
        }
        .greet-title {
          font-family: 'Unbounded', sans-serif;
          font-size: 21px; font-weight: 900; color: #1a0f2e;
          line-height: 1.18; letter-spacing: -.03em; margin-bottom: 7px;
          text-shadow: 1px 1px 0 rgba(255,255,255,0.3);
        }
        .greet-sub { font-size: 13px; color: #3d2f5a; font-weight: 400; line-height: 1.5; }

        /* ── Section label ── */
        .slbl {
          font-family: 'Unbounded', sans-serif;
          font-size: 9.5px; font-weight: 700; color: #8070a0;
          letter-spacing: .1em; text-transform: uppercase;
          padding: 0 2px; display: flex; align-items: center; gap: 8px;
        }
        .slbl::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, #e8dff8, transparent);
        }

        /* ── Mic card ── */
        .mic-card {
          background: white;
          border: 2.5px solid #1a0f2e;
          border-radius: 28px;
          padding: 24px 22px;
          display: flex; flex-direction: column; align-items: center; gap: 20px;
          position: relative; overflow: hidden;
          box-shadow: 5px 5px 0 #1a0f2e;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .mic-card:hover {
          transform: translate(-1px, -1px);
          box-shadow: 6px 6px 0 #1a0f2e;
        }
        .mic-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg, #ff8c69, #ffd166, #85e89d, #74c7f5, #c9a7ff, #ffadd2);
          background-size: 200% 100%;
          animation: gradientShift 3s ease infinite;
        }
        .mic-card::after {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          background: radial-gradient(ellipse at 80% 20%, rgba(201,167,255,.06) 0%, transparent 60%);
          pointer-events: none;
        }

        /* ── Loading card ── */
        .load-card {
          background: white; border: 2.5px solid #1a0f2e;
          border-radius: 24px; padding: 22px;
          box-shadow: 5px 5px 0 #1a0f2e;
          animation: slideIn 0.35s ease both;
        }
        .load-head {
          display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
          font-family: 'Unbounded', sans-serif; font-size: 12px; font-weight: 700; color: #1a0f2e;
        }
        .spin-ring {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2.5px solid #ede5ff; border-top: 2.5px solid #c9a7ff;
          animation: spin 1s linear infinite; flex-shrink: 0;
        }
        .lstep {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 14px; margin-bottom: 8px;
          transition: all .35s ease; border: 1.5px solid transparent;
        }
        .lstep.active {
          background: #faf5eb; border-color: #1a0f2e;
          box-shadow: 2px 2px 0 #1a0f2e;
          transform: translateX(2px);
        }
        .lstep.done { opacity: .35; }
        .lstep.idle { opacity: .15; }
        .ldot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; transition: background .3s; }
        .ltxt { font-size: 12.5px; font-weight: 500; color: #1a0f2e; }
        .lchk { margin-left: auto; font-size: 12px; font-weight: 800; color: #85e89d; }
        .prog {
          height: 7px; background: #ede5ff; border-radius: 99px;
          overflow: hidden; position: relative; margin-top: 16px;
          border: 1px solid #d8c8f0;
        }
        .prog-worm {
          position: absolute; height: 100%; width: 40%; border-radius: 99px;
          background: linear-gradient(90deg, #c9a7ff, #ff8c69, #85e89d, #ffd166);
          background-size: 200% 100%;
          animation: worm 1.8s ease-in-out infinite, gradientShift 2s ease infinite;
        }

        /* ── Result wrapper ── */
        .res-wrap {
          background: white; border: 2.5px solid #1a0f2e;
          border-radius: 26px; overflow: hidden;
          box-shadow: 5px 5px 0 #1a0f2e;
          position: relative;
          animation: slideIn 0.4s ease both;
        }
        .res-wrap::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg,#ff8c69,#ffd166,#85e89d,#74c7f5,#c9a7ff,#ffadd2);
          background-size: 200% 100%;
          animation: gradientShift 3s ease infinite;
        }
        .res-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px 14px;
          border-bottom: 2px solid rgba(26,15,46,.06);
        }
        .res-title {
          font-family: 'Unbounded', sans-serif;
          font-size: 10px; font-weight: 700; color: #1a0f2e;
          letter-spacing: .1em; text-transform: uppercase;
          display: flex; align-items: center; gap: 7px;
        }
        .res-title-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #85e89d, #74c7f5);
          border: 1.5px solid #1a0f2e;
          box-shadow: 1px 1px 0 #1a0f2e;
        }
        .res-btn {
          background: #ffd166; border: 2px solid #1a0f2e;
          border-radius: 99px; padding: 5px 14px;
          font-family: 'Unbounded', sans-serif; font-size: 8px; font-weight: 700; color: #1a0f2e;
          box-shadow: 2px 2px 0 #1a0f2e; cursor: pointer; transition: all .14s;
        }
        .res-btn:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a0f2e; }
        .res-btn:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a0f2e; }
        .res-body { padding: 18px 22px 22px; }

        /* ── Feature pills ── */
        .pill {
          border: 2px solid #1a0f2e; border-radius: 99px; padding: 7px 14px;
          font-family: 'Unbounded', sans-serif; font-size: 9.5px; font-weight: 700;
          letter-spacing: .03em; white-space: nowrap;
          box-shadow: 2px 2px 0 #1a0f2e;
          transition: all .15s;
          cursor: default;
        }
        .pill:hover {
          transform: translate(-1px,-2px) rotate(-1deg);
          box-shadow: 3px 4px 0 #1a0f2e;
        }

        /* ── Another note btn ── */
        .another-btn {
          width: 100%; margin-top: 12px; padding: 15px;
          background: #faf5eb; border: 2.5px solid #1a0f2e; border-radius: 16px;
          font-family: 'Unbounded', sans-serif; font-size: 10.5px; font-weight: 700;
          color: #1a0f2e; cursor: pointer; letter-spacing: .04em;
          box-shadow: 4px 4px 0 #1a0f2e;
          transition: all .15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .another-btn:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #1a0f2e; }
        .another-btn:active { transform: translate(1px,1px); box-shadow: 2px 2px 0 #1a0f2e; }
      `}</style>

      <div className="page">

        {/* ── Banner ── */}
        <div className="banner">
          <div className="b-track">
            {['Record','Transcribe','Summarise','Actions','AI-powered','Multi-lang','Private','Fast',
              'Record','Transcribe','Summarise','Actions','AI-powered','Multi-lang','Private','Fast'].map((t, i) => (
              <span key={i} className="b-item">
                {t} <span className="b-dot" />
              </span>
            ))}
          </div>
          <svg className="b-wave" viewBox="0 0 430 18" preserveAspectRatio="none">
            <path d="M0,18 Q54,2 107,10 T215,4 T322,12 T430,2 L430,18 Z" fill="#faf5eb"/>
          </svg>
        </div>

        {/* ── Top nav ── */}
        <div className="topnav">
          <motion.div className="logo" whileHover={{ scale: 1.03 }}>
            V<span className="logo-o"/>CA
          </motion.div>
          <motion.button className="hist-btn" onClick={() => setHistoryOpen(true)} whileTap={{ scale: .9 }}>
            📋
            {noteCount > 0 && <span className="hist-badge">{noteCount}</span>}
          </motion.button>
        </div>

        {/* ── Scroll ── */}
        <div className="scroll">

          {/* Greeting */}
          <motion.div
            className="greet"
            style={{
              background: greetBg,
              boxShadow: `5px 5px 0 #1a0f2e`,
            }}
            layout transition={sp}
          >
            <div className="greet-blob" style={{ background: greetBlob }} />
            <div className="greet-blob2" />
            <div className="greet-inner">
              <div className="greet-tag">
                {loading ? '⚡ Processing' : results ? '✦ Done!' : '✦ Voice Journal'}
              </div>
              <div className="greet-title">
                {loading ? 'Working\non it…' : results ? "Here's\nyour note!" : 'Hey there,\nready to record?'}
              </div>
              <div className="greet-sub">
                {loading ? 'AI magic in progress' : results ? 'Tap "All notes" to save' : "Speak your mind · we'll handle the rest"}
              </div>
            </div>
          </motion.div>

          {/* Recorder */}
          {!results && (
            <>
              <div className="slbl">Record a note</div>
              <div className="mic-card">
                <Recorder onResults={handleResults} onLoading={handleLoading} />
              </div>
            </>
          )}

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={sp}
              >
                <div className="load-head">
                  <div className="spin-ring" />
                  Analysing your note
                </div>
                {[
                  ['Transcribing your voice',    '#85e89d'],
                  ['Understanding the meaning',  '#ffd166'],
                  ['Writing your summary',        '#c9a7ff'],
                ].map(([label, col], i) => (
                  <div key={i} className={`lstep ${step === i+1 ? 'active' : step > i+1 ? 'done' : 'idle'}`}>
                    <motion.div className="ldot"
                      style={{ background: step > i+1 ? col : step === i+1 ? col : '#e0d4f8' }}
                      animate={step === i+1 ? { scale: [1, 1.7, 1] } : {}}
                      transition={{ duration: .7, repeat: Infinity }}
                    />
                    <span className="ltxt" style={{ fontWeight: step === i+1 ? 700 : 400 }}>{label}</span>
                    {step > i+1 && <span className="lchk">✓</span>}
                  </div>
                ))}
                <div className="prog"><div className="prog-worm" /></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={sp}
              >
                <div className="res-wrap">
                  <div className="res-head">
                    <span className="res-title">
                      <span className="res-title-dot" />
                      Note Summary
                    </span>
                    <button className="res-btn" onClick={() => setHistoryOpen(true)}>All notes →</button>
                  </div>
                  <div className="res-body">
                    <ResultCard results={results} />
                  </div>
                </div>

                <motion.button
                  className="another-btn"
                  whileTap={{ scale: .97 }}
                  onClick={() => { setResults(null); setHasRecorded(false) }}
                >
                  ← Record another
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature pills */}
          {!hasRecorded && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: .45, ...sp }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingBottom: 4 }}
            >
              {[
                ['🎙 Record',          '#ffe8e2', '#c45a2a'],
                ['✍️ Transcribe',      '#fff8d6', '#a07a00'],
                ['✨ Summarise',       '#d8f8e4', '#2a7a4a'],
                ['✅ Actions',         '#ede5ff', '#6a3abf'],
                ['🌐 10+ Languages',  '#ddf0fc', '#2a6a9a'],
                ['🔒 Private',         '#faf5eb', '#3d2f5a'],
              ].map(([label, bg, color]) => (
                <motion.span key={label} className="pill"
                  style={{ background: bg, color }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: .95 }}
                >
                  {label}
                </motion.span>
              ))}
            </motion.div>
          )}

        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}