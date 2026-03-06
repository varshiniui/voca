'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Play, Pause, Trash2, Sparkles, ChevronDown } from 'lucide-react'

const LANGUAGES = [
  { code: 'en',  label: 'English',    flag: '🇬🇧' },
  { code: 'ta',  label: 'Tamil',      flag: '🇮🇳' },
  { code: 'hi',  label: 'Hindi',      flag: '🇮🇳' },
  { code: 'ml',  label: 'Malayalam',  flag: '🇮🇳' },
  { code: 'es',  label: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr',  label: 'French',     flag: '🇫🇷' },
  { code: null,  label: 'Auto-detect',flag: '🌐' },
]

export default function Recorder({ onResults, onLoading }) {
  const [stage, setStage]           = useState('idle')
  const [language, setLanguage]     = useState(LANGUAGES[0])
  const [langOpen, setLangOpen]     = useState(false)
  const [audioBlob, setAudioBlob]   = useState(null)
  const [audioUrl, setAudioUrl]     = useState(null)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [recTime, setRecTime]       = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError]           = useState(null)

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
      setError(err.message === 'Failed to fetch' ? 'Cannot reach server on port 5000.' : err.message)
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
      setError(err.message === 'Failed to fetch' ? 'Cannot reach server on port 5000.' : err.message)
      setStage('preview')
    }
  }

  const summarize = async () => {
    if (!transcript.trim()) return
    onLoading(true); onResults(null); setError(null)
    try {
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/summarize-text`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcript }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Summarization failed')
      onResults(data)
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach server on port 5000.' : err.message)
      onResults(null)
    } finally { onLoading(false) }
  }

  const reset = () => {
    setStage('idle'); setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null); setRecTime(0); setTranscript(''); setError(null); onResults(null)
  }

  const btnBase = {
    width: '100%', borderRadius: 10, border: '1px solid var(--border)',
    background: 'white', color: 'var(--text2)', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    transition: 'all 0.15s',
  }

  const primaryBtn = {
    width: '100%', borderRadius: 10, border: 'none',
    background: 'var(--plum)', color: 'white', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 2px 12px rgba(74,45,78,0.25)',
    transition: 'all 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
      <AnimatePresence mode="wait">

        {/* ── IDLE + RECORDING ── */}
        {(stage === 'idle' || stage === 'recording') && (
          <motion.div key="mic"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%' }}
          >
            {/* Language */}
            {stage === 'idle' && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                <button
                  onClick={() => setLangOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: 'white', border: '1px solid var(--border)', borderRadius: 8,
                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 12,
                    fontWeight: 500, color: 'var(--text2)', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span>{language.flag}</span>
                  <span>{language.label}</span>
                  <motion.span animate={{ rotate: langOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown size={12} color="var(--muted)" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                        background: 'white', border: '1px solid var(--border)',
                        borderRadius: 10, overflow: 'hidden', minWidth: 160,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    >
                      {LANGUAGES.map((lang, i) => (
                        <button key={lang.label}
                          onClick={() => { setLanguage(lang); setLangOpen(false) }}
                          style={{
                            width: '100%', padding: '9px 14px', border: 'none', cursor: 'pointer',
                            background: language.label === lang.label ? 'var(--paper)' : 'white',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontFamily: "'Outfit', sans-serif",
                            borderBottom: i < LANGUAGES.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--paper)'}
                          onMouseLeave={e => e.currentTarget.style.background = language.label === lang.label ? 'var(--paper)' : 'white'}
                        >
                          <span style={{ fontSize: 14 }}>{lang.flag}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: language.label === lang.label ? 'var(--plum)' : 'var(--text2)' }}>
                            {lang.label}
                          </span>
                          {language.label === lang.label && (
                            <span style={{ marginLeft: 'auto', color: 'var(--plum)', fontSize: 11 }}>✓</span>
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
              onClick={stage === 'recording' ? stopRecording : startRecording}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              style={{
                width: 88, height: 88, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: stage === 'recording' ? 'var(--plum)' : 'white',
                border: stage === 'recording' ? 'none' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: stage === 'recording'
                  ? '0 4px 24px rgba(74,45,78,0.35)'
                  : '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease',
              }}
            >
              {stage === 'recording'
                ? <Square size={22} color="white" fill="white" />
                : <Mic size={26} color="var(--plum)" strokeWidth={1.5} />
              }
            </motion.button>

            {stage === 'recording' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--plum)' }}
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(recTime)}
                  </span>
                </div>
                {/* Minimal waveform bars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div key={i}
                      style={{ width: 2.5, borderRadius: 2, background: 'var(--plum-lt)' }}
                      animate={{ height: [3, Math.random() * 16 + 3, 3] }}
                      transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  {language.flag} {language.label} · tap to stop
                </span>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 400 }}>Tap to record your note</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.03em' }}>{language.flag} {language.label}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── PREVIEW ── */}
        {stage === 'preview' && (
          <motion.div key="preview"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Recording · {fmt(recTime)}</span>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: 'white', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                {language.flag} {language.label}
              </span>
            </div>

            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              background: 'white', border: '1px solid var(--border)', borderRadius: 10,
            }}>
              <button onClick={() => {
                if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
                else { audioRef.current?.play(); setIsPlaying(true) }
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--plum)', display: 'flex', padding: 0 }}>
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <div style={{ flex: 1, height: 2, borderRadius: 99, background: 'var(--border)' }}>
                <div style={{ width: '35%', height: '100%', borderRadius: 99, background: 'var(--plum-lt)' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{fmt(recTime)}</span>
            </div>

            <motion.button onClick={reset} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{ ...btnBase, height: 42 }}>
              <Trash2 size={13} /> Re-record
            </motion.button>

            <motion.button onClick={summarizeDirectly} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{ ...primaryBtn, height: 48 }}>
              <Sparkles size={14} /> Summarize Note
            </motion.button>

            <button onClick={transcribeAudio} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
              color: 'var(--muted)', fontFamily: "'Outfit', sans-serif", fontWeight: 400,
              textDecoration: 'underline', textDecorationColor: 'var(--border2)',
              textUnderlineOffset: 3, marginTop: -4,
            }}>
              review transcript first
            </button>
          </motion.div>
        )}

        {/* ── TRANSCRIBING ── */}
        {stage === 'transcribing' && (
          <motion.div key="transcribing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}
          >
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--plum)', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Processing in {language.label}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Usually a few seconds</p>
            </div>
          </motion.div>
        )}

        {/* ── EDITING ── */}
        {stage === 'editing' && (
          <motion.div key="editing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Transcript · {language.flag} {language.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--plum-lt)' }}>edit if needed</span>
            </div>

            <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={5}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 10, resize: 'vertical',
                background: 'white', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, lineHeight: 1.8, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border2)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button onClick={reset} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{ ...btnBase, flex: 1, height: 44 }}>
                <Trash2 size={13} /> Start Over
              </motion.button>
              <motion.button onClick={summarize} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{ ...primaryBtn, flex: 2, height: 44 }}>
                <Sparkles size={13} /> Summarize
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', fontSize: 12, fontWeight: 500,
            }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}