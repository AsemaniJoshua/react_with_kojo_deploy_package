import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import Game from './components/Game'
import GameOver from './components/GameOver'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [screen, setScreen] = useState('landing') // 'landing', 'game', 'gameover'
  const [difficulty, setDifficulty] = useState('PILOT')
  const [lastScore, setLastScore] = useState(0)

  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

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
    </div>
  )
}

export default App
