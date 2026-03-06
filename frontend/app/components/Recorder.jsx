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

const sp = { type: 'spring', stiffness: 320, damping: 26 }

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

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

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
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      // ✅ FIXED: was /api/summarize-text, now posts audio to /api/summarize
      const res  = await fetch(`${url}/api/summarize`, {
        method: 'POST',
        body: buildFormData(),
      })
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

  /* ── Shared button styles ── */
  const btnBase = {
    width: '100%', borderRadius: 12,
    background: 'white', color: 'var(--text2)',
    border: '2px solid #1a0f2e',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    boxShadow: '3px 3px 0 #1a0f2e',
    transition: 'all 0.14s',
  }
  const primaryBtn = {
    width: '100%', borderRadius: 12,
    background: '#4a2d78', color: 'white',
    border: '2px solid #1a0f2e',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '3px 3px 0 #1a0f2e',
    transition: 'all 0.14s',
  }

  return (
    <>
      <style>{`
        .rec-btn:hover  { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #1a0f2e !important; }
        .rec-btn:active { transform: translate(1px,1px);   box-shadow: 1px 1px 0 #1a0f2e !important; }

        /* 3D mic button */
        .mic-3d {
          width: 96px; height: 96px; border-radius: 50%;
          border: 2.5px solid #1a0f2e;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .mic-3d::before {
          content: '';
          position: absolute; inset: 0; border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%);
          z-index: 1; pointer-events: none;
        }
        .mic-3d:hover {
          transform: translate(-3px,-3px) scale(1.05);
          box-shadow: 7px 7px 0 #1a0f2e !important;
        }
        .mic-3d:active {
          transform: translate(2px,2px) scale(0.97);
          box-shadow: 2px 2px 0 #1a0f2e !important;
        }
        .mic-3d-idle {
          background: white;
          box-shadow: 4px 4px 0 #1a0f2e;
        }
        .mic-3d-rec {
          background: linear-gradient(135deg, #4a2d78, #7c4daf);
          box-shadow: 4px 4px 0 #1a0f2e, 0 0 0 0 rgba(74,45,120,0.4);
          animation: recPulse3d 1.5s ease-in-out infinite;
        }
        @keyframes recPulse3d {
          0%,100% { box-shadow: 4px 4px 0 #1a0f2e, 0 0 0 0 rgba(74,45,120,0.4); }
          50%     { box-shadow: 4px 4px 0 #1a0f2e, 0 0 0 16px rgba(74,45,120,0); }
        }

        /* Language picker */
        .lang-btn {
          display: flex; align-items: center; gap: 6px; padding: 6px 13px;
          background: white; border: 2px solid #1a0f2e; border-radius: 10px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600; color: #3d2f5a;
          box-shadow: 2px 2px 0 #1a0f2e; transition: all .15s;
        }
        .lang-btn:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a0f2e; }
        .lang-btn:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a0f2e; }

        .lang-dropdown {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 100;
          background: white; border: 2px solid #1a0f2e; border-radius: 14px;
          overflow: hidden; min-width: 170px;
          box-shadow: 4px 4px 0 #1a0f2e;
        }
        .lang-option {
          width: 100%; padding: 10px 15px; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
          transition: background .12s; background: white;
        }
        .lang-option:not(:last-child) { border-bottom: 1px solid #e8dff8; }
        .lang-option:hover { background: #faf5eb; }
        .lang-option.selected { background: #faf5eb; color: #4a2d78; font-weight: 700; }

        /* Waveform bars */
        .wave-container {
          display: flex; align-items: center; gap: 3px; height: 28px;
        }
        .wv-bar {
          width: 3px; border-radius: 2px;
          background: linear-gradient(180deg, #c9a7ff, #4a2d78);
          transform-origin: bottom;
        }

        /* Audio player */
        .audio-player {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          background: #faf5eb; border: 2px solid #1a0f2e; border-radius: 14px;
          box-shadow: 3px 3px 0 #1a0f2e;
          width: 100%;
        }
        .play-btn {
          background: #4a2d78; border: 2px solid #1a0f2e; border-radius: 8px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 2px 2px 0 #1a0f2e; flex-shrink: 0;
          transition: all .14s;
        }
        .play-btn:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a0f2e; }
        .play-btn:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a0f2e; }

        /* Transcript textarea */
        .transcript-area {
          width: 100%; padding: 14px 16px; border-radius: 12px; resize: vertical;
          background: white; border: 2px solid #e8dff8;
          color: #1a0f2e; font-size: 13px; line-height: 1.8; outline: none;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 2px 2px 0 #e8dff8;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .transcript-area:focus {
          border-color: #4a2d78;
          box-shadow: 2px 2px 0 #4a2d78;
        }

        /* Error box */
        .error-box {
          width: 100%; padding: 11px 15px; border-radius: 10px;
          background: #fef2f2; border: 2px solid #fecaca;
          color: #b91c1c; font-size: 12.5px; font-weight: 500;
          box-shadow: 2px 2px 0 #fecaca;
        }

        /* Transcribing spinner */
        .transcribing-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 16px 0;
        }
        .spin-outer {
          width: 48px; height: 48px; border-radius: 50%;
          border: 3px solid #ede5ff; border-top: 3px solid #4a2d78;
          animation: spin 0.9s linear infinite;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
        <AnimatePresence mode="wait">

          {/* ── IDLE + RECORDING ── */}
          {(stage === 'idle' || stage === 'recording') && (
            <motion.div key="mic"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}
            >
              {/* Language selector */}
              {stage === 'idle' && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                  <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
                    <span>{language.flag}</span>
                    <span>{language.label}</span>
                    <motion.span animate={{ rotate: langOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                      <ChevronDown size={12} color="#8070a0" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {langOpen && (
                      <motion.div className="lang-dropdown"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        {LANGUAGES.map(lang => (
                          <button key={lang.label}
                            className={`lang-option ${language.label === lang.label ? 'selected' : ''}`}
                            onClick={() => { setLanguage(lang); setLangOpen(false) }}
                          >
                            <span style={{ fontSize: 15 }}>{lang.flag}</span>
                            <span>{lang.label}</span>
                            {language.label === lang.label && (
                              <span style={{ marginLeft: 'auto', color: '#4a2d78', fontSize: 11, fontWeight: 800 }}>✓</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* 3D Mic button */}
              <motion.button
                className={`mic-3d ${stage === 'recording' ? 'mic-3d-rec' : 'mic-3d-idle'}`}
                onClick={stage === 'recording' ? stopRecording : startRecording}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                {stage === 'recording'
                  ? <Square size={22} color="white" fill="white" style={{ position: 'relative', zIndex: 2 }} />
                  : <Mic    size={26} color="#4a2d78" strokeWidth={1.8} style={{ position: 'relative', zIndex: 2 }} />
                }
              </motion.button>

              {/* Status text */}
              {stage === 'recording' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.div
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a2d78' }}
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span style={{
                      fontSize: 16, fontWeight: 700, color: '#1a0f2e',
                      fontFamily: "'Unbounded', sans-serif",
                      letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
                    }}>
                      {fmt(recTime)}
                    </span>
                  </div>

                  {/* Rainbow waveform */}
                  <div className="wave-container">
                    {['#ff8c69','#ffd166','#85e89d','#74c7f5','#c9a7ff','#ffadd2','#ff8c69','#ffd166','#85e89d','#74c7f5','#c9a7ff','#ffadd2'].map((color, i) => (
                      <motion.div key={i} className="wv-bar"
                        style={{ background: color }}
                        animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                        transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>

                  <span style={{ fontSize: 11, color: '#8070a0', letterSpacing: '.04em', fontWeight: 500 }}>
                    {language.flag} {language.label} · tap square to stop
                  </span>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#3d2f5a', fontWeight: 500 }}>Tap to record your note</p>
                  <p style={{ fontSize: 11, color: '#8070a0', marginTop: 5, letterSpacing: '.03em' }}>
                    {language.flag} {language.label}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {stage === 'preview' && (
            <motion.div key="preview"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={sp}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#8070a0', fontWeight: 500 }}>Recording · {fmt(recTime)}</span>
                <span style={{
                  fontSize: 11, padding: '3px 11px', borderRadius: 99,
                  background: '#faf5eb', border: '2px solid #1a0f2e',
                  color: '#3d2f5a', fontWeight: 600,
                  boxShadow: '1px 1px 0 #1a0f2e',
                }}>
                  {language.flag} {language.label}
                </span>
              </div>

              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />

              <div className="audio-player">
                <button className="play-btn" onClick={() => {
                  if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
                  else { audioRef.current?.play(); setIsPlaying(true) }
                }}>
                  {isPlaying ? <Pause size={13} color="white" /> : <Play size={13} color="white" />}
                </button>
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#e8dff8', overflow: 'hidden', border: '1px solid #d8c8f0' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #c9a7ff, #4a2d78)' }}
                    animate={{ width: isPlaying ? '100%' : '0%' }}
                    transition={{ duration: recTime, ease: 'linear' }}
                  />
                </div>
                <span style={{ fontSize: 11, color: '#8070a0', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {fmt(recTime)}
                </span>
              </div>

              <motion.button className="rec-btn" onClick={reset} whileTap={{ scale: .97 }}
                style={{ ...btnBase, height: 44 }}>
                <Trash2 size={13} /> Re-record
              </motion.button>

              <motion.button className="rec-btn" onClick={summarizeDirectly} whileTap={{ scale: .97 }}
                style={{ ...primaryBtn, height: 50 }}>
                <Sparkles size={15} /> Summarize Note
              </motion.button>

              <button onClick={transcribeAudio} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                color: '#8070a0', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                textDecoration: 'underline', textDecorationColor: '#d8c8f0',
                textUnderlineOffset: 3, marginTop: -4, textAlign: 'center',
              }}>
                review transcript first
              </button>
            </motion.div>
          )}

          {/* ── TRANSCRIBING ── */}
          {stage === 'transcribing' && (
            <motion.div key="transcribing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="transcribing-wrap"
            >
              <div className="spin-outer" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1a0f2e', fontFamily: "'Unbounded', sans-serif", fontSize: 11 }}>
                  Processing in {language.label}
                </p>
                <p style={{ fontSize: 12, color: '#8070a0', marginTop: 5 }}>Usually a few seconds…</p>
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
                <span style={{
                  fontSize: 9, fontWeight: 700, color: '#8070a0',
                  letterSpacing: '.1em', textTransform: 'uppercase',
                  fontFamily: "'Unbounded', sans-serif",
                }}>
                  Transcript · {language.flag} {language.label}
                </span>
                <span style={{ fontSize: 11, color: '#c9a7ff', fontWeight: 600 }}>edit if needed</span>
              </div>

              <textarea
                className="transcript-area"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={5}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button className="rec-btn" onClick={reset} whileTap={{ scale: .97 }}
                  style={{ ...btnBase, flex: 1, height: 46 }}>
                  <Trash2 size={13} /> Start Over
                </motion.button>
                <motion.button className="rec-btn" onClick={summarize} whileTap={{ scale: .97 }}
                  style={{ ...primaryBtn, flex: 2, height: 46 }}>
                  <Sparkles size={14} /> Summarize
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div className="error-box"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}