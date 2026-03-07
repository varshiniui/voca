'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Download, ChevronDown } from 'lucide-react'

const moodCfg = {
  Focused:      { color:'#a06050', bg:'rgba(200,144,124,.14)', label:'Focused 🎯' },
  Excited:      { color:'#907040', bg:'rgba(200,160,96,.14)',  label:'Excited ⚡' },
  Casual:       { color:'#507860', bg:'rgba(138,170,144,.14)', label:'Casual 🌿' },
  Professional: { color:'#486480', bg:'rgba(138,168,192,.14)', label:'Professional 💼' },
  Urgent:       { color:'#904040', bg:'rgba(200,100,100,.14)', label:'Urgent 🔥' },
  Reflective:   { color:'#806070', bg:'rgba(176,144,154,.14)', label:'Reflective 🌙' },
  default:      { color:'#9a8878', bg:'rgba(200,180,160,.12)', label:'Note ✦' },
}

const sp = { type:'spring', stiffness:300, damping:24 }

const RC_CSS = `
  @keyframes rc-pop  { 0%{opacity:0;transform:scale(.85) translateY(8px);} 70%{transform:scale(1.04);} 100%{opacity:1;transform:scale(1);} }
  @keyframes rc-spin { to { transform:rotate(360deg); } }

  .rc-wrap {
    width:100%;
    font-family:'Outfit',sans-serif;
    font-weight:300;
  }

  /* mood badge */
  .rc-mood {
    display:inline-flex;align-items:center;gap:6px;
    padding:5px 14px;border-radius:99px;
    font-size:10.5px;font-weight:500;letter-spacing:.04em;
    font-family:'Outfit',sans-serif;
    box-shadow:0 3px 0 rgba(160,120,100,.15), 0 5px 14px rgba(160,120,100,.1);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1);
    cursor:default;
  }
  .rc-mood:hover { transform:translateY(-2px) scale(1.04); }

  /* section label */
  .rc-label {
    display:flex;align-items:center;gap:7px;
    font-size:9px;font-weight:500;letter-spacing:.16em;
    text-transform:uppercase;color:#9a8878;
    margin-bottom:9px;font-family:'Outfit',sans-serif;
  }
  .rc-label-bar {
    width:3px;height:12px;border-radius:2px;flex-shrink:0;
  }

  /* summary — full sticky note */
  @keyframes rc-note-in { 0%{opacity:0;transform:rotate(-4deg) scale(.9) translateY(20px);} 70%{transform:rotate(-1.2deg) scale(1.01);} 100%{opacity:1;transform:rotate(-1deg) scale(1);} }

  .rc-summary-wrap {
    position:relative;
    animation:rc-note-in .65s cubic-bezier(.34,1.56,.64,1) forwards;
    margin-bottom:2px;
  }
  .rc-tape {
    position:absolute;top:-9px;left:50%;transform:translateX(-50%);
    width:52px;height:18px;border-radius:4px;z-index:1;
    background:rgba(120,180,160,.42);
    border:1px solid rgba(140,195,175,.5);
    box-shadow:0 2px 6px rgba(80,140,120,.18);
  }
  .rc-summary {
    position:relative;
    padding:24px 20px 18px;border-radius:18px;
    background:linear-gradient(158deg,#e8f4f0 0%,#d8eee8 50%,#c8e4dc 100%);
    border:1px solid rgba(140,190,175,.35);
    font-family:'Cormorant Garamond',serif;
    font-size:14.5px;font-style:italic;font-weight:400;
    line-height:1.85;color:#1a3830;
    transform:rotate(-1deg);
    transform-origin:center top;
    box-shadow:
      4px 7px 36px rgba(80,140,120,.14),
      1px 2px 4px rgba(0,0,0,.04),
      0 6px 0 rgba(120,180,160,.2),
      0 7px 0 rgba(100,165,145,.12),
      0 8px 10px rgba(80,140,120,.12);
    transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
    cursor:default;
  }
  .rc-summary:hover {
    transform:rotate(0deg) translateY(-4px) scale(1.01);
    box-shadow:
      6px 14px 48px rgba(80,140,120,.2),
      1px 2px 4px rgba(0,0,0,.04),
      0 8px 0 rgba(120,180,160,.16),
      0 9px 14px rgba(80,140,120,.14);
  }

  /* key point row */
  .rc-kp {
    display:flex;align-items:flex-start;gap:10px;
    padding:10px 13px;border-radius:14px;margin-bottom:6px;
    background:rgba(248,243,236,.88);
    border:1px solid rgba(176,144,154,.25);
    box-shadow:0 3px 0 rgba(176,144,154,.15), 0 5px 14px rgba(160,120,130,.06);
    transition:all .25s cubic-bezier(.34,1.56,.64,1);
    cursor:default;
  }
  .rc-kp:hover {
    transform:translateX(4px) translateY(-2px);
    border-color:rgba(176,144,154,.45);
    box-shadow:0 5px 0 rgba(176,144,154,.12), 0 10px 22px rgba(160,120,130,.12);
  }
  .rc-kp-num {
    flex-shrink:0;width:20px;height:20px;border-radius:6px;
    background:rgba(176,144,154,.18);
    border:1px solid rgba(176,144,154,.28);
    color:#806070;font-size:9px;font-weight:600;
    display:flex;align-items:center;justify-content:center;
    margin-top:2px;font-family:'Outfit',sans-serif;
    box-shadow:0 2px 0 rgba(176,144,154,.2);
  }

  /* action item row */
  .rc-ai {
    display:flex;align-items:flex-start;gap:10px;
    padding:10px 13px;border-radius:14px;margin-bottom:6px;
    background:rgba(248,243,236,.82);
    border:1px solid rgba(138,170,144,.28);
    box-shadow:0 3px 0 rgba(138,170,144,.18), 0 5px 14px rgba(100,140,120,.06);
    transition:all .25s cubic-bezier(.34,1.56,.64,1);
    cursor:default;
  }
  .rc-ai:hover {
    transform:translateX(4px) translateY(-2px);
    border-color:rgba(138,170,144,.48);
    box-shadow:0 5px 0 rgba(138,170,144,.14), 0 10px 22px rgba(100,140,120,.12);
  }
  .rc-ai-check {
    flex-shrink:0;width:17px;height:17px;border-radius:5px;margin-top:2px;
    background:linear-gradient(135deg,#8aaa90,#6a9870);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(100,140,120,.3), 0 3px 0 rgba(80,120,90,.2);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1);
  }
  .rc-ai:hover .rc-ai-check { transform:rotate(10deg) scale(1.15); }

  /* transcript toggle */
  .rc-tx-btn {
    width:100%;background:rgba(248,243,236,.75);
    border:1px solid rgba(200,180,160,.28);
    border-radius:14px;padding:10px 14px;cursor:pointer;
    display:flex;align-items:center;justify-content:space-between;
    color:#9a8878;font-size:10px;font-weight:400;
    letter-spacing:.1em;text-transform:uppercase;
    font-family:'Outfit',sans-serif;transition:all .2s;
    box-shadow:0 3px 0 rgba(200,180,160,.15);
  }
  .rc-tx-btn:hover {
    background:rgba(255,252,248,.96);border-color:#c8907c;color:#4a3c34;
    transform:translateY(-2px);
    box-shadow:0 5px 0 rgba(200,180,160,.12);
  }

  /* copy button */
  .rc-copy {
    flex:1;height:46px;border-radius:14px;cursor:pointer;
    font-family:'Outfit',sans-serif;font-weight:500;font-size:12.5px;
    display:flex;align-items:center;justify-content:center;gap:6px;
    background:rgba(248,243,236,.88);
    border:1px solid rgba(200,180,160,.3);
    color:#4a3c34;transition:all .25s;
    box-shadow:0 3px 0 rgba(200,180,160,.2), 0 5px 14px rgba(160,120,100,.08);
  }
  .rc-copy:hover {
    background:rgba(255,252,248,.97);border-color:#c8907c;color:#1a1410;
    transform:translateY(-3px);
    box-shadow:0 6px 0 rgba(200,180,160,.15), 0 10px 22px rgba(160,120,100,.14);
  }
  .rc-copy:active { transform:translateY(0); box-shadow:0 1px 0 rgba(200,180,160,.2); }
  .rc-copy.done {
    background:rgba(138,170,144,.15);border-color:rgba(138,170,144,.4);color:#507860;
    box-shadow:0 3px 0 rgba(138,170,144,.18);
  }

  /* export button */
  .rc-export {
    flex:1;height:46px;border-radius:14px;cursor:pointer;
    font-family:'Outfit',sans-serif;font-weight:500;font-size:12.5px;
    display:flex;align-items:center;justify-content:center;gap:6px;
    background:linear-gradient(135deg,#d8a898 0%,#c09090 40%,#a890b0 75%,#90a8c0 100%);
    background-size:250% 250%;background-position:0% 50%;
    border:none;color:white;transition:all .3s;
    box-shadow:0 4px 0 rgba(140,80,80,.28), 0 8px 24px rgba(160,120,130,.32);
    text-shadow:0 1px 3px rgba(80,50,60,.2);
  }
  .rc-export:hover {
    background-position:100% 50%;
    transform:translateY(-4px);
    box-shadow:0 8px 0 rgba(140,80,80,.2), 0 16px 36px rgba(160,120,130,.38);
  }
  .rc-export:active { transform:translateY(0); box-shadow:0 2px 0 rgba(140,80,80,.28); }
  .rc-export:disabled { opacity:.55;cursor:default;transform:none; }

  .rc-divider {
    height:1px;
    background:linear-gradient(90deg,transparent,rgba(200,180,160,.3),transparent);
    margin:16px 0;border-radius:99px;
  }
`

export default function ResultCard({ results }) {
  const [copied,    setCopied]    = useState(false)
  const [exporting, setExporting] = useState(false)
  const [txOpen,    setTxOpen]    = useState(false)

  if (!results) return null

  const {
    transcription,
    keyPoints:   _kp,
    actionItems: _ai,
    summary, mood, wordCount, timestamp,
  } = results
  const keyPoints   = Array.isArray(_kp) ? _kp : []
  const actionItems = (Array.isArray(_ai) ? _ai : []).filter(a => !a.toLowerCase().includes('no specific'))
  const cfg  = moodCfg[mood] || moodCfg.default
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : ''
  const date = timestamp ? new Date(timestamp).toLocaleDateString([], { month:'short', day:'numeric', year:'numeric' }) : ''

  const copyAll = async () => {
    const text = [
      `Voca Note — ${date} ${time}`,
      `\nSUMMARY\n${summary}`,
      `\nKEY POINTS\n${keyPoints?.map((p,i)=>`${i+1}. ${p}`).join('\n')}`,
      `\nACTION ITEMS\n${actionItems?.map(a=>`• ${a}`).join('\n')}`,
      `\nTRANSCRIPT\n"${transcription}"`,
    ].join('')
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(()=>setCopied(false), 2500)
  }

  const exportPDF = () => {
    setExporting(true)
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Voca Note</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Outfit',sans-serif;font-weight:300;background:#f0ebe4;color:#1a1410;padding:52px 60px;max-width:680px;margin:0 auto}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px;padding-bottom:20px;border-bottom:1px solid rgba(200,180,160,.3)}
.logo{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:400;font-style:italic;color:#1a1410}
.logo em{background:linear-gradient(120deg,#c8907c,#b09098,#8aa8c0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.meta{font-size:11px;color:#9a8878;text-align:right;line-height:1.8}
.mood{display:inline-block;padding:5px 14px;border-radius:99px;font-size:10.5px;font-weight:500;letter-spacing:.04em;margin-bottom:22px}
.label{font-size:9px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#9a8878;margin-bottom:9px;display:flex;align-items:center;gap:6px}
.label-bar{width:3px;height:10px;border-radius:2px;display:inline-block}
.summary{font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;line-height:1.85;color:#3a3010;margin-bottom:26px;padding:16px 18px;background:linear-gradient(158deg,#e8f4f0,#c8e4dc);border-radius:14px;border:1px solid rgba(140,190,175,.35)}
.kp-row{display:flex;gap:10px;margin-bottom:8px;align-items:flex-start}
.kp-num{width:20px;height:20px;border-radius:5px;background:rgba(176,144,154,.18);color:#806070;font-size:9px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.kp-text{font-size:13px;color:#4a3c34;line-height:1.7}
.ai-row{display:flex;gap:10px;margin-bottom:8px;align-items:flex-start}
.ai-check{width:16px;height:16px;border-radius:5px;background:linear-gradient(135deg,#8aaa90,#6a9870);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center}
.divider{height:1px;background:rgba(200,180,160,.3);margin:20px 0}
.tx{font-size:12.5px;color:#9a8878;line-height:1.85;font-style:italic;padding:13px 16px;background:rgba(248,243,236,.8);border-radius:12px;border:1px solid rgba(200,180,160,.2)}
.footer{text-align:center;font-size:9px;color:#c8bab0;letter-spacing:.14em;font-weight:400;margin-top:44px;text-transform:uppercase}
</style></head><body>
<div class="header">
  <div class="logo">V<em>oca</em></div>
  <div class="meta">${date||''}${date&&time?' · ':''}${time||''}${wordCount?` · ${wordCount} words`:''}</div>
</div>
<div class="mood" style="background:${cfg.bg};color:${cfg.color};">${cfg.label}</div>
<div class="label"><span class="label-bar" style="background:${cfg.color}"></span>Summary</div>
<div class="summary">${summary}</div>
<div class="divider"></div>
<div class="label"><span class="label-bar" style="background:#b09098"></span>Key Points</div>
<div style="margin-bottom:22px">${(keyPoints||[]).map((p,i)=>`<div class="kp-row"><div class="kp-num">${i+1}</div><span class="kp-text">${p}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="label"><span class="label-bar" style="background:#8aaa90"></span>Action Items</div>
<div style="margin-bottom:22px">${(actionItems||[]).map(a=>`<div class="ai-row"><div class="ai-check"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 4.5L3.5 7L8 2" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="kp-text">${a}</span></div>`).join('')}</div>
<div class="divider"></div>
<div class="label"><span class="label-bar" style="background:#c8907c"></span>Transcript</div>
<div class="tx">"${transcription}"</div>
<div class="footer">Made with Voca · Voice Note Summarizer</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body></html>`
    const blob = new Blob([html],{type:'text/html'})
    const url  = URL.createObjectURL(blob)
    const pop  = window.open(url,'_blank','width=800,height=900')
    if(!pop){ const a=document.createElement('a');a.href=url;a.download='voca-note.html';a.click() }
    setTimeout(()=>{ URL.revokeObjectURL(url); setExporting(false) }, 2000)
  }

  const Divider = () => <div className="rc-divider"/>

  const Label = ({ children, color }) => (
    <p className="rc-label">
      <span className="rc-label-bar" style={{ background: color||'#9a8878' }}/>
      {children}
    </p>
  )

  return (
    <>
      <style>{RC_CSS}</style>
      <div className="rc-wrap">

        {/* timestamp */}
        {time && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ delay:.04 }}
            style={{ display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
            <span style={{ fontSize:10, color:'#9a8878', fontFamily:"'Outfit',sans-serif" }}>{time}</span>
          </motion.div>
        )}

        {/* summary sticky note */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0   }}
          transition={{ ...sp, delay:.08 }}>
          <div className="rc-summary-wrap">
            <div className="rc-tape"/>
            <div className="rc-summary">
              {mood && (
                <motion.div
                  initial={{ opacity:0, scale:.6 }} animate={{ opacity:1, scale:1 }}
                  transition={{ delay:.3, type:'spring', stiffness:300 }}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    padding:'3px 10px', borderRadius:99, marginBottom:11,
                    background:cfg.bg, border:`1px solid ${cfg.color}22`,
                    fontSize:10.5, fontWeight:500, color:cfg.color,
                    fontFamily:"'Outfit',sans-serif",
                  }}>
                  <motion.span
                    animate={{ rotate:[0,10,-10,0] }}
                    transition={{ duration:2, repeat:Infinity, repeatDelay:3 }}
                    style={{ fontSize:13 }}>{cfg.label.split(' ').pop()}</motion.span>
                  {mood}
                </motion.div>
              )}
              <p style={{ margin:0 }}>{summary}</p>
              {wordCount && (
                <p style={{ fontSize:9.5, color:'#5a9080', marginTop:10, opacity:.7,
                  fontFamily:"'Outfit',sans-serif", fontStyle:'normal' }}>
                  {wordCount} words
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <Divider/>

        {/* key points */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          transition={{ ...sp, delay:.12 }}>
          <Label color="#b09098">Key points</Label>
          {(keyPoints||[]).map((pt,i) => (
            <motion.div key={i} className="rc-kp"
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              transition={{ ...sp, delay:.14+i*.06 }}>
              <span className="rc-kp-num">{i+1}</span>
              <span style={{ color:'#4a3c34', fontSize:12.5, lineHeight:1.7,
                fontFamily:"'Outfit',sans-serif", fontWeight:300 }}>{pt}</span>
            </motion.div>
          ))}
        </motion.div>

        <Divider/>

        {/* action items */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          transition={{ ...sp, delay:.18 }}>
          <Label color="#8aaa90">Actions</Label>
          {(actionItems||[]).filter(a=>!a.toLowerCase().includes('no specific')).map((item,i) => (
            <motion.div key={i} className="rc-ai"
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              transition={{ ...sp, delay:.2+i*.06 }}>
              <motion.div className="rc-ai-check"
                initial={{ scale:0, rotate:-20 }}
                animate={{ scale:1, rotate:0   }}
                transition={{ ...sp, delay:.3+i*.06 }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span style={{ color:'#4a3c34', fontSize:12.5, lineHeight:1.7,
                fontFamily:"'Outfit',sans-serif", fontWeight:300 }}>{item}</span>
            </motion.div>
          ))}
        </motion.div>

        <Divider/>

        {/* transcript accordion */}
        <div>
          <button className="rc-tx-btn" onClick={()=>setTxOpen(v=>!v)}>
            <span>📄 Transcript</span>
            <motion.span animate={{ rotate:txOpen?180:0 }} transition={{ duration:.2 }}
              style={{ display:'flex', alignItems:'center' }}>
              <ChevronDown size={12}/>
            </motion.span>
          </button>
          <AnimatePresence>
            {txOpen && (
              <motion.div
                initial={{ opacity:0, height:0, y:-8 }}
                animate={{ opacity:1, height:'auto', y:0 }}
                exit={{ opacity:0, height:0, y:-8 }}
                transition={{ duration:.24, type:'spring', stiffness:260, damping:26 }}
                style={{ overflow:'hidden' }}>
                <p style={{
                  marginTop:8, padding:'13px 15px', borderRadius:14,
                  background:'rgba(248,243,236,.82)',
                  border:'1px solid rgba(200,180,160,.22)',
                  color:'#9a8878', fontSize:12.5, lineHeight:1.85,
                  fontStyle:'italic', fontWeight:300,
                  fontFamily:"'Cormorant Garamond',serif",
                  boxShadow:'inset 0 2px 8px rgba(160,120,100,.06)',
                }}>
                  "{transcription}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* action buttons */}
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ ...sp, delay:.3 }}
          style={{ display:'flex', gap:10, marginTop:18 }}>
          <motion.button
            className={`rc-copy${copied?' done':''}`}
            onClick={copyAll} whileTap={{ scale:.94, y:2 }}>
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="c"
                    initial={{ opacity:0, scale:.7 }} animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0 }}
                    transition={{ type:'spring', stiffness:400 }}
                    style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Check size={13}/> Copied!
                  </motion.span>
                : <motion.span key="u"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Copy size={13}/> Copy
                  </motion.span>
              }
            </AnimatePresence>
          </motion.button>

          <motion.button
            className="rc-export"
            onClick={exportPDF} disabled={exporting}
            whileTap={{ scale:.94, y:2 }}>
            {exporting
              ? <motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                  style={{ display:'flex', alignItems:'center' }}>
                  <Download size={13}/>
                </motion.span>
              : <Download size={13}/>
            }
            {exporting ? 'Opening…' : 'Export PDF'}
          </motion.button>
        </motion.div>
      </div>
    </>
  )
}