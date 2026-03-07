'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import HistoryPanel from './components/HistoryPanel'

/* ── tiny helpers ── */
const MOOD_MAP = {
  Focused:      { emoji:'🎯', bg:'#fff0f0', color:'#e63950' },
  Excited:      { emoji:'⚡', bg:'#fffbe0', color:'#d97706' },
  Casual:       { emoji:'😌', bg:'#edfff6', color:'#059669' },
  Professional: { emoji:'💼', bg:'#f0f4ff', color:'#4f46e5' },
  Urgent:       { emoji:'🔥', bg:'#fff0f0', color:'#dc2626' },
  Reflective:   { emoji:'🌙', bg:'#f5f0ff', color:'#7c3aed' },
}
const mood = (m) => MOOD_MAP[m] || { emoji:'💬', bg:'#f9f5ff', color:'#7c3aed' }

/* ── animated result card ── */
function SummaryCard({ results }) {
  const m = mood(results.mood)
  const kp = Array.isArray(results.keyPoints)   ? results.keyPoints   : []
  const ai = Array.isArray(results.actionItems) ? results.actionItems : []
  const validAi = ai.filter(a => !a.toLowerCase().includes('no specific'))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ── sticky note summary ── */}
      <motion.div
        initial={{ opacity:0, rotate:-3, y:24 }}
        animate={{ opacity:1, rotate:-1, y:0 }}
        transition={{ duration:0.6, type:'spring', stiffness:140 }}
        style={{
          background: 'linear-gradient(145deg, #fffde7 0%, #fff9c4 100%)',
          borderRadius: 18, padding: '22px 22px 26px',
          boxShadow: '4px 6px 28px rgba(249,199,79,0.28), 0 1px 4px rgba(0,0,0,0.06)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* tape strip */}
        <div style={{
          position:'absolute', top:-6, left:'50%', transform:'translateX(-50%)',
          width:56, height:18, borderRadius:4,
          background:'rgba(249,199,79,0.45)',
          backdropFilter:'blur(4px)',
        }}/>
        {/* mood badge */}
        <div style={{
          position:'absolute', top:14, right:14,
          display:'flex', alignItems:'center', gap:5,
          padding:'4px 10px', borderRadius:99,
          background: m.bg, border:`1.5px solid ${m.color}22`,
          fontSize:11, fontWeight:700, color:m.color,
        }}>
          {m.emoji} {results.mood}
        </div>
        <p style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:'clamp(14px,3.5vw,16px)',
          lineHeight:1.75, color:'#3d2c00',
          marginTop:14, paddingRight:80,
        }}>{results.summary}</p>
        {results.wordCount && (
          <p style={{ fontSize:10, color:'#b8960c', fontWeight:600, marginTop:12, letterSpacing:'0.06em' }}>
            {results.wordCount} words
          </p>
        )}
      </motion.div>

      {/* ── key point chips ── */}
      {kp.length > 0 && (
        <div>
          <motion.p
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
            style={{ fontSize:10, fontWeight:700, color:'var(--muted)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}
          >Key points</motion.p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {kp.map((pt, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:12, scale:0.88 }}
                animate={{ opacity:1, y:0,  scale:1 }}
                transition={{ delay:0.45 + i*0.09, type:'spring', stiffness:220 }}
                style={{
                  display:'flex', alignItems:'flex-start', gap:8,
                  padding:'9px 14px', borderRadius:14,
                  background:'rgba(255,255,255,0.85)',
                  border:'1.5px solid rgba(199,125,255,0.2)',
                  boxShadow:'0 2px 12px rgba(199,125,255,0.1)',
                  fontSize:12, color:'var(--text2)', fontWeight:500,
                  maxWidth:'100%', lineHeight:1.5,
                  backdropFilter:'blur(8px)',
                }}
              >
                <span style={{ color:'var(--lavender)', marginTop:1, fontSize:10 }}>◆</span>
                {pt}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── action items ── */}
      {validAi.length > 0 && (
        <div>
          <motion.p
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
            style={{ fontSize:10, fontWeight:700, color:'var(--muted)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8 }}
          >Actions</motion.p>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {validAi.map((a, i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:-16 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.75 + i*0.1, type:'spring', stiffness:200 }}
                style={{
                  display:'flex', alignItems:'flex-start', gap:10,
                  padding:'10px 14px', borderRadius:14,
                  background:'rgba(255,255,255,0.85)',
                  border:'1.5px solid rgba(67,217,173,0.22)',
                  boxShadow:'0 2px 10px rgba(67,217,173,0.1)',
                  backdropFilter:'blur(8px)',
                }}
              >
                <motion.div
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ delay:0.85 + i*0.1, type:'spring', stiffness:400 }}
                  style={{
                    width:18, height:18, borderRadius:6, flexShrink:0, marginTop:1,
                    background:'linear-gradient(135deg,#43d9ad,#74c0fc)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500, lineHeight:1.5 }}>{a}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── main page ── */
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
      setResults(null)
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
        .page { min-height:100vh; background:var(--bg); position:relative; overflow-x:hidden; }

        /* gradient blobs */
        .blob { position:fixed; border-radius:50%; pointer-events:none; z-index:0; filter:blur(60px); }
        .b1 { width:380px;height:380px;top:-120px;right:-100px;background:rgba(255,160,122,0.18);animation:drift 10s ease-in-out infinite; }
        .b2 { width:300px;height:300px;bottom:0;left:-80px;background:rgba(199,125,255,0.14);animation:drift 13s ease-in-out infinite reverse; }
        .b3 { width:220px;height:220px;top:42%;right:-60px;background:rgba(116,192,252,0.13);animation:drift 15s ease-in-out infinite 4s; }
        .b4 { width:180px;height:180px;top:25%;left:5%;background:rgba(67,217,173,0.1);animation:drift 11s ease-in-out infinite 2s; }

        /* nav */
        .nav {
          position:sticky;top:0;z-index:30;
          display:flex;align-items:center;justify-content:space-between;
          padding:13px 20px;
          background:rgba(254,249,244,0.78);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border-bottom:1px solid rgba(255,150,100,0.12);
        }
        .logo {
          font-family:'Playfair Display',serif;
          font-style:italic;font-size:23px;font-weight:700;
          background:linear-gradient(125deg,#ff6b6b,#ffa07a,#f9c74f);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          letter-spacing:-0.01em;
        }
        .nbtn {
          display:flex;align-items:center;gap:7px;
          padding:7px 16px;border-radius:99px;
          background:rgba(255,255,255,0.9);
          border:1.5px solid rgba(255,150,100,0.2);
          font-family:'Sora',sans-serif;font-size:12px;font-weight:600;
          color:var(--text2);cursor:pointer;
          box-shadow:0 2px 14px rgba(255,107,107,0.1);
          transition:all 0.2s;backdrop-filter:blur(8px);
        }
        .nbtn:hover { border-color:var(--peach);transform:translateY(-1px);box-shadow:0 6px 20px rgba(255,107,107,0.18); }
        .badge {
          min-width:17px;height:17px;border-radius:99px;padding:0 4px;
          background:linear-gradient(135deg,#ff6b6b,#ffa07a);
          color:white;font-size:9px;font-weight:800;
          display:inline-flex;align-items:center;justify-content:center;
        }

        /* body */
        .body { position:relative;z-index:1;max-width:540px;margin:0 auto;padding:20px 16px 90px;display:flex;flex-direction:column;gap:18px; }

        /* hero */
        .hero { text-align:center;padding:10px 4px 0; }
        .hero-eyebrow {
          display:inline-flex;align-items:center;gap:7px;
          padding:5px 16px;border-radius:99px;margin-bottom:16px;
          background:rgba(255,255,255,0.85);
          border:1.5px solid rgba(255,150,100,0.2);
          font-size:11px;font-weight:700;color:var(--peach);
          box-shadow:0 2px 12px rgba(255,150,100,0.12);
          backdrop-filter:blur(8px);
        }
        .hero h1 {
          font-family:'Playfair Display',serif;
          font-size:clamp(30px,8.5vw,48px);
          font-weight:700;line-height:1.12;color:var(--text);
          letter-spacing:-0.02em;margin-bottom:10px;
        }
        .hero h1 em {
          font-style:italic;
          background:linear-gradient(125deg,#ff6b6b,#ffa07a,#f9c74f);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .hero-sub { font-size:13px;color:var(--muted);font-weight:500;line-height:1.7;margin-bottom:16px; }
        .chips { display:flex;gap:7px;flex-wrap:wrap;justify-content:center; }
        .chip {
          display:inline-flex;align-items:center;gap:5px;
          padding:5px 13px;border-radius:99px;
          background:rgba(255,255,255,0.85);border:1.5px solid rgba(255,150,100,0.18);
          font-size:11px;color:var(--text2);font-weight:600;
          box-shadow:0 2px 8px rgba(255,107,107,0.07);
          backdrop-filter:blur(6px);transition:all 0.18s;cursor:default;
        }
        .chip:hover { transform:translateY(-2px);box-shadow:0 6px 16px rgba(255,107,107,0.14);border-color:var(--peach); }

        /* recorder glass card */
        .rec-card {
          background:rgba(255,255,255,0.72);
          border:1.5px solid rgba(255,255,255,0.9);
          border-radius:30px;
          padding:clamp(22px,5vw,36px);
          box-shadow:0 8px 40px rgba(255,107,107,0.1),0 2px 8px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,0.95);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          position:relative;overflow:hidden;
        }
        .rec-card::before {
          content:'';position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg,#ff6b6b,#ffa07a,#f9c74f,#43d9ad,#74c0fc,#c77dff,#ff6b6b);
          background-size:300% 100%;animation:shimmer-move 4s linear infinite;
        }

        /* loading */
        .load-card {
          background:rgba(255,255,255,0.72);
          border:1.5px solid rgba(255,255,255,0.9);
          border-radius:22px;padding:20px 22px;
          box-shadow:0 4px 24px rgba(255,107,107,0.08);
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        }

        /* result wrapper */
        .result-wrap {
          background:rgba(255,255,255,0.65);
          border:1.5px solid rgba(255,255,255,0.9);
          border-radius:24px;padding:22px;
          box-shadow:0 8px 36px rgba(255,107,107,0.09),inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
        }
        .result-header {
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:18px;padding-bottom:14px;
          border-bottom:1.5px solid rgba(255,150,100,0.12);
        }
        .all-btn {
          background:rgba(255,107,107,0.07);border:1.5px solid rgba(255,107,107,0.18);
          border-radius:99px;padding:4px 13px;cursor:pointer;
          font-family:'Sora',sans-serif;font-size:11px;font-weight:700;color:var(--rose);
          transition:all 0.18s;
        }
        .all-btn:hover { background:rgba(255,107,107,0.12);transform:translateY(-1px); }

        @media(min-width:560px){
          .nav  { padding:16px 32px; }
          .body { padding:28px 24px 90px;gap:20px; }
        }
      `}</style>

      <div className="page">
        <div className="blob b1"/><div className="blob b2"/>
        <div className="blob b3"/><div className="blob b4"/>

        {/* NAV */}
        <motion.header className="nav"
          initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.4 }}
        >
          <span className="logo">Voca</span>
          <button className="nbtn" onClick={() => setHistoryOpen(true)}>
            📋 Notes
            {noteCount > 0 && (
              <motion.span className="badge" initial={{scale:0}} animate={{scale:1}}
                transition={{type:'spring',stiffness:500,damping:20}}>
                {noteCount}
              </motion.span>
            )}
          </button>
        </motion.header>

        <div className="body">

          {/* HERO */}
          <motion.div className="hero"
            initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            transition={{duration:0.6,delay:0.08}}
          >
            <div className="hero-eyebrow">✦ AI voice notes ✦</div>
            <h1>Your voice,<br/><em>brilliantly captured.</em></h1>
            <p className="hero-sub">Record anything — meetings, ideas, thoughts.<br/>Get an instant smart summary.</p>
            <div className="chips">
              {[['🎙','Record'],['✍️','Transcribe'],['✨','Summarise'],['✅','Actions']].map(([icon,label],i)=>(
                <motion.span key={label} className="chip"
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  transition={{delay:0.5+i*0.07,type:'spring',stiffness:280}}
                >{icon} {label}</motion.span>
              ))}
            </div>
          </motion.div>

          {/* RECORDER */}
          <motion.div className="rec-card"
            initial={{opacity:0,y:22,scale:0.97}}
            animate={{opacity:1,y:0,scale:1}}
            transition={{duration:0.55,delay:0.18,type:'spring',stiffness:170}}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* LOADING */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{opacity:0,y:10,scale:0.97}}
                animate={{opacity:1,y:0,scale:1}}
                exit={{opacity:0,scale:0.97}}
                transition={{duration:0.3}}
              >
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}
                    style={{width:16,height:16,borderRadius:'50%',border:'2.5px solid rgba(255,150,100,0.2)',borderTop:'2.5px solid var(--rose)',flexShrink:0}}
                  />
                  <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>Making magic… ✨</span>
                </div>
                {['Transcribing your voice 🎙','Understanding your message 🧠','Building your summary 📝'].map((label,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:9,marginBottom:7,
                    opacity:step===i+1?1:step>i+1?0.3:0.15,transition:'opacity 0.5s'}}>
                    <motion.div animate={step===i+1?{scale:[1,1.8,1]}:{}} transition={{duration:0.6,repeat:Infinity}}
                      style={{width:6,height:6,borderRadius:'50%',flexShrink:0,transition:'background 0.5s',
                        background:step>i+1?'var(--peach)':step===i+1?'var(--rose)':'rgba(255,150,100,0.2)'}}
                    />
                    <span style={{fontSize:12,color:'var(--text2)',fontWeight:step===i+1?700:500}}>{label}</span>
                  </div>
                ))}
                <div style={{height:3,background:'rgba(255,150,100,0.12)',borderRadius:99,marginTop:14,overflow:'hidden',position:'relative'}}>
                  <motion.div
                    style={{position:'absolute',height:'100%',borderRadius:99,width:'40%',background:'linear-gradient(90deg,#ff6b6b,#ffa07a,#f9c74f)'}}
                    animate={{left:['-40%','110%']}} transition={{duration:1.6,repeat:Infinity,ease:'easeInOut'}}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTS */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-wrap"
                initial={{opacity:0,y:18,scale:0.97}}
                animate={{opacity:1,y:0,scale:1}}
                exit={{opacity:0}}
                transition={{duration:0.5,type:'spring',stiffness:180}}
              >
                <div className="result-header">
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <motion.span initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400}}>
                      ✨
                    </motion.span>
                    <span style={{fontSize:11,fontWeight:800,color:'var(--text)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Your Note</span>
                  </div>
                  <button className="all-btn" onClick={() => setHistoryOpen(true)}>All notes →</button>
                </div>
                <SummaryCard results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAGLINE */}
          <AnimatePresence>
            {!hasRecorded && (
              <motion.p
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                transition={{delay:1.1,duration:0.9}}
                style={{textAlign:'center',fontSize:12,color:'var(--muted)',fontWeight:500,marginTop:2}}
              >
                🔒 Recordings are never stored
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}
