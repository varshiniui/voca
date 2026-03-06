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

const sp = { type: 'spring', stiffness: 320, damping: 28 }

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
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop()); setStage('preview')
      }
      mediaRef.current = recorder
      recorder.start(100); setRecTime(0)
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000)
      setStage('recording')
    } catch (err) {
      if (!navigator.mediaDevices) setError('Open at http://localhost:3000 to use microphone.')
      else if (err.name === 'NotAllowedError') setError('Microphone access denied.')
      else setError(`Could not start: ${err.message}`)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRef.current && stage === 'recording') {
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
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/summarize`, { method: 'POST', body: buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Failed')
      onResults(data); setStage('idle')
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach server.' : err.message)
      setStage('preview')
    } finally { onLoading(false) }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return
    setError(null); setStage('transcribing')
    try {
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/transcribe`, { method: 'POST', body: buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Transcription failed')
      setTranscript(data.transcription); setStage('editing')
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach server.' : err.message)
      setStage('preview')
    }
  }

  const summarize = async () => {
    if (!transcript.trim()) return
    onLoading(true); onResults(null); setError(null)
    try {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res = await fetch(`${url}/api/summarize`, { method: 'POST', body: buildFormData() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Summarization failed')
      onResults(data)
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach server.' : err.message)
      onResults(null)
    } finally { onLoading(false) }
  }

  const reset = () => {
    setStage('idle'); setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null); setRecTime(0); setTranscript(''); setError(null); onResults(null)
  }

  return (
    <>
      <style>{`
        /* ── Language picker ── */
        .lang-btn {
          display: flex; align-items: center; gap: 7px; padding: 7px 13px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; color: rgba(245,239,230,0.6);
          transition: all .18s;
        }
        .lang-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); color: #f5efe6; }

        .lang-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0; z-index: 200;
          background: #1e1c18; border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px; overflow: hidden; min-width: 180px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        }
        .lang-opt {
          width: 100%; padding: 11px 16px; border: none; cursor: pointer;
          background: transparent; display: flex; align-items: center; gap: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: rgba(245,239,230,0.6);
          border-bottom: 1px solid rgba(255,255,255,0.05); transition: all .12s;
        }
        .lang-opt:last-child { border-bottom: none; }
        .lang-opt:hover { background: rgba(255,255,255,0.05); color: #f5efe6; }
        .lang-opt.sel { color: #e8714a; }

        /* ── 3D Mic button ── */
        .mic-btn {
          width: 88px; height: 88px; border-radius: 50%;
          border: none; cursor: pointer; position: relative;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                      box-shadow 0.22s ease;
        }
        .mic-btn-idle {
          background: radial-gradient(circle at 35% 35%, #2a2724, #1a1816);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1),
                      0 8px 32px rgba(0,0,0,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .mic-btn-idle:hover {
          transform: scale(1.07) translateY(-2px);
          box-shadow: 0 0 0 1px rgba(232,113,74,0.4),
                      0 12px 40px rgba(232,113,74,0.2),
                      inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .mic-btn-rec {
          background: radial-gradient(circle at 35% 35%, #c06040, #8a3a20);
          box-shadow: 0 0 0 1px rgba(232,113,74,0.6),
                      0 8px 32px rgba(232,113,74,0.35),
                      inset 0 1px 0 rgba(255,255,255,0.12);
          animation: pulse-ring 1.5s ease-in-out infinite;
        }
        .mic-btn-rec:hover { transform: scale(1.04); }
        .mic-btn-rec:active { transform: scale(0.96); }
        .mic-btn::before {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%);
          pointer-events: none;
        }

        /* ── Audio player ── */
        .player {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; width: 100%;
        }
        .play-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(232,113,74,0.15); border: 1px solid rgba(232,113,74,0.3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all .15s;
          color: #e8714a;
        }
        .play-btn:hover { background: rgba(232,113,74,0.25); }

        /* ── Shared btns ── */
        .btn-ghost {
          width: 100%; border-radius: 12px; padding: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(245,239,230,0.55); cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13px;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: all .18s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); color: #f5efe6; border-color: rgba(255,255,255,0.18); }

        .btn-primary {
          width: 100%; border-radius: 12px; padding: 14px;
          background: #e8714a; border: none;
          color: white; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 14px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all .18s;
          box-shadow: 0 4px 20px rgba(232,113,74,0.35);
        }
        .btn-primary:hover { background: #f08460; box-shadow: 0 6px 28px rgba(232,113,74,0.45); transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); box-shadow: 0 2px 12px rgba(232,113,74,0.3); }

        /* ── Transcript textarea ── */
        .tx-area {
          width: 100%; padding: 14px 16px; border-radius: 12px; resize: vertical;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          color: #f5efe6; font-size: 13.5px; line-height: 1.8; outline: none;
          font-family: 'DM Sans', sans-serif; transition: border-color .15s;
          min-height: 120px;
        }
        .tx-area:focus { border-color: rgba(232,113,74,0.4); }
        .tx-area::placeholder { color: rgba(245,239,230,0.2); }

        /* ── Error ── */
        .err-box {
          width: 100%; padding: 11px 15px; border-radius: 10px;
          background: rgba(185,28,28,0.1); border: 1px solid rgba(185,28,28,0.3);
          color: #fca5a5; font-size: 12.5px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Spinner ── */
        .big-spin {
          width: 44px; height: 44px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.06);
          border-top: 2px solid #e8714a;
          animation: spin 0.9s linear infinite;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
        <AnimatePresence mode="wait">

          {/* ── IDLE / RECORDING ── */}
          {(stage === 'idle' || stage === 'recording') && (
            <motion.div key="mic"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}
            >
              {/* Language */}
              {stage === 'idle' && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                  <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
                    <span>{language.flag}</span>
                    <span>{language.label}</span>
                    <motion.span animate={{ rotate: langOpen ? 180 : 0 }} transition={{ duration: .18 }}>
                      <ChevronDown size={12} />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div className="lang-dropdown"
                        initial={{ opacity: 0, y: -8, scale: .96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: .96 }}
                        transition={{ duration: .15 }}
                      >
                        {LANGUAGES.map(lang => (
                          <button key={lang.label} className={`lang-opt ${language.label === lang.label ? 'sel' : ''}`}
                            onClick={() => { setLanguage(lang); setLangOpen(false) }}>
                            <span style={{ fontSize: 14 }}>{lang.flag}</span>
                            <span>{lang.label}</span>
                            {language.label === lang.label && (
                              <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mic */}
              <motion.button
                className={`mic-btn ${stage === 'recording' ? 'mic-btn-rec' : 'mic-btn-idle'}`}
                onClick={stage === 'recording' ? stopRecording : startRecording}
                whileTap={{ scale: 0.93 }}
              >
                {stage === 'recording'
                  ? <Square size={20} color="white" fill="white" style={{ position: 'relative', zIndex: 1 }} />
                  : <Mic    size={26} color="rgba(245,239,230,0.85)" strokeWidth={1.5} style={{ position: 'relative', zIndex: 1 }} />
                }
              </motion.button>

              {stage === 'recording' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8714a' }}
                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                    <span style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 20, fontWeight: 700, fontStyle: 'italic',
                      color: '#f5efe6', letterSpacing: '0.02em',
                    }}>
                      {fmt(recTime)}
                    </span>
                  </div>
                  {/* Waveform */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24 }}>
                    {['#e8714a','#d4a853','#7aab8a','#6499b8','#e8714a','#d4a853','#7aab8a','#6499b8','#e8714a','#d4a853','#7aab8a','#6499b8'].map((c, i) => (
                      <motion.div key={i} style={{ width: 3, borderRadius: 2, background: c, opacity: 0.7 }}
                        animate={{ height: [3, Math.random() * 18 + 3, 3] }}
                        transition={{ duration: 0.38 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.065, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(245,239,230,0.35)', letterSpacing: '.06em', fontWeight: 500, textTransform: 'uppercase' }}>
                    {language.flag} {language.label} · tap to stop
                  </span>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'rgba(245,239,230,0.5)', fontWeight: 400 }}>
                    Tap to start recording
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(245,239,230,0.25)', marginTop: 5, letterSpacing: '.04em' }}>
                    {language.flag} {language.label}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {stage === 'preview' && (
            <motion.div key="preview"
              initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={sp}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(245,239,230,0.35)', fontWeight: 500, letterSpacing: '.04em' }}>
                  Recording · {fmt(recTime)}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(245,239,230,0.35)', padding: '3px 10px',
                  borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)' }}>
                  {language.flag} {language.label}
                </span>
              </div>

              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />
              <div className="player">
                <button className="play-btn" onClick={() => {
                  if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
                  else { audioRef.current?.play(); setIsPlaying(true) }
                }}>
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <div style={{ flex: 1, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#e8714a,#d4a853)' }}
                    animate={{ width: isPlaying ? '100%' : '0%' }}
                    transition={{ duration: recTime, ease: 'linear' }} />
                </div>
                <span style={{ fontSize: 11, color: 'rgba(245,239,230,0.35)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(recTime)}
                </span>
              </div>

              <motion.button className="btn-ghost" onClick={reset} whileTap={{ scale: .98 }}>
                <Trash2 size={13} /> Re-record
              </motion.button>
              <motion.button className="btn-primary" onClick={summarizeDirectly} whileTap={{ scale: .98 }}>
                <Sparkles size={14} /> Summarize Note
              </motion.button>
              <button onClick={transcribeAudio} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                color: 'rgba(245,239,230,0.3)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.1)',
                textUnderlineOffset: 3, textAlign: 'center', marginTop: -4,
              }}>
                review transcript first
              </button>
            </motion.div>
          )}

          {/* ── TRANSCRIBING ── */}
          {stage === 'transcribing' && (
            <motion.div key="transcribing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '20px 0' }}
            >
              <div className="big-spin" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#f5efe6', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
                  Processing in {language.label}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(245,239,230,0.3)', marginTop: 5 }}>Usually a few seconds…</p>
              </div>
            </motion.div>
          )}

          {/* ── EDITING ── */}
          {stage === 'editing' && (
            <motion.div key="editing"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={sp}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(245,239,230,0.3)',
                  letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif" }}>
                  Transcript · {language.flag} {language.label}
                </span>
                <span style={{ fontSize: 11, color: '#e8714a', opacity: .7 }}>edit if needed</span>
              </div>

              <textarea className="tx-area"
                value={transcript} onChange={e => setTranscript(e.target.value)} rows={5}
                placeholder="Your transcript will appear here…"
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button className="btn-ghost" onClick={reset} whileTap={{ scale: .98 }}
                  style={{ flex: 1 }}>
                  <Trash2 size={13} /> Start Over
                </motion.button>
                <motion.button className="btn-primary" onClick={summarize} whileTap={{ scale: .98 }}
                  style={{ flex: 2 }}>
                  <Sparkles size={13} /> Summarize
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div className="err-box"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}