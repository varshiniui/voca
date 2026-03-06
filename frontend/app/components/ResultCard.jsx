'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Download, Sparkles } from 'lucide-react'

const moodConfig = {
  Focused:      { color: '#2d5a8e', bg: '#ddf0fc', emoji: '🎯' },
  Excited:      { color: '#b45309', bg: '#fff8d6', emoji: '🚀' },
  Casual:       { color: '#2d7a5a', bg: '#d8f8e4', emoji: '😊' },
  Professional: { color: '#4a2d78', bg: '#ede5ff', emoji: '💼' },
  Urgent:       { color: '#b91c1c', bg: '#fef2f2', emoji: '⚡' },
  Reflective:   { color: '#1e5f74', bg: '#ddf0fc', emoji: '🌊' },
  default:      { color: '#6b5c52', bg: '#faf5eb', emoji: '📝' },
}

const sp = { type: 'spring', stiffness: 300, damping: 26 }

export default function ResultCard({ results }) {
  const [copied,    setCopied]    = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expandTx,  setExpandTx]  = useState(false)

  if (!results) return null
  const { transcription, keyPoints, actionItems, summary, mood, wordCount, timestamp } = results

  const cfg      = moodConfig[mood] || moodConfig.default
  const time     = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const date     = timestamp ? new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

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
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#faf5eb;color:#1a0f2e;padding:52px 56px;max-width:680px;margin:0 auto}
.header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #1a0f2e}
.logo{font-family:'Unbounded',sans-serif;font-size:24px;font-weight:900;color:#1a0f2e;letter-spacing:-.03em}
.meta{font-size:11px;color:#8070a0;text-align:right;line-height:1.7;font-weight:500}
.mood{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:99px;font-size:11px;font-weight:700;border:2px solid currentColor;margin-bottom:24px;letter-spacing:0.04em;font-family:'Unbounded',sans-serif;font-size:9px}
.section{margin-bottom:24px}
.label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8070a0;margin-bottom:10px;font-family:'Unbounded',sans-serif}
.summary-text{font-size:14px;line-height:1.85;color:#1a0f2e}
.item{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
.num{width:20px;height:20px;border-radius:6px;background:#ede5ff;color:#4a2d78;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;border:1.5px solid #1a0f2e;font-family:'Unbounded',sans-serif}
.dot{width:6px;height:6px;border-radius:2px;background:#c9a7ff;flex-shrink:0;margin-top:7px;border:1px solid #1a0f2e}
.item-text{font-size:13px;color:#3d2f5a;line-height:1.7}
.transcript-box{background:white;border-radius:14px;padding:16px 18px;border:2px solid #e8dff8}
.transcript-text{font-size:12px;color:#8070a0;line-height:1.9;font-style:italic}
.divider{height:2px;background:#e8dff8;margin:22px 0;border-radius:99px}
.footer{text-align:center;font-size:8px;color:#c9a7ff;letter-spacing:0.15em;font-weight:700;margin-top:40px;font-family:'Unbounded',sans-serif}
</style></head><body>
<div class="header">
  <div class="logo">V●CA</div>
  <div class="meta">${date || 'Today'}<br/>${time || ''} ${wordCount ? `· ${wordCount} words` : ''}</div>
</div>
<div class="mood" style="color:${cfg.color};border-color:${cfg.color};background:${cfg.bg}">${cfg.emoji} ${mood || 'Note'}</div>
<div class="section"><div class="label">Summary</div><p class="summary-text">${summary}</p></div>
<div class="divider"></div>
<div class="section"><div class="label">Key Points</div>${keyPoints?.map((p,i)=>`<div class="item"><div class="num">${i+1}</div><span class="item-text">${p}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="section"><div class="label">Action Items</div>${actionItems?.map(a=>`<div class="item"><div class="dot"></div><span class="item-text">${a}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="transcript-box"><div class="label" style="margin-bottom:10px">Original Transcript</div><p class="transcript-text">"${transcription}"</p></div>
<div class="footer">VOCA · VOICE NOTE SUMMARIZER</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body></html>`
    const blob  = new Blob([html], { type: 'text/html' })
    const url   = URL.createObjectURL(blob)
    const popup = window.open(url, '_blank', 'width=800,height=900')
    if (!popup) { const a = document.createElement('a'); a.href = url; a.download = 'voca-note.html'; a.click() }
    setTimeout(() => { URL.revokeObjectURL(url); setExporting(false) }, 2000)
  }

  return (
    <>
      <style>{`
        .rc-section-label {
          font-size: 9px; font-weight: 700; color: #8070a0;
          letter-spacing: 0.12em; text-transform: uppercase;
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
          font-family: 'Unbounded', sans-serif;
        }
        .rc-section-label::before {
          content: ''; width: 3px; height: 12px; border-radius: 2px;
          background: currentColor; flex-shrink: 0;
        }

        .rc-divider {
          height: 1.5px;
          background: linear-gradient(90deg, #e8dff8, transparent);
          margin: 18px 0;
        }

        /* Key point item */
        .kp-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 9px 12px; border-radius: 12px;
          border: 1.5px solid #e8dff8;
          background: white; margin-bottom: 7px;
          transition: all .15s;
          box-shadow: 2px 2px 0 #e8dff8;
        }
        .kp-item:hover {
          border-color: #d8c8f0;
          box-shadow: 2px 2px 0 #d8c8f0;
          transform: translate(-1px,-1px);
        }
        .kp-num {
          flex-shrink: 0; width: 20px; height: 20px; border-radius: 7px;
          background: #ede5ff; border: 1.5px solid #1a0f2e;
          color: #4a2d78; font-size: 9px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px; box-shadow: 1px 1px 0 #1a0f2e;
          font-family: 'Unbounded', sans-serif;
        }

        /* Action item */
        .ai-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 9px 12px; border-radius: 12px;
          border: 1.5px solid #e8dff8; background: white;
          margin-bottom: 7px; transition: all .15s;
          box-shadow: 2px 2px 0 #e8dff8;
        }
        .ai-item:hover {
          border-color: #85e89d;
          box-shadow: 2px 2px 0 #85e89d;
          transform: translate(-1px,-1px);
        }
        .ai-check {
          flex-shrink: 0; width: 18px; height: 18px; border-radius: 5px;
          border: 2px solid #1a0f2e; background: white;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px; cursor: pointer; transition: all .15s;
          box-shadow: 1px 1px 0 #1a0f2e;
        }
        .ai-check:hover { background: #d8f8e4; border-color: #2a7a4a; }

        /* Transcript accordion */
        .tx-toggle {
          width: 100%; background: #faf5eb; border: 1.5px solid #e8dff8;
          border-radius: 10px; padding: 10px 14px;
          cursor: pointer; display: flex; align-items: center; justify-content: space-between;
          font-family: 'Unbounded', sans-serif; font-size: 8.5px; font-weight: 700;
          color: #8070a0; letter-spacing: .1em; text-transform: uppercase;
          transition: all .15s; box-shadow: 2px 2px 0 #e8dff8;
        }
        .tx-toggle:hover { background: white; border-color: #d8c8f0; }
        .tx-content {
          margin-top: 8px; padding: 14px 16px; border-radius: 10px;
          background: white; border: 1.5px solid #e8dff8;
          font-size: 12.5px; color: #8070a0; line-height: 1.9;
          font-style: italic; box-shadow: 2px 2px 0 #e8dff8;
        }

        /* Action buttons */
        .rc-btn-copy {
          flex: 1; height: 42px; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 12.5px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border: 2px solid #1a0f2e; transition: all .14s;
          box-shadow: 2px 2px 0 #1a0f2e;
        }
        .rc-btn-copy:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a0f2e; }
        .rc-btn-copy:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a0f2e; }
        .rc-btn-export {
          flex: 1; height: 42px; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 12.5px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: #4a2d78; color: white; border: 2px solid #1a0f2e;
          transition: all .14s; box-shadow: 2px 2px 0 #1a0f2e;
        }
        .rc-btn-export:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #1a0f2e; }
        .rc-btn-export:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a0f2e; }
        .rc-btn-export:disabled { opacity: .6; cursor: default; transform: none; }
      `}</style>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Mood + meta row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.05 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}
        >
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 99,
            color: cfg.color, background: cfg.bg,
            border: `2px solid ${cfg.color}`,
            boxShadow: `2px 2px 0 ${cfg.color}`,
            fontFamily: "'Unbounded', sans-serif",
            letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {cfg.emoji} {mood || 'Note'}
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {wordCount && (
              <span style={{
                fontSize: 10, color: '#8070a0', fontWeight: 600,
                background: '#faf5eb', border: '1.5px solid #e8dff8',
                padding: '3px 10px', borderRadius: 99,
              }}>
                {wordCount} words
              </span>
            )}
            {time && (
              <span style={{ fontSize: 11, color: '#8070a0', fontWeight: 500 }}>{time}</span>
            )}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.08 }}>
          <p className="rc-section-label">Summary</p>
          <p style={{
            fontSize: 14, color: '#1a0f2e', lineHeight: 1.85, fontWeight: 400,
            padding: '14px 16px', background: '#faf5eb',
            border: '1.5px solid #e8dff8', borderRadius: 14,
            boxShadow: '2px 2px 0 #e8dff8',
          }}>
            {summary}
          </p>
        </motion.div>

        <div className="rc-divider" />

        {/* Key Points */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.12 }}>
          <p className="rc-section-label">Key Points</p>
          {keyPoints?.map((pt, i) => (
            <motion.div key={i} className="kp-item"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...sp, delay: 0.14 + i * 0.06 }}
            >
              <span className="kp-num">{i + 1}</span>
              <span style={{ color: '#3d2f5a', fontSize: 13, lineHeight: 1.7 }}>{pt}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="rc-divider" />

        {/* Action Items */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: 0.16 }}>
          <p className="rc-section-label">Action Items</p>
          {actionItems?.map((item, i) => (
            <motion.div key={i} className="ai-item"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...sp, delay: 0.18 + i * 0.06 }}
            >
              <div className="ai-check" />
              <span style={{ color: '#3d2f5a', fontSize: 13, lineHeight: 1.7 }}>{item}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="rc-divider" />

        {/* Transcript accordion */}
        <div>
          <button className="tx-toggle" onClick={() => setExpandTx(v => !v)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={10} /> Original Transcript
            </span>
            <motion.span animate={{ rotate: expandTx ? 180 : 0 }} transition={{ duration: .2 }}>▾</motion.span>
          </button>
          <AnimatePresence>
            {expandTx && (
              <motion.div className="tx-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: .22 }}
              >
                "{transcription}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <motion.button className="rc-btn-copy" onClick={copyToClipboard} whileTap={{ scale: .97 }}
            style={{
              background: copied ? '#d8f8e4' : 'white',
              borderColor: copied ? '#2a7a4a' : '#1a0f2e',
              color: copied ? '#2a7a4a' : '#3d2f5a',
              boxShadow: copied ? '2px 2px 0 #2a7a4a' : '2px 2px 0 #1a0f2e',
            }}
          >
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="c" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Check size={12} /> Copied!
                  </motion.span>
                : <motion.span key="u" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Copy size={12} /> Copy
                  </motion.span>
              }
            </AnimatePresence>
          </motion.button>

          <motion.button className="rc-btn-export" onClick={exportPDF} disabled={exporting} whileTap={{ scale: .97 }}>
            <Download size={12} /> {exporting ? 'Opening…' : 'Export PDF'}
          </motion.button>
        </div>

      </div>
    </>
  )
}