'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Download, ChevronDown } from 'lucide-react'

const moodMap = {
  Focused:      { color: '#6499b8', label: 'Focused' },
  Excited:      { color: '#d4a853', label: 'Excited' },
  Casual:       { color: '#7aab8a', label: 'Casual' },
  Professional: { color: '#c9a7ff', label: 'Professional' },
  Urgent:       { color: '#e8714a', label: 'Urgent' },
  Reflective:   { color: '#6499b8', label: 'Reflective' },
  default:      { color: '#8a8070', label: 'Note' },
}

const sp = { type: 'spring', stiffness: 300, damping: 28 }

export default function ResultCard({ results }) {
  const [copied,   setCopied]   = useState(false)
  const [exporting,setExporting]= useState(false)
  const [txOpen,   setTxOpen]   = useState(false)

  if (!results) return null
  const { transcription, keyPoints, actionItems, summary, mood, wordCount, timestamp } = results
  const cfg  = moodMap[mood] || moodMap.default
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const date = timestamp ? new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  const copyToClipboard = async () => {
    const text = `Voca — Voice Note\n${date} ${time}  ·  ${wordCount} words\n\nSUMMARY\n${summary}\n\nKEY POINTS\n${keyPoints?.map((p,i)=>`${i+1}. ${p}`).join('\n')}\n\nACTION ITEMS\n${actionItems?.map(a=>`• ${a}`).join('\n')}\n\nTRANSCRIPT\n"${transcription}"`
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  const exportPDF = () => {
    setExporting(true)
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Voca Note</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#f9f6f2;color:#1a1714;padding:56px 64px;max-width:680px;margin:0 auto}
.header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #1a1714}
.logo{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;font-style:italic;color:#1a1714}
.meta{font-size:11px;color:#8a8070;text-align:right;line-height:1.7;font-weight:500}
.mood{display:inline-block;padding:4px 14px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:28px;background:#f0ebe4;color:#1a1714}
.label{font-size:9px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8a8070;margin-bottom:12px}
.summary{font-size:15px;line-height:1.85;color:#1a1714;margin-bottom:32px;padding:18px 20px;background:#f0ebe4;border-radius:8px}
.kp{display:flex;gap:12px;margin-bottom:10px;align-items:flex-start}
.kp-num{width:22px;height:22px;border-radius:4px;background:#1a1714;color:#f9f6f2;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.kp-text{font-size:13.5px;color:#3d3530;line-height:1.7}
.ai-item{display:flex;gap:12px;margin-bottom:10px;align-items:flex-start}
.ai-box{width:16px;height:16px;border:1.5px solid #c8bfb0;border-radius:3px;flex-shrink:0;margin-top:2px}
.divider{height:1.5px;background:#e8e0d6;margin:24px 0}
.tx{font-size:12px;color:#8a8070;line-height:1.9;font-style:italic;padding:14px 18px;background:#f0ebe4;border-radius:8px}
.footer{text-align:center;font-size:9px;color:#c8bfb0;letter-spacing:0.14em;font-weight:600;margin-top:48px;text-transform:uppercase}
</style></head><body>
<div class="header">
  <div class="logo">Voca</div>
  <div class="meta">${date || ''}<br/>${time || ''} ${wordCount ? `· ${wordCount} words` : ''}</div>
</div>
<div class="mood">${mood || 'Note'}</div>
<div class="label">Summary</div>
<div class="summary">${summary}</div>
<div class="divider"></div>
<div class="label">Key Points</div>
<div style="margin-bottom:28px">${keyPoints?.map((p,i)=>`<div class="kp"><div class="kp-num">${i+1}</div><span class="kp-text">${p}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="label">Action Items</div>
<div style="margin-bottom:28px">${actionItems?.map(a=>`<div class="ai-item"><div class="ai-box"></div><span class="kp-text">${a}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="label" style="margin-bottom:10px">Original Transcript</div>
<div class="tx">"${transcription}"</div>
<div class="footer">Voca · Voice Note Summarizer</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const pop  = window.open(url, '_blank', 'width=800,height=900')
    if (!pop) { const a = document.createElement('a'); a.href=url; a.download='voca-note.html'; a.click() }
    setTimeout(() => { URL.revokeObjectURL(url); setExporting(false) }, 2000)
  }

  const Label = ({ children }) => (
    <p style={{
      fontSize: 9, fontWeight: 600, color: 'rgba(245,239,230,0.3)',
      letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12,
      fontFamily: "'DM Sans',sans-serif",
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ display: 'inline-block', width: 2, height: 10, borderRadius: 2, background: 'rgba(245,239,230,0.2)' }} />
      {children}
    </p>
  )

  const Divider = () => (
    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '18px 0' }} />
  )

  return (
    <>
      <style>{`
        .kp-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all .15s;
        }
        .kp-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
        .kp-num {
          flex-shrink: 0; width: 20px; height: 20px; border-radius: 5px;
          background: rgba(232,113,74,0.15); border: 1px solid rgba(232,113,74,0.25);
          color: #e8714a; font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px; font-family: 'DM Sans', sans-serif;
        }
        .ai-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all .15s;
        }
        .ai-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
        .ai-check {
          flex-shrink: 0; width: 16px; height: 16px; border-radius: 4px;
          border: 1.5px solid rgba(122,171,138,0.4); margin-top: 2px;
          transition: all .15s; cursor: pointer;
        }
        .ai-check:hover { border-color: rgba(122,171,138,0.8); background: rgba(122,171,138,0.1); }

        .tx-toggle {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
          padding: 10px 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          color: rgba(245,239,230,0.3); font-size: 9.5px; font-weight: 600;
          letter-spacing: .1em; text-transform: uppercase;
          font-family: 'DM Sans', sans-serif; transition: all .15s;
        }
        .tx-toggle:hover { background: rgba(255,255,255,0.06); color: rgba(245,239,230,0.55); }

        .rc-btn-copy {
          flex: 1; height: 42px; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 12.5px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(245,239,230,0.55); transition: all .18s;
        }
        .rc-btn-copy:hover { background: rgba(255,255,255,0.09); color: #f5efe6; }
        .rc-btn-copy.copied { background: rgba(122,171,138,0.12); border-color: rgba(122,171,138,0.3); color: #7aab8a; }

        .rc-btn-export {
          flex: 1; height: 42px; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 12.5px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: #e8714a; border: none; color: white; transition: all .18s;
          box-shadow: 0 4px 16px rgba(232,113,74,0.3);
        }
        .rc-btn-export:hover { background: #f08460; box-shadow: 0 6px 24px rgba(232,113,74,0.4); }
        .rc-btn-export:disabled { opacity: .5; cursor: default; }
      `}</style>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Mood + meta */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .05 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}
        >
          <span style={{
            fontSize: 9.5, fontWeight: 600, padding: '4px 12px', borderRadius: 4,
            color: cfg.color, background: `${cfg.color}15`,
            border: `1px solid ${cfg.color}30`,
            letterSpacing: '.1em', textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {mood || 'Note'}
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            {wordCount && <span style={{ fontSize: 11, color: 'rgba(245,239,230,0.3)', fontWeight: 500 }}>{wordCount} words</span>}
            {time && <span style={{ fontSize: 11, color: 'rgba(245,239,230,0.25)' }}>{time}</span>}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .08 }}>
          <Label>Summary</Label>
          <p style={{
            fontSize: 14, color: '#f5efe6', lineHeight: 1.85, fontWeight: 400,
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, marginBottom: 2,
            fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
          }}>
            {summary}
          </p>
        </motion.div>

        <Divider />

        {/* Key Points */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .12 }}>
          <Label>Key Points</Label>
          {keyPoints?.map((pt, i) => (
            <motion.div key={i} className="kp-row"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ ...sp, delay: .14 + i * .06 }}>
              <span className="kp-num">{i + 1}</span>
              <span style={{ color: 'rgba(245,239,230,0.7)', fontSize: 13, lineHeight: 1.7 }}>{pt}</span>
            </motion.div>
          ))}
        </motion.div>

        <Divider />

        {/* Action Items */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .16 }}>
          <Label>Action Items</Label>
          {actionItems?.map((item, i) => (
            <motion.div key={i} className="ai-row"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ ...sp, delay: .18 + i * .06 }}>
              <div className="ai-check" />
              <span style={{ color: 'rgba(245,239,230,0.7)', fontSize: 13, lineHeight: 1.7 }}>{item}</span>
            </motion.div>
          ))}
        </motion.div>

        <Divider />

        {/* Transcript accordion */}
        <div>
          <button className="tx-toggle" onClick={() => setTxOpen(v => !v)}>
            <span>Original Transcript</span>
            <motion.span animate={{ rotate: txOpen ? 180 : 0 }} transition={{ duration: .2 }}>
              <ChevronDown size={12} />
            </motion.span>
          </button>
          <AnimatePresence>
            {txOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: .22 }}
                style={{ overflow: 'hidden' }}
              >
                <p style={{
                  marginTop: 8, padding: '14px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(245,239,230,0.4)', fontSize: 12.5, lineHeight: 1.9, fontStyle: 'italic',
                }}>
                  "{transcription}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <motion.button className={`rc-btn-copy ${copied ? 'copied' : ''}`}
            onClick={copyToClipboard} whileTap={{ scale: .97 }}>
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="c" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}}
                    style={{display:'flex',alignItems:'center',gap:5}}><Check size={12}/>Copied</motion.span>
                : <motion.span key="u" initial={{opacity:0}} animate={{opacity:1}}
                    style={{display:'flex',alignItems:'center',gap:5}}><Copy size={12}/>Copy</motion.span>
              }
            </AnimatePresence>
          </motion.button>

          <motion.button className="rc-btn-export" onClick={exportPDF} disabled={exporting} whileTap={{ scale: .97 }}>
            <Download size={12}/> {exporting ? 'Opening…' : 'Export PDF'}
          </motion.button>
        </div>
      </div>
    </>
  )
}