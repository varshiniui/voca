'use client'

export default function SoundWave({ isActive }) {
  if (!isActive) return null

  const colors = [
    'var(--coral)', 'var(--amber)', 'var(--sage)', 'var(--sky)',
    'var(--coral)', 'var(--amber)', 'var(--sage)', 'var(--sky)',
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 28 }}>
      {[55, 80, 100, 70, 90, 65, 85, 50].map((h, i) => (
        <div key={i} className="bar" style={{
          width: 3,
          height: `${h}%`,
          borderRadius: 99,
          background: colors[i],
          opacity: 0.8,
        }} />
      ))}
    </div>
  )
}
