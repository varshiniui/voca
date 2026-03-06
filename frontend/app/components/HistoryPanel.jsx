'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, ChevronDown } from 'lucide-react'

const moodMap = {
  Focused:      '#6499b8',
  Excited:      '#d4a853',
  Casual:       '#7aab8a',
  Professional: '#c9a7ff',
  Urgent:       '#e8714a',
  Reflective:   '#6499b8',
  default:      '#8a8070',
}

const langLabels = {
  en: 'English', ta: 'Tamil', hi: 'Hindi',
  ml: 'Malayalam', es: 'Spanish', fr: 'French',
}

function NoteCard({ note, onDelete, index }) {
  const [expanded, setExpanded] = useState(false)
  const moodColor = moodMap[note.mood] || moodMap.default
  const date    = new Date(note.createdAt)
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: '#1e1c18',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '14px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
        }}
      >
        {/* Mood dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: moodColor, flexShrink: 0,
          boxShadow: `0 0 6px ${moodColor}80`,
        }} />

        {/* Summary */}
        <p style={{
          flex: 1, fontSize: 12.5, color: 'rgba(245,239,230,0.6)',
          fontWeight: 400, lineHeight: 1.45, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 1,
          WebkitBoxOrient: 'vertical',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {note.summary}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'rgba(245,239,230,0.35)', fontWeight: 500 }}>{dateStr}</span>
          <span style={{ fontSize: 10, color: 'rgba(245,239,230,0.2)' }}>{timeStr}</span>
        </div>

        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown size={13} color="rgba(245,239,230,0.25)" />
        </motion.div>
      </button>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                {note.mood && (
                  <span style={{
                    fontSize: 9.5, padding: '3px 10px', borderRadius: 4, fontWeight: 600,
                    color: moodColor, border: `1px solid ${moodColor}30`,
                    background: `${moodColor}12`, letterSpacing: '.08em', textTransform: 'uppercase',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {note.mood}
                  </span>
                )}
                {note.language && (
                  <span style={{
                    fontSize: 9.5, padding: '3px 10px', borderRadius: 4,
                    color: 'rgba(245,239,230,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)', letterSpacing: '.06em',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {langLabels[note.language] || note.language}
                  </span>
                )}
                {note.wordCount && (
                  <span style={{
                    fontSize: 9.5, padding: '3px 10px', borderRadius: 4,
                    color: 'rgba(245,239,230,0.3)', border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {note.wordCount} words
                  </span>
                )}
              </div>

              {/* Key Points */}
              {note.keyPoints?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{
                    fontSize: 8.5, fontWeight: 600, color: 'rgba(245,239,230,0.25)',
                    letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Key Points</p>
                  {note.keyPoints.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        background: 'rgba(232,113,74,0.12)', border: '1px solid rgba(232,113,74,0.2)',
                        color: '#e8714a', fontSize: 8, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 1,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 12.5, color: 'rgba(245,239,230,0.55)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Items */}
              {note.actionItems?.length > 0 && note.actionItems[0] !== 'No specific action items identified' && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{
                    fontSize: 8.5, fontWeight: 600, color: 'rgba(245,239,230,0.25)',
                    letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Actions</p>
                  {note.actionItems.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: 3, flexShrink: 0, marginTop: 2,
                        border: '1.5px solid rgba(122,171,138,0.35)',
                      }} />
                      <span style={{ fontSize: 12.5, color: 'rgba(245,239,230,0.55)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Delete */}
              <button
                onClick={e => { e.stopPropagation(); onDelete(note.id) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'rgba(245,239,230,0.2)',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  padding: 0, marginTop: 4, transition: 'color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e8714a'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,239,230,0.2)'}
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
    setNotes([]); setClearing(false)
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
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 210,
              width: 400, maxWidth: '92vw',
              background: '#131210',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0,
              background: '#131210',
              zIndex: 1,
            }}>
              <div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22, fontWeight: 900, fontStyle: 'italic',
                  color: '#f5efe6', letterSpacing: '-.02em',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  Your Notes
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#e8714a', display: 'inline-block',
                    boxShadow: '0 0 8px rgba(232,113,74,0.6)',
                  }} />
                </h2>
                <p style={{ fontSize: 11, color: 'rgba(245,239,230,0.3)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
                </p>
              </div>
              <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, cursor: 'pointer',
                color: 'rgba(245,239,230,0.4)',
                display: 'flex', padding: 8,
                transition: 'all .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f5efe6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(245,239,230,0.4)'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Notes list */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0', gap: 10 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.08)',
                    borderTop: '2px solid #e8714a',
                    animation: 'spin 0.9s linear infinite',
                  }} />
                  <span style={{ fontSize: 13, color: 'rgba(245,239,230,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
                    Loading notes…
                  </span>
                </div>
              ) : notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
                  style={{ textAlign: 'center', padding: '64px 24px' }}
                >
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 20, fontStyle: 'italic', color: 'rgba(245,239,230,0.2)',
                    marginBottom: 10,
                  }}>
                    No notes yet
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(245,239,230,0.2)', fontFamily: "'DM Sans', sans-serif" }}>
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
              <div style={{ padding: '12px 16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={clearAll} disabled={clearing} style={{
                  width: '100%', height: 40, borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', fontSize: 12,
                  color: 'rgba(245,239,230,0.25)',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,113,74,0.3)'; e.currentTarget.style.color = '#e8714a'; e.currentTarget.style.background = 'rgba(232,113,74,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(245,239,230,0.25)'; e.currentTarget.style.background = 'transparent'; }}
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