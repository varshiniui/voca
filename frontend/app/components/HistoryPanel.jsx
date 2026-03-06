'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, ChevronDown } from 'lucide-react'

const moodCfg = {
  Focused:      { color: '#5b9bd6', bg: '#e0eff9' },
  Excited:      { color: '#d4922a', bg: '#fdf0d8' },
  Casual:       { color: '#6baa7e', bg: '#e3f4e8' },
  Professional: { color: '#9b7fd4', bg: '#f0ebfb' },
  Urgent:       { color: '#f0765a', bg: '#fde8e3' },
  Reflective:   { color: '#5b9bd6', bg: '#e0eff9' },
  default:      { color: '#9c8570', bg: '#f9efe3' },
}

const langLabels = {
  en: 'English', ta: 'Tamil', hi: 'Hindi',
  ml: 'Malayalam', es: 'Spanish', fr: 'French',
}

function NoteCard({ note, onDelete, index }) {
  const [expanded, setExpanded] = useState(false)
  const cfg     = moodCfg[note.mood] || moodCfg.default
  const date    = new Date(note.createdAt)
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: .97 }}
      transition={{ duration: .32, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(45,32,22,0.06)',
      }}
    >
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', padding: '13px 15px',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
      }}>
        {/* Mood dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: cfg.color, flexShrink: 0,
          boxShadow: `0 0 0 3px ${cfg.bg}`,
        }} />

        <p style={{
          flex: 1, fontSize: 12.5, color: 'var(--ink2)', fontWeight: 600,
          lineHeight: 1.45, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 1,
          WebkitBoxOrient: 'vertical', fontFamily: 'var(--font-body)',
        }}>
          {note.summary}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 700 }}>{dateStr}</span>
          <span style={{ fontSize: 10, color: 'var(--ink4)', fontWeight: 600 }}>{timeStr}</span>
        </div>

        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: .22 }}>
          <ChevronDown size={13} color="var(--ink4)" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: .28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 15px 14px', borderTop: '1.5px solid var(--border2)' }}>
              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, marginTop: 11, marginBottom: 13, flexWrap: 'wrap' }}>
                {note.mood && (
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 800,
                    color: cfg.color, background: cfg.bg,
                    border: `1px solid ${cfg.color}25`,
                    fontFamily: 'var(--font-body)',
                  }}>{note.mood}</span>
                )}
                {note.language && (
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 700,
                    color: 'var(--ink3)', background: 'var(--bg2)',
                    border: '1px solid var(--border)', fontFamily: 'var(--font-body)',
                  }}>{langLabels[note.language] || note.language}</span>
                )}
                {note.wordCount && (
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 700,
                    color: 'var(--ink4)', background: 'var(--bg2)',
                    border: '1px solid var(--border)', fontFamily: 'var(--font-body)',
                  }}>{note.wordCount} words</span>
                )}
              </div>

              {/* Key points */}
              {note.keyPoints?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 8.5, fontWeight: 800, color: 'var(--ink4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7, fontFamily: 'var(--font-body)' }}>Key Points</p>
                  {note.keyPoints.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        background: 'var(--coral-bg)', color: 'var(--coral)',
                        fontSize: 8.5, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                        fontFamily: 'var(--font-body)',
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.6, fontWeight: 600 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action items */}
              {note.actionItems?.length > 0 && note.actionItems[0] !== 'No specific action items identified' && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 8.5, fontWeight: 800, color: 'var(--ink4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7, fontFamily: 'var(--font-body)' }}>Actions</p>
                  {note.actionItems.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: 4, flexShrink: 0, marginTop: 2,
                        border: '1.5px solid rgba(107,170,126,0.4)', background: 'var(--sage-bg)',
                      }} />
                      <span style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.6, fontWeight: 600 }}>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={e => { e.stopPropagation(); onDelete(note.id) }} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11.5, color: 'var(--ink4)',
                fontFamily: 'var(--font-body)', fontWeight: 700, padding: 0, marginTop: 4,
                transition: 'color .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink4)'}
              >
                <Trash2 size={11} /> Delete note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function HistoryPanel({ isOpen, onClose }) {
  const [notes,    setNotes]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (isOpen) fetchNotes()
  }, [isOpen])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/notes`)
      const data = await res.json()
      if (data.success) setNotes(data.notes)
    } catch (e) { console.error('Failed to load notes', e) }
    finally { setLoading(false) }
  }

  const deleteNote = async (id) => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    await fetch(`${url}/api/notes/${id}`, { method: 'DELETE' })
    setNotes(n => n.filter(note => note.id !== id))
  }

  const clearAll = async () => {
    if (!confirm('Delete all notes? This cannot be undone.')) return
    setClearing(true)
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    await fetch(`${url}/api/notes`, { method: 'DELETE' })
    setNotes([]); setClearing(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: .28 }} onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(45,32,22,0.25)', backdropFilter: 'blur(4px)',
            }}
          />

          <motion.div
            initial={{ x: '100%', opacity: .6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: .4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 210,
              width: 400, maxWidth: '92vw',
              background: 'var(--bg)',
              borderLeft: '1.5px solid var(--border)',
              boxShadow: '-12px 0 50px rgba(45,32,22,0.12)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '22px 20px 18px',
              borderBottom: '1.5px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0,
              background: 'rgba(253,246,238,0.95)',
              backdropFilter: 'blur(12px)',
              zIndex: 1,
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22, fontWeight: 600, fontStyle: 'italic',
                  color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  Your Notes
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--coral)', display: 'inline-block' }} />
                </h2>
                <p style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 3, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
                </p>
              </div>
              <button onClick={onClose} style={{
                background: 'var(--bg2)', border: '1.5px solid var(--border)',
                borderRadius: 12, cursor: 'pointer',
                color: 'var(--ink3)', display: 'flex', padding: 8,
                transition: 'all .15s', boxShadow: '0 1px 4px rgba(45,32,22,0.08)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--coral-bg)'; e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.borderColor = 'rgba(240,118,90,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--ink3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0', gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2.5px solid var(--border)',
                    borderTop: '2.5px solid var(--coral)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ fontSize: 13.5, color: 'var(--ink3)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                    Loading notes…
                  </span>
                </div>
              ) : notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
                  style={{ textAlign: 'center', padding: '60px 24px' }}
                >
                  <div style={{ fontSize: 36, marginBottom: 14 }}>🎙</div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontStyle: 'italic', color: 'var(--ink3)', marginBottom: 8 }}>
                    No notes yet
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--ink4)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                    Your recorded notes will appear here.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {notes.map((note, i) => (
                    <NoteCard key={note.id} note={note} onDelete={deleteNote} index={i} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Clear all */}
            {notes.length > 0 && (
              <div style={{ padding: '10px 14px 24px', borderTop: '1.5px solid var(--border2)' }}>
                <button onClick={clearAll} disabled={clearing} style={{
                  width: '100%', height: 40, borderRadius: 12,
                  background: 'var(--bg2)', border: '1.5px dashed var(--border)',
                  cursor: 'pointer', fontSize: 12.5, color: 'var(--ink4)',
                  fontFamily: 'var(--font-body)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,118,90,0.4)'; e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.background = 'var(--coral-bg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink4)'; e.currentTarget.style.background = 'var(--bg2)'; }}
                >
                  <Trash2 size={12} /> Clear all notes
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}