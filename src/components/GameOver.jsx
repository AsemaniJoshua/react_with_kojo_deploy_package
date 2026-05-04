import { motion } from 'framer-motion'

function GameOver({ score, onRestart, onMenu }) {
  const highScore = localStorage.getItem('mathBlast_highScore') || 0;
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'center', padding: '2rem' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}>
        <h2 className="orbitron" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', color: '#ff0055', textShadow: '0 0 30px #ff0055', marginBottom: '1rem' }}>MISSION END</h2>
        
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2rem 3rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '3rem', minWidth: '300px' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Personal Best</p>
          <p className="orbitron" style={{ fontSize: '2.5rem', color: '#00f2ff', textShadow: '0 0 15px #00f2ff', marginBottom: '1rem' }}>{highScore}</p>
          
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '1.5rem 0' }}></div>
          
          <p style={{ fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Final Score</p>
          <p className="orbitron" style={{ fontSize: '1.8rem', color: '#fff' }}>{score}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="neon-btn" onClick={onRestart} style={{ minWidth: '200px', fontSize: '1.2rem' }}>REDEPLOY</button>
          <button className="neon-btn" onClick={onMenu} style={{ minWidth: '200px', fontSize: '1.2rem', borderColor: '#00f2ff', color: '#00f2ff' }}>MENU</button>
        </div>
      </motion.div>
    </div>
  )
}

export default GameOver
