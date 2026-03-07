'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Play, Pause, Trash2, Sparkles, ChevronDown } from 'lucide-react'

const LANGUAGES = [
  { code: 'en',  label: 'English',     flag: '🇬🇧' },
  { code: 'ta',  label: 'Tamil',       flag: '🇮🇳' },
  { code: 'hi',  label: 'Hindi',       flag: '🇮🇳' },
  { code: 'ml',  label: 'Malayalam',   flag: '🇮🇳' },
  { code: 'es',  label: 'Spanish',     flag: '🇪🇸' },
  { code: 'fr',  label: 'French',      flag: '🇫🇷' },
  { code: null,  label: 'Auto-detect', flag: '🌐' },
]

function friendlyError(err) {
  const msg = err?.message || String(err)
  if (msg === 'Failed to fetch')                              return 'Cannot reach server. Check your connection.'
  if (msg.includes('429') || msg.includes('quota'))          return 'AI quota reached — try again in 30s.'
  if (msg.includes('NotAllowedError'))                       return 'Microphone access denied. Allow it in browser settings.'
  return msg
}

const BAR_COUNT = 14
const BAR_COLORS = [
  '#e8b4b8','#d0bce8','#b8cfe8','#b8d4c8','#f0d4b8',
  '#e8b4b8','#d0bce8','#b8cfe8','#b8d4c8','#f0d4b8',
  '#e8b4b8','#d0bce8','#b8cfe8','#f0d4b8',
]

const RECORDER_STYLES = `
  @keyframes orb-breathe {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.05); }
  }
  @keyframes rec-spin {
    to { transform: rotate(360deg); }
  }

  .lang-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 13px; border-radius: 99px;
    background: rgba(255,255,255,0.82);
    border: 1.2px solid rgba(232,180,184,0.35);
    font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 500;
    color: #6b5660; cursor: pointer;
    box-shadow: 0 1px 8px rgba(200,160,168,0.1);
    transition: all 0.18s; backdrop-filter: blur(8px);
  }
  .lang-pill:hover { border-color: #d4878d; background: rgba(255,255,255,0.96); }

  .lang-dd {
    position: absolute; top: calc(100% + 8px); right: 0; z-index: 300;
    background: rgba(255,255,255,0.97);
    border: 1.2px solid rgba(232,180,184,0.3);
    border-radius: 18px; overflow: hidden; min-width: 180px;
    box-shadow: 0 16px 48px rgba(180,140,148,0.2);
    backdrop-filter: blur(16px);
  }
  .lang-opt {
    width: 100%; padding: 10px 16px; border: none; cursor: pointer;
    background: transparent; display: flex; align-items: center; gap: 9px;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 400;
    color: #6b5660; border-bottom: 1px solid rgba(232,180,184,0.18);
    transition: background 0.12s; text-align: left;
  }
  .lang-opt:last-child { border-bottom: none; }
  .lang-opt:hover, .lang-opt.sel { background: rgba(232,180,184,0.15); color: #2d2228; }

  .orb-wrap {
    position: relative; display: flex;
    align-items: center; justify-content: center;
    width: 116px; height: 116px;
  }
  .orb {
    width: 90px; height: 90px; border-radius: 50%; border: none;
    cursor: pointer; position: relative;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
  }
  .orb-idle {
    background: radial-gradient(circle at 35% 30%, #ffffff 0%, #f7e8ec 42%, #e8c0c8 100%);
    box-shadow:
      0 0 0 1px rgba(232,180,184,0.45),
      0 4px 20px rgba(232,180,184,0.38),
      0 12px 44px rgba(208,188,232,0.22),
      inset 0 1px 2px rgba(255,255,255,0.9);
  }
  .orb-idle:hover {
    transform: scale(1.09) translateY(-3px);
    box-shadow:
      0 0 0 1.5px rgba(212,135,141,0.55),
      0 8px 34px rgba(232,180,184,0.48),
      0 22px 64px rgba(208,188,232,0.32),
      inset 0 1px 2px rgba(255,255,255,0.95);
  }
  .orb-rec {
    background: radial-gradient(circle at 35% 30%, #f9d4d8 0%, #e8a0a8 42%, #d47880 100%);
    box-shadow:
      0 0 0 2px rgba(212,120,128,0.5),
      0 6px 28px rgba(212,120,128,0.42),
      0 18px 54px rgba(232,150,158,0.3),
      inset 0 1px 2px rgba(255,255,255,0.55);
    animation: orb-breathe 1.8s ease-in-out infinite;
  }
  .orb::before {
    content: ''; position: absolute;
    top: 12%; left: 18%; width: 30%; height: 25%;
    border-radius: 50%;
    background: rgba(255,255,255,0.55);
    filter: blur(3px); pointer-events: none;
  }

  .wave-bar { border-radius: 3px; transition: height 0.07s ease; }

  .player-row {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px;
    background: rgba(255,255,255,0.72);
    border: 1.2px solid rgba(232,180,184,0.25);
    border-radius: 16px; width: 100%;
    backdrop-filter: blur(8px);
  }
  .play-btn {
    width: 30px; height: 30px; border-radius: 9px; border: none;
    background: linear-gradient(135deg, #e8b4b8, #d0bce8);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; color: white;
    box-shadow: 0 2px 10px rgba(200,160,180,0.32);
    transition: transform 0.15s;
  }
  .play-btn:hover { transform: scale(1.08); }

  .btn-ghost {
    width: 100%; border-radius: 14px; padding: 12px;
    background: rgba(255,255,255,0.65);
    border: 1.2px solid rgba(232,180,184,0.3);
    color: #6b5660; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 13px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all 0.18s; backdrop-filter: blur(8px);
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.92); border-color: #d4878d; color: #2d2228; }

  .btn-primary {
    width: 100%; border-radius: 14px; padding: 13px;
    background: linear-gradient(135deg, #e8b4b8 0%, #d0bce8 100%);
    border: none; color: white; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13.5px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(200,160,180,0.35);
    transition: all 0.2s;
  }
  .btn-primary:hover {
    background: linear-gradient(135deg, #d4878d 0%, #b89cd4 100%);
    box-shadow: 0 6px 28px rgba(200,160,180,0.48);
    transform: translateY(-2px);
  }
  .btn-primary:active { transform: translateY(0); }

  .tx-area {
    width: 100%; padding: 13px 15px; border-radius: 14px; resize: vertical;
    background: rgba(255,255,255,0.72);
    border: 1.2px solid rgba(232,180,184,0.3);
    color: #2d2228; font-size: 13px; line-height: 1.75; outline: none;
    font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; min-height: 100px;
    backdrop-filter: blur(8px);
  }
  .tx-area:focus { border-color: rgba(208,188,232,0.7); background: rgba(255,255,255,0.92); }

  .err-box {
    width: 100%; padding: 10px 14px; border-radius: 12px;
    background: rgba(255,235,235,0.88);
    border: 1.2px solid rgba(220,38,38,0.2);
    color: #b91c1c; font-size: 12px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; line-height: 1.55;
    display: flex; align-items: flex-start; gap: 8px;
    backdrop-filter: blur(8px);
  }

  .spin-ring {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2.5px solid rgba(232,180,184,0.22);
    border-top-color: #d4878d;
    animation: rec-spin 0.9s linear infinite;
  }
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
  const [barHeights, setBarHeights] = useState(Array(BAR_COUNT).fill(4))

  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)
  const audioRef    = useRef(null)
  const analyserRef = useRef(null)
  const animRef     = useRef(null)
  const ctxRef      = useRef(null)

  const fmt = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  /* ── audio visualiser ── */
  const startAudioViz = (stream) => {
    try {
      const ctx      = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      ctx.createMediaStreamSource(stream).connect(analyser)
      ctxRef.current      = ctx
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const heights = Array.from({ length: BAR_COUNT }, (_, i) => {
          const v = data[Math.floor(i * data.length / BAR_COUNT)] || 0
          return Math.max(4, (v / 255) * 38)
        })
        setBarHeights(heights)
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    } catch (e) {
      // Web Audio not available — bars stay flat
    }
  }

  const stopAudioViz = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (ctxRef.current)  { try { ctxRef.current.close() } catch (e) {} }
    setBarHeights(Array(BAR_COUNT).fill(4))
  }

  /* ── recording ── */
  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []
    setLangOpen(false)
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
        stopAudioViz()
        setStage('preview')
      }
      mediaRef.current = recorder
      recorder.start(100)
      setRecTime(0)
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000)
      startAudioViz(stream)
      setStage('recording')
    } catch (err) {
      setError(friendlyError(err))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRef.current && stage === 'recording') {
      mediaRef.current.stop()
      clearInterval(timerRef.current)
    }
  }, [stage])

  /* ── api helpers ── */
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
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/summarize`, { method: 'POST', body: buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      onResults(data)
      setStage('idle')
    } catch (err) {
      setError(friendlyError(err))
      setStage('preview')
    } finally {
      onLoading(false)
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return
    setError(null); setStage('transcribing')
    try {
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/transcribe`, { method: 'POST', body: buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transcription failed')
      setTranscript(data.transcription)
      setStage('editing')
    } catch (err) {
      setError(friendlyError(err))
      setStage('preview')
    }
  }

  const summarize = async () => {
    if (!transcript.trim()) return
    onLoading(true); onResults(null); setError(null)
    try {
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/summarize`, { method: 'POST', body: buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onResults(data)
    } catch (err) {
      setError(friendlyError(err))
      onResults(null)
    } finally {
      onLoading(false)
    }
  }

  const reset = () => {
    setStage('idle')
    setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setRecTime(0)
    setTranscript('')
    setError(null)
    onResults(null)
  }

  /* ── exit prop shorthand ── */
  const ddExit = { opacity: 0, y: -8, scale: 0.96 }

  return (
    <>
      <style>{RECORDER_STYLES}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%' }}>
        <AnimatePresence mode="wait">

          {/* ── IDLE / RECORDING ── */}
          {(stage === 'idle' || stage === 'recording') && (
            <motion.div
              key="mic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}
            >
              {/* Language picker — idle only */}
              {stage === 'idle' && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                  <button className="lang-pill" onClick={() => setLangOpen(o => !o)}>
                    <span style={{ fontSize: 14 }}>{language.flag}</span>
                    <span>{language.label}</span>
                    <motion.span
                      animate={{ rotate: langOpen ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronDown size={11} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {langOpen && (
                      <motion.div
                        className="lang-dd"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={ddExit}
                        transition={{ duration: 0.14 }}
                      >
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang.label}
                            className={`lang-opt${language.label === lang.label ? ' sel' : ''}`}
                            onClick={() => { setLanguage(lang); setLangOpen(false) }}
                          >
                            <span style={{ fontSize: 15 }}>{lang.flag}</span>
                            <span>{lang.label}</span>
                            {language.label === lang.label && (
                              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#d4878d' }}>✓</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Pearl orb */}
              <div className="orb-wrap">
                {/* Ripple rings while recording */}
                {stage === 'recording' && [0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 90, height: 90,
                      borderRadius: '50%',
                      border: `1.5px solid rgba(212,135,141,${0.38 - i * 0.1})`,
                      pointerEvents: 'none',
                    }}
                    animate={{ scale: [1, 1.5 + i * 0.4], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.65, ease: 'easeOut' }}
                  />
                ))}

                <motion.button
                  className={`orb ${stage === 'recording' ? 'orb-rec' : 'orb-idle'}`}
                  onClick={stage === 'recording' ? stopRecording : startRecording}
                  whileTap={{ scale: 0.9 }}
                >
                  {stage === 'recording'
                    ? <Square size={18} color="white" fill="white" style={{ position: 'relative', zIndex: 1 }} />
                    : <Mic    size={26} color="#c87080" strokeWidth={1.8} style={{ position: 'relative', zIndex: 1 }} />
                  }
                </motion.button>
              </div>

              {/* Status below orb */}
              {stage === 'recording' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <motion.div
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4878d', flexShrink: 0 }}
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 24, fontStyle: 'italic', color: '#2d2228', letterSpacing: '0.02em',
                    }}>
                      {fmt(recTime)}
                    </span>
                  </div>

                  {/* Live waveform bars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 40 }}>
                    {barHeights.map((h, i) => (
                      <div
                        key={i}
                        className="wave-bar"
                        style={{ width: 3, height: h, background: BAR_COLORS[i], opacity: 0.82 }}
                      />
                    ))}
                  </div>

                  <span style={{ fontSize: 10.5, color: '#b8a0a8', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                    tap to stop
                  </span>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#6b5660', fontWeight: 400, fontStyle: 'italic' }}>
                    tap to start recording
                  </p>
                  <p style={{ fontSize: 11, color: '#b8a0a8', marginTop: 4 }}>
                    {language.flag} {language.label}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {stage === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 11, width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10.5, color: '#b8a0a8', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {fmt(recTime)} recorded
                </span>
                <span style={{
                  fontSize: 11, color: '#6b5660', padding: '3px 10px',
                  borderRadius: 99, border: '1px solid rgba(232,180,184,0.4)',
                  background: 'rgba(255,255,255,0.72)',
                }}>
                  {language.flag} {language.label}
                </span>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />

              <div className="player-row">
                <button
                  className="play-btn"
                  onClick={() => {
                    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
                    else           { audioRef.current?.play();  setIsPlaying(true)  }
                  }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <div style={{ flex: 1, height: 2, borderRadius: 99, background: 'rgba(232,180,184,0.22)', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#e8b4b8,#d0bce8,#b8cfe8)' }}
                    animate={{ width: isPlaying ? '100%' : '0%' }}
                    transition={{ duration: recTime, ease: 'linear' }}
                  />
                </div>
                <span style={{ fontSize: 11, color: '#b8a0a8', fontWeight: 500 }}>{fmt(recTime)}</span>
              </div>

              <button className="btn-ghost" onClick={reset}>
                <Trash2 size={13} /> Re-record
              </button>
              <button className="btn-primary" onClick={summarizeDirectly}>
                <Sparkles size={13} /> Summarise Note
              </button>
              <button
                onClick={transcribeAudio}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11.5, color: '#b8a0a8', fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'underline dotted', textUnderlineOffset: 3,
                  textAlign: 'center', marginTop: -4, fontStyle: 'italic',
                }}
              >
                review transcript first
              </button>
            </motion.div>
          )}

          {/* ── TRANSCRIBING / LOADING ── */}
          {stage === 'transcribing' && (
            <motion.div
              key="transcribing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 0' }}
            >
              <div className="spin-ring" />
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 15, fontStyle: 'italic', color: '#2d2228', textAlign: 'center',
              }}>
                Processing in {language.label}…
              </p>
            </motion.div>
          )}

          {/* ── EDITING ── */}
          {stage === 'editing' && (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 11 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#b8a0a8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  transcript
                </span>
                <span style={{ fontSize: 11, color: '#a87dd4', fontStyle: 'italic' }}>edit if needed</span>
              </div>
              <textarea
                className="tx-area"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={5}
                placeholder="Your transcript…"
              />
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn-ghost" onClick={reset} style={{ flex: 1 }}>
                  <Trash2 size={12} /> Start over
                </button>
                <button className="btn-primary" onClick={summarize} style={{ flex: 2 }}>
                  <Sparkles size={12} /> Summarise
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="err-box"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}