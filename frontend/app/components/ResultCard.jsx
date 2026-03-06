'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Download } from 'lucide-react'

const moodColors = {
  Focused:      '#3b6ea5',
  Excited:      '#b45309',
  Casual:       '#2d7a5a',
  Professional: '#4a2d4e',
  Urgent:       '#b91c1c',
  Reflective:   '#1e5f74',
  default:      '#6b5c52',
}

export default function ResultCard({ results }) {
  const [copied, setCopied]       = useState(false)
  const [exporting, setExporting] = useState(false)

  if (!results) return null
  const { transcription, keyPoints, actionItems, summary, mood, wordCount, timestamp } = results
  const moodColor = moodColors[mood] || moodColors.default
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const date = timestamp ? new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  const copyToClipboard = async () => {
    const text = `VOCA — Voice Note Summary\n${date} ${time}  |  Mood: ${mood}  |  ${wordCount} words\n\nSUMMARY\n${summary}\n\nKEY POINTS\n${keyPoints?.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nACTION ITEMS\n${actionItems?.map(a => `• ${a}`).join('\n')}\n\nTRANSCRIPT\n"${transcription}"`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const exportPDF = () => {
    setExporting(true)
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Voca Note</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Outfit:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Outfit',sans-serif;background:#faf8f5;color:#2a1f1a;padding:52px 56px;max-width:660px;margin:0 auto}
.header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:36px;padding-bottom:20px;border-bottom:1px solid #e8e2d9}
.logo{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;font-style:italic;color:#4a2d4e}
.meta{font-size:11px;color:#9e8f82;text-align:right;line-height:1.7}
.mood{display:inline-block;padding:3px 12px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid currentColor;margin-bottom:24px;letter-spacing:0.04em}
.section{margin-bottom:22px}
.label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9e8f82;margin-bottom:10px}
.summary-text{font-size:14px;line-height:1.8;color:#2a1f1a}
.item{display:flex;align-items:flex-start;gap:10px;margin-bottom:7px}
.num{width:18px;height:18px;border-radius:5px;background:#f4f1ec;color:#4a2d4e;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;border:1px solid #e8e2d9}
.dot{width:5px;height:5px;border-radius:1px;background:#9e8f82;flex-shrink:0;margin-top:6px}
.item-text{font-size:13px;color:#6b5c52;line-height:1.65}
.transcript-box{background:#f4f1ec;border-radius:10px;padding:14px 16px;border:1px solid #e8e2d9}
.transcript-text{font-size:12px;color:#9e8f82;line-height:1.85;font-style:italic}
.divider{height:1px;background:#e8e2d9;margin:20px 0}
.footer{text-align:center;font-size:9px;color:#c9a8cd;letter-spacing:0.12em;font-weight:600;margin-top:36px}
</style></head><body>
<div class="header">
  <div class="logo">Voca</div>
  <div class="meta">${date}<br/>${time} &nbsp;·&nbsp; ${wordCount} words</div>
</div>
<div class="mood" style="color:${moodColor};border-color:${moodColor}40">${mood || 'Note'}</div>
<div class="section"><div class="label">Summary</div><p class="summary-text">${summary}</p></div>
<div class="divider"></div>
<div class="section"><div class="label">Key Points</div>${keyPoints?.map((p,i)=>`<div class="item"><div class="num">${i+1}</div><span class="item-text">${p}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="section"><div class="label">Action Items</div>${actionItems?.map(a=>`<div class="item"><div class="dot"></div><span class="item-text">${a}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="transcript-box"><div class="label" style="margin-bottom:8px">Original Transcript</div><p class="transcript-text">"${transcription}"</p></div>
<div class="footer">VOCA · VOICE NOTE SUMMARIZER</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const popup = window.open(url, '_blank', 'width=800,height=900')
    if (!popup) { const a = document.createElement('a'); a.href=url; a.download='voca-note.html'; a.click() }
    setTimeout(() => { URL.revokeObjectURL(url); setExporting(false) }, 2000)
  }

  const sectionLabel = (label) => (
    <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
      {label}
    </p>
  )

  const divider = <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Mood + meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 99,
          color: moodColor, border: `1px solid ${moodColor}40`,
          background: `${moodColor}08`, letterSpacing: '0.04em',
        }}>
          {mood || 'Note'}
        </span>
        <div style={{ display: 'flex', gap: 14 }}>
          {wordCount && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{wordCount} words</span>}
          {time      && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{time}</span>}
        </div>
      </div>

      {/* Summary */}
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}>
        {sectionLabel('Summary')}
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8 }}>{summary}</p>
      </motion.div>

      {divider}

      {/* Key Points */}
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        {sectionLabel('Key Points')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {keyPoints?.map((pt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                flexShrink: 0, width: 18, height: 18, borderRadius: 5,
                background: 'white', border: '1px solid var(--border)',
                color: 'var(--plum)', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>{i + 1}</span>
              <span style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.65 }}>{pt}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {divider}

      {/* Action Items */}
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
        {sectionLabel('Action Items')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actionItems?.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid var(--border2)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.65 }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {divider}

      {/* Transcript */}
      <details style={{ cursor: 'pointer' }}>
        <summary style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', listStyle: 'none', display: 'flex', alignItems: 'center', userSelect: 'none', marginBottom: 0 }}>
          Original Transcript <span style={{ marginLeft: 'auto', fontSize: 10 }}>▾</span>
        </summary>
        <p style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12, lineHeight: 1.85, fontStyle: 'italic' }}>
          "{transcription}"
        </p>
      </details>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <motion.button onClick={copyToClipboard} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          style={{
            flex: 1, height: 40, borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
            background: copied ? '#f0fdf4' : 'white',
            border: copied ? '1px solid #bbf7d0' : '1px solid var(--border)',
            color: copied ? '#15803d' : 'var(--text2)',
          }}>
          <AnimatePresence mode="wait">
            {copied
              ? <motion.span key="c" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',alignItems:'center',gap:5}}><Check size={12}/> Copied</motion.span>
              : <motion.span key="u" initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',alignItems:'center',gap:5}}><Copy size={12}/> Copy</motion.span>
            }
          </AnimatePresence>
        </motion.button>

        <motion.button onClick={exportPDF} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={exporting}
          style={{
            flex: 1, height: 40, borderRadius: 8, cursor: exporting ? 'default' : 'pointer',
            fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'var(--plum)', border: 'none', color: 'white',
            opacity: exporting ? 0.6 : 1, transition: 'opacity 0.2s',
          }}>
          <Download size={12}/> {exporting ? 'Opening...' : 'Export PDF'}
        </motion.button>
      </div>
    </div>
  )
}