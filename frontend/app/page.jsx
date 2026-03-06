'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

const sp = { type:'spring', stiffness:280, damping:24 }

const WBAR_COLORS = ['#ff8c69','#ffd166','#85e89d','#74c7f5','#c9a7ff','#ffadd2','#ff8c69','#ffd166','#85e89d','#74c7f5','#c9a7ff','#ffadd2']

export default function Home() {
  const [results,     setResults]     = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [step,        setStep]        = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [noteCount,   setNoteCount]   = useState(0)
  const [activeNav,   setActiveNav]   = useState('home')

  const handleLoading = (v) => {
    setLoading(v)
    if (v) {
      setHasRecorded(true); setStep(1)
      setTimeout(()=>setStep(2),7000)
      setTimeout(()=>setStep(3),14000)
    } else setTimeout(()=>setStep(0),300)
  }
  const handleResults = (data) => {
    setResults(data)
    if (data) setNoteCount(n=>n+1)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

        .page{
          max-width:430px;margin:0 auto;
          min-height:100vh;display:flex;flex-direction:column;
          background:#faf5eb;
          font-family:'DM Sans',sans-serif;
          position:relative;overflow-x:hidden;
          background-image:radial-gradient(circle,rgba(26,15,46,.07) 1px,transparent 1px);
          background-size:22px 22px;
        }

        /* ── Retro banner ── */
        .banner{overflow:hidden;background:#1a0f2e;padding:9px 0 0;flex-shrink:0}
        .b-track{display:flex;width:max-content;animation:marquee 20s linear infinite}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .b-item{
          font-family:'Unbounded',sans-serif;
          font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
          color:#faf5eb;padding:0 22px;white-space:nowrap;
          display:flex;align-items:center;gap:10px;
        }
        .b-wave{display:block;width:100%;height:16px}

        /* ── Status + topnav ── */
        .status{
          display:flex;justify-content:space-between;align-items:center;
          padding:10px 20px 2px;
          font-family:'Unbounded',sans-serif;font-size:10px;font-weight:700;color:#3d2f5a;
        }
        .topnav{
          display:flex;align-items:center;justify-content:space-between;
          padding:8px 20px 14px;
        }
        .logo{
          font-family:'Unbounded',sans-serif;
          font-size:22px;font-weight:900;color:#1a0f2e;
          letter-spacing:-.03em;display:flex;align-items:center;
        }
        .logo-o{
          display:inline-block;width:24px;height:24px;border-radius:50%;
          background:#ff8c69;border:2.5px solid #1a0f2e;
          box-shadow:2px 2px 0 #1a0f2e;
          vertical-align:middle;margin:-2px -1px 0;
        }
        .top-btn{
          width:40px;height:40px;border-radius:14px;
          background:white;border:2px solid #1a0f2e;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;cursor:pointer;
          box-shadow:2px 2px 0 #1a0f2e;transition:all .15s;
          position:relative;
        }
        .top-btn:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 #1a0f2e}
        .top-badge{
          position:absolute;top:-5px;right:-5px;
          width:16px;height:16px;border-radius:50%;
          background:#ff8c69;border:1.5px solid #1a0f2e;
          font-family:'Unbounded',sans-serif;font-size:7px;font-weight:900;
          color:white;display:flex;align-items:center;justify-content:center;
        }

        /* ── Scroll body ── */
        .scroll{
          flex:1;overflow-y:auto;
          padding:4px 18px 110px;
          display:flex;flex-direction:column;gap:14px;
        }
        .scroll::-webkit-scrollbar{display:none}

        /* ── Greeting card ── */
        .greet{
          border:2.5px solid #1a0f2e;border-radius:24px;
          padding:20px 22px;position:relative;overflow:hidden;
          box-shadow:4px 4px 0 #1a0f2e;
        }
        .greet-blob{
          position:absolute;right:-24px;top:-24px;
          width:110px;height:110px;border-radius:50%;
          opacity:.3;
        }
        .greet-blob2{
          position:absolute;left:-16px;bottom:-24px;
          width:80px;height:80px;border-radius:50%;
          opacity:.15;background:#1a0f2e;
        }
        .greet-tag{
          display:inline-flex;align-items:center;gap:5px;
          background:#1a0f2e;color:#faf5eb;
          border-radius:99px;padding:4px 12px;
          font-family:'Unbounded',sans-serif;
          font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
          margin-bottom:10px;
        }
        .greet-title{
          font-family:'Unbounded',sans-serif;
          font-size:20px;font-weight:900;color:#1a0f2e;
          line-height:1.2;letter-spacing:-.02em;margin-bottom:5px;
        }
        .greet-sub{font-size:13px;color:#3d2f5a;font-weight:400;line-height:1.5}

        /* ── Section label ── */
        .slbl{
          font-family:'Unbounded',sans-serif;
          font-size:10px;font-weight:700;color:#3d2f5a;
          letter-spacing:.08em;text-transform:uppercase;
          padding:0 2px;
        }

        /* ── Main mic card ── */
        .mic-card{
          background:white;border:2.5px solid #1a0f2e;
          border-radius:28px;padding:26px 22px;
          box-shadow:4px 4px 0 #1a0f2e;
          display:flex;flex-direction:column;align-items:center;gap:20px;
          position:relative;overflow:hidden;
        }
        .mic-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:5px;
          background:linear-gradient(90deg,#ff8c69,#ffd166,#85e89d,#74c7f5,#c9a7ff,#ffadd2);
        }
        .lang-row{width:100%;display:flex;justify-content:flex-end}
        .lang-pill{
          display:flex;align-items:center;gap:5px;
          padding:5px 12px;background:#faf5eb;
          border:2px solid #1a0f2e;border-radius:99px;
          font-family:'DM Sans',sans-serif;
          font-size:12px;font-weight:500;color:#3d2f5a;
          cursor:pointer;box-shadow:1px 1px 0 #1a0f2e;transition:all .15s;
        }
        .lang-pill:hover{background:#c9a7ff}

        /* mic button */
        .mic-outer{
          width:100px;height:100px;border-radius:50%;
          border:2.5px solid #1a0f2e;
          display:flex;align-items:center;justify-content:center;
          box-shadow:4px 4px 0 #1a0f2e;
          transition:all .2s;cursor:pointer;
        }
        .mic-outer:hover{transform:scale(1.06) translate(-2px,-2px);box-shadow:6px 6px 0 #1a0f2e}
        .mic-outer:active{transform:scale(.97) translate(1px,1px);box-shadow:2px 2px 0 #1a0f2e}
        .mic-inner{
          width:56px;height:56px;border-radius:50%;
          background:#1a0f2e;
          display:flex;align-items:center;justify-content:center;
        }
        .mic-inner svg{width:24px;height:24px;stroke:#faf5eb;stroke-width:2;fill:none}

        .mic-lbl{
          font-family:'Unbounded',sans-serif;
          font-size:13px;font-weight:700;color:#1a0f2e;
          text-align:center;letter-spacing:-.01em;line-height:1.4;
        }
        .mic-sub{font-size:11px;color:#8070a0;text-align:center;font-weight:400;margin-top:-12px}



        /* ── Loading card ── */
        .load-card{
          background:white;border:2.5px solid #1a0f2e;
          border-radius:24px;padding:22px;
          box-shadow:4px 4px 0 #1a0f2e;
        }
        .load-head{
          display:flex;align-items:center;gap:10px;
          margin-bottom:18px;
          font-family:'Unbounded',sans-serif;font-size:13px;font-weight:700;color:#1a0f2e;
        }
        .spin{
          width:18px;height:18px;border-radius:50%;
          border:2.5px solid #ede5ff;border-top:2.5px solid #c9a7ff;
          animation:spin 1s linear infinite;flex-shrink:0;
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        .lstep{
          display:flex;align-items:center;gap:10px;
          padding:8px 12px;border-radius:12px;margin-bottom:7px;
          transition:all .3s;
        }
        .lstep.active{background:#faf5eb;border:1.5px solid #1a0f2e}
        .lstep.done{opacity:.38}
        .lstep.idle{opacity:.17}
        .ldot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
        .ltxt{font-size:12px;font-weight:500;color:#1a0f2e}
        .lchk{margin-left:auto;font-size:11px;font-weight:800;color:#85e89d}
        .prog{height:6px;background:#ede5ff;border-radius:99px;overflow:hidden;position:relative;margin-top:14px}
        .prog-worm{
          position:absolute;height:100%;width:40%;border-radius:99px;
          background:linear-gradient(90deg,#c9a7ff,#ff8c69,#85e89d,#ffd166);
          animation:worm 1.8s ease-in-out infinite;
        }
        @keyframes worm{0%{left:-40%;width:40%}50%{left:30%;width:60%}100%{left:110%;width:40%}}

        /* ── Result wrapper ── */
        .res-wrap{
          background:white;border:2.5px solid #1a0f2e;
          border-radius:24px;overflow:hidden;
          box-shadow:4px 4px 0 #1a0f2e;
          position:relative;
        }
        .res-wrap::before{
          content:'';position:absolute;top:0;left:0;right:0;height:4px;
          background:linear-gradient(90deg,#ff8c69,#ffd166,#85e89d,#74c7f5,#c9a7ff,#ffadd2);
        }
        .res-head{
          display:flex;align-items:center;justify-content:space-between;
          padding:18px 20px 14px;
          border-bottom:2px solid rgba(26,15,46,.07);
        }
        .res-title{
          font-family:'Unbounded',sans-serif;
          font-size:10px;font-weight:700;color:#1a0f2e;
          letter-spacing:.08em;text-transform:uppercase;
        }
        .res-btn{
          background:#ffd166;border:2px solid #1a0f2e;
          border-radius:99px;padding:4px 12px;
          font-family:'Unbounded',sans-serif;font-size:8px;font-weight:700;color:#1a0f2e;
          box-shadow:2px 2px 0 #1a0f2e;cursor:pointer;transition:all .14s;
        }
        .res-btn:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 #1a0f2e}
        .res-body{padding:16px 20px 20px}

        /* ── Bottom nav ── */
        .bnav{
          position:fixed;bottom:0;left:50%;transform:translateX(-50%);
          width:100%;max-width:430px;
          background:white;border-top:2.5px solid #1a0f2e;
          padding:10px 20px 26px;
          display:flex;justify-content:space-around;
          z-index:50;
        }
        .ni{
          display:flex;flex-direction:column;align-items:center;gap:3px;
          cursor:pointer;opacity:.38;transition:all .15s;flex:1;
        }
        .ni.on{opacity:1}
        .ni:hover{opacity:.8;transform:translateY(-2px)}
        .ni-icon{
          width:44px;height:38px;border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
        }
        .ni.on .ni-icon{
          background:#1a0f2e;
          box-shadow:2px 2px 0 rgba(26,15,46,.25);
        }
        .ni-lbl{
          font-family:'Unbounded',sans-serif;
          font-size:7px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#1a0f2e;
        }

        /* ── Waveform bars (rainbow) ── */
        .wave-row{display:flex;align-items:center;gap:3px;height:32px}
        .wbar{
          width:3.5px;border-radius:3px;
          animation:wbar .7s ease-in-out infinite;transform-origin:bottom;
        }
        @keyframes wbar{0%,100%{transform:scaleY(.2)}50%{transform:scaleY(1)}}

        @media(max-width:390px){
          .greet-title{font-size:18px}
          .mic-outer{width:90px;height:90px}
          .mic-inner{width:50px;height:50px}
        }
      `}</style>

      <div className="page">

        {/* ── Banner ── */}
        <div className="banner">
          <div className="b-track">
            {['Record','Transcribe','Summarise','Actions','AI-powered','Multi-lang',
              'Record','Transcribe','Summarise','Actions','AI-powered','Multi-lang'].map((t,i)=>(
              <span key={i} className="b-item">{t} <span>✦</span></span>
            ))}
          </div>
          <svg className="b-wave" viewBox="0 0 390 16" preserveAspectRatio="none">
            <path d="M0,16 Q48,0 97,9 T194,5 T292,11 T390,3 L390,16 Z" fill="#faf5eb"/>
          </svg>
        </div>

        {/* ── Status ── */}
        <div className="status">
          <span>9:41</span>
          <span>●●● 🔋</span>
        </div>

        {/* ── Top nav ── */}
        <div className="topnav">
          <div className="logo">V<span className="logo-o"/>CA</div>
          <motion.button className="top-btn" onClick={()=>setHistoryOpen(true)} whileTap={{scale:.9}}>
            📋
            {noteCount>0 && <span className="top-badge">{noteCount}</span>}
          </motion.button>
        </div>

        {/* ── Scroll body ── */}
        <div className="scroll">

          {/* Greeting card — colour changes with state */}
          <motion.div
            className="greet"
            style={{ background: loading ? '#c9a7ff' : results ? '#85e89d' : '#ffd166' }}
            layout transition={sp}
          >
            <div className="greet-blob" style={{ background: loading?'#ffadd2':results?'#74c7f5':'#ff8c69' }}/>
            <div className="greet-blob2"/>
            <div className="greet-tag">
              {loading ? '⚡ Processing' : results ? '✦ Done!' : '✦ Voice Journal'}
            </div>
            <div className="greet-title">
              {loading ? 'Working\non it…' : results ? "Here's\nyour note!" : 'Hey there,\nready to record?'}
            </div>
            <div className="greet-sub">
              {loading ? 'AI magic in progress' : results ? 'Tap "All notes" to save' : "Speak your mind · we'll handle the rest"}
            </div>
          </motion.div>

          {/* ── Recorder section ── */}
          {!results && (
            <>
              <div className="slbl">Record a note</div>
              <div className="mic-card">
                <div className="lang-row">
                  <div className="lang-pill">🇬🇧 English ▾</div>
                </div>
                <Recorder onResults={handleResults} onLoading={handleLoading}/>
              </div>
            </>
          )}

          {/* ── Loading ── */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
                exit={{opacity:0}} transition={sp}
              >
                <div className="load-head">
                  <div className="spin"/>
                  Analysing your note
                </div>
                {[
                  ['Transcribing your voice',   '#85e89d'],
                  ['Understanding the meaning', '#ffd166'],
                  ['Writing your summary',      '#c9a7ff'],
                ].map(([label,col],i)=>(
                  <div key={i} className={`lstep ${step===i+1?'active':step>i+1?'done':'idle'}`}>
                    <motion.div className="ldot"
                      style={{background:step>i+1?col:step===i+1?col:'#e0d4f8'}}
                      animate={step===i+1?{scale:[1,1.6,1]}:{}}
                      transition={{duration:.8,repeat:Infinity}}
                    />
                    <span className="ltxt" style={{fontWeight:step===i+1?700:500}}>{label}</span>
                    {step>i+1 && <span className="lchk">✓</span>}
                  </div>
                ))}
                <div className="prog"><div className="prog-worm"/></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Result ── */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div
                initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
                exit={{opacity:0}} transition={sp}
              >
                <div className="res-wrap">
                  <div className="res-head">
                    <span className="res-title">Note Summary</span>
                    <button className="res-btn" onClick={()=>setHistoryOpen(true)}>All notes →</button>
                  </div>
                  <div className="res-body">
                    <ResultCard results={results}/>
                  </div>
                </div>

                {/* Record another */}
                <motion.button
                  whileTap={{scale:.96}}
                  onClick={()=>{ setResults(null); setHasRecorded(false) }}
                  style={{
                    width:'100%',marginTop:12,padding:'14px',
                    background:'#faf5eb',border:'2.5px solid #1a0f2e',borderRadius:16,
                    fontFamily:"'Unbounded',sans-serif",fontSize:11,fontWeight:700,
                    color:'#1a0f2e',cursor:'pointer',letterSpacing:'.04em',
                    boxShadow:'3px 3px 0 #1a0f2e',
                  }}
                >← Record another</motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Feature pills (only when idle) ── */}
          {!hasRecorded && (
            <motion.div
              initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              transition={{delay:.4,...sp}}
              style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',paddingBottom:4}}
            >
              {[
                ['🎙 Record',    '#ffe8e2','#c45a2a'],
                ['✍️ Transcribe','#fff8d6','#a07a00'],
                ['✨ Summarise', '#d8f8e4','#2a7a4a'],
                ['✅ Actions',   '#ede5ff','#6a3abf'],
                ['🌐 10+ Languages','#ddf0fc','#2a6a9a'],
                ['🔒 Private',   '#faf5eb','#3d2f5a'],
              ].map(([label,bg,color])=>(
                <span key={label} style={{
                  background:bg, color,
                  border:'2px solid #1a0f2e',
                  borderRadius:99, padding:'7px 14px',
                  fontFamily:"'Unbounded',sans-serif",
                  fontSize:10, fontWeight:700,
                  letterSpacing:'.03em',
                  boxShadow:'2px 2px 0 #1a0f2e',
                  whiteSpace:'nowrap',
                }}>{label}</span>
              ))}
            </motion.div>
          )}

        </div>{/* /scroll */}

        {/* ── Bottom nav ── */}
        <nav className="bnav">
          {[
            {id:'home', icon:'🏠',  label:'Home'},
            {id:'rec',  icon:'🎙', label:'Record', accent:true},
            {id:'notes',icon:'📋', label:'Notes'},
          ].map(({id,icon,label,accent})=>(
            <motion.div key={id}
              className={`ni ${activeNav===id?'on':''}`}
              onClick={()=>{ setActiveNav(id); if(id==='notes') setHistoryOpen(true) }}
              whileTap={{scale:.88}}
            >
              <div className="ni-icon"
                style={accent && activeNav!==id ? {
                  background:'#ff8c69',border:'2px solid #1a0f2e',
                  borderRadius:'50%',boxShadow:'2px 2px 0 #1a0f2e',fontSize:16,
                } : {}}
              >
                {accent
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeNav===id?'#faf5eb':'white'} strokeWidth="2.2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
                  : icon
                }
              </div>
              <span className="ni-lbl">{label}</span>
            </motion.div>
          ))}
        </nav>

      </div>

      <HistoryPanel isOpen={historyOpen} onClose={()=>setHistoryOpen(false)}/>
    </>
  )
}