import { useState } from 'react'

function LandingPage({ onStart }) {
  const [difficulty, setDifficulty] = useState('PILOT')

  const diffs = [
    { id: 'RECRUIT', label: 'RECRUIT' },
    { id: 'PILOT', label: 'PILOT' },
    { id: 'ACE', label: 'ACE' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
      <div style={{ 
        width: '80px', height: '80px', borderRadius: '15px', 
        background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem',
        boxShadow: '0 0 20px var(--neon-cyan)',
        fontFamily: 'Orbitron'
      }}>M</div>
      
      <h1 className="orbitron" style={{ fontSize: '4rem', letterSpacing: '8px', color: 'var(--neon-cyan)', textShadow: '0 0 20px var(--neon-cyan)', marginBottom: '0.5rem' }}>MATH BLAST</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--neon-magenta)', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '3rem', opacity: 0.8 }}>Educational Math Shooter</p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {diffs.map(d => (
          <button
            key={d.id}
            onClick={() => setDifficulty(d.id)}
            style={{
              background: difficulty === d.id ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: difficulty === d.id ? '2px solid var(--neon-cyan)' : '1px solid rgba(0, 242, 255, 0.3)',
              color: difficulty === d.id ? 'var(--neon-cyan)' : 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: 'Orbitron',
              boxShadow: difficulty === d.id ? '0 0 15px var(--neon-cyan)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <button className="neon-btn" onClick={() => onStart(difficulty)}>
        START MISSION
      </button>

      <div style={{ marginTop: '3rem', opacity: 0.6, fontSize: '0.9rem' }}>
        <p>Move: Mouse / Touch / Arrows</p>
        <p>Shoot: Auto / Click / Space</p>
      </div>
    </div>
  )
}

export default LandingPage
