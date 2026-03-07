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

const sp = { type:'spring', stiffness:340, damping:28 }

function friendlyError(err) {
  const msg = err?.message || String(err)
  if (msg === 'Failed to fetch') return 'Cannot reach server. Check your connection.'
  if (msg.includes('429')||msg.includes('quota')||msg.includes('RESOURCE_EXHAUSTED'))
    return 'AI quota reached — wait 30 seconds and try again.'
  if (msg.includes('NotAllowedError')) return 'Microphone access denied. Allow it in browser settings.'
  return msg
}

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

  const mediaRef  = useRef(null)
  const chunksRef = useRef([])
  const timerRef  = useRef(null)
  const audioRef  = useRef(null)

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startRecording = useCallback(async () => {
    setError(null); chunksRef.current = []; setLangOpen(false)
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio:true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => { if (e.data.size>0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type:mimeType })
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t=>t.stop()); setStage('preview')
      }
      mediaRef.current = recorder
      recorder.start(100); setRecTime(0)
      timerRef.current = setInterval(()=>setRecTime(t=>t+1), 1000)
      setStage('recording')
    } catch(err) {
      if (!navigator.mediaDevices) setError('Open at http://localhost:3000 to use microphone.')
      else setError(friendlyError(err))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRef.current && stage==='recording') {
      mediaRef.current.stop(); clearInterval(timerRef.current)
    }
  }, [stage])

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('audio', audioBlob, `note-${Date.now()}.webm`)
    if (language.code) fd.append('language', language.code)
    return fd
  }

  const summarizeDirectly = async () => {
    if (!audioBlob) return
    onLoading(true); onResults(null); setError(null); setStage('transcribing')
    try {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res = await fetch(`${url}/api/summarize`, { method:'POST', body:buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||data.details||'Request failed')
      onResults(data); setStage('idle')
    } catch(err) {
      setError(friendlyError(err)); setStage('preview')
    } finally { onLoading(false) }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return
    setError(null); setStage('transcribing')
    try {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res = await fetch(`${url}/api/transcribe`, { method:'POST', body:buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||data.details||'Transcription failed')
      setTranscript(data.transcription); setStage('editing')
    } catch(err) {
      setError(friendlyError(err)); setStage('preview')
    }
  }

  const summarize = async () => {
    if (!transcript.trim()) return
    onLoading(true); onResults(null); setError(null)
    try {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res = await fetch(`${url}/api/summarize`, { method:'POST', body:buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||data.details||'Failed')
      onResults(data)
    } catch(err) {
      setError(friendlyError(err)); onResults(null)
    } finally { onLoading(false) }
  }

  const reset = () => {
    setStage('idle'); setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null); setRecTime(0); setTranscript(''); setError(null); onResults(null)
  }

  const WAVE_COLORS = ['#f0765a','#f9c74f','#6baa7e','#74c0fc','#c77dff','#f0765a','#f9c74f','#6baa7e','#74c0fc','#c77dff','#f0765a','#f9c74f']

  return (
    <>
      <style>{`
        .r-lang-btn{display:flex;align-items:center;gap:6px;padding:7px 12px;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;cursor:pointer;font-family:var(--font-body);font-size:12px;font-weight:700;color:var(--ink2);transition:all .18s;}
        .r-lang-btn:hover{background:var(--coral-bg);border-color:rgba(240,118,90,0.3);color:var(--coral);}
        .r-lang-dd{position:absolute;top:calc(100% + 8px);right:0;z-index:300;background:white;border:1.5px solid var(--border);border-radius:16px;overflow:hidden;min-width:185px;box-shadow:0 16px 48px rgba(28,17,22,0.13);}
        .r-lang-opt{width:100%;padding:10px 16px;border:none;cursor:pointer;background:transparent;display:flex;align-items:center;gap:10px;font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--ink2);border-bottom:1px solid var(--border2);transition:all .12s;}
        .r-lang-opt:last-child{border-bottom:none;}
        .r-lang-opt:hover,.r-lang-opt.sel{background:var(--coral-bg);color:var(--coral);}
        .r-mic{width:96px;height:96px;border-radius:50%;border:none;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s ease;}
        .r-mic-idle{background:linear-gradient(145deg,#fff8f4 0%,#fde8e0 100%);box-shadow:0 0 0 1.5px rgba(240,118,90,0.22),0 6px 28px rgba(240,118,90,0.18),inset 0 1px 0 rgba(255,255,255,0.85);}
        .r-mic-idle:hover{transform:scale(1.08) translateY(-3px);box-shadow:0 0 0 2px rgba(240,118,90,0.4),0 14px 44px rgba(240,118,90,0.28),inset 0 1px 0 rgba(255,255,255,0.85);}
        .r-mic-rec{background:linear-gradient(135deg,#f0765a 0%,#d45a3a 100%);box-shadow:0 0 0 2px rgba(240,118,90,0.5),0 8px 32px rgba(240,118,90,0.4),inset 0 1px 0 rgba(255,255,255,0.25);animation:pulse-soft 1.6s ease-in-out infinite;}
        .r-mic::before{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,0.38) 0%,transparent 55%);pointer-events:none;}
        .r-player{display:flex;align-items:center;gap:10px;padding:11px 15px;background:var(--bg2);border:1.5px solid var(--border);border-radius:14px;width:100%;}
        .r-play-btn{width:32px;height:32px;border-radius:9px;background:var(--coral);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s;color:white;box-shadow:0 3px 10px rgba(240,118,90,0.3);}
        .r-play-btn:hover{background:var(--coral2);transform:scale(1.06);}
        .r-btn-ghost{width:100%;border-radius:14px;padding:12px;background:var(--bg2);border:1.5px solid var(--border);color:var(--ink2);cursor:pointer;font-family:var(--font-body);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .18s;}
        .r-btn-ghost:hover{background:var(--card);border-color:rgba(240,118,90,0.3);color:var(--coral);}
        .r-btn-primary{width:100%;border-radius:14px;padding:14px;background:var(--coral);border:none;color:white;cursor:pointer;font-family:var(--font-body);font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s;box-shadow:0 4px 18px rgba(240,118,90,0.35);}
        .r-btn-primary:hover{background:var(--coral2);box-shadow:0 6px 28px rgba(240,118,90,0.4);transform:translateY(-2px);}
        .r-tx{width:100%;padding:13px 15px;border-radius:14px;resize:vertical;background:var(--bg2);border:1.5px solid var(--border);color:var(--ink);font-size:13.5px;line-height:1.75;outline:none;font-family:var(--font-body);transition:border-color .15s;min-height:110px;}
        .r-tx:focus{border-color:rgba(240,118,90,0.45);background:white;}
        .r-err{width:100%;padding:11px 14px;border-radius:12px;background:#fff5f5;border:1.5px solid rgba(220,38,38,0.2);color:#b91c1c;font-size:12.5px;font-weight:600;font-family:var(--font-body);line-height:1.55;display:flex;align-items:flex-start;gap:8px;}
        .r-spin{width:40px;height:40px;border-radius:50%;border:3px solid var(--border);border-top:3px solid var(--coral);animation:spin 0.8s linear infinite;}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,width:'100%'}}>
        <AnimatePresence mode="wait">

          {/* IDLE / RECORDING */}
          {(stage==='idle'||stage==='recording') && (
            <motion.div key="mic" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:22,width:'100%'}}>

              {stage==='idle' && (
                <div style={{width:'100%',display:'flex',justifyContent:'flex-end',position:'relative'}}>
                  <button className="r-lang-btn" onClick={()=>setLangOpen(o=>!o)}>
                    <span>{language.flag}</span><span>{language.label}</span>
                    <motion.span animate={{rotate:langOpen?180:0}} transition={{duration:.18}}>
                      <ChevronDown size={11}/>
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div className="r-lang-dd"
                        initial={{opacity:0,y:-8,scale:.96}} animate={{opacity:1,y:0,scale:1}}
                        exit={{opacity:0,y:-8,scale:.96}} transition={{duration:.14}}>
                        {LANGUAGES.map(lang=>(
                          <button key={lang.label} className={`r-lang-opt ${language.label===lang.label?'sel':''}`}
                            onClick={()=>{setLanguage(lang);setLangOpen(false)}}>
                            <span style={{fontSize:15}}>{lang.flag}</span>
                            <span>{lang.label}</span>
                            {language.label===lang.label&&<span style={{marginLeft:'auto',fontSize:11}}>✓</span>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Ripple rings when recording */}
              <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {stage==='recording' && [1,2,3].map(i=>(
                  <motion.div key={i}
                    style={{position:'absolute',width:96,height:96,borderRadius:'50%',border:'1.5px solid rgba(240,118,90,0.4)'}}
                    animate={{scale:[1,1+i*0.45],opacity:[0.5,0]}}
                    transition={{duration:1.8,repeat:Infinity,delay:i*0.5,ease:'easeOut'}}
                  />
                ))}
                <motion.button
                  className={`r-mic ${stage==='recording'?'r-mic-rec':'r-mic-idle'}`}
                  onClick={stage==='recording'?stopRecording:startRecording}
                  whileTap={{scale:0.92}}
                >
                  {stage==='recording'
                    ?<Square size={20} color="white" fill="white" style={{position:'relative',zIndex:1}}/>
                    :<Mic size={28} color="var(--coral)" strokeWidth={2} style={{position:'relative',zIndex:1}}/>
                  }
                </motion.button>
              </div>

              {stage==='recording' ? (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <motion.div style={{width:7,height:7,borderRadius:'50%',background:'var(--coral)'}}
                      animate={{opacity:[1,0.2,1]}} transition={{duration:1,repeat:Infinity}}/>
                    <span style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:600,fontStyle:'italic',color:'var(--ink)',letterSpacing:'.02em'}}>
                      {fmt(recTime)}
                    </span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:3,height:26}}>
                    {WAVE_COLORS.map((c,i)=>(
                      <motion.div key={i} style={{width:3,borderRadius:2,background:c,opacity:0.75}}
                        animate={{height:[3,Math.random()*20+3,3]}}
                        transition={{duration:0.36+Math.random()*0.3,repeat:Infinity,delay:i*0.06,ease:'easeInOut'}}/>
                    ))}
                  </div>
                  <span style={{fontSize:11,color:'var(--ink3)',letterSpacing:'.06em',fontWeight:700,textTransform:'uppercase'}}>
                    {language.flag} {language.label} · tap to stop
                  </span>
                </div>
              ) : (
                <div style={{textAlign:'center'}}>
                  <p style={{fontSize:14,color:'var(--ink2)',fontWeight:600}}>Tap to start recording</p>
                  <p style={{fontSize:11.5,color:'var(--ink4)',marginTop:5,fontWeight:600}}>{language.flag} {language.label}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* PREVIEW */}
          {stage==='preview' && (
            <motion.div key="preview" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={sp}
              style={{display:'flex',flexDirection:'column',gap:12,width:'100%'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:11,color:'var(--ink3)',fontWeight:700,letterSpacing:'.04em',textTransform:'uppercase'}}>
                  Recording · {fmt(recTime)}
                </span>
                <span style={{fontSize:11,color:'var(--ink3)',padding:'3px 11px',borderRadius:99,border:'1.5px solid var(--border)',background:'var(--bg2)',fontWeight:700}}>
                  {language.flag} {language.label}
                </span>
              </div>
              <audio ref={audioRef} src={audioUrl} onEnded={()=>setIsPlaying(false)} style={{display:'none'}}/>
              <div className="r-player">
                <button className="r-play-btn" onClick={()=>{
                  if(isPlaying){audioRef.current?.pause();setIsPlaying(false)}
                  else{audioRef.current?.play();setIsPlaying(true)}
                }}>
                  {isPlaying?<Pause size={13}/>:<Play size={13}/>}
                </button>
                <div style={{flex:1,height:3,borderRadius:99,background:'var(--border)'}}>
                  <motion.div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,var(--coral),var(--amber))'}}
                    animate={{width:isPlaying?'100%':'0%'}} transition={{duration:recTime,ease:'linear'}}/>
                </div>
                <span style={{fontSize:11,color:'var(--ink3)',fontWeight:700}}>{fmt(recTime)}</span>
              </div>
              <motion.button className="r-btn-ghost" onClick={reset} whileTap={{scale:.98}}>
                <Trash2 size={13}/> Re-record
              </motion.button>
              <motion.button className="r-btn-primary" onClick={summarizeDirectly} whileTap={{scale:.98}}>
                <Sparkles size={14}/> Summarize Note
              </motion.button>
              <button onClick={transcribeAudio} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'var(--ink4)',fontFamily:'var(--font-body)',fontWeight:700,textDecoration:'underline dotted',textUnderlineOffset:3,textAlign:'center',marginTop:-4}}>
                review transcript first
              </button>
            </motion.div>
          )}

          {/* TRANSCRIBING */}
          {stage==='transcribing' && (
            <motion.div key="transcribing" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:'20px 0'}}>
              <div className="r-spin"/>
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:14,fontWeight:700,color:'var(--ink)',fontFamily:'var(--font-display)',fontStyle:'italic'}}>
                  Processing in {language.label}…
                </p>
                <p style={{fontSize:12,color:'var(--ink3)',marginTop:5,fontWeight:600}}>Usually just a few seconds!</p>
              </div>
            </motion.div>
          )}

          {/* EDITING */}
          {stage==='editing' && (
            <motion.div key="editing" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={sp}
              style={{width:'100%',display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:10,fontWeight:800,color:'var(--ink3)',letterSpacing:'.12em',textTransform:'uppercase',fontFamily:'var(--font-body)'}}>
                  Transcript · {language.flag} {language.label}
                </span>
                <span style={{fontSize:11.5,color:'var(--coral)',fontWeight:700}}>edit if needed ✏️</span>
              </div>
              <textarea className="r-tx" value={transcript} onChange={e=>setTranscript(e.target.value)} rows={5} placeholder="Your transcript will appear here…"/>
              <div style={{display:'flex',gap:10}}>
                <motion.button className="r-btn-ghost" onClick={reset} whileTap={{scale:.98}} style={{flex:1}}>
                  <Trash2 size={13}/> Start Over
                </motion.button>
                <motion.button className="r-btn-primary" onClick={summarize} whileTap={{scale:.98}} style={{flex:2}}>
                  <Sparkles size={13}/> Summarize
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div className="r-err" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <span style={{flexShrink:0}}>⚠️</span><span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}