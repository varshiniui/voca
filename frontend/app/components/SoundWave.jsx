'use client'

export default function SoundWave({ isActive }) {
  if (!isActive) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 32 }}>
      {[55, 80, 100, 70, 90, 65, 85, 50].map((h, i) => (
        <div key={i} className="bar" style={{
          width: 4, height: `${h}%`, borderRadius: 99,
          background: 'linear-gradient(to top, var(--pink-400), var(--pink-200))',
        }} />
      ))}
    </div>
  )
}