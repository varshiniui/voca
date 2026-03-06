'use client'

export default function SoundWave({ isActive }) {
  if (!isActive) return null

  const colors = ['#e8714a', '#d4a853', '#7aab8a', '#6499b8', '#e8714a', '#d4a853', '#7aab8a', '#6499b8']

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 32 }}>
      {[55, 80, 100, 70, 90, 65, 85, 50].map((h, i) => (
        <div key={i} className="bar" style={{
          width: 3,
          height: `${h}%`,
          borderRadius: 99,
          background: `linear-gradient(to top, ${colors[i]}, ${colors[i]}55)`,
          opacity: 0.8,
        }} />
      ))}
    </div>
  )
}