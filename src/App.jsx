import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import Game from './components/Game'
import GameOver from './components/GameOver'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [screen, setScreen] = useState('landing') // 'landing', 'game', 'gameover'
  const [difficulty, setDifficulty] = useState('PILOT')
  const [lastScore, setLastScore] = useState(0)
  const [showAutoModal, setShowAutoModal] = useState(false)

  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Auto-modal timer (5 seconds)
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('mathBlast_installDismissed')
      if (!dismissed) setShowAutoModal(true)
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer)
    }
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      // If no prompt, we can't trigger native, but we can show instructions
      alert("To install: Open browser menu (⋮) and select 'Add to Home Screen'");
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowAutoModal(false);
    }
  };

  const dismissModal = () => {
    setShowAutoModal(false);
    localStorage.setItem('mathBlast_installDismissed', 'true')
  }

  const startGame = (diff) => {
    setDifficulty(diff)
    setScreen('game')
  }

  const endGame = (score) => {
    setLastScore(score)
    setScreen('gameover')
  }

  const backToMenu = () => {
    setScreen('landing')
  }

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage onStart={startGame} onInstall={handleInstall} showInstall={!!installPrompt} />
          </motion.div>
        )}

        {screen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ height: '100vh', width: '100vw' }}
          >
            <Game difficulty={difficulty} onGameOver={endGame} onExit={backToMenu} />
          </motion.div>
        )}

        {screen === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GameOver score={lastScore} onRestart={() => setScreen('game')} onMenu={backToMenu} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAutoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '2rem' }}
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              style={{ background: '#111', border: '2px solid var(--neon-cyan)', borderRadius: '24px', padding: '3rem', maxWidth: '450px', textAlign: 'center', boxShadow: '0 0 50px rgba(0, 242, 255, 0.3)' }}
            >
              <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))', borderRadius: '15px', margin: '0 auto 2rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'Orbitron', boxShadow: '0 0 20px var(--neon-cyan)' }}>M</div>
              <h3 className="orbitron" style={{ fontSize: '2rem', color: '#fff', marginBottom: '1rem' }}>INSTALL MATH BLAST</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '2.5rem' }}>Experience full-screen gameplay, offline support, and faster loading by adding Math Blast to your home screen.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="neon-btn" onClick={handleInstall} style={{ width: '100%' }}>INSTALL NOW</button>
                <button onClick={dismissModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>NOT NOW</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
