import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function LandingPage({ onStart, onInstall, showInstall, isIOS, isStandalone }) {
  const [difficulty, setDifficulty] = useState('PILOT')
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const highScore = localStorage.getItem('mathBlast_highScore') || 0

  const diffs = [
    { id: 'RECRUIT', label: 'RECRUIT' },
    { id: 'PILOT', label: 'PILOT' },
    { id: 'ACE', label: 'ACE' }
  ]

  const handleInstallClick = async () => {
    const success = await onInstall()
    if (!success && isIOS) {
      setShowIOSGuide(true)
    }
  }

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', width: '100vw', textAlign: 'center', padding: '2rem', background: '#0a0a0c' 
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <img src="/icons/icon-192.png" alt="Math Blast" style={{ width: '80px', height: '80px', borderRadius: '15px', marginBottom: '1.5rem', boxShadow: '0 0 30px var(--neon-cyan)', objectFit: 'cover' }} />
        
        <h1 className="orbitron" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', color: 'var(--neon-cyan)', textShadow: '0 0 20px var(--neon-cyan)', marginBottom: '0.2rem', letterSpacing: '4px' }}>MATH BLAST</h1>
        <p style={{ fontSize: '1rem', color: 'var(--neon-magenta)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', opacity: 0.8 }}>Educational Math Shooter</p>
        
        {highScore > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>Personal Best</p>
            <p className="orbitron" style={{ fontSize: '1.6rem', color: '#fff' }}>{highScore}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {diffs.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              style={{
                background: difficulty === d.id ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: difficulty === d.id ? '2px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: difficulty === d.id ? 'var(--neon-cyan)' : 'white',
                padding: '0.6rem 1.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'Orbitron',
                transition: 'all 0.2s ease',
                minWidth: '120px'
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <button className="neon-btn" onClick={() => onStart(difficulty)} style={{ minWidth: '280px' }}>START MISSION</button>
          {!isStandalone && (
            <button className="neon-btn" onClick={handleInstallClick} style={{ minWidth: '280px', borderColor: 'var(--neon-magenta)', color: 'var(--neon-magenta)', fontSize: '1.1rem' }}>INSTALL APP</button>
          )}
        </div>

        <AnimatePresence>
          {showIOSGuide && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '2rem', color: '#fff', fontSize: '0.9rem', maxWidth: '320px' }}>
              <p style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', marginBottom: '0.8rem' }}>iPhone / iPad Installation:</p>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p>1. Tap the <b>Share</b> button <span style={{ fontSize: '1.2rem' }}>⎋</span></p>
                  <p>2. Tap <b>"Add to Home Screen"</b> <span style={{ fontSize: '1.2rem' }}>⊞</span></p>
                </div>
              </div>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', marginTop: '1rem', textDecoration: 'underline' }}>Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '4rem', opacity: 0.4, fontSize: '0.75rem' }}>
          <p>DRAG TO MOVE • AUTO-FIRE ON</p>
        </div>
      </motion.div>
    </div>
  )
}

export default LandingPage
