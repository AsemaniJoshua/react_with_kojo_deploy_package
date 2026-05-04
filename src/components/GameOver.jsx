import { motion } from 'framer-motion'

function GameOver({ score, onRestart, onMenu }) {
  const highScore = localStorage.getItem('mathBlast_highScore') || 0;
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'center', padding: '2rem' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
        <h2 className="orbitron" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', color: '#ff0055', textShadow: '0 0 20px #ff0055', marginBottom: '0.8rem' }}>MISSION END</h2>
        
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1.5rem 2.5rem', borderRadius: '15px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '2rem', minWidth: '280px' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Personal Best</p>
          <p className="orbitron" style={{ fontSize: '1.8rem', color: '#00f2ff', textShadow: '0 0 10px #00f2ff', marginBottom: '0.8rem' }}>{highScore}</p>
          
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '1rem 0' }}></div>
          
          <p style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Final Score</p>
          <p className="orbitron" style={{ fontSize: '1.4rem', color: '#fff' }}>{score}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="neon-btn" onClick={onRestart} style={{ minWidth: '160px', fontSize: '1rem', padding: '0.8rem 1.5rem' }}>REDEPLOY</button>
          <button className="neon-btn" onClick={onMenu} style={{ minWidth: '160px', fontSize: '1rem', padding: '0.8rem 1.5rem', borderColor: '#00f2ff', color: '#00f2ff' }}>MENU</button>
        </div>
      </motion.div>
    </div>
  )
}

export default GameOver
