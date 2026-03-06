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
        .page { min-height:100vh; background:var(--cream); }

        .nav {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 20px;
          background:var(--cream);
          position:sticky; top:0; z-index:20;
        }
        .nav-logo {
          font-family:'Cormorant Garamond',serif;
          font-size:22px; font-style:italic; font-weight:500; color:var(--plum);
        }
        .nav-btn {
          display:flex; align-items:center; gap:6px;
          padding:6px 12px; border:1px solid var(--border);
          border-radius:8px; background:white;
          font-family:'Outfit',sans-serif; font-size:12px; font-weight:500;
          color:var(--text2); cursor:pointer; transition:all 0.15s;
        }
        .nav-btn:hover { border-color:var(--plum-lt); color:var(--plum); }
        .badge {
          min-width:15px; height:15px; border-radius:99px; padding:0 4px;
          background:var(--plum); color:white;
          font-size:9px; font-weight:700;
          display:inline-flex; align-items:center; justify-content:center;
        }

        .body {
          max-width:560px; margin:0 auto;
          padding:20px 16px 80px;
          display:flex; flex-direction:column; gap:14px;
        }

        /* Hero */
        .hero {
          text-align:center;
          padding:16px 8px 8px;
        }
        .hero-tag {
          display:inline-flex; align-items:center; gap:8px;
          padding:4px 14px; border-radius:99px;
          border:1px solid var(--border);
          background:white;
          font-size:10px; color:var(--muted); font-weight:500;
          letter-spacing:0.08em; text-transform:uppercase;
          margin-bottom:14px;
        }
        .hero-tag span { color:var(--plum-lt); }
        .hero h1 {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(32px,9vw,50px);
          font-weight:400; color:var(--text);
          line-height:1.1; letter-spacing:-0.01em;
          margin-bottom:8px;
        }
        .hero-sub {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(15px,4vw,20px);
          color:var(--plum2); font-style:italic;
          margin-bottom:14px;
        }
        .hero-pills {
          display:flex; gap:6px; flex-wrap:wrap; justify-content:center;
        }
        .hero-pill {
          display:inline-flex; align-items:center; gap:4px;
          padding:4px 12px; border-radius:99px;
          border:1px solid var(--border); background:rgba(255,255,255,0.8);
          font-size:11px; color:var(--text2); font-weight:500;
        }
        .hero-pill-icon { color:var(--plum-lt); font-size:9px; }

        /* Divider */
        .divider-row {
          display:flex; align-items:center; gap:10;
        }
        .divider-line { flex:1; height:1px; background:var(--border); }
        .divider-text {
          font-size:10px; color:var(--border2); letter-spacing:0.1em;
          text-transform:uppercase; font-weight:500; white-space:nowrap;
        }

        /* Recorder card */
        .rec-card {
          background:var(--paper);
          border:1px solid var(--border);
          border-radius:20px;
          padding:clamp(20px,5vw,32px);
          box-shadow:0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(74,45,78,0.06);
          position:relative; overflow:hidden;
        }
        .rec-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent);
        }

        /* Info row */
        .info-row {
          display:flex; gap:10;
        }
        .info-chip {
          flex:1; padding:12px 14px;
          background:white; border:1px solid var(--border); border-radius:12px;
          display:flex; flex-direction:column; gap:3;
        }
        .info-chip-icon { font-size:14px; }
        .info-chip-label { font-size:10px; color:var(--muted); font-weight:500; letter-spacing:0.05em; text-transform:uppercase; }
        .info-chip-val { font-size:12px; color:var(--text2); font-weight:500; }

        /* Loading / result */
        .load-card {
          background:var(--paper); border:1px solid var(--border);
          border-radius:14px; padding:18px 20px;
        }
        .result-wrap {
          background:var(--paper); border:1px solid var(--border);
          border-radius:14px; padding:20px;
          box-shadow:0 2px 16px rgba(74,45,78,0.07);
          position:relative; overflow:hidden;
        }
        .result-wrap::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent);
        }

        @media(min-width:560px){
          .nav { padding:18px 32px; }
          .body { padding:28px 24px 80px; }
        }
      `}</style>

      <div className="page">
        {/* NAV */}
        <motion.header className="nav"
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.4 }}
        >
          <span className="nav-logo">Voca</span>
          <button className="nav-btn" onClick={() => setHistoryOpen(true)}>
            <HistoryIcon hasNotes={noteCount > 0} />
            Notes
            {noteCount > 0 && <span className="badge">{noteCount}</span>}
          </button>
        </motion.header>

        <div className="body">

          {/* Hero */}
          <motion.div className="hero"
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55, delay:0.1 }}
          >
            <div className="hero-tag">
              <span>✦</span> AI Voice Notes <span>✦</span>
            </div>
            <h1>Speak your mind.</h1>
            <p className="hero-sub">Your words, beautifully organised.</p>
            <div className="hero-pills">
              {[['◎','Transcribe'],['◈','Summarise'],['◇','Actions']].map(([icon,label],i) => (
                <motion.span key={label} className="hero-pill"
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.5+i*0.08 }}
                >
                  <span className="hero-pill-icon">{icon}</span>{label}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Info chips */}
          {!hasRecorded && (
            <motion.div className="info-row"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.4 }}
            >
              {[
                { icon:'🌍', label:'Languages', val:'7 supported' },
                { icon:'⚡', label:'Speed', val:'~10 seconds' },
                { icon:'🔒', label:'Privacy', val:'Not stored' },
              ].map(c => (
                <div key={c.label} className="info-chip">
                  <span className="info-chip-icon">{c.icon}</span>
                  <span className="info-chip-label">{c.label}</span>
                  <span className="info-chip-val">{c.val}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Recorder */}
          <motion.div className="rec-card"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55, delay:0.2 }}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }} transition={{ duration:0.3 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                    style={{ width:14, height:14, borderRadius:'50%', border:'2px solid var(--border)', borderTop:'2px solid var(--plum)', flexShrink:0 }}
                  />
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>Working on your note…</span>
                </div>
                {['Transcribing your voice','Understanding your message','Organising your insights'].map((label,i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:9, marginBottom:6,
                    opacity:step===i+1?1:step>i+1?0.3:0.15, transition:'opacity 0.5s',
                  }}>
                    <motion.div
                      animate={step===i+1?{scale:[1,1.6,1]}:{}}
                      transition={{ duration:0.7, repeat:Infinity }}
                      style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, transition:'background 0.5s',
                        background:step>i+1?'var(--plum-lt)':step===i+1?'var(--plum)':'var(--border2)',
                      }}
                    />
                    <span style={{ fontSize:12, color:'var(--text2)', fontWeight:step===i+1?500:400 }}>{label}</span>
                  </div>
                ))}
                <div style={{ height:2, background:'var(--border)', borderRadius:99, marginTop:12, overflow:'hidden', position:'relative' }}>
                  <motion.div style={{ position:'absolute', height:'100%', borderRadius:99, background:'var(--plum)', width:'40%' }}
                    animate={{ left:['-40%','110%'] }} transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-wrap"
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }} transition={{ duration:0.45 }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--plum)' }} />
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--text)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Note Summary</span>
                  </div>
                  <button onClick={() => setHistoryOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--plum-lt)', fontFamily:"'Outfit',sans-serif", fontWeight:500, textDecoration:'underline dotted', textUnderlineOffset:3, padding:0 }}>
                    View all →
                  </button>
                </div>
                <ResultCard results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <AnimatePresence>
            {!hasRecorded && (
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ delay:1.2, duration:0.8 }}
                style={{ textAlign:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontStyle:'italic', color:'var(--border2)', marginTop:4 }}
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