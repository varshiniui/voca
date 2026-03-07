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

function friendlyError(err) {
  const msg = err?.message || String(err)
  if (msg === 'Failed to fetch')                     return 'Cannot reach server.'
  if (msg.includes('429')||msg.includes('quota'))    return 'AI quota reached — try again in 30s.'
  if (msg.includes('NotAllowedError'))               return 'Microphone access denied.'
  return msg
}

const BAR_COUNT  = 18
const BAR_COLORS = ['#f2c4c4','#f5d8c0','#dcc4f2','#c4d8f2','#c4e8d8',
                    '#f2e0b0','#f2c4c4','#f5d8c0','#dcc4f2','#c4d8f2',
                    '#c4e8d8','#f2e0b0','#f2c4c4','#f5d8c0','#dcc4f2',
                    '#c4d8f2','#c4e8d8','#f2e0b0']

const S = `
@keyframes rec-spin   { to { transform: rotate(360deg); } }
@keyframes orb-pulse  { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
@keyframes blink-dot  { 0%,100%{opacity:1;} 50%{opacity:.2;} }

.orb-shell {
  position:relative; display:flex; align-items:center; justify-content:center;
  width:148px; height:148px; flex-shrink:0;
}
.orb-btn {
  width:108px; height:108px; border-radius:50%; border:none; cursor:pointer;
  position:relative; display:flex; align-items:center; justify-content:center;
  transition:transform .35s cubic-bezier(.34,1.56,.64,1);
  z-index:2;
}
.orb-idle {
  background: radial-gradient(circle at 33% 28%, #fff 0%, #fdeef0 38%, #f2c4c4 72%, #e8a8b0 100%);
  box-shadow:
    0 0 0 1px rgba(242,196,196,.5),
    0 6px 28px rgba(242,196,196,.45),
    0 18px 60px rgba(220,196,242,.25),
    inset 0 2px 4px rgba(255,255,255,.85);
}
.orb-idle:hover { transform:scale(1.08) translateY(-4px); }
.orb-idle:hover { box-shadow:
    0 0 0 2px rgba(212,135,141,.5),
    0 12px 44px rgba(242,196,196,.55),
    0 28px 80px rgba(220,196,242,.35),
    inset 0 2px 4px rgba(255,255,255,.9); }
.orb-rec {
  background: radial-gradient(circle at 33% 28%, #fde8ea 0%, #f5a8b0 42%, #e07880 100%);
  box-shadow:
    0 0 0 2px rgba(224,120,128,.55),
    0 8px 36px rgba(224,120,128,.5),
    0 24px 72px rgba(242,160,168,.35),
    inset 0 2px 4px rgba(255,255,255,.5);
  animation: orb-pulse 2s ease-in-out infinite;
}
.orb-btn::before {
  content:''; position:absolute; top:13%; left:19%; width:28%; height:22%;
  border-radius:50%; background:rgba(255,255,255,.6); filter:blur(4px); pointer-events:none;
}

.lang-chip {
  display:inline-flex; align-items:center; gap:5px; padding:5px 12px;
  border-radius:99px; background:rgba(255,255,255,.78);
  border:1px solid rgba(242,196,196,.35);
  font-family:var(--font-body,'Outfit'),sans-serif; font-size:11px; font-weight:400;
  color:#5c4a58; cursor:pointer; transition:all .18s;
  backdrop-filter:blur(8px);
}
.lang-chip:hover { border-color:#e8a8b0; background:rgba(255,255,255,.95); }
.lang-dd {
  position:absolute; top:calc(100%+8px); right:0; z-index:400;
  background:rgba(255,252,250,.97); border:1px solid rgba(242,196,196,.3);
  border-radius:20px; overflow:hidden; min-width:176px;
  box-shadow:0 20px 60px rgba(180,140,148,.2); backdrop-filter:blur(20px);
}
.lang-item {
  width:100%; padding:10px 16px; border:none; cursor:pointer; background:transparent;
  display:flex; align-items:center; gap:10px;
  font-family:var(--font-body,'Outfit'),sans-serif; font-size:12px; font-weight:300;
  color:#5c4a58; border-bottom:1px solid rgba(242,196,196,.15); transition:background .1s;
  text-align:left;
}
.lang-item:last-child { border-bottom:none; }
.lang-item:hover,.lang-item.active { background:rgba(242,196,196,.18); color:#1e1520; }

.play-orb {
  width:34px; height:34px; border-radius:50%; border:none; cursor:pointer;
  background:radial-gradient(circle at 38% 34%, #fff 0%, #f5d0d4 60%, #e8a8b0 100%);
  box-shadow:0 2px 12px rgba(232,168,176,.4); display:flex; align-items:center;
  justify-content:center; transition:transform .15s; color:#c87080; flex-shrink:0;
}
.play-orb:hover { transform:scale(1.1); }

.ghost-btn {
  width:100%; padding:11px; border-radius:16px; cursor:pointer;
  background:rgba(255,255,255,.6); border:1px solid rgba(242,196,196,.3);
  font-family:var(--font-body,'Outfit'),sans-serif; font-size:12.5px; font-weight:400;
  color:#5c4a58; display:flex; align-items:center; justify-content:center; gap:6px;
  transition:all .2s; backdrop-filter:blur(8px);
}
.ghost-btn:hover { background:rgba(255,255,255,.92); border-color:#e8a8b0; color:#1e1520; }

.main-btn {
  width:100%; padding:13px; border-radius:16px; border:none; cursor:pointer;
  background:linear-gradient(135deg, #f2c4c4 0%, #dcc4f2 50%, #c4d8f2 100%);
  background-size:200% 200%; background-position:0% 50%;
  font-family:var(--font-body,'Outfit'),sans-serif; font-size:13px; font-weight:500;
  color:white; display:flex; align-items:center; justify-content:center; gap:7px;
  box-shadow:0 4px 22px rgba(200,160,200,.35); transition:all .25s;
  text-shadow:0 1px 3px rgba(100,60,100,.2);
}
.main-btn:hover {
  background-position:100% 50%;
  box-shadow:0 8px 32px rgba(200,160,200,.48);
  transform:translateY(-2px);
}
.main-btn:active { transform:translateY(0); }

.tx {
  width:100%; padding:13px 15px; border-radius:16px; resize:vertical;
  background:rgba(255,255,255,.7); border:1px solid rgba(242,196,196,.3);
  color:#1e1520; font-size:13px; line-height:1.75; outline:none;
  font-family:var(--font-body,'Outfit'),sans-serif; font-weight:300;
  transition:border-color .15s; min-height:96px; backdrop-filter:blur(8px);
}
.tx:focus { border-color:rgba(220,196,242,.7); background:rgba(255,255,255,.92); }

.err { padding:10px 14px; border-radius:14px; width:100%;
  background:rgba(255,235,235,.9); border:1px solid rgba(220,38,38,.18);
  color:#b91c1c; font-size:12px; font-weight:400; display:flex; gap:8px;
  align-items:flex-start; font-family:var(--font-body,'Outfit'),sans-serif;
}
.spin { width:32px;height:32px;border-radius:50%;
  border:2px solid rgba(242,196,196,.2); border-top-color:#e8a8b0;
  animation:rec-spin .9s linear infinite; }
.wave-bar { border-radius:99px; transition:height .06s ease; }
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
  const [bars,       setBars]       = useState(Array(BAR_COUNT).fill(4))

  const mediaRef  = useRef(null)
  const chunksRef = useRef([])
  const timerRef  = useRef(null)
  const audioRef  = useRef(null)
  const animRef   = useRef(null)
  const ctxRef    = useRef(null)
  const anlRef    = useRef(null)

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startViz = (stream) => {
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)()
      const anl = ctx.createAnalyser(); anl.fftSize = 64
      ctx.createMediaStreamSource(stream).connect(anl)
      ctxRef.current = ctx; anlRef.current = anl
      const d = new Uint8Array(anl.frequencyBinCount)
      const tick = () => {
        anl.getByteFrequencyData(d)
        setBars(Array.from({length:BAR_COUNT},(_,i)=> Math.max(4,(d[Math.floor(i*d.length/BAR_COUNT)]||0)/255*42))        )
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    } catch(e){}
  }
  const stopViz = () => {
    if(animRef.current) cancelAnimationFrame(animRef.current)
    if(ctxRef.current) try{ctxRef.current.close()}catch(e){}
    setBars(Array(BAR_COUNT).fill(4))
  }

  const startRec = useCallback(async()=>{
    setError(null); chunksRef.current=[]; setLangOpen(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true})
      const mime   = MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'audio/ogg'
      const rec    = new MediaRecorder(stream,{mimeType:mime})
      rec.ondataavailable = e=>{ if(e.data.size>0) chunksRef.current.push(e.data) }
      rec.onstop = ()=>{
        const blob = new Blob(chunksRef.current,{type:mime})
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t=>t.stop()); stopViz(); setStage('preview')
      }
      mediaRef.current = rec; rec.start(100); setRecTime(0)
      timerRef.current = setInterval(()=>setRecTime(t=>t+1),1000)
      startViz(stream); setStage('recording')
    } catch(err){ setError(friendlyError(err)) }
  },[])

  const stopRec = useCallback(()=>{
    if(mediaRef.current&&stage==='recording'){mediaRef.current.stop();clearInterval(timerRef.current)}
  },[stage])

  const buildFD = ()=>{
    const fd=new FormData()
    fd.append('audio',audioBlob,`note-${Date.now()}.webm`)
    if(language.code) fd.append('language',language.code)
    return fd
  }

  const summarizeDirect = async()=>{
    if(!audioBlob)return
    onLoading(true);onResults(null);setError(null);setStage('transcribing')
    try{
      const url=process.env.NEXT_PUBLIC_BACKEND_URL||'http://localhost:5000'
      const res=await fetch(`${url}/api/summarize`,{method:'POST',body:buildFD()})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||'Failed')
      onResults(data);setStage('idle')
    }catch(err){setError(friendlyError(err));setStage('preview')}
    finally{onLoading(false)}
  }

  const transcribeAudio = async()=>{
    if(!audioBlob)return
    setError(null);setStage('transcribing')
    try{
      const url=process.env.NEXT_PUBLIC_BACKEND_URL||'http://localhost:5000'
      const res=await fetch(`${url}/api/transcribe`,{method:'POST',body:buildFD()})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||'Failed')
      setTranscript(data.transcription);setStage('editing')
    }catch(err){setError(friendlyError(err));setStage('preview')}
  }

  const doSummarize = async()=>{
    if(!transcript.trim())return
    onLoading(true);onResults(null);setError(null)
    try{
      const url=process.env.NEXT_PUBLIC_BACKEND_URL||'http://localhost:5000'
      const res=await fetch(`${url}/api/summarize`,{method:'POST',body:buildFD()})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||'Failed')
      onResults(data)
    }catch(err){setError(friendlyError(err));onResults(null)}
    finally{onLoading(false)}
  }

  const reset = ()=>{
    setStage('idle');setAudioBlob(null)
    if(audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null);setRecTime(0);setTranscript('');setError(null);onResults(null)
  }

  const exitProps = { opacity:0, scale:0.96 }

  return(
    <>
      <style>{S}</style>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,width:'100%'}}>
        <AnimatePresence mode="wait">

          {/* ── IDLE / RECORDING ── */}
          {(stage==='idle'||stage==='recording')&&(
            <motion.div key="mic"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:18,width:'100%'}}
            >
              {/* lang picker */}
              {stage==='idle'&&(
                <div style={{width:'100%',display:'flex',justifyContent:'flex-end',position:'relative'}}>
                  <button className="lang-chip" onClick={()=>setLangOpen(o=>!o)}>
                    <span style={{fontSize:13}}>{language.flag}</span>
                    <span>{language.label}</span>
                    <motion.span animate={{rotate:langOpen?180:0}} transition={{duration:.18}}
                      style={{display:'flex',alignItems:'center'}}>
                      <ChevronDown size={10}/>
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {langOpen&&(
                      <motion.div className="lang-dd"
                        initial={{opacity:0,y:-8,scale:.95}}
                        animate={{opacity:1,y:0,scale:1}}
                        exit={{opacity:0,y:-8,scale:.95}}
                        transition={{duration:.14}}
                      >
                        {LANGUAGES.map(l=>(
                          <button key={l.label}
                            className={`lang-item${language.label===l.label?' active':''}`}
                            onClick={()=>{setLanguage(l);setLangOpen(false)}}
                          >
                            <span style={{fontSize:14}}>{l.flag}</span>
                            <span>{l.label}</span>
                            {language.label===l.label&&<span style={{marginLeft:'auto',color:'#e8a8b0',fontSize:10}}>✓</span>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* orb */}
              <div className="orb-shell">
                {stage==='recording'&&[0,1,2,3].map(i=>(
                  <motion.div key={i} style={{
                    position:'absolute',width:108,height:108,borderRadius:'50%',
                    border:`1px solid rgba(224,140,148,${0.4-i*.08})`,
                    pointerEvents:'none',zIndex:1,
                  }}
                    animate={{scale:[1,1.6+i*.35],opacity:[0.55,0]}}
                    transition={{duration:2.2,repeat:Infinity,delay:i*.55,ease:'easeOut'}}
                  />
                ))}
                <motion.button
                  className={`orb-btn ${stage==='recording'?'orb-rec':'orb-idle'}`}
                  onClick={stage==='recording'?stopRec:startRec}
                  whileTap={{scale:.88}}
                >
                  {stage==='recording'
                    ?<Square size={20} color="white" fill="white" style={{position:'relative',zIndex:1}}/>
                    :<Mic size={28} color="#c87080" strokeWidth={1.6} style={{position:'relative',zIndex:1}}/>
                  }
                </motion.button>
              </div>

              {/* status */}
              {stage==='recording'?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#e8a8b0',
                      animation:'blink-dot 1s ease-in-out infinite'}}/>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,
                      fontStyle:'italic',color:'var(--ink)',letterSpacing:'.02em'}}>
                      {fmt(recTime)}
                    </span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:2.5,height:44}}>
                    {bars.map((h,i)=>(
                      <div key={i} className="wave-bar"
                        style={{width:3,height:h,background:BAR_COLORS[i],opacity:.85}}/>
                    ))}
                  </div>
                  <span style={{fontSize:10,color:'var(--muted)',letterSpacing:'.12em',
                    textTransform:'uppercase',fontWeight:400}}>tap to stop</span>
                </div>
              ):(
                <div style={{textAlign:'center',lineHeight:1.5}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,
                    fontStyle:'italic',color:'var(--ink2)',fontWeight:400}}>
                    tap to begin
                  </p>
                  <p style={{fontSize:10.5,color:'var(--muted)',marginTop:3}}>
                    {language.flag} {language.label}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {stage==='preview'&&(
            <motion.div key="preview"
              initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
              exit={exitProps}
              transition={{type:'spring',stiffness:280,damping:26}}
              style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}
            >
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:10,color:'var(--muted)',letterSpacing:'.1em',textTransform:'uppercase'}}>
                  {fmt(recTime)}
                </span>
                <span style={{fontSize:10.5,color:'var(--ink2)',padding:'3px 10px',borderRadius:99,
                  border:'1px solid rgba(242,196,196,.4)',background:'rgba(255,255,255,.65)'}}>
                  {language.flag} {language.label}
                </span>
              </div>
              <audio ref={audioRef} src={audioUrl} onEnded={()=>setIsPlaying(false)} style={{display:'none'}}/>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 13px',
                background:'rgba(255,255,255,.65)',border:'1px solid rgba(242,196,196,.25)',
                borderRadius:16,backdropFilter:'blur(8px)'}}>
                <button className="play-orb" onClick={()=>{
                  if(isPlaying){audioRef.current?.pause();setIsPlaying(false)}
                  else{audioRef.current?.play();setIsPlaying(true)}
                }}>
                  {isPlaying?<Pause size={11}/>:<Play size={11}/>}
                </button>
                <div style={{flex:1,height:2,borderRadius:99,background:'rgba(242,196,196,.22)',overflow:'hidden'}}>
                  <motion.div style={{height:'100%',borderRadius:99,
                    background:'linear-gradient(90deg,#f2c4c4,#dcc4f2,#c4d8f2)'}}
                    animate={{width:isPlaying?'100%':'0%'}}
                    transition={{duration:recTime,ease:'linear'}}/>
                </div>
                <span style={{fontSize:10.5,color:'var(--muted)',fontWeight:400}}>{fmt(recTime)}</span>
              </div>
              <button className="ghost-btn" onClick={reset}>
                <Trash2 size={12}/> Re-record
              </button>
              <button className="main-btn" onClick={summarizeDirect}>
                <Sparkles size={13}/> Summarise
              </button>
              <button onClick={transcribeAudio} style={{background:'none',border:'none',
                cursor:'pointer',fontSize:11,color:'var(--muted)',fontFamily:"'Outfit',sans-serif",
                textDecoration:'underline dotted',textUnderlineOffset:3,
                textAlign:'center',fontStyle:'italic',marginTop:-4}}>
                review transcript first
              </button>
            </motion.div>
          )}

          {/* ── TRANSCRIBING ── */}
          {stage==='transcribing'&&(
            <motion.div key="loading"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:13,padding:'26px 0'}}
            >
              <div className="spin"/>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,
                fontStyle:'italic',color:'var(--ink2)'}}>
                Processing in {language.label}…
              </p>
            </motion.div>
          )}

          {/* ── EDITING ── */}
          {stage==='editing'&&(
            <motion.div key="editing"
              initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              exit={{opacity:0}}
              transition={{type:'spring',stiffness:260,damping:24}}
              style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}
            >
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:10,color:'var(--muted)',letterSpacing:'.1em',textTransform:'uppercase'}}>transcript</span>
                <span style={{fontSize:10.5,color:'#a87dd4',fontStyle:'italic'}}>edit if needed</span>
              </div>
              <textarea className="tx" value={transcript}
                onChange={e=>setTranscript(e.target.value)} rows={5} placeholder="Your transcript…"/>
              <div style={{display:'flex',gap:8}}>
                <button className="ghost-btn" onClick={reset} style={{flex:1}}><Trash2 size={12}/> Reset</button>
                <button className="main-btn"  onClick={doSummarize} style={{flex:2}}><Sparkles size={12}/> Summarise</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <AnimatePresence>
          {error&&(
            <motion.div className="err"
              initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <span style={{flexShrink:0}}>⚠️</span><span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}