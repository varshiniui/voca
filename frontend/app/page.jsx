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

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Cork board background ── */
        .board {
          min-height: 100vh;
          background: #e8dcc8;
          background-image:
            radial-gradient(circle, rgba(26,15,46,.05) 1px, transparent 1px),
            linear-gradient(rgba(26,15,46,.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,15,46,.018) 1px, transparent 1px);
          background-size: 24px 24px, 48px 48px, 48px 48px;
          font-family: 'DM Sans', sans-serif;
          position: relative; overflow-x: hidden;
        }

        /* ── Top bar ── */
        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: #1a0f2e;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px; height: 50px;
          box-shadow: 0 4px 0 rgba(0,0,0,0.25);
        }
        .marquee-wrap { flex: 1; overflow: hidden; margin: 0 16px; }
        .marquee-track { display: flex; width: max-content; animation: marquee 22s linear infinite; }
        .marquee-item {
          font-family: 'Unbounded', sans-serif; font-size: 7.5px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase;
          color: rgba(250,245,235,0.55); padding: 0 16px;
          display: flex; align-items: center; gap: 9px; white-space: nowrap;
        }
        .m-dot { width: 3px; height: 3px; border-radius: 50%; background: #c9a7ff; flex-shrink: 0; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .logo {
          font-family: 'Unbounded', sans-serif; font-size: 19px; font-weight: 900;
          color: #faf5eb; letter-spacing: -.04em; display: flex; align-items: center; flex-shrink: 0;
        }
        .logo-o {
          display: inline-block; width: 19px; height: 19px; border-radius: 50%;
          background: linear-gradient(135deg, #ff8c69, #ffd166);
          border: 2px solid #faf5eb; vertical-align: middle; margin: -2px -1px 0;
          transition: transform 0.4s ease;
        }
        .logo:hover .logo-o { transform: rotate(180deg); }

        .hist-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; cursor: pointer; flex-shrink: 0; transition: all .15s; position: relative;
        }
        .hist-btn:hover { background: rgba(255,255,255,0.18); }
        .hist-badge {
          position: absolute; top: -5px; right: -5px; width: 16px; height: 16px;
          border-radius: 50%; background: #ff8c69; border: 1.5px solid #1a0f2e;
          font-family: 'Unbounded', sans-serif; font-size: 7px; font-weight: 900;
          color: white; display: flex; align-items: center; justify-content: center;
        }

        /* ══════════════════════════
           DESKTOP — STICKY BOARD
        ══════════════════════════ */
        .desktop-board {
          display: none; position: relative; z-index: 1;
          padding: 56px 48px 72px; min-height: calc(100vh - 50px);
        }

        /* Pinned board title */
        .board-pin-title {
          position: absolute; top: 24px; left: 50%; transform: translateX(-50%) rotate(-1deg);
          background: #1a0f2e; color: #faf5eb;
          padding: 8px 26px; border-radius: 3px;
          font-family: 'Unbounded', sans-serif; font-size: 9px; font-weight: 700;
          letter-spacing: .16em; text-transform: uppercase;
          box-shadow: 3px 3px 14px rgba(0,0,0,0.4); z-index: 20;
        }
        .board-pin-title::before {
          content: '📌'; position: absolute; top: -16px; left: 50%;
          transform: translateX(-50%); font-size: 22px;
        }

        /* Desktop 2-col grid */
        .desktop-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 28px; max-width: 1080px; margin: 70px auto 0; align-items: start;
        }

        /* ── STICKY NOTE ── */
        .sticky {
          border-radius: 3px; padding: 32px 26px 30px;
          position: relative;
          box-shadow: 4px 5px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1),
                      inset 0 -3px 6px rgba(0,0,0,0.04);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        /* Tape strip at top */
        .sticky::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 26px; background: rgba(0,0,0,0.055); border-radius: 3px 3px 0 0;
        }
        /* Fold at bottom-right corner */
        .sticky::after {
          content: ''; position: absolute; bottom: 0; right: 0;
          width: 0; height: 0;
          border-style: solid; border-width: 0 0 22px 22px;
          border-color: transparent transparent rgba(0,0,0,0.12) transparent;
        }
        .sticky:hover {
          box-shadow: 8px 12px 28px rgba(0,0,0,0.22), 0 2px 4px rgba(0,0,0,0.1);
        }

        .sticky-yellow  { background: #fde77a; transform: rotate(-1.4deg); }
        .sticky-yellow:hover  { transform: rotate(-0.4deg) translateY(-5px); }
        .sticky-mint    { background: #b8edc4; transform: rotate(1.1deg); }
        .sticky-mint:hover    { transform: rotate(0.3deg) translateY(-5px); }
        .sticky-blue    { background: #aed9f5; transform: rotate(-0.8deg); }
        .sticky-blue:hover    { transform: rotate(0.1deg) translateY(-5px); }
        .sticky-pink    { background: #f8bbd9; transform: rotate(1.3deg); }
        .sticky-pink:hover    { transform: rotate(0.4deg) translateY(-5px); }
        .sticky-lavender { background: #d4c2f5; transform: rotate(-1.1deg); }
        .sticky-lavender:hover { transform: rotate(-0.2deg) translateY(-5px); }
        .sticky-peach   { background: #ffc9a8; transform: rotate(0.9deg); }
        .sticky-peach:hover   { transform: rotate(0deg) translateY(-5px); }

        /* Pushpin */
        .pushpin {
          position: absolute; top: -9px; left: 50%; transform: translateX(-50%);
          width: 20px; height: 20px; border-radius: 50%;
          border: 2.5px solid rgba(0,0,0,0.28); z-index: 5;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 3px rgba(255,255,255,0.45);
        }
        .pushpin::after {
          content: ''; position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
          width: 3px; height: 12px; background: rgba(0,0,0,0.22); border-radius: 0 0 2px 2px;
        }
        /* Pushpin shine */
        .pushpin::before {
          content: ''; position: absolute; top: 3px; left: 5px;
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.55);
        }

        .sticky-label {
          font-family: 'Unbounded', sans-serif; font-size: 8.5px; font-weight: 700;
          letter-spacing: .1em; text-transform: uppercase;
          color: rgba(26,15,46,0.45); margin-bottom: 14px; margin-top: 12px;
        }
        .sticky-title {
          font-family: 'Unbounded', sans-serif; font-size: 21px; font-weight: 900;
          color: #1a0f2e; line-height: 1.18; letter-spacing: -.03em; margin-bottom: 10px;
        }
        .sticky-sub { font-size: 13px; color: #3d2f5a; line-height: 1.6; }

        /* Feature list on welcome sticky */
        .feature-row {
          display: flex; align-items: center; gap: 8px; padding: 7px 10px;
          background: rgba(255,255,255,0.45); border-radius: 8px;
          border: 1px solid rgba(26,15,46,0.08); font-size: 12.5px;
          color: #3d2f5a; font-weight: 500;
          transition: background .15s;
        }
        .feature-row:hover { background: rgba(255,255,255,0.7); }

        /* Tape strip decoration */
        .tape {
          position: absolute; top: -8px; left: 30%;
          width: 40%; height: 20px; border-radius: 2px;
          background: rgba(255,255,255,0.45);
          border: 1px solid rgba(255,255,255,0.6);
          transform: rotate(-1deg);
        }

        /* Loading / result sections */
        .load-head {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
          font-family: 'Unbounded', sans-serif; font-size: 10px; font-weight: 700; color: #1a0f2e;
        }
        .spin-ring {
          width: 17px; height: 17px; border-radius: 50%;
          border: 2.5px solid rgba(26,15,46,0.15); border-top: 2.5px solid #4a2d78;
          animation: spin 1s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        .lstep {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 10px; margin-bottom: 6px;
          transition: all .3s; border: 1.5px solid transparent;
        }
        .lstep.active { background: rgba(255,255,255,0.55); border-color: rgba(26,15,46,0.2); transform: translateX(2px); }
        .lstep.done   { opacity: .3; }
        .lstep.idle   { opacity: .15; }
        .ldot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .ltxt { font-size: 12px; font-weight: 500; color: #1a0f2e; }
        .lchk { margin-left: auto; font-size: 11px; font-weight: 800; color: #2a7a4a; }
        .prog { height: 6px; background: rgba(26,15,46,0.1); border-radius: 99px; overflow: hidden; position: relative; margin-top: 14px; }
        .prog-worm {
          position: absolute; height: 100%; width: 40%; border-radius: 99px;
          background: linear-gradient(90deg,#4a2d78,#ff8c69,#85e89d,#ffd166);
          animation: worm 1.8s ease-in-out infinite;
        }
        @keyframes worm { 0%{left:-40%;width:40%} 50%{left:30%;width:60%} 100%{left:110%;width:40%} }

        .another-btn-sticky {
          width: 100%; margin-top: 16px; padding: 13px;
          background: rgba(255,255,255,0.5); border: 2px solid rgba(26,15,46,0.3);
          border-radius: 10px; font-family: 'Unbounded', sans-serif;
          font-size: 9px; font-weight: 700; color: #1a0f2e; cursor: pointer;
          letter-spacing: .05em; transition: all .15s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          box-shadow: 2px 2px 0 rgba(26,15,46,0.15);
        }
        .another-btn-sticky:hover { background: rgba(255,255,255,0.75); transform: translate(-1px,-1px); box-shadow: 3px 3px 0 rgba(26,15,46,0.2); }

        /* Deco notes */
        .deco-note {
          position: absolute; border-radius: 3px; opacity: 0.4;
          box-shadow: 2px 3px 8px rgba(0,0,0,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; pointer-events: none; z-index: 0;
        }

        /* ══════════════════════════
           MOBILE LAYOUT
        ══════════════════════════ */
        .mobile-layout {
          display: flex; flex-direction: column; padding: 0 16px 52px; gap: 14px;
          position: relative; z-index: 1;
        }
        .mobile-greet {
          border: 2.5px solid #1a0f2e; border-radius: 24px; padding: 20px 22px;
          position: relative; overflow: hidden; box-shadow: 4px 4px 0 #1a0f2e;
          margin-top: 16px; transition: background 0.5s ease;
        }
        .mobile-greet-blob {
          position: absolute; right: -28px; top: -28px;
          width: 120px; height: 120px; border-radius: 50%;
          opacity: .22; animation: blob 6s ease-in-out infinite;
        }
        .mobile-greet-blob2 {
          position: absolute; left: -20px; bottom: -28px;
          width: 80px; height: 80px; border-radius: 50%;
          opacity: .08; background: #1a0f2e; animation: blob 8s ease-in-out infinite reverse;
        }
        @keyframes blob {
          0%,100%{border-radius:60% 40% 70% 30%/50% 60% 40% 70%}
          50%{border-radius:70% 30% 60% 40%/40% 70% 30% 60%}
        }
        .greet-tag {
          display: inline-flex; align-items: center; gap: 5px;
          background: #1a0f2e; color: #faf5eb; border-radius: 99px; padding: 4px 12px;
          margin-bottom: 10px; font-family: 'Unbounded', sans-serif;
          font-size: 7.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.2); position: relative; z-index: 2;
        }
        .greet-title {
          font-family: 'Unbounded', sans-serif; font-size: 20px; font-weight: 900;
          color: #1a0f2e; line-height: 1.18; letter-spacing: -.03em; margin-bottom: 7px;
          position: relative; z-index: 2;
        }
        .greet-sub { font-size: 13px; color: #3d2f5a; font-weight: 400; line-height: 1.5; position: relative; z-index: 2; }

        .slbl {
          font-family: 'Unbounded', sans-serif; font-size: 9px; font-weight: 700;
          color: #8070a0; letter-spacing: .1em; text-transform: uppercase;
          display: flex; align-items: center; gap: 8px; padding: 0 2px;
        }
        .slbl::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, #d8c8f0, transparent); }

        .mobile-mic-card {
          background: white; border: 2.5px solid #1a0f2e; border-radius: 28px;
          padding: 24px 20px; display: flex; flex-direction: column; align-items: center; gap: 20px;
          position: relative; overflow: hidden; box-shadow: 5px 5px 0 #1a0f2e;
        }
        .mobile-mic-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg,#ff8c69,#ffd166,#85e89d,#74c7f5,#c9a7ff,#ffadd2);
          background-size: 200% 100%; animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
          0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
        }

        .load-card-m {
          background: white; border: 2.5px solid #1a0f2e; border-radius: 24px;
          padding: 22px; box-shadow: 5px 5px 0 #1a0f2e;
        }
        .load-head-m {
          display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
          font-family: 'Unbounded', sans-serif; font-size: 11px; font-weight: 700; color: #1a0f2e;
        }
        .spin-ring-m {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid #ede5ff; border-top: 2.5px solid #c9a7ff;
          animation: spin 1s linear infinite; flex-shrink: 0;
        }
        .lstep-m {
          display: flex; align-items: center; gap: 11px; padding: 9px 13px;
          border-radius: 12px; margin-bottom: 7px; transition: all .3s; border: 1.5px solid transparent;
        }
        .lstep-m.active { background: #faf5eb; border-color: #1a0f2e; box-shadow: 2px 2px 0 #1a0f2e; transform: translateX(2px); }
        .lstep-m.done   { opacity: .35; }
        .lstep-m.idle   { opacity: .15; }
        .ldot-m { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .ltxt-m { font-size: 12px; font-weight: 500; color: #1a0f2e; }
        .lchk-m { margin-left: auto; font-size: 11px; font-weight: 800; color: #85e89d; }
        .prog-m { height: 7px; background: #ede5ff; border-radius: 99px; overflow: hidden; position: relative; margin-top: 14px; border: 1px solid #d8c8f0; }
        .prog-worm-m {
          position: absolute; height: 100%; width: 40%; border-radius: 99px;
          background: linear-gradient(90deg,#c9a7ff,#ff8c69,#85e89d,#ffd166);
          animation: worm 1.8s ease-in-out infinite;
        }

        .res-wrap-m {
          background: white; border: 2.5px solid #1a0f2e; border-radius: 26px;
          overflow: hidden; box-shadow: 5px 5px 0 #1a0f2e; position: relative;
        }
        .res-wrap-m::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg,#ff8c69,#ffd166,#85e89d,#74c7f5,#c9a7ff,#ffadd2);
          background-size: 200% 100%; animation: gradientShift 3s ease infinite;
        }
        .res-head-m {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px; border-bottom: 1.5px solid rgba(26,15,46,.07);
        }
        .res-title-m {
          font-family: 'Unbounded', sans-serif; font-size: 9.5px; font-weight: 700;
          color: #1a0f2e; letter-spacing: .1em; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .res-dot-m { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg,#85e89d,#74c7f5); border: 1.5px solid #1a0f2e; }
        .res-btn-m {
          background: #ffd166; border: 2px solid #1a0f2e; border-radius: 99px; padding: 5px 13px;
          font-family: 'Unbounded', sans-serif; font-size: 8px; font-weight: 700; color: #1a0f2e;
          box-shadow: 2px 2px 0 #1a0f2e; cursor: pointer; transition: all .14s;
        }
        .res-btn-m:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a0f2e; }

        .another-btn-m {
          width: 100%; margin-top: 12px; padding: 15px;
          background: #faf5eb; border: 2.5px solid #1a0f2e; border-radius: 16px;
          font-family: 'Unbounded', sans-serif; font-size: 10px; font-weight: 700;
          color: #1a0f2e; cursor: pointer; letter-spacing: .04em;
          box-shadow: 4px 4px 0 #1a0f2e; transition: all .15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .another-btn-m:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #1a0f2e; }
        .another-btn-m:active { transform: translate(1px,1px); box-shadow: 2px 2px 0 #1a0f2e; }

        .pill {
          border: 2px solid #1a0f2e; border-radius: 99px; padding: 7px 13px;
          font-family: 'Unbounded', sans-serif; font-size: 9px; font-weight: 700;
          letter-spacing: .03em; white-space: nowrap; box-shadow: 2px 2px 0 #1a0f2e;
          transition: all .15s; cursor: default;
        }
        .pill:hover { transform: translate(-1px,-2px) rotate(-1deg); box-shadow: 3px 4px 0 #1a0f2e; }

        /* ── Responsive breakpoints ── */
        @media (min-width: 768px) {
          .desktop-board  { display: block; }
          .mobile-layout  { display: none; }
        }
        @media (max-width: 767px) {
          .desktop-board  { display: none; }
          .mobile-layout  { display: flex; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <div className="logo">V<span className="logo-o"/>CA</div>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {['Record','Transcribe','Summarise','Actions','AI-powered','Multi-lang','Private','Fast',
              'Record','Transcribe','Summarise','Actions','AI-powered','Multi-lang','Private','Fast'].map((t, i) => (
              <span key={i} className="marquee-item">{t}<span className="m-dot"/></span>
            ))}
          </div>
        </div>
        <motion.button className="hist-btn" onClick={() => setHistoryOpen(true)} whileTap={{ scale: .9 }}>
          📋
          {noteCount > 0 && <span className="hist-badge">{noteCount}</span>}
        </motion.button>
      </div>

      <div className="board">

        {/* ═══════════════════════════════
            DESKTOP — CORK BOARD
        ═══════════════════════════════ */}
        <div className="desktop-board">

          {/* Decorative background notes */}
          {[
            { top:50,  left:20,  w:72, h:62, bg:'#f8bbd9', rot:-9,  emoji:'🎙' },
            { top:70,  right:24, w:65, h:55, bg:'#b8edc4', rot:7,   emoji:'✨' },
            { bottom:60, left:44, w:60, h:52, bg:'#d4c2f5', rot:-6, emoji:'📝' },
            { bottom:48, right:60, w:68, h:58, bg:'#aed9f5', rot:8, emoji:'✅' },
            { top:200, left:8,   w:55, h:48, bg:'#fde77a', rot:12,  emoji:'💡' },
          ].map((n, i) => (
            <div key={i} className="deco-note" style={{
              top: n.top, left: n.left, right: n.right, bottom: n.bottom,
              width: n.w, height: n.h, background: n.bg, transform: `rotate(${n.rot}deg)`,
            }}>{n.emoji}</div>
          ))}

          {/* Pinned board label */}
          <div className="board-pin-title">MY VOICE BOARD</div>

          <div className="desktop-grid">

            {/* LEFT col: Recorder */}
            <motion.div
              className="sticky sticky-yellow"
              initial={{ opacity: 0, y: 30, rotate: -1.4 }}
              animate={{ opacity: 1, y: 0, rotate: -1.4 }}
              transition={{ ...sp, delay: 0.08 }}
              style={{ zIndex: 10 }}
            >
              <div className="pushpin" style={{ background: '#ff8c69' }} />
              <div className="sticky-label">🎙 Record a note</div>
              <Recorder onResults={handleResults} onLoading={handleLoading} />
            </motion.div>

            {/* RIGHT col: Welcome / Loading / Result */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, zIndex: 10 }}>

              {/* Welcome sticky */}
              <AnimatePresence>
                {!results && !loading && (
                  <motion.div
                    className="sticky sticky-mint"
                    initial={{ opacity: 0, y: 24, rotate: 1.1 }}
                    animate={{ opacity: 1, y: 0, rotate: 1.1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ ...sp, delay: 0.18 }}
                  >
                    <div className="pushpin" style={{ background: '#85e89d' }} />
                    <div className="sticky-label">✦ Voice Journal</div>
                    <div className="sticky-title">Hey there,<br/>ready to record?</div>
                    <div className="sticky-sub" style={{ marginBottom: 18 }}>Speak your mind · we'll handle the rest</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {['🎙 Record voice notes','✍️ Auto-transcribe','✨ AI summaries','✅ Extract action items','🌐 10+ languages'].map(f => (
                        <div key={f} className="feature-row">{f}</div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading sticky */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    className="sticky sticky-lavender"
                    initial={{ opacity: 0, y: 24, rotate: -1.1 }}
                    animate={{ opacity: 1, y: 0, rotate: -1.1 }}
                    exit={{ opacity: 0 }}
                    transition={sp}
                  >
                    <div className="pushpin" style={{ background: '#c9a7ff' }} />
                    <div className="sticky-label">⚡ Processing</div>
                    <div className="load-head">
                      <div className="spin-ring" /> Analysing your note…
                    </div>
                    {[
                      ['Transcribing your voice',   '#85e89d'],
                      ['Understanding the meaning', '#ffd166'],
                      ['Writing your summary',       '#c9a7ff'],
                    ].map(([label, col], i) => (
                      <div key={i} className={`lstep ${step===i+1?'active':step>i+1?'done':'idle'}`}>
                        <motion.div className="ldot"
                          style={{ background: step>i+1?col:step===i+1?col:'rgba(26,15,46,0.15)' }}
                          animate={step===i+1?{scale:[1,1.7,1]}:{}}
                          transition={{ duration:.7, repeat:Infinity }}
                        />
                        <span className="ltxt" style={{ fontWeight: step===i+1?700:400 }}>{label}</span>
                        {step>i+1 && <span className="lchk">✓</span>}
                      </div>
                    ))}
                    <div className="prog"><div className="prog-worm"/></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result sticky */}
              <AnimatePresence>
                {results && !loading && (
                  <motion.div
                    className="sticky sticky-blue"
                    initial={{ opacity: 0, y: 28, rotate: -0.8 }}
                    animate={{ opacity: 1, y: 0, rotate: -0.8 }}
                    exit={{ opacity: 0 }}
                    transition={sp}
                  >
                    <div className="pushpin" style={{ background: '#74c7f5' }} />
                    <div className="sticky-label">✦ Note Summary</div>
                    <ResultCard results={results} />
                    <button className="another-btn-sticky"
                      onClick={() => { setResults(null); setHasRecorded(false) }}>
                      ← Record another
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* ═══════════════════════════════
            MOBILE LAYOUT
        ═══════════════════════════════ */}
        <div className="mobile-layout">

          {/* Greeting */}
          <motion.div
            className="mobile-greet"
            style={{ background: loading ? '#c9a7ff' : results ? '#85e89d' : '#ffd166' }}
            layout transition={sp}
          >
            <div className="mobile-greet-blob" style={{ background: loading?'#ffadd2':results?'#74c7f5':'#ff8c69' }} />
            <div className="mobile-greet-blob2" />
            <div className="greet-tag">{loading?'⚡ Processing':results?'✦ Done!':'✦ Voice Journal'}</div>
            <div className="greet-title">{loading?'Working\non it…':results?"Here's\nyour note!":'Hey there,\nready to record?'}</div>
            <div className="greet-sub">{loading?'AI magic in progress':results?'Tap "All notes" to save':"Speak your mind · we'll handle the rest"}</div>
          </motion.div>

          {/* Recorder */}
          {!results && (
            <>
              <div className="slbl">Record a note</div>
              <div className="mobile-mic-card">
                <Recorder onResults={handleResults} onLoading={handleLoading} />
              </div>
            </>
          )}

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card-m"
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }} transition={sp}
              >
                <div className="load-head-m"><div className="spin-ring-m"/>Analysing your note</div>
                {[['Transcribing your voice','#85e89d'],['Understanding the meaning','#ffd166'],['Writing your summary','#c9a7ff']].map(([label,col],i)=>(
                  <div key={i} className={`lstep-m ${step===i+1?'active':step>i+1?'done':'idle'}`}>
                    <motion.div className="ldot-m" style={{background:step>i+1?col:step===i+1?col:'#e0d4f8'}}
                      animate={step===i+1?{scale:[1,1.7,1]}:{}} transition={{duration:.7,repeat:Infinity}}/>
                    <span className="ltxt-m" style={{fontWeight:step===i+1?700:400}}>{label}</span>
                    {step>i+1&&<span className="lchk-m">✓</span>}
                  </div>
                ))}
                <div className="prog-m"><div className="prog-worm-m"/></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={sp}>
                <div className="res-wrap-m">
                  <div className="res-head-m">
                    <span className="res-title-m"><span className="res-dot-m"/>Note Summary</span>
                    <button className="res-btn-m" onClick={()=>setHistoryOpen(true)}>All notes →</button>
                  </div>
                  <div style={{padding:'18px 20px 22px'}}>
                    <ResultCard results={results}/>
                  </div>
                </div>
                <motion.button className="another-btn-m" whileTap={{scale:.97}}
                  onClick={()=>{setResults(null);setHasRecorded(false)}}>
                  ← Record another
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pills */}
          {!hasRecorded && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.45,...sp}}
              style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',paddingBottom:4}}>
              {[['🎙 Record','#ffe8e2','#c45a2a'],['✍️ Transcribe','#fff8d6','#a07a00'],
                ['✨ Summarise','#d8f8e4','#2a7a4a'],['✅ Actions','#ede5ff','#6a3abf'],
                ['🌐 10+ Languages','#ddf0fc','#2a6a9a'],['🔒 Private','#faf5eb','#3d2f5a']
              ].map(([label,bg,color])=>(
                <motion.span key={label} className="pill" style={{background:bg,color}}
                  whileHover={{y:-2}} whileTap={{scale:.95}}>{label}</motion.span>
              ))}
            </motion.div>
          )}

        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}