'use client'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Play, Pause, Trash2, Sparkles, ChevronDown } from 'lucide-react'

const LANGUAGES = [
  { code:'en',  label:'English',     flag:'🇬🇧' },
  { code:'ta',  label:'Tamil',       flag:'🇮🇳' },
  { code:'hi',  label:'Hindi',       flag:'🇮🇳' },
  { code:'ml',  label:'Malayalam',   flag:'🇮🇳' },
  { code:'es',  label:'Spanish',     flag:'🇪🇸' },
  { code:'fr',  label:'French',      flag:'🇫🇷' },
  { code:null,  label:'Auto-detect', flag:'🌐' },
]

function friendlyError(e) {
  const m = e?.message||String(e)
  if(m==='Failed to fetch')                  return 'Cannot reach server.'
  if(m.includes('429')||m.includes('quota')) return 'AI quota reached — retry in 30s.'
  if(m.includes('NotAllowedError'))          return 'Microphone access denied.'
  return m
}

const N = 18
const BARS = ['#c8907c','#b09098','#8aa8c0','#8aaa90','#c8a060',
              '#c8907c','#b09098','#8aa8c0','#8aaa90','#c8a060',
              '#c8907c','#b09098','#8aa8c0','#8aaa90','#c8a060',
              '#c8907c','#b09098','#8aa8c0']

const RS = `
  @keyframes rs-spin    { to { transform:rotate(360deg); } }
  @keyframes rs-breathe { 0%,100%{transform:scale(1);}    50%{transform:scale(1.06);} }
  @keyframes rs-blink   { 0%,100%{opacity:1;}             50%{opacity:.15;} }
  @keyframes rs-wobble  { 0%,100%{transform:rotate(0);}   25%{transform:rotate(-4deg);} 75%{transform:rotate(4deg);} }
  @keyframes rs-pulse-ring { 0%{transform:scale(1);opacity:.5;} 100%{transform:scale(2.4);opacity:0;} }
  @keyframes rs-float   { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }

  /* orb shell */
  .ro-shell {
    position:relative;display:flex;align-items:center;justify-content:center;
    width:148px;height:148px;flex-shrink:0;
  }

  /* 3D pearl orb */
  .ro {
    width:112px;height:112px;border-radius:50%;border:none;cursor:pointer;
    position:relative;display:flex;align-items:center;justify-content:center;
    transition:transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s ease;
    z-index:2;flex-shrink:0;
    transform-style:preserve-3d;
  }
  .ro-idle {
    background:radial-gradient(circle at 32% 26%,#fff8f4 0%,#f4e4dc 35%,#e8c0b0 68%,#d8a090 100%);
    box-shadow:
      0 0 0 1px rgba(200,144,124,.4),
      0 6px 30px rgba(200,144,124,.38),
      0 16px 56px rgba(176,144,154,.22),
      /* 3d bottom edge */
      0 8px 0 rgba(180,110,90,.2),
      0 10px 0 rgba(180,110,90,.12),
      0 12px 16px rgba(160,100,80,.2),
      inset 0 2px 5px rgba(255,255,255,.88);
  }
  .ro-idle:hover {
    transform:scale(1.09) translateY(-6px) rotateX(8deg);
    box-shadow:
      0 0 0 2px rgba(180,110,90,.45),
      0 12px 44px rgba(200,144,124,.55),
      0 28px 80px rgba(176,144,154,.3),
      0 14px 0 rgba(180,110,90,.15),
      0 16px 24px rgba(160,100,80,.25),
      inset 0 2px 5px rgba(255,255,255,.92);
  }
  .ro-rec {
    background:radial-gradient(circle at 32% 26%,#f8e0da 0%,#e8a898 42%,#cc7068 100%);
    box-shadow:
      0 0 0 2px rgba(200,100,90,.5),
      0 8px 36px rgba(200,100,90,.48),
      0 22px 68px rgba(220,140,130,.32),
      0 8px 0 rgba(160,70,60,.25),
      0 10px 14px rgba(140,60,50,.2),
      inset 0 2px 4px rgba(255,255,255,.5);
    animation:rs-breathe 2s ease-in-out infinite;
  }
  /* specular highlights */
  .ro::before {
    content:'';position:absolute;
    top:11%;left:17%;width:29%;height:22%;
    border-radius:50%;
    background:rgba(255,255,255,.65);
    filter:blur(4px);pointer-events:none;
    z-index:1;
  }
  .ro::after {
    content:'';position:absolute;
    bottom:22%;right:18%;width:14%;height:10%;
    border-radius:50%;
    background:rgba(255,255,255,.3);
    filter:blur(3px);pointer-events:none;
    z-index:1;
  }

  /* idle float animation */
  .ro-idle-wrap { animation:rs-float 4s ease-in-out infinite; }

  /* lang picker */
  .rl-chip {
    display:inline-flex;align-items:center;gap:5px;
    padding:5px 12px;border-radius:99px;
    background:rgba(255,252,248,.78);
    border:1px solid rgba(200,180,160,.28);
    font-family:'Outfit',sans-serif;font-size:11px;font-weight:300;
    color:#4a3c34;cursor:pointer;transition:all .2s;
    backdrop-filter:blur(8px);
    box-shadow:0 3px 0 rgba(200,180,160,.2), 0 5px 12px rgba(160,120,100,.08);
  }
  .rl-chip:hover {
    border-color:#c8907c;background:rgba(255,252,248,.97);
    transform:translateY(-2px);
    box-shadow:0 5px 0 rgba(200,180,160,.15), 0 8px 18px rgba(160,120,100,.14);
  }
  .rl-dd {
    position:absolute;top:calc(100% + 8px);right:0;z-index:400;
    background:rgba(252,248,243,.97);
    border:1px solid rgba(200,180,160,.25);
    border-radius:20px;overflow:hidden;min-width:176px;
    box-shadow:
      0 4px 0 rgba(200,180,160,.12),
      0 20px 60px rgba(160,120,90,.18);
    backdrop-filter:blur(20px);
  }
  .rl-item {
    width:100%;padding:10px 16px;border:none;cursor:pointer;
    background:transparent;display:flex;align-items:center;gap:10px;
    font-family:'Outfit',sans-serif;font-size:12px;font-weight:300;
    color:#4a3c34;border-bottom:1px solid rgba(200,180,160,.15);
    transition:all .12s;text-align:left;
  }
  .rl-item:last-child { border-bottom:none; }
  .rl-item:hover,.rl-item.sel {
    background:rgba(200,144,124,.12);color:#1a1410;
    padding-left:20px;
  }

  /* player */
  .rp-row {
    display:flex;align-items:center;gap:10px;
    padding:10px 13px;
    background:rgba(255,252,248,.7);
    border:1px solid rgba(200,180,160,.22);
    border-radius:16px;width:100%;
    backdrop-filter:blur(8px);
    box-shadow:0 3px 0 rgba(200,180,160,.15), 0 6px 18px rgba(160,120,100,.07);
  }
  .rp-btn {
    width:34px;height:34px;border-radius:50%;border:none;cursor:pointer;
    background:radial-gradient(circle at 36% 32%,#fff4f0 0%,#ecc8b8 60%,#d8a890 100%);
    box-shadow:0 3px 0 rgba(180,110,90,.2), 0 6px 14px rgba(200,144,124,.3);
    display:flex;align-items:center;justify-content:center;
    color:#a06050;transition:all .2s;flex-shrink:0;
  }
  .rp-btn:hover {
    transform:scale(1.12) translateY(-2px);
    box-shadow:0 6px 0 rgba(180,110,90,.15), 0 10px 20px rgba(200,144,124,.4);
  }
  .rp-btn:active { transform:scale(.95); }

  /* buttons */
  .rb-ghost {
    width:100%;padding:11px;border-radius:16px;cursor:pointer;
    background:rgba(255,252,248,.65);
    border:1px solid rgba(200,180,160,.28);
    font-family:'Outfit',sans-serif;font-size:12.5px;font-weight:300;
    color:#4a3c34;display:flex;align-items:center;justify-content:center;gap:6px;
    transition:all .25s;backdrop-filter:blur(8px);
    box-shadow:0 3px 0 rgba(200,180,160,.18), 0 5px 14px rgba(160,120,100,.07);
  }
  .rb-ghost:hover {
    background:rgba(255,252,248,.96);border-color:#c8907c;color:#1a1410;
    transform:translateY(-3px);
    box-shadow:0 6px 0 rgba(200,180,160,.14), 0 10px 22px rgba(160,120,100,.14);
  }
  .rb-ghost:active { transform:translateY(0); box-shadow:0 1px 0 rgba(200,180,160,.18); }

  .rb-main {
    width:100%;padding:13px;border-radius:16px;border:none;cursor:pointer;
    background:linear-gradient(135deg,#d8a898 0%,#c09090 35%,#a890b0 70%,#90a8c0 100%);
    background-size:250% 250%;background-position:0% 50%;
    font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;
    color:white;display:flex;align-items:center;justify-content:center;gap:7px;
    box-shadow:
      0 4px 0 rgba(140,80,80,.3),
      0 8px 28px rgba(160,120,130,.35);
    transition:all .3s;letter-spacing:.01em;
    text-shadow:0 1px 3px rgba(80,50,60,.25);
  }
  .rb-main:hover {
    background-position:100% 50%;
    transform:translateY(-4px);
    box-shadow:0 8px 0 rgba(140,80,80,.22), 0 16px 38px rgba(160,120,130,.42);
  }
  .rb-main:active {
    transform:translateY(0);
    box-shadow:0 2px 0 rgba(140,80,80,.3), 0 4px 14px rgba(160,120,130,.3);
  }

  .rb-tx {
    width:100%;padding:13px 15px;border-radius:16px;resize:vertical;
    background:rgba(255,252,248,.72);
    border:1px solid rgba(200,180,160,.28);
    color:#1a1410;font-size:13px;line-height:1.75;outline:none;
    font-family:'Outfit',sans-serif;font-weight:300;
    transition:all .2s;min-height:95px;
    box-shadow:0 3px 0 rgba(200,180,160,.15) inset;
  }
  .rb-tx:focus {
    border-color:rgba(176,144,154,.6);
    background:rgba(255,252,248,.96);
    box-shadow:0 0 0 3px rgba(176,144,154,.12), 0 3px 0 rgba(200,180,160,.1) inset;
  }

  .rb-err {
    padding:10px 14px;border-radius:14px;width:100%;
    background:rgba(255,235,230,.9);
    border:1px solid rgba(200,80,80,.18);
    color:#903030;font-size:12px;font-weight:300;
    display:flex;gap:8px;align-items:flex-start;
    font-family:'Outfit',sans-serif;
    box-shadow:0 3px 0 rgba(200,80,80,.1);
  }
  .rs-ring {
    width:30px;height:30px;border-radius:50%;
    border:2px solid rgba(200,144,124,.18);
    border-top-color:#c8907c;
    animation:rs-spin .9s linear infinite;
  }
  .rw-bar { border-radius:99px;transition:height .06s ease; }
`

export default function Recorder({ onResults, onLoading }) {
  const [stage,      setStage]      = useState('idle')
  const [language,   setLanguage]   = useState(LANGUAGES[0])
  const [langOpen,   setLangOpen]   = useState(false)
  const [audioBlob,  setAudioBlob]  = useState(null)
  const [audioUrl,   setAudioUrl]   = useState(null)
  const [isPlaying,  setIsPlaying]  = useState(false)
  const [recTime,    setRecTime]    = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error,      setError]      = useState(null)
  const [bars,       setBars]       = useState(Array(N).fill(4))

  const mediaRef = useRef(null); const chunksRef = useRef([])
  const timerRef = useRef(null); const audioRef  = useRef(null)
  const animRef  = useRef(null); const ctxRef    = useRef(null)
  const anlRef   = useRef(null)

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startViz = stream => {
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)()
      const anl = ctx.createAnalyser(); anl.fftSize=64
      ctx.createMediaStreamSource(stream).connect(anl)
      ctxRef.current=ctx; anlRef.current=anl
      const d = new Uint8Array(anl.frequencyBinCount)
      const tick = () => {
        anl.getByteFrequencyData(d)
        setBars(Array.from({length:N},(_,i)=>Math.max(4,(d[Math.floor(i*d.length/N)]||0)/255*46)))
        animRef.current=requestAnimationFrame(tick)
      }
      animRef.current=requestAnimationFrame(tick)
    } catch(e){}
  }
  const stopViz = () => {
    if(animRef.current) cancelAnimationFrame(animRef.current)
    if(ctxRef.current) try{ctxRef.current.close()}catch(e){}
    setBars(Array(N).fill(4))
  }

  const startRec = useCallback(async()=>{
    setError(null); chunksRef.current=[]; setLangOpen(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true})
      const mime   = MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'audio/ogg'
      const rec    = new MediaRecorder(stream,{mimeType:mime})
      rec.ondataavailable = e=>{ if(e.data.size>0) chunksRef.current.push(e.data) }
      rec.onstop = ()=>{
        const blob=new Blob(chunksRef.current,{type:mime})
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t=>t.stop()); stopViz(); setStage('preview')
      }
      mediaRef.current=rec; rec.start(100); setRecTime(0)
      timerRef.current=setInterval(()=>setRecTime(t=>t+1),1000)
      startViz(stream); setStage('recording')
    } catch(err){ setError(friendlyError(err)) }
  },[])

  const stopRec = useCallback(()=>{
    if(mediaRef.current&&stage==='recording'){
      mediaRef.current.stop(); clearInterval(timerRef.current)
    }
  },[stage])

  const buildFD = ()=>{
    const fd=new FormData()
    fd.append('audio',audioBlob,`note-${Date.now()}.webm`)
    if(language.code) fd.append('language',language.code)
    return fd
  }

  const summarizeDirect = async()=>{
    if(!audioBlob) return
    onLoading(true); onResults(null); setError(null); setStage('transcribing')
    try {
      const url=process.env.NEXT_PUBLIC_BACKEND_URL||'http://localhost:5000'
      const res=await fetch(`${url}/api/summarize`,{method:'POST',body:buildFD()})
      const d=await res.json()
      if(!res.ok) throw new Error(d.error||'Failed')
      onResults(d); setStage('idle')
    } catch(err){ setError(friendlyError(err)); setStage('preview') }
    finally{ onLoading(false) }
  }

  const transcribeAudio = async()=>{
    if(!audioBlob) return
    setError(null); setStage('transcribing')
    try {
      const url=process.env.NEXT_PUBLIC_BACKEND_URL||'http://localhost:5000'
      const res=await fetch(`${url}/api/transcribe`,{method:'POST',body:buildFD()})
      const d=await res.json()
      if(!res.ok) throw new Error(d.error||'Failed')
      setTranscript(d.transcription); setStage('editing')
    } catch(err){ setError(friendlyError(err)); setStage('preview') }
  }
const doSummarize = async () => {
  if (!transcript.trim()) return
  onLoading(true); onResults(null); setError(null)
  try {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    const res = await fetch(`${url}/api/summarize-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcription: transcript, language: language.code })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed')
    onResults(data)
  } catch (err) {
    setError(friendlyError(err)); onResults(null)
  } finally {
    onLoading(false)
  }
}

  const reset = ()=>{
    setStage('idle'); setAudioBlob(null)
    if(audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null); setRecTime(0); setTranscript(''); setError(null); onResults(null)
  }

  return (
    <>
      <style>{RS}</style>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,width:'100%'}}>
        <AnimatePresence mode="wait">

          {/* IDLE / RECORDING */}
          {(stage==='idle'||stage==='recording') && (
            <motion.div key="mic"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:18,width:'100%'}}>

              {/* lang picker */}
              {stage==='idle' && (
                <div style={{width:'100%',display:'flex',justifyContent:'flex-end',position:'relative'}}>
                  <button className="rl-chip" onClick={()=>setLangOpen(o=>!o)}>
                    <motion.span
                      animate={langOpen?{rotate:180}:{rotate:0}}
                      style={{fontSize:13,display:'inline-block'}}>
                      {language.flag}
                    </motion.span>
                    <span>{language.label}</span>
                    <motion.span animate={{rotate:langOpen?180:0}} transition={{duration:.18}}
                      style={{display:'flex',alignItems:'center'}}>
                      <ChevronDown size={10}/>
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div className="rl-dd"
                        initial={{opacity:0,y:-10,scale:.93,rotateX:-8}}
                        animate={{opacity:1,y:0,scale:1,rotateX:0}}
                        exit={{opacity:0,y:-10,scale:.93}}
                        transition={{duration:.16,type:'spring',stiffness:300}}>
                        {LANGUAGES.map((l,i) => (
                          <motion.button key={l.label}
                            className={`rl-item${language.label===l.label?' sel':''}`}
                            initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                            transition={{delay:i*.04}}
                            onClick={()=>{setLanguage(l);setLangOpen(false)}}>
                            <span style={{fontSize:14}}>{l.flag}</span>
                            <span>{l.label}</span>
                            {language.label===l.label&&(
                              <motion.span
                                initial={{scale:0}} animate={{scale:1}}
                                transition={{type:'spring',stiffness:400}}
                                style={{marginLeft:'auto',color:'#c8907c',fontSize:10}}>✓</motion.span>
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* 3D PEARL ORB */}
              <div className="ro-shell">
                {/* 4 ripple rings when recording */}
                {stage==='recording' && [0,1,2,3].map(i=>(
                  <motion.div key={i} style={{
                    position:'absolute',width:112,height:112,borderRadius:'50%',
                    border:`1px solid rgba(200,110,100,${.42-i*.08})`,
                    pointerEvents:'none',zIndex:1,
                  }}
                    animate={{scale:[1,1.6+i*.38],opacity:[0.55,0]}}
                    transition={{duration:2.4,repeat:Infinity,delay:i*.6,ease:'easeOut'}}
                  />
                ))}
                {/* idle — gentle float */}
                <div className={stage==='idle'?'ro-idle-wrap':''}>
                  <motion.button
                    className={`ro ${stage==='recording'?'ro-rec':'ro-idle'}`}
                    onClick={stage==='recording'?stopRec:startRec}
                    whileTap={{scale:.86,rotateX:8}}
                    whileHover={stage==='idle'?{rotateY:8}:{}}
                  >
                    {stage==='recording'
                      ?<motion.span
                          animate={{scale:[1,1.15,1]}}
                          transition={{duration:.6,repeat:Infinity}}
                          style={{position:'relative',zIndex:1,display:'flex'}}>
                          <Square size={20} color="white" fill="white"/>
                        </motion.span>
                      :<motion.span
                          animate={{y:[0,-2,0],rotate:[0,3,-3,0]}}
                          transition={{duration:3,repeat:Infinity,repeatDelay:2}}
                          style={{position:'relative',zIndex:1,display:'flex'}}>
                          <Mic size={28} color="#b07060" strokeWidth={1.6}/>
                        </motion.span>
                    }
                  </motion.button>
                </div>
              </div>

              {/* STATUS */}
              {stage==='recording' ? (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#c8907c',
                      animation:'rs-blink 1s ease-in-out infinite'}}/>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",
                      fontSize:26,fontStyle:'italic',color:'#1a1410',letterSpacing:'.02em',
                      textShadow:'0 2px 8px rgba(200,144,124,.3)'}}>
                      {fmt(recTime)}
                    </span>
                  </div>
                  {/* live waveform */}
                  <div style={{display:'flex',alignItems:'center',gap:3,height:48}}>
                    {bars.map((h,i)=>(
                      <div key={i} className="rw-bar"
                        style={{width:3,height:h,background:BARS[i],opacity:.85,
                          boxShadow:`0 0 6px ${BARS[i]}88`}}/>
                    ))}
                  </div>
                  <motion.span
                    animate={{opacity:[.4,1,.4]}}
                    transition={{duration:2,repeat:Infinity}}
                    style={{fontSize:10,color:'#9a8878',letterSpacing:'.12em',
                      textTransform:'uppercase',fontWeight:300}}>
                    tap to stop
                  </motion.span>
                </div>
              ) : (
                <motion.div style={{textAlign:'center'}}
                  animate={{y:[0,-3,0]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,
                    fontStyle:'italic',color:'#4a3c34',fontWeight:300}}>tap to begin</p>
                  <p style={{fontSize:10.5,color:'#9a8878',marginTop:3,fontFamily:"'Outfit',sans-serif"}}>
                    {language.flag} {language.label}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* PREVIEW */}
          {stage==='preview' && (
            <motion.div key="preview"
              initial={{opacity:0,y:16,scale:.95,rotateX:6}}
              animate={{opacity:1,y:0,scale:1,rotateX:0}}
              exit={{opacity:0,y:-8,scale:.97}}
              transition={{type:'spring',stiffness:260,damping:24}}
              style={{width:'100%',display:'flex',flexDirection:'column',gap:11}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:10,color:'#9a8878',letterSpacing:'.1em',textTransform:'uppercase'}}>
                  {fmt(recTime)} recorded
                </span>
                <span style={{fontSize:10.5,color:'#4a3c34',padding:'3px 10px',borderRadius:99,
                  border:'1px solid rgba(200,180,160,.3)',background:'rgba(255,252,248,.72)',
                  boxShadow:'0 2px 0 rgba(200,180,160,.15)'}}>
                  {language.flag} {language.label}
                </span>
              </div>
              <audio ref={audioRef} src={audioUrl} onEnded={()=>setIsPlaying(false)} style={{display:'none'}}/>
              <div className="rp-row">
                <button className="rp-btn" onClick={()=>{
                  if(isPlaying){audioRef.current?.pause();setIsPlaying(false)}
                  else{audioRef.current?.play();setIsPlaying(true)}
                }}>
                  {isPlaying?<Pause size={11}/>:<Play size={11}/>}
                </button>
                <div style={{flex:1,height:2,borderRadius:99,background:'rgba(200,180,160,.2)',overflow:'hidden'}}>
                  <motion.div style={{height:'100%',borderRadius:99,
                    background:'linear-gradient(90deg,#c8907c,#b09098,#8aa8c0)'}}
                    animate={{width:isPlaying?'100%':'0%'}}
                    transition={{duration:recTime,ease:'linear'}}/>
                </div>
                <span style={{fontSize:10.5,color:'#9a8878'}}>{fmt(recTime)}</span>
              </div>
              <button className="rb-ghost" onClick={reset}><Trash2 size={12}/> Re-record</button>
              <button className="rb-main"  onClick={summarizeDirect}>
                <motion.span animate={{rotate:[0,20,-20,0]}} transition={{duration:1.5,repeat:Infinity,repeatDelay:2}}>
                  <Sparkles size={13}/>
                </motion.span>
                Summarise
              </button>
              <button onClick={transcribeAudio} style={{background:'none',border:'none',cursor:'pointer',
                fontSize:11,color:'#9a8878',fontFamily:"'Outfit',sans-serif",fontStyle:'italic',
                textDecoration:'underline dotted',textUnderlineOffset:3,textAlign:'center',marginTop:-4}}>
                review transcript first
              </button>
            </motion.div>
          )}

          {/* TRANSCRIBING */}
          {stage==='transcribing' && (
            <motion.div key="loading"
              initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:'28px 0'}}>
              <div style={{position:'relative'}}>
                <div className="rs-ring"/>
                <motion.div
                  animate={{scale:[1,1.3,1],opacity:[.4,1,.4]}}
                  transition={{duration:1.5,repeat:Infinity}}
                  style={{position:'absolute',inset:-6,borderRadius:'50%',
                    border:'1px solid rgba(200,144,124,.2)'}}/>
              </div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,
                fontStyle:'italic',color:'#4a3c34',textAlign:'center'}}>
                Processing in {language.label}…
              </p>
            </motion.div>
          )}

          {/* EDITING */}
          {stage==='editing' && (
            <motion.div key="editing"
              initial={{opacity:0,y:12,scale:.97}} animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0}}
              transition={{type:'spring',stiffness:240,damping:22}}
              style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:10,color:'#9a8878',letterSpacing:'.1em',textTransform:'uppercase'}}>transcript</span>
                <span style={{fontSize:10.5,color:'#b09098',fontStyle:'italic',fontFamily:"'Outfit',sans-serif"}}>edit if needed ✏️</span>
              </div>
              <textarea className="rb-tx" value={transcript}
                onChange={e=>setTranscript(e.target.value)} rows={5} placeholder="Your transcript…"/>
              <div style={{display:'flex',gap:8}}>
                <button className="rb-ghost" onClick={reset}    style={{flex:1}}><Trash2 size={12}/> Reset</button>
                <button className="rb-main"  onClick={doSummarize} style={{flex:2}}>
                  <Sparkles size={12}/> Summarise
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div className="rb-err"
              initial={{opacity:0,y:8,scale:.96}} animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,scale:.96}}>
              <motion.span animate={{rotate:[0,15,-15,0]}} transition={{duration:.4,repeat:3}}>⚠️</motion.span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}