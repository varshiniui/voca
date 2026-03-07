'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import HistoryPanel from './components/HistoryPanel'

/* mood → pastel color pair */
const MOODS = {
  Focused:      ['#fce8e8','#c96b70'],
  Excited:      ['#fef4e0','#c9973a'],
  Casual:       ['#e8f4ec','#4a9e6e'],
  Professional: ['#e8eef8','#4a6eb8'],
  Urgent:       ['#fce8e8','#c94a4a'],
  Reflective:   ['#f0eaf8','#8a5cb8'],
}
const moodStyle = m => MOODS[m] || ['#f0eaf8','#8a5cb8']

/* ── sticky note result card ── */
function Result({ data }) {
  const kp = Array.isArray(data.keyPoints)   ? data.keyPoints   : []
  const ai = Array.isArray(data.actionItems) ? data.actionItems.filter(a => !a.toLowerCase().includes('no specific')) : []
  const [bg, accent] = moodStyle(data.mood)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* summary sticky */}
      <motion.div
        initial={{ opacity:0, rotate:-2, y:20, scale:0.97 }}
        animate={{ opacity:1, rotate:-0.8, y:0, scale:1 }}
        transition={{ duration:0.65, type:'spring', stiffness:130 }}
        style={{
          background:'linear-gradient(160deg,#fffef5 0%,#faf8e0 100%)',
          borderRadius:20,
          padding:'28px 26px 22px',
          boxShadow:'3px 5px 24px rgba(200,180,100,0.22), 0 1px 3px rgba(0,0,0,0.04)',
          position:'relative',
        }}
      >
        {/* tape */}
        <div style={{
          position:'absolute',top:-7,left:'50%',transform:'translateX(-50%)',
          width:52,height:16,borderRadius:3,
          background:'rgba(240,200,120,0.5)',
        }}/>
        {/* mood pill */}
        {data.mood && (
          <div style={{
            display:'inline-flex',alignItems:'center',gap:5,
            padding:'3px 10px',borderRadius:99,marginBottom:14,
            background:bg,border:`1px solid ${accent}30`,
            fontSize:10,fontWeight:600,color:accent,letterSpacing:'0.04em',
          }}>
            {data.mood}
          </div>
        )}
        <p style={{
          fontFamily:"'DM Serif Display',serif",
          fontSize:'clamp(15px,3.8vw,17px)',
          lineHeight:1.72,color:'#3a3010',
          fontStyle:'italic',
        }}>{data.summary}</p>
        {data.wordCount && (
          <p style={{fontSize:10,color:'#b8a020',fontWeight:500,marginTop:10,opacity:0.7}}>
            {data.wordCount} words · just now
          </p>
        )}
      </motion.div>

      {/* key points */}
      {kp.length > 0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
          {kp.map((pt,i) => (
            <motion.div key={i}
              initial={{opacity:0,scale:0.82,y:8}}
              animate={{opacity:1,scale:1,y:0}}
              transition={{delay:0.3+i*0.08,type:'spring',stiffness:260}}
              style={{
                padding:'8px 13px',borderRadius:14,
                background:'rgba(255,255,255,0.82)',
                border:'1.2px solid rgba(176,176,216,0.4)',
                boxShadow:'0 2px 10px rgba(160,140,200,0.1)',
                fontSize:12,color:'#4a3f60',fontWeight:400,lineHeight:1.5,
                backdropFilter:'blur(8px)',
              }}
            >
              <span style={{color:'var(--lilac2)',marginRight:5,fontSize:9}}>◆</span>
              {pt}
            </motion.div>
          ))}
        </div>
      )}

      {/* actions */}
      {ai.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {ai.map((a,i) => (
            <motion.div key={i}
              initial={{opacity:0,x:-14}}
              animate={{opacity:1,x:0}}
              transition={{delay:0.55+i*0.09,type:'spring',stiffness:200}}
              style={{
                display:'flex',alignItems:'flex-start',gap:10,
                padding:'10px 14px',borderRadius:14,
                background:'rgba(255,255,255,0.75)',
                border:'1.2px solid rgba(180,218,200,0.5)',
                backdropFilter:'blur(8px)',
              }}
            >
              <motion.div
                initial={{scale:0}} animate={{scale:1}}
                transition={{delay:0.65+i*0.09,type:'spring',stiffness:400}}
                style={{
                  width:17,height:17,borderRadius:6,flexShrink:0,marginTop:1,
                  background:'linear-gradient(135deg,#b8d4c8,#7ab09a)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span style={{fontSize:12,color:'#3a4a40',lineHeight:1.55,fontWeight:400}}>{a}</span>
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
    if (v) {
      setResults(null)
      setStep(1)
      setTimeout(()=>setStep(2),7000)
      setTimeout(()=>setStep(3),14000)
    } else setTimeout(()=>setStep(0),300)
  }
  const handleResults = d => { setResults(d); if(d) setCount(n=>n+1) }

  return (
    <>
      <style>{`
        .wrap {
          min-height:100vh;
          background:var(--bg);
          position:relative;overflow-x:hidden;
        }

        /* blobs */
        .blob { position:fixed;pointer-events:none;z-index:0;filter:blur(55px); }
        .b1 { width:340px;height:340px;top:-80px;right:-60px;
              background:rgba(232,180,184,0.28);
              animation:blob-drift 12s ease-in-out infinite; }
        .b2 { width:280px;height:280px;bottom:20px;left:-70px;
              background:rgba(208,188,232,0.22);
              animation:blob-drift 14s ease-in-out infinite 3s reverse; }
        .b3 { width:200px;height:200px;top:44%;right:-30px;
              background:rgba(184,208,232,0.2);
              animation:blob-drift 16s ease-in-out infinite 6s; }
        .b4 { width:160px;height:160px;top:30%;left:4%;
              background:rgba(184,212,200,0.18);
              animation:blob-drift 10s ease-in-out infinite 1s; }

        /* nav */
        .nav {
          position:sticky;top:0;z-index:30;
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 22px;
          background:rgba(247,243,240,0.8);
          backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
          border-bottom:1px solid rgba(232,180,184,0.15);
        }
        .logo {
          font-family:'DM Serif Display',serif;
          font-style:italic;font-size:22px;
          color:var(--ink);letter-spacing:-0.01em;
        }
        .nav-btn {
          display:flex;align-items:center;gap:6px;
          padding:6px 15px;border-radius:99px;
          background:rgba(255,255,255,0.85);
          border:1.2px solid rgba(232,180,184,0.35);
          font-family:'DM Sans',sans-serif;font-size:11.5px;font-weight:500;
          color:var(--ink2);cursor:pointer;
          box-shadow:0 1px 8px rgba(200,160,168,0.1);
          transition:all 0.2s;
          backdrop-filter:blur(8px);
        }
        .nav-btn:hover { border-color:var(--rose2);transform:translateY(-1px);box-shadow:0 4px 16px rgba(200,140,148,0.18); }
        .dot {
          width:16px;height:16px;border-radius:50%;
          background:linear-gradient(135deg,var(--rose),var(--lilac));
          color:white;font-size:8px;font-weight:700;
          display:inline-flex;align-items:center;justify-content:center;
        }

        /* body */
        .body {
          position:relative;z-index:1;
          max-width:520px;margin:0 auto;
          padding:22px 16px 90px;
          display:flex;flex-direction:column;gap:16px;
        }

        /* hero — minimal */
        .hero { text-align:center;padding:8px 0 2px; }
        .hero h1 {
          font-family:'DM Serif Display',serif;
          font-size:clamp(34px,9vw,54px);
          line-height:1.08;color:var(--ink);
          letter-spacing:-0.025em;margin-bottom:8px;
        }
        .hero h1 em {
          font-style:italic;color:var(--rose2);
        }
        .hero-sub {
          font-size:13px;color:var(--muted);
          font-weight:300;line-height:1.65;
          font-style:italic;
        }

        /* recorder card */
        .rec-card {
          background:rgba(255,255,255,0.68);
          border:1.2px solid rgba(255,255,255,0.92);
          border-radius:28px;padding:clamp(20px,5vw,32px);
          box-shadow:0 6px 36px rgba(200,160,168,0.12),
                     0 1px 4px rgba(0,0,0,0.03),
                     inset 0 1px 0 rgba(255,255,255,0.95);
          backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
          position:relative;overflow:hidden;
        }
        .rec-card::before {
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,var(--rose),var(--lilac),var(--blue),var(--sage),var(--rose));
          background-size:300% 100%;
          animation:shimmer 5s linear infinite;
        }

        /* loading */
        .load-card {
          background:rgba(255,255,255,0.65);
          border:1.2px solid rgba(255,255,255,0.9);
          border-radius:20px;padding:18px 22px;
          box-shadow:0 3px 20px rgba(200,160,168,0.08);
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        }

        /* result wrapper */
        .result-card {
          background:rgba(255,255,255,0.62);
          border:1.2px solid rgba(255,255,255,0.9);
          border-radius:24px;padding:20px;
          box-shadow:0 6px 30px rgba(200,160,168,0.1),
                     inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
        }
        .result-bar {
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:16px;padding-bottom:12px;
          border-bottom:1px solid rgba(232,180,184,0.2);
        }
        .see-all {
          padding:4px 12px;border-radius:99px;
          background:transparent;border:1px solid rgba(232,180,184,0.4);
          font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;
          color:var(--rose2);cursor:pointer;transition:all 0.18s;
        }
        .see-all:hover { background:rgba(232,180,184,0.12); }

        .footer-note {
          text-align:center;font-size:11px;color:var(--muted);
          font-weight:300;font-style:italic;
        }

        @media(min-width:560px){
          .nav  { padding:16px 32px; }
          .body { padding:28px 20px 90px;gap:18px; }
        }
      `}</style>

      <div className="wrap">
        <div className="blob b1"/><div className="blob b2"/>
        <div className="blob b3"/><div className="blob b4"/>

        {/* NAV */}
        <motion.nav className="nav"
          initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
        >
          <span className="logo">Voca</span>
          <button className="nav-btn" onClick={()=>setHistOpen(true)}>
            Notes
            {count>0 && (
              <motion.span className="dot" initial={{scale:0}} animate={{scale:1}}
                transition={{type:'spring',stiffness:500}}>
                {count}
              </motion.span>
            )}
          </button>
        </motion.nav>

        <div className="body">

          {/* HERO */}
          <motion.div className="hero"
            initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
            transition={{duration:0.55,delay:0.06}}
          >
            <h1>Voice,<br/><em>captured.</em></h1>
            <p className="hero-sub">Record, transcribe, summarise.</p>
          </motion.div>

          {/* RECORDER */}
          <motion.div className="rec-card"
            initial={{opacity:0,y:20,scale:0.97}}
            animate={{opacity:1,y:0,scale:1}}
            transition={{duration:0.55,delay:0.15,type:'spring',stiffness:160}}
          >
            <Recorder onResults={handleResults} onLoading={handleLoading} />
          </motion.div>

          {/* LOADING */}
          <AnimatePresence>
            {loading && (
              <motion.div className="load-card"
                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                exit={{opacity:0,y:-6}} transition={{duration:0.3}}
              >
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
                  <motion.div
                    animate={{rotate:360}}
                    transition={{duration:1.2,repeat:Infinity,ease:'linear'}}
                    style={{width:14,height:14,borderRadius:'50%',
                      border:'2px solid rgba(232,180,184,0.2)',
                      borderTop:'2px solid var(--rose2)',flexShrink:0}}
                  />
                  <span style={{fontSize:12.5,fontWeight:500,color:' var(--ink)',fontStyle:'italic'}}>Processing…</span>
                </div>
                {['Transcribing','Understanding','Summarising'].map((label,i)=>(
                  <div key={i} style={{
                    display:'flex',alignItems:'center',gap:8,marginBottom:6,
                    opacity:step===i+1?1:step>i+1?0.25:0.1,transition:'opacity 0.5s',
                  }}>
                    <div style={{
                      width:5,height:5,borderRadius:'50%',flexShrink:0,
                      transition:'background 0.4s',
                      background:step>i+1?'var(--rose)':step===i+1?'var(--rose2)':'rgba(232,180,184,0.25)',
                    }}/>
                    <span style={{fontSize:11.5,color:'var(--ink2)',fontWeight:step===i+1?500:300}}>{label}</span>
                  </div>
                ))}
                <div style={{height:2,background:'rgba(232,180,184,0.15)',borderRadius:99,marginTop:12,overflow:'hidden',position:'relative'}}>
                  <motion.div
                    style={{position:'absolute',height:'100%',borderRadius:99,width:'35%',
                      background:'linear-gradient(90deg,var(--rose),var(--lilac),var(--blue))'}}
                    animate={{left:['-35%','108%']}}
                    transition={{duration:1.8,repeat:Infinity,ease:'easeInOut'}}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTS */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="result-card"
                initial={{opacity:0,y:16,scale:0.97}}
                animate={{opacity:1,y:0,scale:1}}
                exit={{opacity:0}}
                transition={{duration:0.45,type:'spring',stiffness:180}}
              >
                <div className="result-bar">
                  <span style={{fontSize:10.5,fontWeight:500,color:'var(--muted)',letterSpacing:'0.1em',textTransform:'uppercase'}}>note</span>
                  <button className="see-all" onClick={()=>setHistOpen(true)}>all notes →</button>
                </div>
                <Result data={results}/>
              </motion.div>
            )}
          </AnimatePresence>

          {/* footer */}
          <AnimatePresence>
            {!results && !loading && (
              <motion.p className="footer-note"
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                transition={{delay:1.2,duration:0.8}}
              >
                🔒 never stored
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <HistoryPanel isOpen={histOpen} onClose={()=>setHistOpen(false)}/>
    </>
  )
}