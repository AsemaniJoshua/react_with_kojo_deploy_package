import { useState } from 'react'
import { motion } from 'framer-motion'

function LandingPage({ onStart, onInstall, showInstall }) {
  const [difficulty, setDifficulty] = useState('PILOT')
  const highScore = localStorage.getItem('mathBlast_highScore') || 0

  const diffs = [
    { id: 'RECRUIT', label: 'RECRUIT' },
    { id: 'PILOT', label: 'PILOT' },
    { id: 'ACE', label: 'ACE' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <img 
          src="/icons/icon-192.png" 
          alt="Math Blast Logo"
          style={{ 
            width: '80px', height: '80px', borderRadius: '15px', 
            marginBottom: '2rem',
            boxShadow: '0 0 30px var(--neon-cyan)',
            objectFit: 'cover'
          }} 
        />
        
        <h1 className="orbitron" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', letterSpacing: '6px', color: 'var(--neon-cyan)', textShadow: '0 0 20px var(--neon-cyan)', marginBottom: '0.2rem' }}>MATH BLAST</h1>
        <p style={{ fontSize: '1rem', color: 'var(--neon-magenta)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '1rem', opacity: 0.8 }}>Educational Math Shooter</p>
        
        {highScore > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Personal Best</p>
            <p className="orbitron" style={{ fontSize: '1.6rem', color: '#fff' }}>{highScore}</p>
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
              className="neon-btn"
              style={{ 
                minWidth: '300px',
                borderColor: 'var(--neon-magenta)',
                color: 'var(--neon-magenta)',
                boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)',
                marginTop: '0.5rem'
              }}
            >
              INSTALL APP
            </button>
          )}
        </div>

        <div style={{ marginTop: '4rem', opacity: 0.5, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <p>DRAG TO MOVE</p>
            <p>AUTO-FIRE ACTIVE</p>
          </div>
          {!showInstall && (
            <p style={{ opacity: 0.4 }}>If "Install" is missing, use browser menu → "Add to Home Screen"</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default LandingPage
