'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import HistoryPanel from './components/HistoryPanel'

const MOODS = {
  Focused:      ['#fce8e8','#c96b70'],
  Excited:      ['#fef4e0','#c9973a'],
  Casual:       ['#e8f4ec','#4a9e6e'],
  Professional: ['#e8eef8','#4a6eb8'],
  Urgent:       ['#fce8e8','#c94a4a'],
  Reflective:   ['#f0eaf8','#8a5cb8'],
}
const moodStyle = m => MOODS[m] || ['#f0eaf8','#8a5cb8']

function Result({ data }) {
  const kp = Array.isArray(data.keyPoints)   ? data.keyPoints   : []
  const ai = Array.isArray(data.actionItems) ? data.actionItems.filter(a => !a.toLowerCase().includes('no specific')) : []
  const [bg, accent] = moodStyle(data.mood)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      {/* sticky note */}
      <motion.div
        initial={{ opacity:0, rotate:-2.5, y:22, scale:0.97 }}
        animate={{ opacity:1, rotate:-0.7, y:0,  scale:1   }}
        transition={{ duration:0.6, type:'spring', stiffness:130 }}
        style={{
          background:'linear-gradient(155deg,#fffef5,#faf8e0)',
          borderRadius:20, padding:'26px 22px 20px',
          boxShadow:'3px 5px 24px rgba(200,180,100,0.2),0 1px 3px rgba(0,0,0,0.04)',
          position:'relative',
        }}
      >
        <div style={{
          position:'absolute', top:-7, left:'50%', transform:'translateX(-50%)',
          width:50, height:15, borderRadius:3,
          background:'rgba(240,200,120,0.5)',
        }}/>
        {data.mood && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:4,
            padding:'3px 10px', borderRadius:99, marginBottom:13,
            background:bg, border:`1px solid ${accent}28`,
            fontSize:10, fontWeight:600, color:accent,
          }}>
            {data.mood}
          </div>
        )}
        <p style={{
          fontFamily:"'DM Serif Display',serif",
          fontSize:'clamp(14px,3.6vw,16px)',
          lineHeight:1.78, color:'#3a3010', fontStyle:'italic',
        }}>{data.summary}</p>
        {data.wordCount && (
          <p style={{ fontSize:9.5, color:'#b8a020', marginTop:10, opacity:0.65 }}>
            {data.wordCount} words
          </p>
        )}
      </motion.div>

      {/* key points */}
      {kp.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {kp.map((pt,i) => (
            <motion.div key={i}
              initial={{ opacity:0, scale:0.82, y:8 }}
              animate={{ opacity:1, scale:1,    y:0 }}
              transition={{ delay:0.28+i*0.08, type:'spring', stiffness:260 }}
              style={{
                padding:'8px 13px', borderRadius:13,
                background:'rgba(255,255,255,0.8)',
                border:'1.2px solid rgba(208,188,232,0.35)',
                boxShadow:'0 2px 10px rgba(160,140,200,0.08)',
                fontSize:11.5, color:'#4a3f60', lineHeight:1.5,
                backdropFilter:'blur(8px)',
              }}
            >
              <span style={{ color:'#a87dd4', marginRight:5, fontSize:9 }}>◆</span>
              {pt}
            </motion.div>
          ))}
        </div>
      )}

      {/* actions */}
      {ai.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {ai.map((a,i) => (
            <motion.div key={i}
              initial={{ opacity:0, x:-14 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay:0.5+i*0.09, type:'spring', stiffness:200 }}
              style={{
                display:'flex', alignItems:'flex-start', gap:9,
                padding:'9px 13px', borderRadius:13,
                background:'rgba(255,255,255,0.75)',
                border:'1.2px solid rgba(184,212,200,0.45)',
                backdropFilter:'blur(8px)',
              }}
            >
              <motion.div
                initial={{ scale:0 }} animate={{ scale:1 }}
                transition={{ delay:0.6+i*0.09, type:'spring', stiffness:400 }}
                style={{
                  width:16, height:16, borderRadius:5, flexShrink:0, marginTop:1,
                  background:'linear-gradient(135deg,#b8d4c8,#7ab09a)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span style={{ fontSize:12, color:'#3a4a40', lineHeight:1.55 }}>{a}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [results,  setResults]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState(0)
  const [histOpen, setHistOpen] = useState(false)
  const [count,    setCount]    = useState(0)

  const handleLoading = v => {
    setLoading(v)
    if (v) {
      setResults(null); setStep(1)
      setTimeout(()=>setStep(2),7000)
      setTimeout(()=>setStep(3),14000)
    } else setTimeout(()=>setStep(0),300)
  }
  const handleResults = d => { setResults(d); if(d) setCount(n=>n+1) }

  return (
    <>
      <style>{`
        .page { min-height:100vh;background:var(--bg);position:relative;overflow-x:hidden; }

        /* blobs */
        .blob { position:fixed;pointer-events:none;z-index:0;filter:blur(60px); }
        .b1 { width:360px;height:360px;top:-100px;right:-80px;
              background:rgba(232,180,184,0.3);
              animation:blob-drift 12s ease-in-out infinite; }
        .b2 { width:300px;height:300px;bottom:0;left:-80px;
              background:rgba(208,188,232,0.22);
              animation:blob-drift 15s ease-in-out infinite 4s reverse; }
        .b3 { width:220px;height:220px;top:45%;right:-40px;
              background:rgba(184,208,232,0.2);
              animation:blob-drift 17s ease-in-out infinite 7s; }
        .b4 { width:180px;height:180px;top:28%;left:3%;
              background:rgba(184,212,200,0.18);
              animation:blob-drift 11s ease-in-out infinite 2s; }

        /* nav */
        .nav {
          position:sticky;top:0;z-index:30;
          display:flex;align-items:center;justify-content:space-between;
          padding:13px 22px;
          background:rgba(247,243,240,0.82);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border-bottom:1px solid rgba(232,180,184,0.14);
        }
        .logo {
          font-family:'DM Serif Display',serif;
          font-style:italic;font-size:22px;color:#2d2228;letter-spacing:-0.01em;
        }
        .nav-btn {
          display:flex;align-items:center;gap:6px;
          padding:6px 15px;border-radius:99px;
          background:rgba(255,255,255,0.85);
          border:1.2px solid rgba(232,180,184,0.35);
          font-family:'DM Sans',sans-serif;font-size:11.5px;font-weight:500;color:#6b5660;
          cursor:pointer;transition:all .2s;backdrop-filter:blur(8px);
          box-shadow:0 1px 8px rgba(200,160,168,0.1);
        }
        .nav-btn:hover { border-color:#d4878d;transform:translateY(-1px); }
        .n-dot {
          width:16px;height:16px;border-radius:50%;
          background:linear-gradient(135deg,#e8b4b8,#d0bce8);
          color:white;font-size:8px;font-weight:700;
          display:inline-flex;align-items:center;justify-content:center;
        }

        /* body */
        .body {
          position:relative;z-index:1;
          max-width:520px;margin:0 auto;
          padding:0 16px 90px;
          display:flex;flex-direction:column;gap:14px;
        }

        /* hero — with decorative band */
        .hero-band {
          padding:28px 0 20px;
          text-align:center;
          position:relative;
        }
        .hero-band::before {
          content:'';
          position:absolute;
          left:50%;transform:translateX(-50%);
          bottom:0;width:48px;height:2px;border-radius:99px;
          background:linear-gradient(90deg,#e8b4b8,#d0bce8);
          opacity:0.6;
        }
        .hero-band h1 {
          font-family:'DM Serif Display',serif;
          font-size:clamp(38px,10vw,58px);
          line-height:1.06;color:#2d2228;
          letter-spacing:-0.03em;
          margin-bottom:6px;
        }
        .hero-band h1 em { color:#c87080;font-style:italic; }
        .hero-sub {
          font-size:12.5px;color:#b8a0a8;
          font-weight:300;font-style:italic;letter-spacing:0.02em;
        }

        /* recorder card */
        .rec-card {
          background:rgba(255,255,255,0.68);
          border:1.2px solid rgba(255,255,255,0.94);
          border-radius:28px;
          padding:clamp(20px,5vw,32px);
          box-shadow:
            0 6px 36px rgba(200,160,168,0.12),
            0 1px 4px rgba(0,0,0,0.03),
            inset 0 1px 0 rgba(255,255,255,0.96);
          backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
          position:relative;overflow:hidden;
        }
        .rec-card::before {
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,#e8b4b8,#d0bce8,#b8cfe8,#b8d4c8,#f0d4b8,#e8b4b8);
          background-size:300% 100%;
          animation:shimmer 6s linear infinite;
        }

        /* loading card */
        .load-card {
          background:rgba(255,255,255,0.65);
          border:1.2px solid rgba(255,255,255,0.9);
          border-radius:20px;padding:18px 20px;
          box-shadow:0 3px 20px rgba(200,160,168,0.08);
          backdrop-filter:blur(16px);
        }

        /* result card */
        .result-card {
          background:rgba(255,255,255,0.62);
          border:1.2px solid rgba(255,255,255,0.9);
          border-radius:24px;padding:20px;
          box-shadow:0 6px 30px rgba(200,160,168,0.1),
                     inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter:blur(18px);
        }
        .result-bar {
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:15px;padding-bottom:12px;
          border-bottom:1px solid rgba(232,180,184,0.18);
        }
        .see-all {
          padding:4px 12px;border-radius:99px;
          background:transparent;border:1px solid rgba(232,180,184,0.4);
          font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;
          color:#d4878d;cursor:pointer;transition:all .18s;
        }
        .see-all:hover { background:rgba(232,180,184,0.1); }

        .footer-note {
          text-align:center;font-size:11px;color:#c8b0b8;
          font-weight:300;font-style:italic;padding-bottom:8px;
        }

        @media(min-width:560px){
          .nav  { padding:15px 32px; }
          .body { padding:0 20px 90px;gap:16px; }
        }
      `}</style>

      <div className="page">
        <div className="blob b1"/><div className="blob b2"/>
        <div className="blob b3"/><div className="blob b4"/>

        <motion.nav className="nav"
          initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
        >
          <span className="logo">Voca</span>
          <button className="nav-btn" onClick={() => setHistOpen(true)}>
            Notes
            {count > 0 && (
              <motion.span className="n-dot"
                initial={{ scale:0 }} animate={{ scale:1 }}
                transition={{ type:'spring', stiffness:500 }}
              >{count}</motion.span>
            )}
          </button>
        </motion.nav>

        <div className="body">

          {/* HERO */}
          <motion.div className="hero-band"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55, delay:0.06 }}
          >
            <h1>Voice,<br/><em>captured.</em></h1>
            <p className="hero-sub">record · transcribe · summarise</p>
          </motion.div>

          {/* RECORDER */}
          <motion.div className="rec-card"
            initial={{ opacity:0, y:22, scale:0.97 }}
            animate={{ opacity:1, y:0,  scale:1 }}
            transition={{ duration:0.55, delay:0.14, type:'spring', stiffness:160 }}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading}/>
          </motion.div>

          {/* LOADING */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-6 }} transition={{ duration:0.28 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
                  <motion.div
                    animate={{ rotate:360 }}
                    transition={{ duration:1.2, repeat:Infinity, ease:'linear' }}
                    style={{ width:13, height:13, borderRadius:'50', flexShrink:0,
                      border:'2px solid rgba(232,180,184,0.2)', borderTop:'2px solid #d4878d' }}
                  />
                  <span style={{ fontSize:12.5, fontWeight:400, color:'#2d2228', fontStyle:'italic',
                    fontFamily:"'DM Serif Display',serif" }}>
                    Processing…
                  </span>
                </div>
                {['Transcribing','Understanding','Summarising'].map((label,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6,
                    opacity:step===i+1?1:step>i+1?0.22:0.1, transition:'opacity 0.5s' }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, transition:'background 0.4s',
                      background:step>i+1?'#e8b4b8':step===i+1?'#d4878d':'rgba(232,180,184,0.2)' }}/>
                    <span style={{ fontSize:11.5, color:'#6b5660', fontWeight:step===i+1?500:300 }}>{label}</span>
                  </div>
                ))}
                <div style={{ height:2, background:'rgba(232,180,184,0.15)', borderRadius:99, marginTop:12, overflow:'hidden', position:'relative' }}>
                  <motion.div
                    style={{ position:'absolute', height:'100%', borderRadius:99, width:'30%',
                      background:'linear-gradient(90deg,#e8b4b8,#d0bce8,#b8cfe8)' }}
                    animate={{ left:['-30%','108%'] }}
                    transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTS */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-card"
                initial={{ opacity:0, y:16, scale:0.97 }}
                animate={{ opacity:1, y:0,  scale:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.45, type:'spring', stiffness:180 }}
              >
                <div className="result-bar">
                  <span style={{ fontSize:10, fontWeight:500, color:'#b8a0a8',
                    letterSpacing:'0.1em', textTransform:'uppercase' }}>note</span>
                  <button className="see-all" onClick={() => setHistOpen(true)}>all notes →</button>
                </div>
                <Result data={results}/>
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !loading && (
            <motion.p className="footer-note"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:1.3, duration:0.8 }}
            >
              🔒 never stored
            </motion.p>
          )}
        </div>
      </div>

      <HistoryPanel isOpen={histOpen} onClose={() => setHistOpen(false)}/>
    </>
  )
}