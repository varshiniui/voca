'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

const spring = { type:'spring', stiffness:260, damping:22 }

/* ── 3D tilt card wrapper ── */
function TiltCard({ children, className, style }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-0.5, 0.5], [6, -6])
  const rotateY = useTransform(x, [-0.5, 0.5], [-6, 6])

  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top)  / rect.height - 0.5)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX, rotateY, transformStyle:'preserve-3d', transformPerspective:900 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      transition={{ type:'spring', stiffness:180, damping:24 }}
    >
      {children}
    </motion.div>
  )
}

/* ── Floating orb ── */
function Orb({ color, size, top, left, delay, blur=80 }) {
  return (
    <div style={{
      position:'fixed', borderRadius:'50%',
      width:size, height:size, top, left,
      background:color, filter:`blur(${blur}px)`,
      opacity:0.35, pointerEvents:'none', zIndex:0,
      animation:`orb-drift ${14+delay}s ease-in-out infinite`,
      animationDelay:`${delay}s`,
    }}/>
  )
}

/* ── Small floating badge chip ── */
function FloatingChip({ label, bg, color, style }) {
  return (
    <motion.div
      style={{
        position:'absolute',
        background:bg, color,
        border:'2px solid rgba(30,20,40,0.12)',
        borderRadius:99, padding:'6px 14px',
        fontSize:11, fontWeight:800,
        fontFamily:"'Syne',sans-serif",
        letterSpacing:'0.06em',
        boxShadow:`0 8px 24px ${bg}80, 0 2px 0 rgba(0,0,0,0.08)`,
        whiteSpace:'nowrap',
        zIndex:2,
        ...style,
      }}
      animate={{ y:[0,-8,0], rotate:[0,2,-2,0] }}
      transition={{ duration:4+Math.random()*2, repeat:Infinity, ease:'easeInOut', delay:Math.random()*2 }}
    >
      {label}
    </motion.div>
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
      setHasRecorded(true); setStep(1)
      setTimeout(()=>setStep(2),7000)
      setTimeout(()=>setStep(3),14000)
    } else { setTimeout(()=>setStep(0),300) }
  }
  const handleResults = (data) => {
    setResults(data)
    if (data) setNoteCount(n=>n+1)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

        .page {
          min-height:100vh;
          background: linear-gradient(145deg, #f0eaff 0%, #fde8f4 35%, #e8f4ff 65%, #edfff7 100%);
          font-family:'Syne',sans-serif;
          position:relative; overflow-x:hidden;
        }

        /* ── Marquee ticker ── */
        .ticker-wrap {
          overflow:hidden;
          background:#1e1428;
          border-bottom:none;
          padding:10px 0;
          position:relative; z-index:10;
        }
        .ticker-track {
          display:flex; width:max-content;
          animation:marquee 22s linear infinite;
        }
        .ticker-item {
          font-size:11px; font-weight:700;
          letter-spacing:0.14em; text-transform:uppercase;
          color:#f0eaff; padding:0 28px;
          white-space:nowrap;
          display:flex; align-items:center; gap:12px;
        }
        .t-dot {
          width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0;
        }

        /* ── Nav ── */
        .nav {
          position:sticky; top:0; z-index:30;
          display:flex; align-items:center; justify-content:space-between;
          padding:15px 28px;
          background:rgba(240,234,255,0.80);
          backdrop-filter:blur(24px);
          -webkit-backdrop-filter:blur(24px);
          border-bottom:2px solid rgba(30,20,40,0.10);
        }
        .logo {
          font-family:'Instrument Serif',serif;
          font-style:italic; font-size:26px;
          color:#1e1428; letter-spacing:-0.02em;
          display:flex; align-items:center; gap:10px;
        }
        .logo-badge {
          font-family:'Syne',sans-serif;
          font-style:normal; font-size:9px; font-weight:800;
          letter-spacing:0.12em; text-transform:uppercase;
          background:#ffe882; color:#1e1428;
          border:2px solid #1e1428;
          padding:3px 9px; border-radius:6px;
          box-shadow:2px 2px 0 #1e1428;
        }

        .notes-btn {
          display:flex; align-items:center; gap:8px;
          padding:9px 22px;
          background:white;
          border:2px solid #1e1428;
          border-radius:99px;
          font-family:'Syne',sans-serif;
          font-size:12px; font-weight:800;
          color:#1e1428; cursor:pointer;
          letter-spacing:0.04em;
          box-shadow:3px 3px 0 #1e1428;
          transition:all 0.18s;
        }
        .notes-btn:hover {
          background:#d4bfff;
          transform:translate(-1px,-2px);
          box-shadow:4px 5px 0 #1e1428;
        }
        .badge {
          min-width:18px; height:18px; border-radius:99px; padding:0 5px;
          background:#ff7b6b; color:white;
          font-size:9px; font-weight:800;
          display:inline-flex; align-items:center; justify-content:center;
        }

        /* ── Body ── */
        .body {
          position:relative; z-index:1;
          max-width:560px; margin:0 auto;
          padding:44px 22px 100px;
          display:flex; flex-direction:column; gap:22px;
        }

        /* ── Hero ── */
        .hero { text-align:center; padding:4px 0 10px; position:relative; }
        .eyebrow {
          display:inline-flex; align-items:center; gap:8px;
          padding:7px 20px; border-radius:99px; margin-bottom:24px;
          background:white;
          border:2px solid #1e1428;
          font-size:10px; font-weight:800; color:#1e1428;
          letter-spacing:0.12em; text-transform:uppercase;
          box-shadow:3px 3px 0 #1e1428;
        }
        .eyebrow-dot { width:7px;height:7px;border-radius:50%;background:#ffb3a7;display:inline-block; }

        .hero h1 {
          font-family:'Instrument Serif',serif;
          font-size:clamp(36px,9.5vw,56px);
          font-weight:400; line-height:1.12;
          color:#1e1428; letter-spacing:-0.025em;
          margin-bottom:16px;
        }
        .hero h1 em {
          font-style:italic;
          background:linear-gradient(135deg,#d4608c,#8a68d4,#3dbda3);
          background-size:200%;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 5s linear infinite;
        }

        .hero-sub {
          font-size:14px; color:#4a3f60; font-weight:500;
          line-height:1.7; margin-bottom:26px; letter-spacing:0.02em;
        }

        /* ── Pills ── */
        .pills { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
        .pill {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 18px; border-radius:99px;
          border:2px solid #1e1428;
          font-size:12px; font-weight:700; letter-spacing:0.04em;
          cursor:default; transition:all 0.2s;
          box-shadow:3px 3px 0 #1e1428;
        }
        .pill:hover { transform:translate(-1px,-3px); box-shadow:4px 6px 0 #1e1428; }
        .p-coral  { background:#ffe8e4; color:#1e1428; }
        .p-lemon  { background:#fff8cc; color:#1e1428; }
        .p-mint   { background:#d4f7f0; color:#1e1428; }
        .p-lilac  { background:#ede5ff; color:#1e1428; }

        /* ── 3D Recorder card ── */
        .rec-card {
          background:white;
          border:2px solid rgba(30,20,40,0.14);
          border-radius:32px;
          padding:clamp(26px,5vw,40px);
          position:relative; overflow:hidden;
          /* layered shadow = 3D lift effect */
          box-shadow:
            0 1px 0 rgba(255,255,255,0.9) inset,
            0 -1px 0 rgba(0,0,0,0.04) inset,
            0 4px 0  #e0d4f8,
            0 8px 0  #cdc0f0,
            0 12px 0 #baaee8,
            0 16px 32px rgba(138,104,212,0.18),
            0 2px 6px rgba(0,0,0,0.06);
          transform:translateY(0);
          transition:transform 0.35s ease, box-shadow 0.35s ease;
        }
        .rec-card:hover {
          transform:translateY(-4px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.9) inset,
            0 4px 0  #e0d4f8,
            0 8px 0  #cdc0f0,
            0 12px 0 #baaee8,
            0 18px 0 #a89de0,
            0 24px 48px rgba(138,104,212,0.22),
            0 4px 8px rgba(0,0,0,0.08);
        }
        .rec-card::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:4px;
          background:linear-gradient(90deg,#ffb3a7,#ffe882,#8eecd8,#d4bfff,#ffb8d0,#ffb3a7);
          background-size:300% 100%;
          animation:shimmer 5s linear infinite;
        }

        /* ── 3D colour stat chips above card ── */
        .stat-chips {
          display:flex; gap:10px; justify-content:center;
          margin-bottom:-10px; position:relative; z-index:2;
        }
        .stat-chip {
          padding:6px 16px;
          border-radius:99px;
          border:2px solid rgba(30,20,40,0.15);
          font-size:11px; font-weight:800;
          letter-spacing:0.05em;
          box-shadow:0 6px 20px rgba(0,0,0,0.10), 0 2px 0 rgba(0,0,0,0.08);
        }

        /* ── Load card ── */
        .load-card {
          background:white;
          border:2px solid rgba(30,20,40,0.12);
          border-radius:24px; padding:24px 26px;
          box-shadow:
            0 4px 0 #e0d4f8,
            0 8px 0 #cdc0f0,
            0 14px 28px rgba(138,104,212,0.14);
        }

        /* ── Result card ── */
        .result-wrap {
          background:white;
          border:2px solid rgba(30,20,40,0.12);
          border-radius:28px; padding:28px;
          box-shadow:
            0 4px 0 #f8c4d4,
            0 8px 0 #f0aec0,
            0 16px 32px rgba(212,96,140,0.14);
          position:relative; overflow:hidden;
        }
        .result-wrap::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:4px;
          background:linear-gradient(90deg,#ffb3a7,#ffe882,#8eecd8,#d4bfff);
        }

        .footer-note {
          text-align:center; font-size:12px;
          color:#9080b0; font-weight:600; letter-spacing:0.05em;
        }

        @media(min-width:560px){
          .nav  { padding:18px 40px; }
          .body { padding:48px 32px 100px; }
        }
      `}</style>

      <div className="page">
        {/* ── Pastel orbs ── */}
        <Orb color="#ffb3a7" size={480} top="-140px" left="-100px"  delay={0}  blur={90}/>
        <Orb color="#d4bfff" size={400} top="10%"   left="60%"     delay={3}  blur={80}/>
        <Orb color="#8eecd8" size={360} top="55%"   left="-80px"   delay={6}  blur={80}/>
        <Orb color="#ffe882" size={300} top="30%"   left="70%"     delay={2}  blur={70}/>
        <Orb color="#ffb8d0" size={260} top="75%"   left="50%"     delay={8}  blur={70}/>
        <Orb color="#a8d8f0" size={220} top="20%"   left="20%"     delay={4}  blur={60}/>

        {/* ── Ticker ── */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...Array(2)].map((_,rep) =>
              ['Record','Transcribe','Summarise','Action Items','Multi-language','AI-powered'].map((t,i) => (
                <span key={`${rep}-${i}`} className="ticker-item">
                  {t}
                  <span className="t-dot" style={{ background:['#ffb3a7','#ffe882','#8eecd8','#d4bfff','#ffb8d0','#a8d8f0'][i] }}/>
                </span>
              ))
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <motion.header className="nav"
          initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.45 }}
        >
          <div className="logo">
            Voca
            <span className="logo-badge">AI</span>
          </div>
          <motion.button className="notes-btn"
            onClick={() => setHistoryOpen(true)}
            whileTap={{ scale:0.94 }}
          >
            My Notes
            {noteCount > 0 && (
              <motion.span className="badge"
                initial={{ scale:0 }} animate={{ scale:1 }}
                transition={{ type:'spring', stiffness:500 }}
              >{noteCount}</motion.span>
            )}
          </motion.button>
        </motion.header>

        <div className="body">

          {/* ── Hero ── */}
          <motion.div className="hero"
            initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55, delay:0.12 }}
          >
            {/* floating decorative chips */}
            <FloatingChip label="✦ NEW"      bg="#ffe882" color="#1e1428" style={{ top:'-10px', left:'4%' }}/>
            <FloatingChip label="AI-powered" bg="#d4bfff" color="#4a3f60" style={{ top:'30px',  right:'2%' }}/>
            <FloatingChip label="Free"       bg="#8eecd8" color="#1e1428" style={{ bottom:'-8px',left:'12%' }}/>

            <div className="eyebrow">
              <span className="eyebrow-dot"/>
              Voice Journal
            </div>

            <h1>
              Speak your mind.<br/>
              <em>We'll handle the rest.</em>
            </h1>

            <p className="hero-sub">
              Record a thought · get a beautiful summary · keep your day.
            </p>

            <div className="pills">
              {[['Record','p-coral'],['Transcribe','p-lemon'],['Summarise','p-mint'],['Actions','p-lilac']].map(([l,c],i) => (
                <motion.span key={l} className={`pill ${c}`}
                  initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.45+i*0.08, ...spring }}
                >{l}</motion.span>
              ))}
            </div>
          </motion.div>

          {/* ── Stat chips ── */}
          <motion.div className="stat-chips"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.5, ...spring }}
          >
            {[
              { label:'Instant',  bg:'#ffe8e4', dk:'#e8826e' },
              { label:'Accurate', bg:'#d4f7f0', dk:'#3dbda3' },
              { label:'Private',  bg:'#ede5ff', dk:'#8a68d4' },
            ].map(({ label, bg, dk }) => (
              <div key={label} className="stat-chip" style={{ background:bg, color:dk }}>
                {label}
              </div>
            ))}
          </motion.div>

          {/* ── Recorder (3D tilt) ── */}
          <TiltCard
            className="rec-card"
            style={{ animationDelay:'0.28s' }}
          >
            <motion.div
              initial={{ opacity:0, y:28, scale:0.95 }}
              animate={{ opacity:1, y:0, scale:1 }}
              transition={{ delay:0.28, ...spring }}
            >
              <Recorder onResults={handleResults} onLoading={handleLoading} />
            </motion.div>
          </TiltCard>

          {/* ── Loading ── */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{ opacity:0, y:14, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, scale:0.96 }}
                transition={{ duration:0.28 }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <motion.div
                    animate={{ rotate:360 }}
                    transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                    style={{
                      width:18, height:18, borderRadius:'50%',
                      border:'2.5px solid #ede5ff',
                      borderTop:'2.5px solid #8a68d4',
                      flexShrink:0,
                    }}
                  />
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:'#1e1428' }}>
                    Working on it…
                  </span>
                </div>

                {[
                  ['Transcribing your voice',    '#ffe8e4','#e8826e'],
                  ['Understanding the meaning',  '#fff8cc','#c4a000'],
                  ['Writing your summary',       '#d4f7f0','#3dbda3'],
                ].map(([label, bg, col], i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:10, marginBottom:9,
                    opacity: step===i+1 ? 1 : step>i+1 ? 0.35 : 0.18,
                    transition:'opacity 0.4s',
                  }}>
                    <motion.div
                      style={{
                        width:9, height:9, borderRadius:'50%', flexShrink:0,
                        background: step>i+1 ? col : step===i+1 ? col : '#e0d4f8',
                        transition:'background 0.4s',
                      }}
                      animate={step===i+1 ? { scale:[1,1.6,1] } : {}}
                      transition={{ duration:0.8, repeat:Infinity }}
                    />
                    <span style={{
                      fontFamily:"'Syne',sans-serif", fontSize:13,
                      fontWeight: step===i+1 ? 700 : 500,
                      color: step===i+1 ? '#1e1428' : '#9080b0',
                    }}>{label}</span>
                    {step>i+1 && (
                      <span style={{ marginLeft:'auto', fontSize:11, fontWeight:800, color:'#3dbda3' }}>✓</span>
                    )}
                  </div>
                ))}

                <div style={{ height:5, background:'#ede5ff', borderRadius:99, marginTop:18, overflow:'hidden', position:'relative', borderRadius:99 }}>
                  <motion.div
                    style={{
                      position:'absolute', height:'100%', width:'40%', borderRadius:99,
                      background:'linear-gradient(90deg,#d4bfff,#ffb3a7,#8eecd8)',
                    }}
                    animate={{ left:['-40%','110%'] }}
                    transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results ── */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-wrap"
                initial={{ opacity:0, y:22, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.4, ...spring }}
              >
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:20, paddingBottom:16,
                  borderBottom:'2px solid #f0eaff',
                }}>
                  <span style={{
                    fontFamily:"'Syne',sans-serif",
                    fontWeight:800, fontSize:11,
                    letterSpacing:'0.1em', textTransform:'uppercase',
                    color:'#1e1428',
                  }}>Note Summary</span>
                  <button onClick={() => setHistoryOpen(true)} style={{
                    background:'#ffe882',
                    border:'2px solid #1e1428',
                    borderRadius:99, padding:'5px 16px',
                    cursor:'pointer',
                    fontFamily:"'Syne',sans-serif",
                    fontSize:11, fontWeight:800, color:'#1e1428',
                    boxShadow:'2px 2px 0 #1e1428',
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translate(-1px,-2px)'; e.currentTarget.style.boxShadow='3px 4px 0 #1e1428'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translate(0,0)'; e.currentTarget.style.boxShadow='2px 2px 0 #1e1428'; }}
                  >All notes →</button>
                </div>
                <ResultCard results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer ── */}
          <AnimatePresence>
            {!hasRecorded && (
              <motion.p className="footer-note"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ delay:1.4, duration:0.9 }}
              >
                Your recordings are never stored
              </motion.p>
            )}
          </AnimatePresence>

        </div>
      </div>

      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}