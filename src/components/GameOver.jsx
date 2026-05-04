function GameOver({ score, onRestart, onMenu }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'center' }}>
      <h2 className="orbitron" style={{ fontSize: '4rem', color: 'var(--neon-magenta)', textShadow: '0 0 20px var(--neon-magenta)', marginBottom: '2rem' }}>MISSION END</h2>
      <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Units Lost.</p>
      <p style={{ fontSize: '1.2rem', opacity: 0.6, marginBottom: '2rem' }}>Session Performance: {score} Units</p>
      
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button className="neon-btn" onClick={onRestart} style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>RETRY</button>
        <button className="neon-btn" onClick={onMenu} style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}>MENU</button>
      </div>
    </div>
  )
}

export default GameOver
