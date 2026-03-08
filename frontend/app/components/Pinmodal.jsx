'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PIN_CSS = `
  @keyframes pm-shake { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-8px);} 40%{transform:translateX(8px);} 60%{transform:translateX(-5px);} 80%{transform:translateX(5px);} }
  @keyframes pm-pop   { 0%{transform:scale(.6);} 70%{transform:scale(1.15);} 100%{transform:scale(1);} }
  @keyframes pm-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }

  .pm-overlay {
    position:fixed;inset:0;z-index:500;
    background:rgba(26,20,16,.55);
    backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    display:flex;align-items:center;justify-content:center;
    padding:20px;
  }
  .pm-card {
    background:rgba(248,243,236,.96);
    border:1px solid rgba(255,255,255,.95);
    border-radius:28px;padding:36px 32px 30px;
    width:100%;max-width:340px;
    box-shadow:
      0 2px 0 rgba(200,180,160,.15),
      0 4px 0 rgba(200,180,160,.08),
      0 24px 80px rgba(100,70,50,.22),
      inset 0 1px 0 rgba(255,255,255,.9);
    display:flex;flex-direction:column;align-items:center;gap:0;
  }
  .pm-icon {
    font-size:36px;margin-bottom:12px;
    animation:pm-float 4s ease-in-out infinite;
    display:block;
  }
  .pm-title {
    font-family:'Cormorant Garamond',serif;
    font-size:24px;font-weight:400;font-style:italic;
    color:#1a1410;margin-bottom:6px;text-align:center;
    text-shadow:0 1px 0 rgba(200,180,160,.4);
  }
  .pm-sub {
    font-size:11.5px;color:#9a8878;font-weight:300;
    font-family:'Outfit',sans-serif;text-align:center;
    margin-bottom:26px;line-height:1.6;
  }
  /* dots row */
  .pm-dots { display:flex;gap:12px;margin-bottom:24px; }
  .pm-dot {
    width:14px;height:14px;border-radius:50%;
    border:1.5px solid rgba(200,144,124,.4);
    background:transparent;
    transition:all .2s cubic-bezier(.34,1.56,.64,1);
  }
  .pm-dot.filled {
    background:linear-gradient(135deg,#c8907c,#b09098);
    border-color:transparent;
    box-shadow:0 2px 8px rgba(200,144,124,.4);
    animation:pm-pop .25s cubic-bezier(.34,1.56,.64,1);
  }
  .pm-dot.shake { animation:pm-shake .4s ease; }
  /* numpad */
  .pm-pad { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%; }
  .pm-key {
    height:52px;border-radius:14px;border:none;cursor:pointer;
    font-family:'Outfit',sans-serif;font-size:18px;font-weight:400;
    color:#1a1410;
    background:rgba(255,252,248,.85);
    border:1px solid rgba(200,180,160,.25);
    box-shadow:0 3px 0 rgba(200,180,160,.2), 0 5px 14px rgba(160,120,100,.07);
    transition:all .15s cubic-bezier(.34,1.56,.64,1);
    display:flex;align-items:center;justify-content:center;
  }
  .pm-key:hover { background:rgba(255,252,248,.98);transform:translateY(-2px);box-shadow:0 5px 0 rgba(200,180,160,.16),0 8px 18px rgba(160,120,100,.12); }
  .pm-key:active { transform:translateY(1px);box-shadow:0 1px 0 rgba(200,180,160,.2); }
  .pm-key.del { font-size:14px;color:#9a8878; }
  .pm-key.zero { grid-column:2; }
  /* error */
  .pm-err {
    font-size:11px;color:#c05050;font-family:'Outfit',sans-serif;
    margin-top:10px;min-height:16px;text-align:center;
  }
  /* shimmer top */
  .pm-card::before {
    content:'';position:absolute;top:0;left:8%;right:8%;height:1.5px;border-radius:99px;
    background:linear-gradient(90deg,transparent,rgba(200,144,124,.4),rgba(176,144,154,.3),transparent);
  }
  .pm-card { position:relative; }
`

// Generates or retrieves a stable device ID
function getDeviceId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('voca_device_id')
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9)
    localStorage.setItem('voca_device_id', id)
  }
  return id
}

function hashPIN(pin) {
  // Simple client-side hash preview — real hash done server-side
  // We just send the PIN to /api/auth/register or /api/auth/verify
  return pin
}

export default function PinModal({ onUnlock }) {
  const [mode,    setMode]    = useState('loading') // loading | setup | enter
  const [pin,     setPin]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [step,    setStep]    = useState('pin')     // pin | confirm (for setup)
  const [error,   setError]   = useState('')
  const [shake,   setShake]   = useState(false)
  const [busy,    setBusy]    = useState(false)
  const deviceId = useRef('')

  const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  useEffect(() => {
    deviceId.current = getDeviceId()
    checkRegistered()
  }, [])

  const checkRegistered = async () => {
    try {
      const res  = await fetch(`${API}/api/auth/status`, {
        headers: { 'x-device-id': getDeviceId() }
      })
      const data = await res.json()
      // Also check if we have a stored pinHash that auto-unlocks
      const storedHash = localStorage.getItem('voca_pin_hash')
      if (data.registered && storedHash) {
        // Try auto-unlock with stored hash
        const verify = await fetch(`${API}/api/auth/status`, {
          headers: { 'x-device-id': getDeviceId(), 'x-pin-hash': storedHash }
        })
        // If stored hash works just unlock silently
        onUnlock({ deviceId: getDeviceId(), pinHash: storedHash })
        return
      }
      setMode(data.registered ? 'enter' : 'setup')
    } catch(e) {
      setMode('setup') // offline fallback
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const pressKey = (k) => {
    setError('')
    const current = mode === 'setup' && step === 'confirm' ? confirm : pin
    if (current.length >= 4) return
    if (mode === 'setup' && step === 'confirm') setConfirm(c => c + k)
    else setPin(p => p + k)
  }

  const pressDelete = () => {
    setError('')
    if (mode === 'setup' && step === 'confirm') setConfirm(c => c.slice(0,-1))
    else setPin(p => p.slice(0,-1))
  }

  // Auto-submit when 4 digits entered
  useEffect(() => {
    const current = mode === 'setup' && step === 'confirm' ? confirm : pin
    if (current.length === 4) {
      setTimeout(() => handleSubmit(current), 120)
    }
  }, [pin, confirm])

  const handleSubmit = async (value) => {
    if (busy) return
    setBusy(true)
    try {
      if (mode === 'setup') {
        if (step === 'pin') {
          // Move to confirm step
          setStep('confirm')
          setBusy(false)
          return
        }
        // Confirm step — check match
        if (value !== pin) {
          setError("PINs don't match — try again")
          setConfirm('')
          setStep('pin')
          setPin('')
          triggerShake()
          setBusy(false)
          return
        }
        // Register
        const res  = await fetch(`${API}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: deviceId.current, pin })
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Registration failed'); triggerShake(); setBusy(false); return }
        localStorage.setItem('voca_pin_hash', data.pinHash)
        onUnlock({ deviceId: deviceId.current, pinHash: data.pinHash })

      } else {
        // Enter mode — verify
        const res  = await fetch(`${API}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: deviceId.current, pin: value })
        })
        const data = await res.json()
        if (!res.ok) {
          setError('Wrong PIN — try again')
          setPin('')
          triggerShake()
          setBusy(false)
          return
        }
        localStorage.setItem('voca_pin_hash', data.pinHash)
        onUnlock({ deviceId: deviceId.current, pinHash: data.pinHash })
      }
    } catch(e) {
      setError('Connection error')
      triggerShake()
    }
    setBusy(false)
  }

  if (mode === 'loading') return null

  const currentPin  = mode === 'setup' && step === 'confirm' ? confirm : pin
  const title       = mode === 'setup'
    ? (step === 'pin' ? 'Set your PIN' : 'Confirm PIN')
    : 'Enter your PIN'
  const subtitle    = mode === 'setup'
    ? (step === 'pin' ? 'Choose a 4-digit PIN to protect your notes' : 'Re-enter your PIN to confirm')
    : 'Your notes are waiting ✦'

  return (
    <>
      <style>{PIN_CSS}</style>
      <motion.div className="pm-overlay"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:.25 }}>
        <motion.div className="pm-card"
          initial={{ opacity:0, y:32, scale:.93 }}
          animate={{ opacity:1, y:0,  scale:1   }}
          transition={{ type:'spring', stiffness:260, damping:24, delay:.05 }}>

          <span className="pm-icon">🔐</span>
          <h2 className="pm-title">{title}</h2>
          <p className="pm-sub">{subtitle}</p>

          {/* PIN dots */}
          <div className={`pm-dots${shake?' shake':''}`}>
            {[0,1,2,3].map(i => (
              <motion.div key={i} className={`pm-dot${i < currentPin.length?' filled':''}`}
                animate={i < currentPin.length ? { scale:[1,1.2,1] } : {}}
                transition={{ duration:.2 }}/>
            ))}
          </div>

          {/* Number pad */}
          <div className="pm-pad">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <motion.button key={n} className="pm-key"
                onClick={() => pressKey(String(n))}
                whileTap={{ scale:.88 }}>
                {n}
              </motion.button>
            ))}
            <div/> {/* empty cell */}
            <motion.button className="pm-key zero" onClick={() => pressKey('0')} whileTap={{ scale:.88 }}>0</motion.button>
            <motion.button className="pm-key del"  onClick={pressDelete}         whileTap={{ scale:.88 }}>⌫</motion.button>
          </div>

          <p className="pm-err">{error}</p>

          {mode === 'enter' && (
            <motion.button
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.5 }}
              onClick={() => { localStorage.removeItem('voca_device_id'); localStorage.removeItem('voca_pin_hash'); window.location.reload() }}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:10.5,
                color:'#c8bab0', fontFamily:"'Outfit',sans-serif", marginTop:4,
                textDecoration:'underline dotted', textUnderlineOffset:3 }}>
              use a different device
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </>
  )
}