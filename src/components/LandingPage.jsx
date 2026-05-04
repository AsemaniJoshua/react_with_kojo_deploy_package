import { useState, motion } from 'framer-motion'
import { useState as useReactState } from 'react'

function LandingPage({ onStart, onInstall, showInstall }) {
  const [difficulty, setDifficulty] = useReactState('PILOT')
  const highScore = localStorage.getItem('mathBlast_highScore') || 0

  const diffs = [
    { id: 'RECRUIT', label: 'RECRUIT' },
    { id: 'PILOT', label: 'PILOT' },
    { id: 'ACE', label: 'ACE' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '15px', 
          background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto 2rem auto',
          boxShadow: '0 0 30px var(--neon-cyan)',
          fontFamily: 'Orbitron'
        }}>M</div>
        
        <h1 className="orbitron" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', letterSpacing: '8px', color: 'var(--neon-cyan)', textShadow: '0 0 20px var(--neon-cyan)', marginBottom: '0.5rem' }}>MATH BLAST</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--neon-magenta)', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '1rem', opacity: 0.8 }}>Educational Math Shooter</p>
        
        {highScore > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <p style={{ fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '2px' }}>Personal Best</p>
            <p className="orbitron" style={{ fontSize: '2rem', color: '#fff' }}>{highScore}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {diffs.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              style={{
                background: difficulty === d.id ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: difficulty === d.id ? '2px solid var(--neon-cyan)' : '1px solid rgba(0, 242, 255, 0.3)',
                color: difficulty === d.id ? 'var(--neon-cyan)' : 'white',
                padding: '0.8rem 2rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'Orbitron',
                boxShadow: difficulty === d.id ? '0 0 15px var(--neon-cyan)' : 'none',
                transition: 'all 0.3s ease',
                minWidth: '140px'
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <button className="neon-btn" onClick={() => onStart(difficulty)} style={{ minWidth: '300px' }}>
            START MISSION
          </button>
          
          {showInstall && (
            <button 
              onClick={onInstall}
              style={{ 
                background: 'none', border: 'none', color: 'var(--neon-cyan)', 
                textDecoration: 'underline', cursor: 'pointer', opacity: 0.8,
                fontSize: '1rem', fontFamily: 'Orbitron'
              }}
            >
              INSTALL TO DEVICE
            </button>
          )}
        </div>

        <div style={{ marginTop: '4rem', opacity: 0.5, fontSize: '0.9rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <p>DRAG TO MOVE</p>
          <p>AUTO-FIRE ACTIVE</p>
        </div>
      </motion.div>
    </div>
  )
}

export default LandingPage
