'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, ChevronDown } from 'lucide-react'

const moodColors = {
  Focused: '#3b6ea5', Excited: '#b45309', Casual: '#2d7a5a',
  Professional: '#4a2d4e', Urgent: '#b91c1c', Reflective: '#1e5f74',
  default: '#6b5c52',
}

const langLabels = { en:'English', ta:'Tamil', hi:'Hindi', ml:'Malayalam', es:'Spanish', fr:'French' }

function NoteCard({ note, onDelete, index }) {
  const [expanded, setExpanded] = useState(false)
  const moodColor = moodColors[note.mood] || moodColors.default
  const date = new Date(note.createdAt)
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(74,45,78,0.04)',
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '14px 16px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
        }}
      >
        {/* Mood dot */}
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: moodColor, flexShrink: 0 }} />

        {/* Summary preview */}
        <p style={{
          flex: 1, fontSize: 12, color: 'var(--text2)', fontWeight: 400,
          lineHeight: 1.4, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 1,
          WebkitBoxOrient: 'vertical',
        }}>
          {note.summary}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{dateStr}</span>
          <span style={{ fontSize: 10, color: 'var(--border2)' }}>{timeStr}</span>
        </div>

        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={13} color="var(--border2)" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>

              {/* Tags row */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                {note.mood && (
                  <span style={{
                    fontSize: 10, padding: '2px 9px', borderRadius: 99, fontWeight: 600,
                    color: moodColor, border: `1px solid ${moodColor}30`, background: `${moodColor}08`,
                  }}>{note.mood}</span>
                )}
                {note.language && (
                  <span style={{
                    fontSize: 10, padding: '2px 9px', borderRadius: 99,
                    color: 'var(--muted)', border: '1px solid var(--border)', background: 'var(--paper)',
                  }}>{langLabels[note.language] || note.language}</span>
                )}
                {note.wordCount && (
                  <span style={{
                    fontSize: 10, padding: '2px 9px', borderRadius: 99,
                    color: 'var(--muted)', border: '1px solid var(--border)', background: 'var(--paper)',
                  }}>{note.wordCount} words</span>
                )}
              </div>

              {/* Key points */}
              {note.keyPoints?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Key Points</p>
                  {note.keyPoints.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: 'var(--plum-lt)', marginTop: 1, flexShrink: 0 }}>◆</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action items */}
              {note.actionItems?.length > 0 && note.actionItems[0] !== 'No specific action items identified' && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Actions</p>
                  {note.actionItems.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid var(--border2)', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Delete */}
              <button onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 11, color: 'var(--border2)', fontFamily: "'Outfit', sans-serif",
                  padding: 0, marginTop: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--border2)'}
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
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (isOpen) fetchNotes()
  }, [isOpen])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/notes`)
      const data = await res.json()
      if (data.success) setNotes(data.notes)
    } catch (e) {
      console.error('Failed to load notes', e)
    } finally {
      setLoading(false)
    }
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
    setNotes([])
    setClearing(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(42,31,26,0.18)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
              width: 380, maxWidth: '90vw',
              background: 'var(--cream)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-8px 0 40px rgba(74,45,78,0.1)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Panel header */}
            <div style={{
              padding: '24px 24px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, background: 'var(--cream)', zIndex: 1,
            }}>
              <div>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: 'var(--plum)',
                }}>
                  Your Notes
                </span>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
                </p>
              </div>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', display: 'flex', padding: 4, borderRadius: 8,
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Notes list */}
            <div style={{ flex: 1, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTop: '2px solid var(--plum)', animation: 'spin 0.9s linear infinite' }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Loading notes…</span>
                </div>
              ) : notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  style={{ textAlign: 'center', padding: '60px 24px' }}
                >
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: 'var(--plum-lt)', marginBottom: 8 }}>
                    No notes yet
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>
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
              <div style={{ padding: '12px 16px 24px', borderTop: '1px solid var(--border)' }}>
                <button onClick={clearAll} disabled={clearing} style={{
                  width: '100%', height: 38, borderRadius: 10,
                  background: 'none', border: '1px solid var(--border)',
                  cursor: 'pointer', fontSize: 12, color: 'var(--muted)',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#b91c1c' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
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