import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, LogOut } from 'lucide-react'

function Game({ difficulty, onGameOver, onExit }) {
  const canvasRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const [units, setUnits] = useState(10)
  const [highScore, setHighScore] = useState(localStorage.getItem('mathBlast_highScore') || 0)
  const [isLowEnergy, setIsLowEnergy] = useState(false)

  // Game state refs (to avoid React render loop issues)
  const gameState = useRef({
    units: 10,
    running: true,
    paused: false,
    bullets: [],
    gates: [],
    particles: [],
    hazards: [],
    spawnTimer: 0,
    drainTimer: 0,
    lastTime: 0,
    gameTime: 0,
    screenShake: 0,
    mouseX: 0,
    playerX: 0,
    playerY: 0,
    config: {
      drainRate: 0.1,
      gateSpeed: 3.5,
      spawnInterval: 1800
    }
  })

  // Audio Context ref
  const audioCtx = useRef(null)

  useEffect(() => {
    // Initialize config based on difficulty
    const g = gameState.current
    if (difficulty === 'RECRUIT') {
      g.config = { drainRate: 0.02, gateSpeed: 2.5, spawnInterval: 2000 }
    } else if (difficulty === 'PILOT') {
      g.config = { drainRate: 0.1, gateSpeed: 3.5, spawnInterval: 1800 }
    } else {
      g.config = { drainRate: 0.3, gateSpeed: 5, spawnInterval: 1500 }
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      g.playerX = canvas.width / 2
      g.playerY = canvas.height - 100
    }

    window.addEventListener('resize', resize)
    resize()

    // Classes & Logic
    class Particle {
      constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
      }
      update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
      }
    }

    class Gate {
      constructor(x, y, type, value, width) {
        this.x = x; this.y = y; this.type = type; this.value = value;
        this.width = width; this.height = 80;
        this.speed = g.config.gateSpeed;
        this.active = true;
      }
      draw() {
        let color = this.type === 'sub' ? '#ff4d4d' : '#00f2ff';
        ctx.shadowBlur = 15; ctx.shadowColor = color; ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white'; ctx.font = '700 24px Orbitron'; ctx.textAlign = 'center';
        let symbol = this.type === 'add' ? '+' : this.type === 'sub' ? '-' : 'x';
        ctx.fillText(`${symbol}${this.value}`, this.x + this.width / 2, this.y + this.height / 2 + 10);
        ctx.shadowBlur = 0;
      }
      update() { this.y += this.speed; if (this.y > canvas.height) this.active = false; }
    }

    class Hazard {
      constructor(x, y) {
        this.x = x; this.y = y; this.size = 30; this.speed = g.config.gateSpeed * 1.2;
        this.rotation = 0; this.active = true;
      }
      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff4d4d'; ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2;
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
      }
      update() { this.y += this.speed; this.rotation += 0.05; if (this.y > canvas.height + 50) this.active = false; }
    }

    const playSound = (freq, type = 'square', duration = 0.1, vol = 0.05) => {
      if (!audioCtx.current) return
      const osc = audioCtx.current.createOscillator()
      const gain = audioCtx.current.createGain()
      osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime)
      gain.gain.setValueAtTime(vol, audioCtx.current.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + duration)
      osc.connect(gain); gain.connect(audioCtx.current.destination)
      osc.start(); osc.stop(audioCtx.current.currentTime + duration)
    }

    const spawnGateRow = () => {
      const gateWidth = canvas.width / 3
      for (let i = 0; i < 3; i++) {
        let type = ['add', 'sub', 'mul'][Math.floor(Math.random() * 3)]
        let value = type === 'mul' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 20) + 5
        g.gates.push(new Gate(i * gateWidth, -100, type, value, gateWidth))
      }
      if (Math.random() > 0.6) g.hazards.push(new Hazard(Math.random() * canvas.width, -200))
    }

    const shoot = () => {
      g.bullets.push({ x: g.playerX, y: g.playerY - 20, speed: 12, radius: 4 })
      playSound(440, 'triangle', 0.1, 0.03)
    }

    const autoShootTimer = setInterval(() => {
      if (g.running && !g.paused) shoot()
    }, 350)

    const loop = (timestamp) => {
      if (!g.running) return
      if (g.paused) {
        requestAnimationFrame(loop)
        return
      }

      const dt = timestamp - g.lastTime
      g.lastTime = timestamp
      g.gameTime += dt

      // Drain
      g.drainTimer += dt
      if (g.drainTimer > 100) {
        g.units = Math.max(0, g.units - (g.config.drainRate * 0.1))
        setUnits(Math.floor(g.units))
        setIsLowEnergy(g.units <= 5)
        if (g.units <= 0) {
          g.running = false
          onGameOver(Math.floor(g.units))
        }
        g.drainTimer = 0
      }

      // Draw
      ctx.save()
      if (g.screenShake > 0) {
        ctx.translate((Math.random()-0.5)*g.screenShake, (Math.random()-0.5)*g.screenShake)
        g.screenShake *= 0.9
      }
      ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Spawning
      g.spawnTimer += dt || 16
      if (g.spawnTimer > Math.max(800, g.config.spawnInterval - (g.gameTime/1000))) {
        spawnGateRow(); g.spawnTimer = 0
      }

      // Physics
      g.bullets.forEach((b, i) => {
        b.y -= b.speed
        if (b.y < -20) g.bullets.splice(i, 1)
      })

      g.gates.forEach((gate, i) => {
        gate.update(); gate.draw()
        if (!gate.active) g.gates.splice(i, 1)
        
        // Bullet collision
        g.bullets.forEach((b, bi) => {
          if (gate.active && b.x > gate.x && b.x < gate.x + gate.width && b.y > gate.y && b.y < gate.y + gate.height) {
            applyEffect(gate); gate.active = false; g.bullets.splice(bi, 1)
          }
        })
        // Player collision
        if (gate.active && g.playerX > gate.x && g.playerX < gate.x + gate.width && g.playerY > gate.y && g.playerY < gate.y + gate.height) {
          applyEffect(gate); gate.active = false
        }
      })

      g.hazards.forEach((h, i) => {
        h.update(); h.draw()
        if (!h.active) g.hazards.splice(i, 1)
        if (h.active && Math.abs(g.playerX - h.x) < 40 && Math.abs(g.playerY - h.y) < 40) {
          g.units = Math.max(0, g.units - 15); h.active = false; g.screenShake = 30; playSound(100, 'sawtooth', 0.4, 0.2)
        }
      })

      g.particles.forEach((p, i) => {
        p.update(); p.draw()
        if (p.life <= 0) g.particles.splice(i, 1)
      })

      // Player
      ctx.shadowBlur = 15; ctx.shadowColor = '#00f2ff'; ctx.fillStyle = '#00f2ff';
      ctx.beginPath(); ctx.moveTo(g.playerX, g.playerY - 20); ctx.lineTo(g.playerX - 20, g.playerY + 20); ctx.lineTo(g.playerX + 20, g.playerY + 20); ctx.closePath(); ctx.fill();

      // Bullets
      ctx.fillStyle = '#ff00ff'; g.bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill()
      })

      ctx.restore()
      requestAnimationFrame(loop)
    }

    const applyEffect = (gate) => {
      const prev = g.units
      if (gate.type === 'add') g.units += gate.value
      else if (gate.type === 'sub') g.units -= gate.value
      else if (gate.type === 'mul') g.units *= gate.value
      g.units = Math.max(0, g.units)
      g.screenShake = g.units > prev ? 10 : 20
      playSound(g.units > prev ? 880 : 220, 'square', 0.2)
      for (let i = 0; i < 15; i++) g.particles.push(new Particle(gate.x + gate.width/2, gate.y + gate.height/2, gate.type === 'sub' ? '#ff4d4d' : '#00f2ff'))
    }

    const handleMove = (e) => {
      if (g.paused) return
      const x = e.touches ? e.touches[0].clientX : e.clientX
      g.playerX = x
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove, { passive: false })

    g.lastTime = performance.now()
    requestAnimationFrame(loop)

    return () => {
      g.running = false
      clearInterval(autoShootTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
    }
  }, [difficulty])

  const togglePause = () => {
    const newState = !isPaused
    setIsPaused(newState)
    gameState.current.paused = newState
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      
      {/* HUD */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', pointerEvents: 'none' }}>
        <div className={`orbitron ${isLowEnergy ? 'low-energy' : ''}`} style={{ fontSize: '2rem', color: 'var(--neon-cyan)', textShadow: '0 0 10px var(--neon-cyan)' }}>
          UNITS: {units}
        </div>
        <div style={{ fontSize: '1rem', opacity: 0.7 }}>HIGH SCORE: {highScore}</div>
      </div>

      {/* Pause Button */}
      <button 
        onClick={togglePause}
        style={{ position: 'fixed', top: '20px', right: '20px', background: 'rgba(0,242,255,0.1)', border: '1px solid var(--neon-cyan)', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)', cursor: 'pointer' }}
      >
        {isPaused ? <Play size={24} /> : <Pause size={24} />}
      </button>

      {/* Pause Menu */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          >
            <h2 className="orbitron" style={{ fontSize: '3rem', marginBottom: '2rem', color: 'var(--neon-cyan)' }}>PAUSED</h2>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <button className="neon-btn" onClick={togglePause} style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>RESUME</button>
              <button className="neon-btn" onClick={onExit} style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderColor: 'var(--neon-magenta)', color: 'var(--neon-magenta)' }}>EXIT</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Game
