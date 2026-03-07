'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import HistoryPanel from './components/HistoryPanel'

/* ── mood palette ── */
const MOOD = {
  Focused:      { bg:'#fce8e8', fg:'#b84050', emoji:'🎯' },
  Excited:      { bg:'#fef4d8', fg:'#b87020', emoji:'⚡' },
  Casual:       { bg:'#e8f8ee', fg:'#2a8a58', emoji:'🌿' },
  Professional: { bg:'#e8eef8', fg:'#3050a0', emoji:'💼' },
  Urgent:       { bg:'#fce8e8', fg:'#b83030', emoji:'🔥' },
  Reflective:   { bg:'#f0e8f8', fg:'#7840b0', emoji:'🌙' },
}
const getMood = m => MOOD[m] || { bg:'#f0e8f8', fg:'#7840b0', emoji:'✦' }

/* ── result canvas ── */
function ResultCanvas({ data }) {
  const kp = Array.isArray(data.keyPoints)   ? data.keyPoints   : []
  const ai = Array.isArray(data.actionItems) ? data.actionItems.filter(a=>!a.toLowerCase().includes('no specific')) : []
  const m  = getMood(data.mood)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* ── summary — rotated sticky note ── */}
      <motion.div
        initial={{opacity:0,rotate:-4,y:28,scale:.95}}
        animate={{opacity:1,rotate:-1.2,y:0,scale:1}}
        transition={{duration:.7,type:'spring',stiffness:120,damping:16}}
        style={{
          position:'relative',
          background:'linear-gradient(160deg, #fffef0 0%, #faf6d8 55%, #f5f0c0 100%)',
          borderRadius:22,
          padding:'28px 24px 22px',
          boxShadow:'4px 6px 32px rgba(200,180,80,.22), 1px 2px 6px rgba(0,0,0,.05)',
        }}
      >
        {/* tape */}
        <div style={{position:'absolute',top:-9,left:'50%',transform:'translateX(-50%)',
          width:54,height:18,borderRadius:4,
          background:'rgba(245,220,100,.4)',backdropFilter:'blur(2px)'}}/>
        {/* mood badge */}
        <div style={{
          position:'absolute',top:14,right:14,
          display:'flex',alignItems:'center',gap:5,
          padding:'4px 10px',borderRadius:99,
          background:m.bg,border:`1.5px solid ${m.fg}20`,
          fontSize:10.5,fontWeight:500,color:m.fg,
          fontFamily:"'Outfit',sans-serif",letterSpacing:'.03em',
        }}>
          <span style={{fontSize:13}}>{m.emoji}</span> {data.mood}
        </div>
        <p style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'clamp(15px,3.8vw,17px)',
          lineHeight:1.8,color:'#3a3010',
          fontStyle:'italic',fontWeight:400,
          paddingRight:80,marginTop:8,
        }}>{data.summary}</p>
        {data.wordCount&&(
          <p style={{fontSize:9.5,color:'#b8a030',marginTop:10,opacity:.65,fontFamily:"'Outfit',sans-serif"}}>
            {data.wordCount} words
          </p>
        )}
      </motion.div>

      {/* ── key point chips ── */}
      {kp.length>0&&(
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {kp.map((pt,i)=>(
            <motion.div key={i}
              initial={{opacity:0,scale:.8,y:10}}
              animate={{opacity:1,scale:1,y:0}}
              transition={{delay:.25+i*.07,type:'spring',stiffness:280,damping:22}}
              style={{
                display:'flex',alignItems:'flex-start',gap:7,
                padding:'8px 13px',borderRadius:16,
                background:'rgba(255,255,255,.78)',
                border:'1px solid rgba(220,196,242,.4)',
                boxShadow:'0 3px 14px rgba(180,150,220,.1)',
                fontSize:11.5,color:'#4a3a60',lineHeight:1.5,
                backdropFilter:'blur(10px)',
                fontFamily:"'Outfit',sans-serif",fontWeight:300,
              }}
            >
              <span style={{color:'#c4a0e8',fontSize:9,marginTop:2,flexShrink:0}}>◆</span>
              {pt}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── action checklist ── */}
      {ai.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {ai.map((a,i)=>(
            <motion.div key={i}
              initial={{opacity:0,x:-18}}
              animate={{opacity:1,x:0}}
              transition={{delay:.5+i*.08,type:'spring',stiffness:220,damping:24}}
              style={{
                display:'flex',alignItems:'flex-start',gap:10,
                padding:'10px 14px',borderRadius:16,
                background:'rgba(255,255,255,.72)',
                border:'1px solid rgba(196,232,216,.5)',
                backdropFilter:'blur(10px)',
              }}
            >
              <motion.div
                initial={{scale:0,rotate:-30}}
                animate={{scale:1,rotate:0}}
                transition={{delay:.62+i*.08,type:'spring',stiffness:400}}
                style={{
                  width:18,height:18,borderRadius:6,flexShrink:0,marginTop:1,
                  background:'linear-gradient(135deg,#c4e8d8,#8ec8b0)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span style={{fontSize:12,color:'#304840',lineHeight:1.55,fontFamily:"'Outfit',sans-serif",fontWeight:300}}>
                {a}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── page ── */
export default function Home() {
  const [results,  setResults]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState(0)
  const [histOpen, setHistOpen] = useState(false)
  const [count,    setCount]    = useState(0)

  const handleLoading = v => {
    setLoading(v)
    if(v){ setResults(null); setStep(1)
      setTimeout(()=>setStep(2),7000)
      setTimeout(()=>setStep(3),14000)
    } else setTimeout(()=>setStep(0),300)
  }
  const handleResults = d => { setResults(d); if(d) setCount(n=>n+1) }

  return (
    <>
      <style>{`
        .pg { min-height:100vh; background:var(--paper); position:relative; overflow-x:hidden; }

        /* ink-wash blobs */
        .blob { position:fixed; pointer-events:none; z-index:0; filter:blur(72px); opacity:.9; }
        .b1 { width:420px;height:420px;top:-140px;right:-100px;
              background:rgba(242,196,196,.32);
              animation:ink-drift 14s ease-in-out infinite; }
        .b2 { width:360px;height:360px;bottom:-80px;left:-100px;
              background:rgba(220,196,242,.26);
              animation:ink-drift 18s ease-in-out infinite 5s reverse; }
        .b3 { width:260px;height:260px;top:40%;right:-60px;
              background:rgba(196,216,242,.24);
              animation:ink-drift 20s ease-in-out infinite 8s; }
        .b4 { width:200px;height:200px;top:22%;left:2%;
              background:rgba(196,232,216,.22);
              animation:ink-drift 12s ease-in-out infinite 2s; }
        .b5 { width:180px;height:180px;bottom:20%;right:8%;
              background:rgba(242,224,176,.2);
              animation:ink-drift 16s ease-in-out infinite 10s reverse; }

        /* grain overlay */
        .grain {
          position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.025;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size:128px;
        }

        /* nav */
        .nav {
          position:sticky;top:0;z-index:30;
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 24px;
          background:rgba(253,248,244,.82);
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(242,196,196,.14);
        }
        .logo {
          font-family:'Cormorant Garamond',serif;
          font-style:italic;font-size:24px;font-weight:400;
          color:var(--ink);letter-spacing:-.01em;
        }
        .logo span {
          background:linear-gradient(125deg,#e8a0a8,#c0a0e0,#a0c0e8);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .notes-btn {
          display:flex;align-items:center;gap:6px;
          padding:7px 16px;border-radius:99px;
          background:rgba(255,255,255,.8);
          border:1px solid rgba(242,196,196,.32);
          font-family:'Outfit',sans-serif;font-size:11.5px;font-weight:400;
          color:var(--ink2);cursor:pointer;transition:all .2s;
          backdrop-filter:blur(10px);
          box-shadow:0 1px 10px rgba(200,160,168,.1);
        }
        .notes-btn:hover { border-color:#e8a8b0;transform:translateY(-1px);background:rgba(255,255,255,.96); }
        .count-pip {
          width:17px;height:17px;border-radius:50%;
          background:linear-gradient(135deg,#f2c4c4,#dcc4f2);
          color:white;font-size:8.5px;font-weight:600;
          display:inline-flex;align-items:center;justify-content:center;
        }

        /* body */
        .body {
          position:relative;z-index:1;
          max-width:520px;margin:0 auto;
          padding:0 16px 100px;
          display:flex;flex-direction:column;gap:14px;
        }

        /* hero */
        .hero {
          padding:32px 0 18px;
          text-align:center;
          position:relative;
        }
        .hero::after {
          content:'';
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:40px;height:1.5px;border-radius:99px;
          background:linear-gradient(90deg,transparent,rgba(232,168,176,.5),transparent);
        }
        .hero h1 {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(42px,11vw,62px);
          line-height:1.04;
          font-weight:300;
          color:var(--ink);
          letter-spacing:-.03em;
          margin-bottom:7px;
        }
        .hero h1 em {
          font-style:italic;font-weight:400;
          background:linear-gradient(125deg,#e8a0a8 0%,#c4a0e8 50%,#a0c0e8 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .hero-sub {
          font-family:'Outfit',sans-serif;
          font-size:12px;color:var(--muted);font-weight:300;
          letter-spacing:.12em;text-transform:uppercase;
        }

        /* glass recorder card */
        .rec-frame {
          position:relative;overflow:hidden;
          background:rgba(255,252,250,.68);
          border:1px solid rgba(255,255,255,.94);
          border-radius:32px;
          padding:clamp(22px,5vw,36px);
          box-shadow:
            0 8px 44px rgba(200,160,168,.12),
            0 2px 8px rgba(0,0,0,.03),
            inset 0 1px 0 rgba(255,255,255,.98);
          backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
        }
        /* prismatic top line */
        .rec-frame::before {
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,
            #f2c4c4,#f5d8c0,#f2e0b0,#c4e8d8,#c4d8f2,#dcc4f2,#f2c4c4);
          background-size:400% 100%;
          animation:shimmer-bar 8s linear infinite;
        }
        /* soft inner glow top */
        .rec-frame::after {
          content:'';position:absolute;top:0;left:10%;right:10%;height:60px;
          background:radial-gradient(ellipse at top,rgba(242,196,196,.12) 0%,transparent 70%);
          pointer-events:none;
        }

        /* processing */
        .proc-card {
          background:rgba(255,252,250,.65);
          border:1px solid rgba(255,255,255,.9);
          border-radius:22px;padding:18px 22px;
          box-shadow:0 3px 22px rgba(200,160,168,.08);
          backdrop-filter:blur(18px);
        }

        /* result canvas wrapper */
        .result-wrap {
          background:rgba(255,252,250,.62);
          border:1px solid rgba(255,255,255,.92);
          border-radius:28px;padding:22px;
          box-shadow:0 8px 40px rgba(200,160,168,.1),
                     inset 0 1px 0 rgba(255,255,255,.95);
          backdrop-filter:blur(22px);
        }
        .result-top {
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:16px;padding-bottom:13px;
          border-bottom:1px solid rgba(242,196,196,.16);
        }
        .all-link {
          padding:4px 12px;border-radius:99px;
          background:transparent;border:1px solid rgba(242,196,196,.4);
          font-family:'Outfit',sans-serif;font-size:11px;font-weight:400;
          color:#c87080;cursor:pointer;transition:all .18s;
        }
        .all-link:hover { background:rgba(242,196,196,.12); }

        .foot { text-align:center;font-size:11px;color:var(--faint);
          font-style:italic;font-family:'Outfit',sans-serif;padding-bottom:4px; }

        @media(min-width:560px){
          .nav  { padding:16px 36px; }
          .body { padding:0 24px 100px;gap:16px; }
        }
      `}</style>

      <div className="pg">
        <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/>
        <div className="blob b4"/><div className="blob b5"/>
        <div className="grain"/>

        {/* NAV */}
        <motion.nav className="nav"
          initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
          <span className="logo">V<span>oca</span></span>
          <button className="notes-btn" onClick={()=>setHistOpen(true)}>
            Notes
            {count>0&&(
              <motion.span className="count-pip"
                initial={{scale:0}} animate={{scale:1}}
                transition={{type:'spring',stiffness:500,damping:20}}>
                {count}
              </motion.span>
            )}
          </button>
        </motion.nav>

        <div className="body">

          {/* HERO */}
          <motion.div className="hero"
            initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
            transition={{duration:.6,delay:.06}}>
            <h1>Voice,<br/><em>distilled.</em></h1>
            <p className="hero-sub">record · transcribe · summarise</p>
          </motion.div>

          {/* RECORDER FRAME */}
          <motion.div className="rec-frame"
            initial={{opacity:0,y:24,scale:.97}}
            animate={{opacity:1,y:0,scale:1}}
            transition={{duration:.6,delay:.16,type:'spring',stiffness:150,damping:20}}>
            <Recorder onResults={handleResults} onLoading={handleLoading}/>
          </motion.div>

          {/* PROCESSING */}
          <AnimatePresence>
            {loading&&(
              <motion.div className="proc-card"
                initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                exit={{opacity:0,y:-8}} transition={{duration:.28}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
                  <motion.div animate={{rotate:360}} transition={{duration:1.2,repeat:Infinity,ease:'linear'}}
                    style={{width:13,height:13,borderRadius:'50%',flexShrink:0,
                      border:'1.8px solid rgba(242,196,196,.2)',borderTopColor:'#e8a8b0'}}/>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,
                    fontStyle:'italic',color:'var(--ink)'}}>Making magic…</span>
                </div>
                {['Transcribing','Understanding','Composing'].map((label,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,
                    opacity:step===i+1?1:step>i+1?.2:.08,transition:'opacity .5s'}}>
                    <motion.div
                      animate={step===i+1?{scale:[1,1.7,1]}:{}}
                      transition={{duration:.7,repeat:Infinity}}
                      style={{width:4,height:4,borderRadius:'50%',flexShrink:0,transition:'background .4s',
                        background:step>i+1?'#f2c4c4':step===i+1?'#e8a8b0':'rgba(242,196,196,.2)'}}/>
                    <span style={{fontSize:11.5,color:'var(--ink2)',
                      fontWeight:step===i+1?400:300,fontFamily:"'Outfit',sans-serif"}}>{label}</span>
                  </div>
                ))}
                <div style={{height:1.5,background:'rgba(242,196,196,.12)',borderRadius:99,
                  marginTop:12,overflow:'hidden',position:'relative'}}>
                  <motion.div style={{position:'absolute',height:'100%',borderRadius:99,width:'28%',
                    background:'linear-gradient(90deg,#f2c4c4,#dcc4f2,#c4d8f2)'}}
                    animate={{left:['-28%','108%']}}
                    transition={{duration:1.9,repeat:Infinity,ease:'easeInOut'}}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTS */}
          <AnimatePresence>
            {results&&!loading&&(
              <motion.div className="result-wrap"
                initial={{opacity:0,y:20,scale:.97}}
                animate={{opacity:1,y:0,scale:1}}
                exit={{opacity:0}}
                transition={{duration:.5,type:'spring',stiffness:170,damping:22}}>
                <div className="result-top">
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,
                    fontStyle:'italic',color:'var(--muted)'}}>note</span>
                  <button className="all-link" onClick={()=>setHistOpen(true)}>all notes →</button>
                </div>
                <ResultCanvas data={results}/>
              </motion.div>
            )}
          </AnimatePresence>

          {/* footer */}
          {!results&&!loading&&(
            <motion.p className="foot"
              initial={{opacity:0}} animate={{opacity:1}}
              transition={{delay:1.4,duration:.9}}>
              🔒 never stored
            </motion.p>
          )}
        </div>
      </div>

      <HistoryPanel isOpen={histOpen} onClose={()=>setHistOpen(false)}/>
    </>
  )
}