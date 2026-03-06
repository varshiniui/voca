'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

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
        @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,500;0,600;0,700;0,800;1,700&family=DM+Serif+Display:ital@0;1&display=swap');

        .page {
          min-height: 100vh;
          background: #fdf6ff;
          font-family: 'Nunito', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(40px);
        }
        .blob-1 { width:320px; height:320px; top:-100px; right:-80px; background:rgba(192,132,252,0.2); animation: blobmove 9s ease-in-out infinite; }
        .blob-2 { width:240px; height:240px; bottom:5%; left:-80px; background:rgba(244,114,182,0.15); animation: blobmove 11s ease-in-out infinite reverse; }
        .blob-3 { width:180px; height:180px; top:45%; right:-50px; background:rgba(52,211,153,0.12); animation: blobmove 13s ease-in-out infinite 3s; }
        @keyframes blobmove {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-20px,15px) scale(1.05); }
          66%      { transform: translate(15px,-10px) scale(0.95); }
        }

        .nav {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: rgba(253,246,255,0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1.5px solid rgba(192,132,252,0.15);
        }
        .logo {
          font-family: 'DM Serif Display', serif;
          font-style: italic;
          font-size: 24px;
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .notes-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px;
          background: white;
          border: 1.5px solid rgba(192,132,252,0.3);
          border-radius: 99px;
          font-family: 'Nunito', sans-serif;
          font-size: 12px; font-weight: 700;
          color: #7c3aed;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(147,51,234,0.1);
          transition: all 0.2s;
        }
        .notes-btn:hover {
          border-color: #c084fc;
          box-shadow: 0 4px 20px rgba(147,51,234,0.18);
          transform: translateY(-1px);
        }
        .badge {
          min-width: 17px; height: 17px;
          border-radius: 99px; padding: 0 4px;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          color: white; font-size: 9px; font-weight: 800;
          display: inline-flex; align-items: center; justify-content: center;
        }

        .body {
          position: relative; z-index: 1;
          max-width: 520px; margin: 0 auto;
          padding: 22px 16px 80px;
          display: flex; flex-direction: column; gap: 16px;
        }

        .hero { text-align: center; padding: 10px 0 4px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 16px; border-radius: 99px; margin-bottom: 16px;
          background: linear-gradient(135deg, rgba(147,51,234,0.08), rgba(236,72,153,0.08));
          border: 1.5px solid rgba(147,51,234,0.12);
          font-size: 11px; font-weight: 800; color: #9333ea;
          letter-spacing: 0.03em;
        }
        .hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(30px, 8.5vw, 48px);
          font-weight: 400; line-height: 1.15;
          color: #1a0a2e; letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .hero h1 em {
          font-style: italic;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 14px; color: #a78fc0;
          font-weight: 600; line-height: 1.6; margin-bottom: 16px;
        }
        .pills {
          display: flex; gap: 7px; flex-wrap: wrap; justify-content: center;
        }
        .pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 99px;
          background: white;
          border: 1.5px solid rgba(192,132,252,0.25);
          font-size: 12px; color: #6b4f8a; font-weight: 700;
          box-shadow: 0 2px 8px rgba(147,51,234,0.06);
          transition: all 0.18s; cursor: default;
        }
        .pill:hover {
          border-color: #c084fc;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(147,51,234,0.12);
        }

        .card {
          background: white;
          border: 1.5px solid rgba(192,132,252,0.2);
          border-radius: 28px;
          padding: clamp(22px, 5vw, 34px);
          box-shadow: 0 4px 32px rgba(147,51,234,0.08), 0 1px 4px rgba(0,0,0,0.03);
          position: relative; overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #9333ea, #ec4899, #34d399, #9333ea);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        .load-card {
          background: white;
          border: 1.5px solid rgba(192,132,252,0.2);
          border-radius: 22px; padding: 20px 22px;
          box-shadow: 0 4px 20px rgba(147,51,234,0.07);
        }
        .result-card {
          background: white;
          border: 1.5px solid rgba(192,132,252,0.2);
          border-radius: 22px; padding: 22px;
          box-shadow: 0 4px 28px rgba(147,51,234,0.08);
          position: relative; overflow: hidden;
        }
        .result-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #9333ea, #ec4899, #34d399);
        }

        @media(min-width: 560px) {
          .nav  { padding: 16px 32px; }
          .body { padding: 30px 24px 80px; gap: 18px; }
        }
      `}</style>

      <div className="page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        {/* NAV */}
        <motion.header className="nav"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="logo">Voca</span>
          <button className="notes-btn" onClick={() => setHistoryOpen(true)}>
            📋 Notes
            {noteCount > 0 && (
              <motion.span className="badge"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >{noteCount}</motion.span>
            )}
          </button>
        </motion.header>

        <div className="body">

          {/* Hero */}
          <motion.div className="hero"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="hero-badge">✨ AI-powered voice notes</div>
            <h1>Speak your mind.<br/><em>We'll handle the rest.</em></h1>
            <p className="hero-sub">Record → transcribe → summarise in seconds.</p>
            <div className="pills">
              {[['🎙','Record'],['✍️','Transcribe'],['✨','Summarise'],['✅','Actions']].map(([icon, label], i) => (
                <motion.span key={label} className="pill"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
                >
                  {icon} {label}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Recorder card */}
          <motion.div className="card"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.2, type: 'spring', stiffness: 180 }}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width:16, height:16, borderRadius:'50%', border:'2.5px solid #ecdff5', borderTop:'2.5px solid #9333ea', flexShrink:0 }}
                  />
                  <span style={{ fontSize:13, fontWeight:700, color:'#1a0a2e' }}>Working on your note… ✨</span>
                </div>
                {['Transcribing your voice 🎙','Understanding your message 🧠','Organising your insights 📝'].map((label, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:9, marginBottom:6,
                    opacity: step===i+1 ? 1 : step>i+1 ? 0.3 : 0.15,
                    transition:'opacity 0.5s',
                  }}>
                    <motion.div
                      animate={step===i+1 ? { scale:[1,1.8,1] } : {}}
                      transition={{ duration:0.6, repeat:Infinity }}
                      style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                        background: step>i+1 ? '#c084fc' : step===i+1 ? '#9333ea' : '#ecdff5',
                        transition:'background 0.5s',
                      }}
                    />
                    <span style={{ fontSize:12, color:'#6b4f8a', fontWeight: step===i+1 ? 700 : 500 }}>{label}</span>
                  </div>
                ))}
                <div style={{ height:3, background:'#ecdff5', borderRadius:99, marginTop:14, overflow:'hidden', position:'relative' }}>
                  <motion.div style={{ position:'absolute', height:'100%', borderRadius:99, width:'40%', background:'linear-gradient(90deg,#9333ea,#ec4899)' }}
                    animate={{ left:['-40%','110%'] }} transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-card"
                initial={{ opacity:0, y:16, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.45, type:'spring', stiffness:200 }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:14, borderBottom:'1.5px solid #f3e8ff' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>✨</span>
                    <span style={{ fontSize:11, fontWeight:800, color:'#1a0a2e', letterSpacing:'0.06em', textTransform:'uppercase' }}>Note Summary</span>
                  </div>
                  <button onClick={() => setHistoryOpen(true)} style={{
                    background:'linear-gradient(135deg,rgba(147,51,234,0.08),rgba(236,72,153,0.08))',
                    border:'1.5px solid rgba(147,51,234,0.15)', borderRadius:99,
                    padding:'4px 12px', cursor:'pointer',
                    fontSize:11, color:'#9333ea',
                    fontFamily:"'Nunito',sans-serif", fontWeight:700,
                  }}>All notes →</button>
                </div>
                <ResultCard results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <AnimatePresence>
            {!hasRecorded && (
              <motion.p
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ delay:1.2, duration:0.8 }}
                style={{ textAlign:'center', fontSize:12, color:'#a78fc0', fontWeight:600, marginTop:4 }}
              >
                🔒 Your recordings are never stored
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}