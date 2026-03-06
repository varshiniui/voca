'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Download, ChevronDown } from 'lucide-react'

const moodCfg = {
  Focused:      { color: '#5b9bd6', bg: '#e0eff9', label: 'Focused 🎯' },
  Excited:      { color: '#d4922a', bg: '#fdf0d8', label: 'Excited 🔥' },
  Casual:       { color: '#6baa7e', bg: '#e3f4e8', label: 'Casual 😌' },
  Professional: { color: '#9b7fd4', bg: '#f0ebfb', label: 'Professional 💼' },
  Urgent:       { color: '#f0765a', bg: '#fde8e3', label: 'Urgent ⚡' },
  Reflective:   { color: '#5b9bd6', bg: '#e0eff9', label: 'Reflective 🌊' },
  default:      { color: '#9c8570', bg: '#f9efe3', label: 'Note 📝' },
}

const sp = { type: 'spring', stiffness: 320, damping: 26 }

export default function ResultCard({ results }) {
  const [copied,    setCopied]    = useState(false)
  const [exporting, setExporting] = useState(false)
  const [txOpen,    setTxOpen]    = useState(false)

  if (!results) return null
  const { transcription, keyPoints, actionItems, summary, mood, wordCount, timestamp } = results
  const cfg   = moodCfg[mood] || moodCfg.default
  const time  = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const date  = timestamp ? new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  const copyAll = async () => {
    const text = `Voca Note — ${date} ${time}\n\nSUMMARY\n${summary}\n\nKEY POINTS\n${keyPoints?.map((p,i)=>`${i+1}. ${p}`).join('\n')}\n\nACTION ITEMS\n${actionItems?.map(a=>`• ${a}`).join('\n')}\n\nTRANSCRIPT\n"${transcription}"`
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  const exportPDF = () => {
    setExporting(true)
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Voca Note</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Lora:ital,wght@0,600;1,400&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Nunito',sans-serif;background:#fdf6ee;color:#2d2016;padding:52px 60px;max-width:680px;margin:0 auto}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #e8ddd0}
.logo{font-family:'Lora',serif;font-size:24px;font-weight:600;font-style:italic;color:#2d2016;display:flex;align-items:center;gap:8px}
.logo-dot{width:8px;height:8px;border-radius:50%;background:#f0765a;display:inline-block}
.meta{font-size:11px;color:#9c8570;text-align:right;line-height:1.7;font-weight:600}
.mood{display:inline-block;padding:5px 15px;border-radius:99px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:24px}
.label{font-size:9px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9c8570;margin-bottom:10px}
.summary{font-family:'Lora',serif;font-size:15px;font-style:italic;line-height:1.85;color:#2d2016;margin-bottom:28px;padding:16px 18px;background:#fff8f0;border-radius:12px;border:1.5px solid rgba(240,118,90,0.15)}
.kp{display:flex;gap:11px;margin-bottom:9px;align-items:flex-start}
.kp-num{width:22px;height:22px;border-radius:6px;background:#fde8e3;color:#f0765a;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.kp-text{font-size:13.5px;color:#5c4a36;line-height:1.7;font-weight:600}
.ai-row{display:flex;gap:11px;margin-bottom:9px;align-items:flex-start}
.ai-box{width:15px;height:15px;border-radius:4px;border:2px solid rgba(107,170,126,0.5);flex-shrink:0;margin-top:3px}
.divider{height:1.5px;background:#e8ddd0;margin:22px 0}
.tx{font-size:12.5px;color:#9c8570;line-height:1.85;font-style:italic;padding:13px 16px;background:#f9efe3;border-radius:10px}
.footer{text-align:center;font-size:9.5px;color:#c4b09a;letter-spacing:0.14em;font-weight:800;margin-top:44px;text-transform:uppercase}
</style></head><body>
<div class="header">
  <div class="logo"><span class="logo-dot"></span>Voca</div>
  <div class="meta">${date || ''}<br/>${time || ''}${wordCount ? ` · ${wordCount} words` : ''}</div>
</div>
<div class="mood" style="background:${cfg.bg};color:${cfg.color};">${cfg.label}</div>
<div class="label">Summary</div>
<div class="summary">${summary}</div>
<div class="divider"></div>
<div class="label">Key Points</div>
<div style="margin-bottom:26px">${keyPoints?.map((p,i)=>`<div class="kp"><div class="kp-num">${i+1}</div><span class="kp-text">${p}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="label">Action Items</div>
<div style="margin-bottom:26px">${actionItems?.map(a=>`<div class="ai-row"><div class="ai-box"></div><span class="kp-text">${a}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="label" style="margin-bottom:10px">Original Transcript</div>
<div class="tx">"${transcription}"</div>
<div class="footer">Made with Voca · Voice Note Summarizer</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const pop  = window.open(url, '_blank', 'width=800,height=900')
    if (!pop) { const a = document.createElement('a'); a.href = url; a.download = 'voca-note.html'; a.click() }
    setTimeout(() => { URL.revokeObjectURL(url); setExporting(false) }, 2000)
  }

  const Divider = () => (
    <div style={{ height: 1.5, background: 'var(--border2)', margin: '16px 0', borderRadius: 99 }} />
  )

  const Label = ({ children, color }) => (
    <p style={{
      fontSize: 9.5, fontWeight: 800, color: color || 'var(--ink4)',
      letterSpacing: '.12em', textTransform: 'uppercase',
      marginBottom: 10, fontFamily: 'var(--font-body)',
      display: 'flex', alignItems: 'center', gap: 7,
    }}>
      <span style={{ display: 'inline-block', width: 3, height: 12, borderRadius: 2, background: color || 'var(--border)' }} />
      {children}
    </p>
  )

  return (
    <>
      <style>{`
        .rc-kp {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 12px; margin-bottom: 6px;
          background: var(--bg2); border: 1.5px solid var(--border2);
          transition: all .15s;
        }
        .rc-kp:hover { background: var(--card2); border-color: var(--border); transform: translateX(2px); }
        .rc-kp-num {
          flex-shrink: 0; width: 21px; height: 21px; border-radius: 6px;
          background: var(--coral-bg); border: 1.5px solid rgba(240,118,90,0.2);
          color: var(--coral); font-size: 9.5px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; margin-top: 1px;
          font-family: var(--font-body);
        }
        .rc-ai {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 12px; margin-bottom: 6px;
          background: var(--sage-bg); border: 1.5px solid rgba(107,170,126,0.2);
          transition: all .15s;
        }
        .rc-ai:hover { border-color: rgba(107,170,126,0.4); transform: translateX(2px); }
        .rc-ai-box {
          flex-shrink: 0; width: 15px; height: 15px; border-radius: 4px;
          border: 2px solid rgba(107,170,126,0.5); margin-top: 2px; cursor: pointer;
          transition: all .15s;
        }
        .rc-ai-box:hover { background: var(--sage-bg); border-color: var(--sage); }

        .rc-tx-toggle {
          width: 100%; background: var(--bg2); border: 1.5px solid var(--border);
          border-radius: 12px; padding: 10px 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          color: var(--ink3); font-size: 10px; font-weight: 800;
          letter-spacing: .1em; text-transform: uppercase;
          font-family: var(--font-body); transition: all .15s;
        }
        .rc-tx-toggle:hover { background: var(--card); border-color: var(--ink4); color: var(--ink2); }

        .rc-btn-copy {
          flex: 1; height: 44px; border-radius: 12px; cursor: pointer;
          font-family: var(--font-body); font-weight: 700; font-size: 13px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: var(--bg2); border: 1.5px solid var(--border);
          color: var(--ink2); transition: all .18s;
        }
        .rc-btn-copy:hover { background: var(--card); border-color: var(--ink4); color: var(--ink); }
        .rc-btn-copy.copied { background: var(--sage-bg); border-color: rgba(107,170,126,0.3); color: var(--sage); }

        .rc-btn-export {
          flex: 1; height: 44px; border-radius: 12px; cursor: pointer;
          font-family: var(--font-body); font-weight: 800; font-size: 13px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: var(--coral); border: none; color: white; transition: all .18s;
          box-shadow: 0 3px 14px rgba(240,118,90,0.3);
        }
        .rc-btn-export:hover { background: var(--coral2); box-shadow: 0 5px 22px rgba(240,118,90,0.4); transform: translateY(-1px); }
        .rc-btn-export:disabled { opacity: .55; cursor: default; transform: none; }
      `}</style>

      <div style={{ width: '100%' }}>

        {/* Mood + meta */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .04 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}
        >
          <span style={{
            fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 99,
            color: cfg.color, background: cfg.bg,
            border: `1.5px solid ${cfg.color}25`,
            letterSpacing: '.06em', fontFamily: 'var(--font-body)',
          }}>
            {cfg.label}
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {wordCount && <span style={{ fontSize: 11, color: 'var(--ink4)', fontWeight: 700 }}>{wordCount} words</span>}
            {time && <span style={{ fontSize: 11, color: 'var(--ink4)', fontWeight: 600 }}>{time}</span>}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .08 }}>
          <Label color="var(--coral)">Summary</Label>
          <p style={{
            fontSize: 14, color: 'var(--ink)', lineHeight: 1.85, fontWeight: 400,
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            padding: '14px 16px', background: 'var(--coral-bg)',
            border: '1.5px solid rgba(240,118,90,0.15)', borderRadius: 14,
            marginBottom: 2,
          }}>
            {summary}
          </p>
        </motion.div>

        <Divider />

        {/* Key Points */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .12 }}>
          <Label color="var(--sky)">Key Points</Label>
          {keyPoints?.map((pt, i) => (
            <motion.div key={i} className="rc-kp"
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ ...sp, delay: .14 + i * .05 }}>
              <span className="rc-kp-num">{i + 1}</span>
              <span style={{ color: 'var(--ink2)', fontSize: 13, lineHeight: 1.7, fontWeight: 600 }}>{pt}</span>
            </motion.div>
          ))}
        </motion.div>

        <Divider />

        {/* Action Items */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sp, delay: .16 }}>
          <Label color="var(--sage)">Action Items</Label>
          {actionItems?.map((item, i) => (
            <motion.div key={i} className="rc-ai"
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ ...sp, delay: .18 + i * .05 }}>
              <div className="rc-ai-box" />
              <span style={{ color: 'var(--ink2)', fontSize: 13, lineHeight: 1.7, fontWeight: 600 }}>{item}</span>
            </motion.div>
          ))}
        </motion.div>

        <Divider />

        {/* Transcript accordion */}
        <div>
          <button className="rc-tx-toggle" onClick={() => setTxOpen(v => !v)}>
            <span>📄 Original Transcript</span>
            <motion.span animate={{ rotate: txOpen ? 180 : 0 }} transition={{ duration: .2 }}>
              <ChevronDown size={13} />
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
                  marginTop: 8, padding: '13px 15px', borderRadius: 12,
                  background: 'var(--bg2)', border: '1.5px solid var(--border2)',
                  color: 'var(--ink3)', fontSize: 12.5, lineHeight: 1.85,
                  fontStyle: 'italic', fontWeight: 400,
                }}>
                  "{transcription}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <motion.button className={`rc-btn-copy ${copied ? 'copied' : ''}`}
            onClick={copyAll} whileTap={{ scale: .97 }}>
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="c" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}}
                    style={{display:'flex',alignItems:'center',gap:5}}><Check size={13}/>Copied!</motion.span>
                : <motion.span key="u" initial={{opacity:0}} animate={{opacity:1}}
                    style={{display:'flex',alignItems:'center',gap:5}}><Copy size={13}/>Copy</motion.span>
              }
            </AnimatePresence>
          </motion.button>
          <motion.button className="rc-btn-export" onClick={exportPDF} disabled={exporting} whileTap={{ scale: .97 }}>
            <Download size={13} /> {exporting ? 'Opening…' : 'Export PDF'}
          </motion.button>
        </div>
      </div>
    </>
  )
}