'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Recorder from './components/Recorder'
import ResultCard from './components/ResultCard'
import HistoryPanel from './components/HistoryPanel'

const MOOD = {
  Focused:      { bg:'rgba(200,144,124,.14)', fg:'#a06050', emoji:'🎯' },
  Excited:      { bg:'rgba(200,160,96,.14)',  fg:'#907040', emoji:'⚡' },
  Casual:       { bg:'rgba(138,170,144,.14)', fg:'#507860', emoji:'🌿' },
  Professional: { bg:'rgba(138,168,192,.14)', fg:'#486480', emoji:'💼' },
  Urgent:       { bg:'rgba(200,100,100,.14)', fg:'#904040', emoji:'🔥' },
  Reflective:   { bg:'rgba(176,144,154,.14)', fg:'#806070', emoji:'🌙' },
}
const getMood = m => MOOD[m] || { bg:'rgba(176,144,154,.14)', fg:'#806070', emoji:'✦' }

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@300;400;500&display=swap');

  @keyframes ink-morph {
    0%,100% { border-radius:58% 42% 62% 38%/50% 54% 46% 50%; transform:translate(0,0) scale(1) rotate(0deg); }
    30%      { border-radius:42% 58% 38% 62%/60% 40% 60% 40%; transform:translate(20px,-18px) scale(1.04) rotate(6deg); }
    60%      { border-radius:66% 34% 54% 46%/44% 58% 42% 56%; transform:translate(-14px,22px) scale(.97) rotate(-4deg); }
  }
  @keyframes shimmer-rail {
    0%   { background-position:-400% center; }
    100% { background-position: 400% center; }
  }
  @keyframes float-gentle {
    0%,100% { transform:translateY(0px) rotate(0deg); }
    33%     { transform:translateY(-6px) rotate(.4deg); }
    66%     { transform:translateY(-3px) rotate(-.3deg); }
  }
  @keyframes card-pop {
    0%   { opacity:0; transform:translateY(28px) scale(.93) rotateX(8deg); }
    100% { opacity:1; transform:translateY(0)    scale(1)   rotateX(0deg); }
  }
  @keyframes chip-bounce {
    0%   { opacity:0; transform:scale(.7) translateY(10px); }
    70%  { transform:scale(1.08) translateY(-2px); }
    100% { opacity:1; transform:scale(1)   translateY(0); }
  }
  @keyframes note-drop {
    0%   { opacity:0; transform:translateY(-20px) rotate(-6deg) scale(.9); }
    60%  { transform:translateY(4px)  rotate(-1.5deg) scale(1.01); }
    100% { opacity:1; transform:translateY(0)  rotate(-1deg)   scale(1); }
  }
  @keyframes sparkle-spin {
    0%  { transform:rotate(0deg)   scale(1); }
    50% { transform:rotate(180deg) scale(1.15); }
    100%{ transform:rotate(360deg) scale(1); }
  }
  @keyframes wink {
    0%,90%,100% { transform:scaleY(1); }
    95%         { transform:scaleY(.1); }
  }

  .voca-page {
    min-height:100vh;
    background:#f0ebe4;
    font-family:'Outfit',sans-serif;
    font-weight:300;
    color:#1a1410;
    position:relative;
    overflow-x:hidden;
    perspective:1200px;
  }

  /* blobs */
  .vb { position:fixed; pointer-events:none; z-index:0; filter:blur(80px); }
  .vb1 { width:480px;height:480px;top:-160px;right:-120px;background:rgba(200,144,124,.22);animation:ink-morph 16s ease-in-out infinite; }
  .vb2 { width:380px;height:380px;bottom:-100px;left:-100px;background:rgba(176,144,154,.18);animation:ink-morph 20s ease-in-out infinite 6s reverse; }
  .vb3 { width:300px;height:300px;top:38%;right:-70px;background:rgba(138,168,192,.16);animation:ink-morph 24s ease-in-out infinite 10s; }
  .vb4 { width:240px;height:240px;top:18%;left:0;background:rgba(138,170,144,.14);animation:ink-morph 14s ease-in-out infinite 3s; }
  .vb5 { width:200px;height:200px;bottom:18%;right:6%;background:rgba(200,160,96,.13);animation:ink-morph 18s ease-in-out infinite 12s reverse; }

  /* grain */
  .vgrain {
    position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:200px;
  }

  /* floating decorative dots */
  .deco-dot {
    position:fixed;pointer-events:none;z-index:0;border-radius:50%;
    animation:float-gentle var(--dur,8s) ease-in-out infinite var(--delay,0s);
  }

  /* nav */
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
    font-style:italic;font-weight:400;font-size:23px;
    letter-spacing:-.01em;color:#1a1410;
    cursor:default;
    transition:transform .3s cubic-bezier(.34,1.56,.64,1);
  }
  .vlogo:hover { transform:scale(1.06) rotate(-1deg); }
  .vlogo em {
    font-style:italic;
    background:linear-gradient(120deg,#c8907c,#b09098,#8aa8c0);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .vnotes-btn {
    display:flex;align-items:center;gap:6px;
    padding:7px 16px;border-radius:99px;
    background:rgba(255,252,248,.75);
    border:1px solid rgba(200,180,160,.3);
    font-family:'Outfit',sans-serif;font-size:11.5px;font-weight:400;
    color:#4a3c34;cursor:pointer;transition:all .25s;
    backdrop-filter:blur(10px);
    /* subtle 3d lift */
    box-shadow:0 2px 0 rgba(180,160,140,.2), 0 4px 16px rgba(160,120,100,.1);
  }
  .vnotes-btn:hover {
    transform:translateY(-3px) scale(1.02);
    box-shadow:0 6px 0 rgba(180,160,140,.15), 0 10px 24px rgba(160,120,100,.18);
    border-color:#c8907c;
    background:rgba(255,252,248,.95);
  }
  .vnotes-btn:active { transform:translateY(0); box-shadow:0 1px 0 rgba(180,160,140,.2); }
  .vpip {
    width:17px;height:17px;border-radius:50%;
    background:linear-gradient(135deg,#d8a898,#b09098);
    color:white;font-size:8.5px;font-weight:600;
    display:inline-flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(180,130,130,.35);
    animation:wink 4s ease-in-out infinite;
  }

  /* body */
  .vbody {
    position:relative;z-index:2;
    max-width:500px;margin:0 auto;
    padding:0 16px 100px;
    display:flex;flex-direction:column;gap:14px;
  }

  /* hero */
  .vhero { padding:32px 0 18px;text-align:center;position:relative; }
  .vhero::after {
    content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);
    width:36px;height:1px;border-radius:99px;
    background:linear-gradient(90deg,transparent,rgba(200,144,124,.4),transparent);
  }
  .vhero h1 {
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(44px,12vw,66px);
    line-height:1.02;font-weight:300;
    color:#1a1410;letter-spacing:-.035em;
    margin-bottom:9px;
    /* 3d text depth */
    text-shadow:
      0 1px 0 rgba(200,180,160,.5),
      0 2px 0 rgba(200,180,160,.3),
      0 4px 12px rgba(160,120,100,.15);
    transform-style:preserve-3d;
  }
  .vhero h1 em {
    font-style:italic;font-weight:400;
    background:linear-gradient(120deg,#c8907c 0%,#b09098 55%,#8aa8c0 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .vhero-sub {
    font-size:11px;color:#9a8878;font-weight:300;
    letter-spacing:.16em;text-transform:uppercase;
  }

  /* floating badge above hero */
  .vhero-badge {
    display:inline-flex;align-items:center;gap:6px;
    padding:5px 14px;border-radius:99px;margin-bottom:14px;
    background:rgba(255,252,248,.85);
    border:1px solid rgba(200,180,160,.28);
    font-size:10.5px;color:#9a8878;font-weight:400;letter-spacing:.06em;
    box-shadow:
      0 3px 0 rgba(180,160,140,.18),
      0 6px 20px rgba(160,120,100,.1);
    font-family:'Outfit',sans-serif;
    transition:transform .25s cubic-bezier(.34,1.56,.64,1);
  }
  .vhero-badge:hover { transform:translateY(-3px) scale(1.03); }
  .vhero-badge-dot {
    width:5px;height:5px;border-radius:50%;
    background:linear-gradient(135deg,#c8907c,#b09098);
    box-shadow:0 0 6px rgba(200,144,124,.6);
    animation:sparkle-spin 3s ease-in-out infinite;
  }

  /* 3D recorder frame */
  .vrec-frame {
    position:relative;overflow:hidden;
    background:rgba(248,243,236,.72);
    border:1px solid rgba(255,255,255,.95);
    border-radius:32px;
    padding:clamp(22px,6vw,38px);
    /* 3d card shadow stack */
    box-shadow:
      0 1px 0 rgba(255,255,255,.9) inset,
      0 2px 0 rgba(200,180,160,.12),
      0 4px 0 rgba(200,180,160,.08),
      0 8px 0 rgba(200,180,160,.05),
      0 12px 48px rgba(160,120,100,.12),
      0 2px 8px rgba(0,0,0,.04);
    backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
    transform-style:preserve-3d;
    transition:transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s ease;
  }
  .vrec-frame:hover {
    transform:translateY(-4px) rotateX(1.5deg);
    box-shadow:
      0 1px 0 rgba(255,255,255,.9) inset,
      0 2px 0 rgba(200,180,160,.12),
      0 4px 0 rgba(200,180,160,.08),
      0 8px 0 rgba(200,180,160,.05),
      0 20px 64px rgba(160,120,100,.18),
      0 4px 12px rgba(0,0,0,.06);
  }
  .vrec-frame::before {
    content:'';position:absolute;top:0;left:0;right:0;height:2px;
    background:linear-gradient(90deg,#c8907c,#d8a898,#c8a060,#8aaa90,#8aa8c0,#b09098,#c8907c);
    background-size:400% 100%;
    animation:shimmer-rail 9s linear infinite;
  }
  .vrec-frame::after {
    content:'';position:absolute;top:0;left:8%;right:8%;height:80px;
    background:radial-gradient(ellipse at top,rgba(200,144,124,.08) 0%,transparent 70%);
    pointer-events:none;
  }

  /* processing */
  .vproc {
    background:rgba(248,243,236,.68);
    border:1px solid rgba(255,255,255,.9);
    border-radius:22px;padding:18px 22px;
    box-shadow:0 4px 0 rgba(200,180,160,.1), 0 8px 28px rgba(160,120,100,.09);
    backdrop-filter:blur(18px);
  }

  /* result */
  .vresult {
    background:rgba(248,243,236,.65);
    border:1px solid rgba(255,255,255,.92);
    border-radius:28px;padding:22px;
    box-shadow:
      0 2px 0 rgba(200,180,160,.12),
      0 4px 0 rgba(200,180,160,.07),
      0 8px 44px rgba(160,120,100,.1),
      inset 0 1px 0 rgba(255,255,255,.88);
    backdrop-filter:blur(24px);
    animation:card-pop .5s cubic-bezier(.34,1.56,.64,1) forwards;
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
    color:#c8907c;cursor:pointer;transition:all .2s;
    box-shadow:0 2px 0 rgba(200,144,124,.15);
  }
  .vresult-link:hover {
    background:rgba(200,144,124,.1);
    transform:translateY(-2px);
    box-shadow:0 4px 0 rgba(200,144,124,.12);
  }

  /* sticky note */
  .sticky-note {
    position:relative;
    background:linear-gradient(158deg,#e8f4f0 0%,#d8eee8 50%,#c8e4dc 100%);
    border-radius:20px;
    padding:28px 24px 22px;
    border:1px solid rgba(140,190,175,.35);
    box-shadow:
      4px 7px 36px rgba(80,140,120,.16),
      1px 2px 4px rgba(0,0,0,.04),
      0 6px 0 rgba(120,180,160,.2),
      0 7px 0 rgba(100,165,145,.12),
      0 8px 10px rgba(80,140,120,.14);
    transform:rotate(-1deg);
    transform-origin:center top;
    transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
  }
  .sticky-note:hover {
    transform:rotate(0deg) translateY(-4px) scale(1.01);
    box-shadow:
      6px 14px 48px rgba(80,140,120,.22),
      1px 2px 4px rgba(0,0,0,.04),
      0 8px 0 rgba(120,180,160,.16),
      0 9px 14px rgba(80,140,120,.16);
  }
  .sticky-tape {
    position:absolute;top:-9px;left:50%;transform:translateX(-50%);
    width:52px;height:18px;border-radius:4px;
    background:rgba(120,180,160,.45);backdrop-filter:blur(2px);
    border:1px solid rgba(140,195,175,.5);
    box-shadow:0 2px 6px rgba(80,140,120,.2);
  }

  /* key chips */
  .kchip {
    display:inline-flex;align-items:flex-start;gap:6px;
    padding:8px 13px;border-radius:14px;
    background:rgba(248,243,236,.88);
    border:1px solid rgba(176,144,154,.28);
    font-size:11.5px;color:#4a3c34;line-height:1.5;
    font-family:'Outfit',sans-serif;font-weight:300;
    box-shadow:0 3px 0 rgba(176,144,154,.18), 0 6px 16px rgba(160,120,130,.08);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
    cursor:default;
    animation:chip-bounce .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  .kchip:hover {
    transform:translateY(-3px) scale(1.02);
    box-shadow:0 6px 0 rgba(176,144,154,.14), 0 12px 24px rgba(160,120,130,.14);
  }

  /* action items */
  .aitem {
    display:flex;align-items:flex-start;gap:10px;
    padding:10px 14px;border-radius:14px;
    background:rgba(248,243,236,.82);
    border:1px solid rgba(138,170,144,.32);
    box-shadow:0 3px 0 rgba(138,170,144,.2), 0 6px 16px rgba(100,140,120,.07);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
    cursor:default;
  }
  .aitem:hover {
    transform:translateX(4px) translateY(-2px);
    box-shadow:0 5px 0 rgba(138,170,144,.16), 0 10px 22px rgba(100,140,120,.12);
  }

  /* demo button */
  .vdemo-btn {
    display:inline-flex;align-items:center;gap:7px;
    padding:9px 20px;border-radius:99px;border:none;cursor:pointer;
    background:rgba(255,252,248,.85);
    border:1.5px dashed rgba(200,144,124,.45);
    font-family:'Outfit',sans-serif;font-size:12px;font-weight:400;
    color:#c8907c;letter-spacing:.02em;
    box-shadow:0 3px 0 rgba(200,144,124,.15), 0 6px 20px rgba(200,144,124,.1);
    transition:all .28s cubic-bezier(.34,1.56,.64,1);
    backdrop-filter:blur(10px);
  }
  .vdemo-btn:hover {
    background:rgba(255,252,248,.98);
    border-style:solid;border-color:#c8907c;
    color:#a06050;
    transform:translateY(-4px) scale(1.04);
    box-shadow:0 7px 0 rgba(200,144,124,.12), 0 14px 30px rgba(200,144,124,.2);
  }
  .vdemo-btn:active { transform:translateY(0) scale(.98); }
  .vdemo-btn:disabled { opacity:.5; cursor:default; transform:none; }

  /* demo badge on result */
  .vdemo-badge {
    display:inline-flex;align-items:center;gap:5px;
    padding:3px 9px;border-radius:99px;
    background:rgba(200,160,96,.12);
    border:1px solid rgba(200,160,96,.3);
    font-size:9.5px;color:#907040;font-weight:400;
    font-family:'Outfit',sans-serif;letter-spacing:.05em;
  }

  .vfoot {
    text-align:center;font-size:11px;color:#c8bab0;
    font-style:italic;font-family:'Outfit',sans-serif;
  }

  @media(min-width:560px){
    .vnav  { padding:16px 36px; }
    .vbody { padding:0 24px 100px;gap:16px; }
  }
`

function FloatingDots() {
  const dots = [
    { size:8,  top:'12%', left:'4%',  color:'rgba(200,144,124,.25)', dur:'7s',  delay:'0s'  },
    { size:5,  top:'24%', right:'6%', color:'rgba(176,144,154,.2)',  dur:'9s',  delay:'2s'  },
    { size:10, top:'55%', left:'2%',  color:'rgba(138,168,192,.2)',  dur:'11s', delay:'4s'  },
    { size:6,  top:'72%', right:'4%', color:'rgba(138,170,144,.2)',  dur:'8s',  delay:'1s'  },
    { size:4,  top:'38%', left:'8%',  color:'rgba(200,160,96,.18)',  dur:'6s',  delay:'3s'  },
  ]
  return (
    <>
      {dots.map((d,i) => (
        <div key={i} className="deco-dot" style={{
          width:d.size, height:d.size,
          top:d.top, left:d.left, right:d.right,
          background:d.color,
          '--dur':d.dur, '--delay':d.delay,
          boxShadow:`0 0 ${d.size*2}px ${d.color}`,
        }}/>
      ))}
    </>
  )
}


export default function Home() {
  const [results,  setResults]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState(0)
  const [histOpen, setHistOpen] = useState(false)
  const [count,    setCount]    = useState(0)
  const [demoIdx,  setDemoIdx]  = useState(0)

  const handleLoading = v => {
    setLoading(v)
    if (v) {
      setResults(null); setStep(1)
      setTimeout(()=>setStep(2), 7000)
      setTimeout(()=>setStep(3), 14000)
    } else setTimeout(()=>setStep(0), 300)
  }
  const handleResults = d => { setResults(d); if(d) setCount(n=>n+1) }

  const runDemo = () => {
    const note = DEMO_NOTES[demoIdx % DEMO_NOTES.length]
    setDemoIdx(i => i+1)
    setResults(null); setLoading(true); setStep(1)
    setTimeout(()=>setStep(2), 1100)
    setTimeout(()=>setStep(3), 2200)
    setTimeout(()=>{ setLoading(false); setResults(note); setStep(0) }, 3000)
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="voca-page">
        <div className="vb vb1"/><div className="vb vb2"/><div className="vb vb3"/>
        <div className="vb vb4"/><div className="vb vb5"/>
        <div className="vgrain"/>
        <FloatingDots/>

        {/* NAV */}
        <motion.nav className="vnav"
          initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.5 }}>
          <span className="vlogo">V<em>oca</em></span>
          <button className="vnotes-btn" onClick={()=>setHistOpen(true)}>
            <motion.span
              animate={{ rotate:[0,-8,8,0] }}
              transition={{ duration:2, repeat:Infinity, repeatDelay:5 }}>
              🎵
            </motion.span>
            Notes
            {count > 0 && (
              <motion.span className="vpip"
                initial={{ scale:0 }} animate={{ scale:1 }}
                transition={{ type:'spring', stiffness:500, damping:18 }}>
                {count}
              </motion.span>
            )}
          </button>
        </motion.nav>

        <div className="vbody">

          {/* HERO */}
          <motion.div className="vhero"
            initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.65, delay:.08 }}>
            <motion.div className="vhero-badge"
              initial={{ opacity:0, y:-10, scale:.9 }}
              animate={{ opacity:1, y:0,   scale:1  }}
              transition={{ delay:.2, type:'spring', stiffness:280 }}>
              <div className="vhero-badge-dot"/>
              AI voice notes
            </motion.div>
            <motion.h1
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:.28, duration:.6 }}>
              Voice,<br/><em>distilled.</em>
            </motion.h1>
            <motion.p className="vhero-sub"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:.5, duration:.6 }}>
              record · transcribe · summarise
            </motion.p>
            <motion.div style={{ marginTop:18 }}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:.75, type:'spring', stiffness:260 }}>
              <motion.button
                className="vdemo-btn"
                onClick={runDemo}
                disabled={loading}
                whileTap={{ scale:.94 }}
                animate={{ y:[0,-3,0] }}
                transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
              >
                <motion.span
                  animate={{ rotate:[0,15,-15,0] }}
                  transition={{ duration:2, repeat:Infinity, repeatDelay:3 }}>
                  ✨
                </motion.span>
                Try a demo note
              </motion.button>
            </motion.div>
          </motion.div>

          {/* RECORDER */}
          <motion.div className="vrec-frame"
            initial={{ opacity:0, y:28, scale:.96, rotateX:6 }}
            animate={{ opacity:1, y:0,  scale:1,  rotateX:0 }}
            transition={{ duration:.7, delay:.2, type:'spring', stiffness:130, damping:18 }}>
            <Recorder onResults={handleResults} onLoading={handleLoading}/>
          </motion.div>

          {/* PROCESSING */}
          <AnimatePresence>
            {loading && (
              <motion.div className="vproc"
                initial={{ opacity:0, y:14, scale:.97 }}
                animate={{ opacity:1, y:0,  scale:1  }}
                exit={{ opacity:0, y:-8, scale:.97 }}
                transition={{ duration:.3 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
                  <motion.div animate={{ rotate:360 }}
                    transition={{ duration:1.3, repeat:Infinity, ease:'linear' }}
                    style={{ width:13, height:13, borderRadius:'50%', flexShrink:0,
                      border:'1.8px solid rgba(200,144,124,.2)', borderTopColor:'#c8907c' }}/>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14,
                    fontStyle:'italic', color:'#1a1410' }}>Making magic…</span>
                </div>
                {['Transcribing','Understanding','Composing'].map((label,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5,
                    opacity:step===i+1?1:step>i+1?.2:.08, transition:'opacity .5s' }}>
                    <motion.div
                      animate={step===i+1 ? { scale:[1,1.8,1] } : {}}
                      transition={{ duration:.7, repeat:Infinity }}
                      style={{ width:4, height:4, borderRadius:'50%', flexShrink:0,
                        transition:'background .4s',
                        background:step>i+1?'#d8a898':step===i+1?'#c8907c':'rgba(200,144,124,.18)' }}/>
                    <span style={{ fontSize:11.5, color:'#4a3c34',
                      fontWeight:step===i+1?400:300, fontFamily:"'Outfit',sans-serif" }}>{label}</span>
                  </div>
                ))}
                <div style={{ height:1.5, background:'rgba(200,144,124,.12)', borderRadius:99,
                  marginTop:11, overflow:'hidden', position:'relative' }}>
                  <motion.div style={{ position:'absolute', height:'100%', borderRadius:99, width:'28%',
                    background:'linear-gradient(90deg,#d8a898,#b09098,#8aa8c0)' }}
                    animate={{ left:['-28%','108%'] }}
                    transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTS */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div className="vresult"
                initial={{ opacity:0, y:24, scale:.96, rotateX:5 }}
                animate={{ opacity:1, y:0,  scale:1,  rotateX:0 }}
                exit={{ opacity:0, scale:.97 }}
                transition={{ duration:.6, type:'spring', stiffness:150, damping:20 }}>
                <div className="vresult-bar">
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <motion.span
                      animate={{ opacity:[.6,1,.6] }}
                      transition={{ duration:3, repeat:Infinity }}
                      style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14,
                        fontStyle:'italic', color:'#9a8878' }}>note ✦</motion.span>
                    {!results?.id && (
                      <span className="vdemo-badge">✨ demo</span>
                    )}
                  </div>
                  <button className="vresult-link" onClick={()=>setHistOpen(true)}>all notes →</button>
                </div>
                <ResultCard results={results}/>
              </motion.div>
            )}
          </AnimatePresence>

          {!results && !loading && (
            <motion.p className="vfoot"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay:1.4, duration:.9 }}>
              🔒 never stored
            </motion.p>
          )}
        </div>
      </div>
      <HistoryPanel isOpen={histOpen} onClose={()=>setHistOpen(false)}/>
    </>
  )
}