import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, LogOut, Zap, Shield, Target, Award, Wind } from 'lucide-react'

const SECTORS = [
  { name: 'NEON REACH', primary: '#00f2ff', secondary: '#ff00ff', grid: 'rgba(0, 242, 255, 0.05)' },
  { name: 'EMERALD VOID', primary: '#00ff88', secondary: '#f4ff00', grid: 'rgba(0, 255, 136, 0.05)' },
  { name: 'CRIMSON CORE', primary: '#ff0055', secondary: '#00ccff', grid: 'rgba(255, 0, 85, 0.05)' }
]

function Game({ difficulty, onGameOver, onExit }) {
  const canvasRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const [units, setUnits] = useState(10)
  const [highScore, setHighScore] = useState(localStorage.getItem('mathBlast_highScore') || 0)
  const [isLowEnergy, setIsLowEnergy] = useState(false)
  const [sector, setSector] = useState(0)
  const [combo, setCombo] = useState(0)
  const [activePowerups, setActivePowerups] = useState([])

  const gameState = useRef({
    units: 10, running: true, paused: false,
    bullets: [], gates: [], particles: [], stars: [], floatingTexts: [], hazards: [], powerups: [],
    drones: [],
    spawnTimer: 0, drainTimer: 0, lastTime: 0, gameTime: 0, screenShake: 0,
    playerX: window.innerWidth / 2, playerY: window.innerHeight - 100,
    combo: 0, blastMode: false,
    currentSector: 0,
    activeBuffs: { shield: 0, overclock: 0, siphon: 0 },
    config: { drainRate: 0.1, gateSpeed: 3.5, spawnInterval: 1800 }
  })

  const audioCtx = useRef(null)

  useEffect(() => {
    const g = gameState.current
    g.units = 10; g.running = true; g.paused = false; g.lastTime = performance.now()
    
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d')
    try { audioCtx.current = new (window.AudioContext || window.webkitAudioContext)() } catch(e) {}

    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight
      g.playerX = canvas.width / 2; g.playerY = canvas.height - 100
      g.stars = Array.from({ length: 120 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2, speed: Math.random() * 2 + 1 }))
    }
    window.addEventListener('resize', resize); resize()

    const playSound = (freq, type = 'square', duration = 0.1, vol = 0.05) => {
      if (!audioCtx.current || audioCtx.current.state === 'suspended') return
      const osc = audioCtx.current.createOscillator(); const gain = audioCtx.current.createGain()
      osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime)
      gain.gain.setValueAtTime(vol, audioCtx.current.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + duration)
      osc.connect(gain); gain.connect(audioCtx.current.destination); osc.start(); osc.stop(audioCtx.current.currentTime + duration)
    }

    const shoot = () => {
      const count = g.activeBuffs.overclock > 0 ? 3 : 1
      for (let i = 0; i < count; i++) {
        g.bullets.push({ 
          x: g.playerX + (count > 1 ? (i - 1) * 15 : 0), 
          y: g.playerY - 20, 
          speed: 14, 
          radius: g.blastMode ? 6 : 4,
          color: g.blastMode ? '#fff' : SECTORS[g.currentSector].secondary
        })
      }
      playSound(g.blastMode ? 880 : 440, 'triangle', 0.1, 0.02)
    }

    const spawnItems = () => {
      const gateWidth = canvas.width / 3
      for (let i = 0; i < 3; i++) {
        let type = ['add', 'sub', 'mul'][Math.floor(Math.random() * 3)]
        let value = type === 'mul' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 20) + 5
        g.gates.push({ x: i * gateWidth, y: -100, type, value, width: gateWidth, height: 80, active: true })
      }
      if (Math.random() > 0.6) g.hazards.push({ x: Math.random() * canvas.width, y: -200, size: 30, rotation: 0, active: true })
      if (Math.random() > 0.9) {
        const pTypes = ['shield', 'overclock', 'siphon']
        g.powerups.push({ x: Math.random() * canvas.width, y: -150, type: pTypes[Math.floor(Math.random() * 3)], size: 25, active: true })
      }
    }

    const loop = (timestamp) => {
      if (!g.running) return
      if (g.paused) { g.lastTime = timestamp; requestAnimationFrame(loop); return }
      const dt = timestamp - g.lastTime; g.lastTime = timestamp; g.gameTime += dt

      // Sector Logic
      const newSector = Math.min(SECTORS.length - 1, Math.floor(g.gameTime / 60000))
      if (newSector !== g.currentSector) {
        g.currentSector = newSector; setSector(newSector)
        playSound(330, 'sine', 0.5, 0.1)
        g.screenShake = 50
      }

      // Buff Logic
      Object.keys(g.activeBuffs).forEach(key => {
        if (g.activeBuffs[key] > 0) g.activeBuffs[key] -= dt
      })
      setActivePowerups(Object.keys(g.activeBuffs).filter(k => g.activeBuffs[k] > 0))

      // Drain
      if (!g.activeBuffs.siphon || g.activeBuffs.siphon <= 0) {
        g.drainTimer += dt
        if (g.drainTimer > 100) {
          g.units = Math.max(0, g.units - (g.config.drainRate * (1 + g.currentSector * 0.5) * 0.1))
          setUnits(Math.floor(g.units)); setIsLowEnergy(g.units <= 5)
          if (g.units <= 0) { g.running = false; onGameOver(0); return }
          g.drainTimer = 0
        }
      }

      ctx.save(); if (g.screenShake > 0) { ctx.translate((Math.random()-0.5)*g.screenShake, (Math.random()-0.5)*g.screenShake); g.screenShake *= 0.9 }
      ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Starfield
      ctx.fillStyle = SECTORS[g.currentSector].grid; g.stars.forEach(s => {
        s.y += s.speed * (1 + g.currentSector * 0.2); if (s.y > canvas.height) s.y = -10;
        ctx.fillRect(s.x, s.y, s.size, s.size)
      })

      // Spawning
      g.spawnTimer += dt
      if (g.spawnTimer > Math.max(600, (g.config.spawnInterval - (g.gameTime/1500)) / (1 + g.currentSector * 0.2))) {
        spawnItems(); g.spawnTimer = 0
      }

      // Logic: Drones
      const droneCount = Math.min(10, Math.floor(g.units / 20))
      if (g.drones.length !== droneCount) {
        if (g.drones.length < droneCount) g.drones.push({ x: g.playerX, y: g.playerY, offset: Math.random() * Math.PI * 2 })
        else g.drones.pop()
      }
      g.drones.forEach((d, i) => {
        const targetX = g.playerX + Math.cos(g.gameTime/500 + d.offset) * 60
        const targetY = g.playerY + Math.sin(g.gameTime/500 + d.offset) * 40
        d.x += (targetX - d.x) * 0.1; d.y += (targetY - d.y) * 0.1
        ctx.fillStyle = SECTORS[g.currentSector].primary; ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle
        ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, Math.PI * 2); ctx.fill()
      })

      // Logic: Gates
      g.gates.forEach((gate, i) => {
        gate.y += g.config.gateSpeed * (1 + g.currentSector * 0.1); if (gate.y > canvas.height) { g.gates.splice(i, 1); g.combo = 0; setCombo(0); g.blastMode = false; return }
        let color = gate.type === 'sub' ? '#ff4d4d' : SECTORS[g.currentSector].primary
        ctx.shadowBlur = 15; ctx.shadowColor = color; ctx.strokeStyle = color; ctx.lineWidth = 3
        ctx.strokeRect(gate.x + 5, gate.y, gate.width - 10, gate.height)
        ctx.fillStyle = 'white'; ctx.font = '700 24px Orbitron'; ctx.textAlign = 'center'
        let symbol = gate.type === 'add' ? '+' : gate.type === 'sub' ? '-' : 'x'
        ctx.fillText(`${symbol}${gate.value}`, gate.x + gate.width / 2, gate.y + gate.height / 2 + 10)
        
        g.bullets.forEach((b, bi) => {
          if (b.x > gate.x && b.x < gate.x + gate.width && b.y > gate.y && b.y < gate.y + gate.height) {
            applyGateEffect(gate); g.gates.splice(i, 1); g.bullets.splice(bi, 1)
          }
        })
        if (Math.abs(g.playerX - (gate.x + gate.width/2)) < gate.width/2 && Math.abs(g.playerY - (gate.y + gate.height/2)) < 40) {
          applyGateEffect(gate); g.gates.splice(i, 1)
        }
      })

      // Logic: Hazards
      g.hazards.forEach((h, i) => {
        h.y += g.config.gateSpeed * 1.3; h.rotation += 0.05
        if (h.y > canvas.height + 50) { g.hazards.splice(i, 1); return }
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rotation); ctx.shadowBlur = 15; ctx.shadowColor = '#ff4d4d'; ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2; ctx.strokeRect(-h.size/2, -h.size/2, h.size, h.size); ctx.restore()
        if (Math.abs(g.playerX - h.x) < 40 && Math.abs(g.playerY - h.y) < 40) {
          if (g.activeBuffs.shield > 0) { g.activeBuffs.shield = 0; g.hazards.splice(i, 1); playSound(880, 'sine', 0.3) }
          else { g.units = Math.max(0, g.units - 20); g.hazards.splice(i, 1); g.screenShake = 30; playSound(100, 'sawtooth', 0.4); g.combo = 0; setCombo(0); g.blastMode = false }
        }
      })

      // Logic: Powerups
      g.powerups.forEach((p, i) => {
        p.y += g.config.gateSpeed; if (p.y > canvas.height + 50) { g.powerups.splice(i, 1); return }
        ctx.shadowBlur = 20; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#000'; ctx.font = '700 12px Orbitron'; ctx.fillText(p.type[0].toUpperCase(), p.x, p.y + 5)
        if (Math.abs(g.playerX - p.x) < 40 && Math.abs(g.playerY - p.y) < 40) {
          g.activeBuffs[p.type] = 10000; g.powerups.splice(i, 1); playSound(1200, 'sine', 0.2, 0.1)
        }
      })

      // Logic: Bullets & Particles
      g.bullets.forEach((b, i) => { b.y -= b.speed; if (b.y < -20) g.bullets.splice(i, 1); ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill() })
      g.particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= p.decay; if (p.life <= 0) { g.particles.splice(i, 1); return }; ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1.0 })
      g.floatingTexts.forEach((t, i) => { t.y -= 2; t.life -= 0.02; if (t.life <= 0) { g.floatingTexts.splice(i, 1); return }; ctx.globalAlpha = t.life; ctx.fillStyle = t.color; ctx.font = '700 20px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y); ctx.globalAlpha = 1.0 })

      // Player
      if (g.activeBuffs.shield > 0) { ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.playerX, g.playerY, 50, 0, Math.PI*2); ctx.stroke() }
      ctx.shadowBlur = 20; ctx.shadowColor = SECTORS[g.currentSector].primary; ctx.fillStyle = ctx.shadowColor
      ctx.beginPath(); ctx.moveTo(g.playerX, g.playerY - 30); ctx.lineTo(g.playerX - 25, g.playerY + 15); ctx.lineTo(g.playerX, g.playerY + 5); ctx.lineTo(g.playerX + 25, g.playerY + 15); ctx.closePath(); ctx.fill()

      ctx.restore(); requestAnimationFrame(loop)
    }

    const applyGateEffect = (gate) => {
      const prev = g.units
      if (gate.type === 'add') g.units += gate.value
      else if (gate.type === 'sub') g.units -= gate.value
      else if (gate.type === 'mul') g.units *= gate.value
      g.units = Math.max(0, g.units); g.screenShake = g.units > prev ? 10 : 20; playSound(g.units > prev ? 880 : 220, 'square')
      
      if (g.units > prev) {
        g.combo++; setCombo(g.combo)
        if (g.combo >= 5) { g.blastMode = true; playSound(1500, 'sine', 0.4) }
      } else {
        g.combo = 0; setCombo(0); g.blastMode = false
      }

      g.floatingTexts.push({ x: gate.x + gate.width/2, y: gate.y, text: `${gate.type === 'add' ? '+' : gate.type === 'sub' ? '-' : 'x'}${gate.value}`, color: g.units > prev ? '#00f2ff' : '#ff4d4d', life: 1.0 })
      for (let i = 0; i < 15; i++) g.particles.push({ x: gate.x + gate.width/2, y: gate.y + gate.height/2, color: gate.type === 'sub' ? '#ff4d4d' : SECTORS[g.currentSector].primary, size: Math.random()*5+2, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 1.0, decay: Math.random()*0.05 + 0.02 })
    }

    const handleMove = (e) => { if (g.paused || !g.running) return; g.playerX = e.touches ? e.touches[0].clientX : e.clientX }
    const autoShoot = setInterval(() => { if (g.running && !g.paused) shoot() }, 350)
    window.addEventListener('mousemove', handleMove); window.addEventListener('touchmove', handleMove, { passive: false })
    requestAnimationFrame(loop)
    return () => { g.running = false; clearInterval(autoShoot); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMove); window.removeEventListener('touchmove', handleMove) }
  }, [difficulty])

  const togglePause = () => { const newState = !isPaused; setIsPaused(newState); gameState.current.paused = newState; if (!newState && audioCtx.current) audioCtx.current.resume() }

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', background: '#0a0a0c' }} />
      
      {/* HUD */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', pointerEvents: 'none', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: SECTORS[sector].primary, textShadow: `0 0 10px ${SECTORS[sector].primary}` }}>
          <Wind size={24} />
          <span className="orbitron" style={{ fontSize: '1.2rem', opacity: 0.8 }}>SECTOR: {SECTORS[sector].name}</span>
        </div>
        <div className={`orbitron ${isLowEnergy ? 'low-energy' : ''}`} style={{ fontSize: '3rem', color: SECTORS[sector].primary, textShadow: `0 0 15px ${SECTORS[sector].primary}`, fontWeight: 'bold' }}>
          UNITS: {Math.floor(units)}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          {combo > 0 && <div className="orbitron" style={{ color: combo >= 5 ? '#fff' : SECTORS[sector].secondary, textShadow: '0 0 10px currentColor' }}>COMBO x{combo} {combo >= 5 && ' - BLAST MODE!'}</div>}
        </div>
      </div>

      {/* Buff HUD */}
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', display: 'flex', gap: '1rem', zIndex: 10 }}>
        {activePowerups.map(buff => (
          <div key={buff} style={{ background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '10px', border: `1px solid ${SECTORS[sector].primary}`, display: 'flex', alignItems: 'center', gap: '0.5rem', color: SECTORS[sector].primary }}>
            {buff === 'shield' && <Shield size={16} />}
            {buff === 'overclock' && <Zap size={16} />}
            {buff === 'siphon' && <Award size={16} />}
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{buff}</span>
          </div>
        ))}
      </div>

      <button onClick={togglePause} style={{ position: 'fixed', top: '20px', right: '20px', background: 'rgba(0,242,255,0.1)', border: `2px solid ${SECTORS[sector].primary}`, borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SECTORS[sector].primary, cursor: 'pointer', zIndex: 10, boxShadow: `0 0 15px ${SECTORS[sector].primary}` }}>
        {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
      </button>

      <AnimatePresence>
        {isPaused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <h2 className="orbitron" style={{ fontSize: '4rem', marginBottom: '3rem', color: SECTORS[sector].primary, textShadow: `0 0 30px ${SECTORS[sector].primary}` }}>SYSTEM PAUSED</h2>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <button className="neon-btn" onClick={togglePause} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Play size={24} /> RESUME</button>
              <button className="neon-btn" onClick={onExit} style={{ borderColor: 'var(--neon-magenta)', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LogOut size={24} /> EXIT</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Game
