'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, ChevronDown } from 'lucide-react'

const moodCfg = {
  Focused:      { color:'#a06050', bg:'rgba(200,144,124,.14)' },
  Excited:      { color:'#907040', bg:'rgba(200,160,96,.14)'  },
  Casual:       { color:'#507860', bg:'rgba(138,170,144,.14)' },
  Professional: { color:'#486480', bg:'rgba(138,168,192,.14)' },
  Urgent:       { color:'#904040', bg:'rgba(200,100,100,.14)' },
  Reflective:   { color:'#806070', bg:'rgba(176,144,154,.14)' },
  default:      { color:'#9a8878', bg:'rgba(200,180,160,.12)' },
}

const langLabels = { en:'English',ta:'Tamil',hi:'Hindi',ml:'Malayalam',es:'Spanish',fr:'French' }

const HP_CSS = `
  @keyframes hp-spin  { to { transform:rotate(360deg); } }
  @keyframes hp-pop   { 0%{opacity:0;transform:scale(.82) translateY(10px);} 70%{transform:scale(1.04);} 100%{opacity:1;transform:scale(1);} }
  @keyframes hp-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-4px);} }

  .hp-panel {
    position:fixed;top:0;right:0;bottom:0;z-index:210;
    width:400px;max-width:92vw;
    background:#f0ebe4;
    border-left:1px solid rgba(200,180,160,.25);
    box-shadow:-16px 0 64px rgba(100,70,50,.12);
    display:flex;flex-direction:column;
    overflow:hidden;
    font-family:'Outfit',sans-serif;font-weight:300;
  }

  /* header */
  .hp-header {
    padding:22px 20px 18px;
    border-bottom:1px solid rgba(200,180,160,.2);
    display:flex;align-items:center;justify-content:space-between;
    position:sticky;top:0;
    background:rgba(240,235,228,.92);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    z-index:1;
  }
  .hp-title {
    font-family:'Cormorant Garamond',serif;
    font-size:22px;font-weight:400;font-style:italic;
    color:#1a1410;display:flex;align-items:center;gap:8px;
    /* 3d text */
    text-shadow:0 1px 0 rgba(200,180,160,.5), 0 3px 8px rgba(160,120,100,.1);
  }
  .hp-title-dot {
    width:7px;height:7px;border-radius:50%;
    background:linear-gradient(135deg,#c8907c,#b09098);
    box-shadow:0 0 8px rgba(200,144,124,.5), 0 2px 0 rgba(180,110,90,.2);
    animation:hp-float 3s ease-in-out infinite;
  }
  .hp-count {
    font-size:11px;color:#9a8878;margin-top:3px;
    font-family:'Outfit',sans-serif;font-weight:300;
  }

  /* close button */
  .hp-close {
    background:rgba(248,243,236,.85);
    border:1px solid rgba(200,180,160,.28);
    border-radius:12px;cursor:pointer;
    color:#9a8878;display:flex;padding:8px;
    transition:all .22s;
    box-shadow:0 3px 0 rgba(200,180,160,.2), 0 5px 14px rgba(160,120,100,.08);
  }
  .hp-close:hover {
    background:rgba(255,252,248,.96);color:#c8907c;
    border-color:#c8907c;
    transform:translateY(-2px) rotate(90deg);
    box-shadow:0 5px 0 rgba(200,180,160,.15), 0 10px 22px rgba(160,120,100,.14);
  }
  .hp-close:active { transform:translateY(0) rotate(90deg); }

  /* note card */
  .hp-card {
    background:rgba(255,252,248,.78);
    border:1px solid rgba(200,180,160,.22);
    border-radius:18px;overflow:hidden;
    box-shadow:
      0 3px 0 rgba(200,180,160,.18),
      0 5px 0 rgba(200,180,160,.1),
      0 8px 24px rgba(160,120,100,.08);
    transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
    backdrop-filter:blur(10px);
  }
  .hp-card:hover {
    transform:translateY(-3px);
    box-shadow:
      0 5px 0 rgba(200,180,160,.14),
      0 7px 0 rgba(200,180,160,.08),
      0 14px 36px rgba(160,120,100,.14);
  }

  /* card header row */
  .hp-card-btn {
    width:100%;padding:13px 15px;background:none;border:none;cursor:pointer;
    display:flex;align-items:center;gap:10px;text-align:left;
    transition:background .18s;
  }
  .hp-card-btn:hover { background:rgba(200,180,160,.06); }

  /* mood dot */
  .hp-mood-dot {
    width:9px;height:9px;border-radius:50%;flex-shrink:0;
    box-shadow:0 0 0 3px rgba(255,255,255,.8), 0 2px 6px rgba(0,0,0,.1);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1);
  }
  .hp-card:hover .hp-mood-dot { transform:scale(1.4); }

  /* summary text */
  .hp-summary {
    flex:1;font-size:12.5px;color:#4a3c34;font-weight:300;line-height:1.5;
    overflow:hidden;display:-webkit-box;
    -webkit-box-orient:vertical;
    font-family:'Outfit',sans-serif;
    transition:color .2s;
  }
  .hp-card:hover .hp-summary { color:#1a1410; }

  /* expanded content */
  .hp-expanded {
    padding:0 15px 14px;
    border-top:1px solid rgba(200,180,160,.15);
  }

  /* pills row */
  .hp-pill {
    display:inline-flex;align-items:center;
    padding:3px 10px;border-radius:99px;
    font-size:9.5px;font-weight:400;
    font-family:'Outfit',sans-serif;
    box-shadow:0 2px 0 rgba(200,180,160,.15);
    transition:transform .2s cubic-bezier(.34,1.56,.64,1);
  }
  .hp-pill:hover { transform:translateY(-2px) scale(1.04); }

  /* kp row */
  .hp-kp {
    display:flex;gap:8px;margin-bottom:5px;align-items:flex-start;
    padding:7px 10px;border-radius:12px;
    background:rgba(248,243,236,.7);
    border:1px solid rgba(176,144,154,.18);
    box-shadow:0 2px 0 rgba(176,144,154,.12);
    transition:transform .22s cubic-bezier(.34,1.56,.64,1);
  }
  .hp-kp:hover { transform:translateX(3px); }
  .hp-kp-num {
    width:18px;height:18px;border-radius:5px;flex-shrink:0;
    background:rgba(176,144,154,.18);border:1px solid rgba(176,144,154,.25);
    color:#806070;font-size:8.5px;font-weight:500;
    display:flex;align-items:center;justify-content:center;margin-top:1px;
    box-shadow:0 2px 0 rgba(176,144,154,.15);
  }

  /* action row */
  .hp-ai {
    display:flex;gap:8px;margin-bottom:5px;align-items:flex-start;
    padding:7px 10px;border-radius:12px;
    background:rgba(248,243,236,.7);
    border:1px solid rgba(138,170,144,.2);
    box-shadow:0 2px 0 rgba(138,170,144,.14);
    transition:transform .22s cubic-bezier(.34,1.56,.64,1);
  }
  .hp-ai:hover { transform:translateX(3px); }
  .hp-ai-check {
    width:14px;height:14px;border-radius:4px;flex-shrink:0;margin-top:2px;
    background:linear-gradient(135deg,#8aaa90,#6a9870);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 4px rgba(100,140,120,.28), 0 2px 0 rgba(80,120,90,.18);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1);
  }
  .hp-ai:hover .hp-ai-check { transform:rotate(12deg) scale(1.15); }

  /* delete button */
  .hp-del {
    display:flex;align-items:center;gap:5px;
    background:none;border:none;cursor:pointer;
    font-size:11px;color:#c8bab0;
    font-family:'Outfit',sans-serif;font-weight:300;
    padding:0;margin-top:6px;transition:all .2s;
  }
  .hp-del:hover { color:#c8907c;transform:translateX(2px); }

  /* clear all */
  .hp-clear {
    width:100%;height:42px;border-radius:14px;
    background:rgba(248,243,236,.7);
    border:1.5px dashed rgba(200,180,160,.4);
    cursor:pointer;font-size:12px;color:#9a8878;
    font-family:'Outfit',sans-serif;font-weight:300;
    display:flex;align-items:center;justify-content:center;gap:6px;
    transition:all .22s;
    box-shadow:0 3px 0 rgba(200,180,160,.1);
  }
  .hp-clear:hover {
    border-color:rgba(200,144,124,.45);color:#c8907c;
    background:rgba(200,144,124,.08);
    transform:translateY(-2px);
    box-shadow:0 5px 0 rgba(200,144,124,.1);
  }
  .hp-clear:active { transform:translateY(0); }
  .hp-clear:disabled { opacity:.45;cursor:default;transform:none; }

  /* empty state */
  .hp-empty { text-align:center;padding:60px 24px; }
  .hp-empty-icon {
    font-size:40px;margin-bottom:14px;
    animation:hp-float 4s ease-in-out infinite;
    display:block;
  }

  /* section micro-label */
  .hp-mlabel {
    font-size:8.5px;font-weight:500;color:#9a8878;
    letter-spacing:.12em;text-transform:uppercase;
    margin-bottom:7px;font-family:'Outfit',sans-serif;
    display:flex;align-items:center;gap:5px;
  }
  .hp-mlabel::before {
    content:'';display:inline-block;
    width:3px;height:10px;border-radius:2px;
  }
`

function NoteCard({ note, onDelete, index }) {
  const [expanded, setExpanded] = useState(false)
  const cfg     = moodCfg[note.mood] || moodCfg.default
  const date    = new Date(note.createdAt)
  const dateStr = date.toLocaleDateString([], { month:'short', day:'numeric' })
  const timeStr = date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  const kp = typeof note.keyPoints   === 'string' ? JSON.parse(note.keyPoints)   : (note.keyPoints   || [])
  const ai = typeof note.actionItems === 'string' ? JSON.parse(note.actionItems) : (note.actionItems || [])
  const validAi = ai.filter(a => !a.toLowerCase().includes('no specific'))

  return (
    <motion.div className="hp-card"
      initial={{ opacity:0, y:14, scale:.95 }}
      animate={{ opacity:1, y:0,  scale:1   }}
      exit={{ opacity:0, x:-16, scale:.95   }}
      transition={{ duration:.35, delay:index*.06, type:'spring', stiffness:260, damping:24 }}
    >
      <button className="hp-card-btn" onClick={()=>setExpanded(e=>!e)}>
        {/* mood dot */}
        <div className="hp-mood-dot" style={{ background:cfg.color, boxShadow:`0 0 0 3px ${cfg.bg}, 0 2px 6px rgba(0,0,0,.1)` }}/>

        {/* summary */}
        <p className="hp-summary" style={{
          WebkitLineClamp: expanded ? 'unset' : 1,
        }}>
          {note.summary}
        </p>

        {/* date */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1, flexShrink:0 }}>
          <span style={{ fontSize:9.5, color:'#9a8878', fontFamily:"'Outfit',sans-serif" }}>{dateStr}</span>
          <span style={{ fontSize:9.5, color:'#c8bab0', fontFamily:"'Outfit',sans-serif" }}>{timeStr}</span>
        </div>

        {/* chevron */}
        <motion.div animate={{ rotate:expanded?180:0 }} transition={{ duration:.22 }}
          style={{ display:'flex', alignItems:'center', color:'#c8bab0', flexShrink:0 }}>
          <ChevronDown size={12}/>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:.26, ease:'easeInOut' }}
            style={{ overflow:'hidden' }}
          >
            <div className="hp-expanded">
              {/* pills */}
              <div style={{ display:'flex', gap:6, marginTop:11, marginBottom:12, flexWrap:'wrap' }}>
                {note.mood && (
                  <motion.span className="hp-pill"
                    initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ type:'spring', stiffness:380, delay:.05 }}
                    style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}22` }}>
                    {note.mood}
                  </motion.span>
                )}
                {note.language && (
                  <motion.span className="hp-pill"
                    initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ type:'spring', stiffness:380, delay:.1 }}
                    style={{ color:'#9a8878', background:'rgba(200,180,160,.12)', border:'1px solid rgba(200,180,160,.22)' }}>
                    {langLabels[note.language] || note.language}
                  </motion.span>
                )}
                {note.wordCount && (
                  <motion.span className="hp-pill"
                    initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ type:'spring', stiffness:380, delay:.15 }}
                    style={{ color:'#9a8878', background:'rgba(200,180,160,.12)', border:'1px solid rgba(200,180,160,.22)' }}>
                    {note.wordCount} words
                  </motion.span>
                )}
              </div>

              {/* key points */}
              {kp.length > 0 && (
                <div style={{ marginBottom:11 }}>
                  <p className="hp-mlabel" style={{ '--bar-color':'#b09098' }}>
                    <span style={{ display:'inline-block', width:3, height:10, borderRadius:2, background:'#b09098', flexShrink:0 }}/>
                    Key points
                  </p>
                  {kp.map((pt,i) => (
                    <motion.div key={i} className="hp-kp"
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay:i*.05, type:'spring', stiffness:260 }}>
                      <span className="hp-kp-num">{i+1}</span>
                      <span style={{ fontSize:12, color:'#4a3c34', lineHeight:1.6,
                        fontFamily:"'Outfit',sans-serif", fontWeight:300 }}>{pt}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* action items */}
              {validAi.length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <p className="hp-mlabel">
                    <span style={{ display:'inline-block', width:3, height:10, borderRadius:2, background:'#8aaa90', flexShrink:0 }}/>
                    Actions
                  </p>
                  {validAi.map((a,i) => (
                    <motion.div key={i} className="hp-ai"
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay:i*.05, type:'spring', stiffness:260 }}>
                      <motion.div className="hp-ai-check"
                        initial={{ scale:0, rotate:-20 }}
                        animate={{ scale:1, rotate:0   }}
                        transition={{ delay:.1+i*.05, type:'spring', stiffness:400 }}>
                        <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                          <path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                      <span style={{ fontSize:12, color:'#4a3c34', lineHeight:1.6,
                        fontFamily:"'Outfit',sans-serif", fontWeight:300 }}>{a}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* delete */}
              <button className="hp-del"
                onClick={e=>{ e.stopPropagation(); onDelete(note.id) }}>
                <Trash2 size={10}/> Delete note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function HistoryPanel({ isOpen, onClose, auth }) {
  const [notes,    setNotes]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => { if (isOpen) fetchNotes() }, [isOpen])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const url  = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res  = await fetch(`${url}/api/notes`, { headers: auth ? {'x-device-id':auth.deviceId,'x-pin-hash':auth.pinHash} : {} })
      const data = await res.json()
      if (data.success) setNotes(data.notes)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const deleteNote = async id => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    await fetch(`${url}/api/notes/${id}`, { method:'DELETE' })
    setNotes(n => n.filter(note => note.id !== id))
  }

  const clearAll = async () => {
    if (!confirm('Delete all notes? This cannot be undone.')) return
    setClearing(true)
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    await fetch(`${url}/api/notes`, { method:'DELETE' })
    setNotes([]); setClearing(false)
  }

  return (
    <>
      <style>{HP_CSS}</style>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:.28 }}
              onClick={onClose}
              style={{ position:'fixed', inset:0, zIndex:200,
                background:'rgba(26,20,16,.18)', backdropFilter:'blur(8px)' }}
            />

            {/* panel */}
            <motion.div className="hp-panel"
              initial={{ x:'100%', opacity:.5 }}
              animate={{ x:0, opacity:1 }}
              exit={{ x:'100%', opacity:0 }}
              transition={{ duration:.42, ease:[0.16,1,0.3,1] }}
            >
              {/* header */}
              <div className="hp-header">
                <div>
                  <h2 className="hp-title">
                    Your Notes
                    <div className="hp-title-dot"/>
                  </h2>
                  <p className="hp-count">
                    {notes.length} {notes.length===1?'note':'notes'} saved
                  </p>
                </div>
                <button className="hp-close" onClick={onClose}>
                  <X size={15}/>
                </button>
              </div>

              {/* list */}
              <div style={{ flex:1, padding:'14px', display:'flex', flexDirection:'column',
                gap:8, overflowY:'auto' }}>
                {loading ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                    padding:'56px 0', gap:10 }}>
                    <motion.div animate={{ rotate:360 }}
                      transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                      style={{ width:18, height:18, borderRadius:'50%',
                        border:'2px solid rgba(200,144,124,.2)', borderTopColor:'#c8907c' }}/>
                    <span style={{ fontSize:13, color:'#9a8878',
                      fontFamily:"'Outfit',sans-serif", fontStyle:'italic' }}>
                      Loading…
                    </span>
                  </div>
                ) : notes.length === 0 ? (
                  <motion.div className="hp-empty"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.2 }}>
                    <span className="hp-empty-icon">🎙</span>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20,
                      fontStyle:'italic', color:'#9a8878', marginBottom:7 }}>
                      No notes yet
                    </p>
                    <p style={{ fontSize:12, color:'#c8bab0',
                      fontFamily:"'Outfit',sans-serif", fontWeight:300 }}>
                      Your recorded notes will appear here.
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {notes.map((note,i) => (
                      <NoteCard key={note.id} note={note} onDelete={deleteNote} index={i}/>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* clear all footer */}
              {notes.length > 0 && (
                <motion.div
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:.2 }}
                  style={{ padding:'10px 14px 24px', borderTop:'1px solid rgba(200,180,160,.18)' }}>
                  <button className="hp-clear" onClick={clearAll} disabled={clearing}>
                    <Trash2 size={11}/>
                    {clearing ? 'Clearing…' : 'Clear all notes'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}