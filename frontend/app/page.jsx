'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import HistoryPanel from './components/HistoryPanel'

/* ─── design tokens (warm amber-dusk, NOT bright) ─── */
const T = {
  bg:      '#f0ebe4',       /* warm parchment */
  bg2:     '#e8e0d6',       /* slightly darker */
  ink:     '#1a1410',       /* near-black warm */
  ink2:    '#4a3c34',       /* deep brown */
  muted:   '#9a8878',       /* warm grey */
  faint:   '#c8bab0',       /* very faint */
  rose:    '#c8907c',       /* terracotta */
  blush:   '#e8c0b0',       /* soft blush */
  amber:   '#c8a060',       /* warm amber */
  sage:    '#8aaa90',       /* muted sage */
  sky:     '#8aa8c0',       /* dusty sky */
  lilac:   '#b0909a',       /* muted mauve */
  glass:   'rgba(240,235,228,0.7)',
  border:  'rgba(200,180,160,0.25)',
}

const PAGE_CSS = `
  @keyframes ink-morph {
    0%,100% { border-radius:58% 42% 62% 38%/50% 54% 46% 50%; transform:translate(0,0) scale(1) rotate(0deg); }
    30%      { border-radius:42% 58% 38% 62%/60% 40% 60% 40%; transform:translate(20px,-18px) scale(1.04) rotate(6deg); }
    60%      { border-radius:66% 34% 54% 46%/44% 58% 42% 56%; transform:translate(-14px,22px) scale(.97) rotate(-4deg); }
  }
  @keyframes shimmer-rail {
    0%   { background-position:-300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes float-in {
    from { opacity:0; transform:translateY(20px) scale(.96); }
    to   { opacity:1; transform:translateY(0)    scale(1);   }
  }

  .voca-page {
    min-height:100vh;
    background:${T.bg};
    font-family:'Outfit',sans-serif;
    font-weight:300;
    color:${T.ink};
    position:relative;
    overflow-x:hidden;
  }

  /* ── blobs: warm sepia tones, NOT bright ── */
  .vb { position:fixed; pointer-events:none; z-index:0; filter:blur(80px); }
  .vb1 { width:480px;height:480px;top:-160px;right:-120px;
          background:rgba(200,144,124,.22);
          animation:ink-morph 16s ease-in-out infinite; }
  .vb2 { width:380px;height:380px;bottom:-100px;left:-100px;
          background:rgba(176,144,154,.18);
          animation:ink-morph 20s ease-in-out infinite 6s reverse; }
  .vb3 { width:300px;height:300px;top:38%;right:-70px;
          background:rgba(138,168,192,.16);
          animation:ink-morph 24s ease-in-out infinite 10s; }
  .vb4 { width:240px;height:240px;top:18%;left:0;
          background:rgba(138,170,144,.14);
          animation:ink-morph 14s ease-in-out infinite 3s; }
  .vb5 { width:200px;height:200px;bottom:18%;right:6%;
          background:rgba(200,160,96,.13);
          animation:ink-morph 18s ease-in-out infinite 12s reverse; }

  /* ── paper grain ── */
  .vgrain {
    position:fixed;inset:0;pointer-events:none;z-index:1;
    opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-size:200px;
  }

  /* ── nav ── */
  .vnav {
    position:sticky;top:0;z-index:40;
    display:flex;align-items:center;justify-content:space-between;
    padding:13px 24px;
    background:rgba(240,235,228,.85);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    border-bottom:1px solid rgba(200,180,160,.18);
  }
  .vlogo {
    font-family:'Cormorant Garamond',serif;
    font-style:italic; font-weight:400; font-size:23px;
    letter-spacing:-.01em; color:${T.ink};
  }
  .vlogo em {
    font-style:italic;
    background:linear-gradient(120deg,${T.rose},${T.lilac},${T.sky});
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .vnotes-btn {
    display:flex;align-items:center;gap:6px;
    padding:7px 16px;border-radius:99px;
    background:rgba(255,252,248,.75);
    border:1px solid rgba(200,180,160,.3);
    font-family:'Outfit',sans-serif;font-size:11.5px;font-weight:400;
    color:${T.ink2};cursor:pointer;
    transition:all .2s;backdrop-filter:blur(10px);
  }
  .vnotes-btn:hover { background:rgba(255,252,248,.95);border-color:${T.rose}; transform:translateY(-1px); }
  .vpip {
    width:17px;height:17px;border-radius:50%;
    background:linear-gradient(135deg,${T.blush},${T.lilac});
    color:white;font-size:8.5px;font-weight:600;
    display:inline-flex;align-items:center;justify-content:center;
  }

  /* ── body ── */
  .vbody {
    position:relative;z-index:2;
    max-width:500px;margin:0 auto;
    padding:0 16px 100px;
    display:flex;flex-direction:column;gap:14px;
  }

  /* ── hero ── */
  .vhero {
    padding:34px 0 20px; text-align:center; position:relative;
  }
  .vhero::after {
    content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%);
    width:36px; height:1px; border-radius:99px;
    background:linear-gradient(90deg,transparent,${T.faint},transparent);
  }
  .vhero h1 {
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(44px,12vw,66px);
    line-height:1.02; font-weight:300;
    color:${T.ink}; letter-spacing:-.035em;
    margin-bottom:9px;
  }
  .vhero h1 em {
    font-style:italic; font-weight:400;
    background:linear-gradient(120deg,${T.rose} 0%,${T.lilac} 55%,${T.sky} 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .vhero-sub {
    font-size:11px; color:${T.muted}; font-weight:300;
    letter-spacing:.16em; text-transform:uppercase;
  }

  /* ── recorder frame ── */
  .vrec-frame {
    position:relative; overflow:hidden;
    background:rgba(248,243,236,.72);
    border:1px solid rgba(255,252,248,.95);
    border-radius:32px;
    padding:clamp(22px,6vw,38px);
    box-shadow:
      0 8px 48px rgba(160,120,100,.1),
      0 2px 8px rgba(0,0,0,.04),
      inset 0 1px 0 rgba(255,255,255,.9);
    backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
  }
  .vrec-frame::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,${T.blush},${T.amber},${T.sage},${T.sky},${T.lilac},${T.blush});
    background-size:400% 100%;
    animation:shimmer-rail 9s linear infinite;
  }
  .vrec-frame::after {
    content:''; position:absolute; top:0; left:8%; right:8%; height:80px;
    background:radial-gradient(ellipse at top,rgba(200,144,124,.08) 0%,transparent 70%);
    pointer-events:none;
  }

  /* ── processing ── */
  .vproc {
    background:rgba(248,243,236,.68);
    border:1px solid rgba(255,252,248,.9);
    border-radius:22px; padding:18px 22px;
    box-shadow:0 3px 24px rgba(160,120,100,.07);
    backdrop-filter:blur(18px);
  }

  /* ── result canvas ── */
  .vresult {
    background:rgba(248,243,236,.65);
    border:1px solid rgba(255,252,248,.92);
    border-radius:28px; padding:22px;
    box-shadow:0 8px 44px rgba(160,120,100,.1),
               inset 0 1px 0 rgba(255,255,255,.88);
    backdrop-filter:blur(24px);
  }
  .vresult-bar {
    display:flex;align-items:center;justify-content:space-between;
    margin-bottom:16px;padding-bottom:12px;
    border-bottom:1px solid rgba(200,180,160,.18);
  }
  .vresult-link {
    padding:4px 12px;border-radius:99px;
    background:transparent;border:1px solid rgba(200,144,124,.35);
    font-family:'Outfit',sans-serif;font-size:11px;font-weight:400;
    color:${T.rose};cursor:pointer;transition:all .18s;
  }
  .vresult-link:hover { background:rgba(200,144,124,.1); }

  .vfoot { text-align:center;font-size:11px;color:${T.faint};
    font-style:italic;font-family:'Outfit',sans-serif; }

  @media(min-width:560px){
    .vnav  { padding:16px 36px; }
    .vbody { padding:0 24px 100px;gap:16px; }
  }
`

/* ── mood palette (muted, not bright) ── */
const MOOD = {
  Focused:      { bg:'rgba(200,144,124,.12)', fg:'#a06050', emoji:'🎯' },
  Excited:      { bg:'rgba(200,160,96,.12)',  fg:'#907040', emoji:'⚡' },
  Casual:       { bg:'rgba(138,170,144,.12)', fg:'#507860', emoji:'🌿' },
  Professional: { bg:'rgba(138,168,192,.12)', fg:'#486480', emoji:'💼' },
  Urgent:       { bg:'rgba(200,100,100,.12)', fg:'#904040', emoji:'🔥' },
  Reflective:   { bg:'rgba(176,144,154,.12)', fg:'#806070', emoji:'🌙' },
}
const getMood = m => MOOD[m] || { bg:'rgba(176,144,154,.12)', fg:'#806070', emoji:'✦' }

function ResultCanvas({ data }) {
  const kp = Array.isArray(data.keyPoints)   ? data.keyPoints   : []
  const ai = Array.isArray(data.actionItems)
    ? data.actionItems.filter(a => !a.toLowerCase().includes('no specific')) : []
  const m = getMood(data.mood)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:13 }}>

      {/* sticky note */}
      <motion.div
        initial={{ opacity:0, rotate:-4, y:28, scale:.95 }}
        animate={{ opacity:1, rotate:-1, y:0,  scale:1   }}
        transition={{ duration:.7, type:'spring', stiffness:110, damping:16 }}
        style={{
          position:'relative',
          background:'linear-gradient(158deg,#fefce8 0%,#f8f4c8 60%,#f0eaa8 100%)',
          borderRadius:20,
          padding:'28px 24px 22px',
          boxShadow:'4px 7px 36px rgba(160,130,40,.2), 1px 2px 4px rgba(0,0,0,.05)',
        }}
      >
        {/* tape */}
        <div style={{
          position:'absolute',top:-9,left:'50%',transform:'translateX(-50%)',
          width:52,height:17,borderRadius:4,
          background:'rgba(230,200,80,.38)',backdropFilter:'blur(2px)',
        }}/>
        {data.mood && (
          <div style={{
            display:'inline-flex',alignItems:'center',gap:5,
            padding:'4px 10px',borderRadius:99,marginBottom:13,
            background:m.bg,border:`1px solid ${m.fg}28`,
            fontSize:10.5,fontWeight:500,color:m.fg,
            fontFamily:"'Outfit',sans-serif",letterSpacing:'.03em',
          }}>
            <span style={{fontSize:12}}>{m.emoji}</span> {data.mood}
          </div>
        )}
        <p style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'clamp(15px,4vw,17px)',
          lineHeight:1.78,color:'#3a3010',
          fontStyle:'italic',fontWeight:400,paddingRight:76,marginTop:4,
        }}>{data.summary}</p>
        {data.wordCount && (
          <p style={{fontSize:9.5,color:'#a89030',marginTop:10,opacity:.6,fontFamily:"'Outfit',sans-serif"}}>
            {data.wordCount} words
          </p>
        )}
      </motion.div>

      {/* key chips */}
      {kp.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {kp.map((pt,i) => (
            <motion.div key={i}
              initial={{ opacity:0, scale:.78, y:10 }}
              animate={{ opacity:1, scale:1,   y:0  }}
              transition={{ delay:.22+i*.07, type:'spring', stiffness:260, damping:22 }}
              style={{
                display:'flex',alignItems:'flex-start',gap:6,
                padding:'8px 13px',borderRadius:14,
                background:'rgba(248,243,236,.85)',
                border:`1px solid rgba(176,144,154,.28)`,
                fontSize:11.5,color:T.ink2,lineHeight:1.5,
                backdropFilter:'blur(10px)',
                fontFamily:"'Outfit',sans-serif",fontWeight:300,
              }}
            >
              <span style={{color:T.lilac,fontSize:8,marginTop:3,flexShrink:0}}>◆</span>
              {pt}
            </motion.div>
          ))}
        </div>
      )}

      {/* action items */}
      {ai.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {ai.map((a,i) => (
            <motion.div key={i}
              initial={{ opacity:0, x:-16 }}
              animate={{ opacity:1, x:0  }}
              transition={{ delay:.45+i*.08, type:'spring', stiffness:220, damping:24 }}
              style={{
                display:'flex',alignItems:'flex-start',gap:10,
                padding:'10px 14px',borderRadius:14,
                background:'rgba(248,243,236,.8)',
                border:`1px solid rgba(138,170,144,.32)`,
                backdropFilter:'blur(10px)',
              }}
            >
              <motion.div
                initial={{ scale:0, rotate:-20 }}
                animate={{ scale:1, rotate:0   }}
                transition={{ delay:.55+i*.08, type:'spring', stiffness:380 }}
                style={{
                  width:17,height:17,borderRadius:5,flexShrink:0,marginTop:1,
                  background:`linear-gradient(135deg,${T.sage},#6a9870)`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span style={{fontSize:12,color:T.ink2,lineHeight:1.55,
                fontFamily:"'Outfit',sans-serif",fontWeight:300}}>{a}</span>
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
      setTimeout(()=>setStep(2), 7000)
      setTimeout(()=>setStep(3), 14000)
    } else setTimeout(()=>setStep(0), 300)
  }
  const handleResults = d => { setResults(d); if(d) setCount(n=>n+1) }

  return (
    <>
      <style>{PAGE_CSS}</style>

      <div className="voca-page">
        <div className="vb vb1"/><div className="vb vb2"/><div className="vb vb3"/>
        <div className="vb vb4"/><div className="vb vb5"/>
        <div className="vgrain"/>

        {/* NAV */}
        <motion.nav className="vnav"
          initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
          <span className="vlogo">V<em>oca</em></span>
          <button className="vnotes-btn" onClick={()=>setHistOpen(true)}>
            Notes
            {count > 0 && (
              <motion.span className="vpip"
                initial={{scale:0}} animate={{scale:1}}
                transition={{type:'spring',stiffness:500,damping:20}}>
                {count}
              </motion.span>
            )}
          </button>
        </motion.nav>

        <div className="vbody">

          {/* HERO */}
          <motion.div className="vhero"
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            transition={{duration:.6,delay:.08}}>
            <h1>Voice,<br/><em>distilled.</em></h1>
            <p className="vhero-sub">record · transcribe · summarise</p>
          </motion.div>

          {/* RECORDER */}
          <motion.div className="vrec-frame"
            initial={{opacity:0,y:26,scale:.97}}
            animate={{opacity:1,y:0,scale:1}}
            transition={{duration:.65,delay:.18,type:'spring',stiffness:140,damping:20}}>
            <Recorder onResults={handleResults} onLoading={handleLoading}/>
          </motion.div>

          {/* PROCESSING */}
          <AnimatePresence>
            {loading && (
              <motion.div className="vproc"
                initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                exit={{opacity:0,y:-8}} transition={{duration:.28}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
                  <motion.div animate={{rotate:360}}
                    transition={{duration:1.3,repeat:Infinity,ease:'linear'}}
                    style={{width:13,height:13,borderRadius:'50%',flexShrink:0,
                      border:`1.8px solid rgba(200,144,124,.2)`,borderTopColor:T.rose}}/>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,
                    fontStyle:'italic',color:T.ink}}>Making magic…</span>
                </div>
                {['Transcribing','Understanding','Composing'].map((label,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,
                    opacity:step===i+1?1:step>i+1?.2:.08,transition:'opacity .5s'}}>
                    <div style={{width:4,height:4,borderRadius:'50%',flexShrink:0,
                      transition:'background .4s',
                      background:step>i+1?T.blush:step===i+1?T.rose:'rgba(200,144,124,.18)'}}/>
                    <span style={{fontSize:11.5,color:T.ink2,
                      fontWeight:step===i+1?400:300,fontFamily:"'Outfit',sans-serif"}}>{label}</span>
                  </div>
                ))}
                <div style={{height:1.5,background:'rgba(200,144,124,.12)',borderRadius:99,
                  marginTop:11,overflow:'hidden',position:'relative'}}>
                  <motion.div style={{position:'absolute',height:'100%',borderRadius:99,width:'28%',
                    background:`linear-gradient(90deg,${T.blush},${T.lilac},${T.sky})`}}
                    animate={{left:['-28%','108%']}}
                    transition={{duration:2,repeat:Infinity,ease:'easeInOut'}}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTS */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="vresult"
                initial={{opacity:0,y:22,scale:.97}}
                animate={{opacity:1,y:0,scale:1}}
                exit={{opacity:0}}
                transition={{duration:.55,type:'spring',stiffness:160,damping:22}}>
                <div className="vresult-bar">
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,
                    fontStyle:'italic',color:T.muted}}>note</span>
                  <button className="vresult-link" onClick={()=>setHistOpen(true)}>all notes →</button>
                </div>
                <ResultCanvas data={results}/>
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !loading && (
            <motion.p className="vfoot"
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