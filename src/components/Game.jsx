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
  const [sectorIndex, setSectorIndex] = useState(0)
  const [combo, setCombo] = useState(0)
  const [activePowerups, setActivePowerups] = useState([])

  const gameState = useRef({
    units: 10, running: false, paused: false,
    bullets: [], gates: [], particles: [], stars: [], floatingTexts: [], hazards: [], powerups: [], drones: [],
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
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Safety Reset
    const loopState = { active: true }
    g.units = 10; g.running = true; g.paused = false; g.lastTime = 0; g.gameTime = 0
    g.spawnTimer = 5000; // Force immediate spawn on first loop
    g.drainTimer = 0
    g.bullets = []; g.gates = []; g.particles = []; g.hazards = []; g.powerups = []; g.floatingTexts = []; g.drones = []
    g.currentSector = 0; setSectorIndex(0); g.combo = 0; setCombo(0); g.blastMode = false
    g.activeBuffs = { shield: 0, overclock: 0, siphon: 0 }

    if (difficulty === 'RECRUIT') g.config = { drainRate: 0.02, gateSpeed: 2.8, spawnInterval: 1800 }
    else if (difficulty === 'PILOT') g.config = { drainRate: 0.1, gateSpeed: 3.8, spawnInterval: 1600 }
    else g.config = { drainRate: 0.3, gateSpeed: 5.2, spawnInterval: 1400 }

    try { audioCtx.current = new (window.AudioContext || window.webkitAudioContext)() } catch(e) {}

    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight
      g.playerX = canvas.width / 2; g.playerY = canvas.height - 100
      g.stars = Array.from({ length: 100 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2, speed: Math.random() * 2 + 1 }))
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
          x: g.playerX + (count > 1 ? (i - 1) * 20 : 0), 
          y: g.playerY - 30, 
          speed: 16, 
          radius: g.blastMode ? 10 : 6,
          color: g.blastMode ? '#fff' : SECTORS[g.currentSector].primary
        })
      }
      playSound(g.blastMode ? 880 : 440, 'triangle', 0.1, 0.02)
    }

    const spawnItems = () => {
      const w = window.innerWidth; const gateWidth = w / 3
      // Spawn Gates
      for (let i = 0; i < 3; i++) {
        const type = ['add', 'sub', 'mul'][Math.floor(Math.random() * 3)]
        const value = type === 'mul' ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 20) + 5
        g.gates.push({ x: i * gateWidth, y: -100, type, value, width: gateWidth, height: 80, collected: false })
      }
      // Random Hazards
      if (Math.random() > 0.5) g.hazards.push({ x: Math.random() * w, y: -200, size: 30, rotation: 0 })
      // Random Powerups
      if (Math.random() > 0.9) {
        const types = ['shield', 'overclock', 'siphon']
        g.powerups.push({ x: Math.random() * w, y: -150, type: types[Math.floor(Math.random() * 3)], size: 25 })
      }
    }

    const checkGameOver = () => {
      if (g.units <= 0) { g.units = 0; g.running = false; onGameOver(0); return true }
      return false
    }

    const applyGateEffect = (gate) => {
      const prev = g.units
      if (gate.type === 'add') g.units += gate.value
      else if (gate.type === 'sub') g.units -= gate.value
      else if (gate.type === 'mul') g.units *= gate.value
      g.units = Math.max(0, g.units); g.screenShake = g.units > prev ? 12 : 25; playSound(g.units > prev ? 880 : 220, 'square')
      if (g.units > highScore) { setHighScore(Math.floor(g.units)); localStorage.setItem('mathBlast_highScore', Math.floor(g.units)) }
      if (g.units > prev) { g.combo++; setCombo(g.combo); if (g.combo >= 5) { g.blastMode = true; playSound(1400, 'sine', 0.4) } }
      else { g.combo = 0; setCombo(0); g.blastMode = false }
      checkGameOver()
      g.floatingTexts.push({ x: gate.x + gate.width/2, y: gate.y, text: `${gate.type === 'add' ? '+' : gate.type === 'sub' ? '-' : 'x'}${gate.value}`, color: g.units > prev ? SECTORS[g.currentSector].primary : '#ff4d4d', life: 1.0 })
      for (let i = 0; i < 15; i++) g.particles.push({ x: gate.x + gate.width/2, y: gate.y + gate.height/2, color: g.units > prev ? SECTORS[g.currentSector].primary : '#ff4d4d', size: Math.random()*5+2, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 1.0, decay: Math.random()*0.04 + 0.02 })
    }

    const loop = (timestamp) => {
      if (!g.running || !loopState.active) return
      if (g.paused) { g.lastTime = timestamp; requestAnimationFrame(loop); return }
      const dt = g.lastTime ? timestamp - g.lastTime : 16
      g.lastTime = timestamp; g.gameTime += dt

      // Sector & Difficulty Updates
      const nextSec = Math.min(SECTORS.length - 1, Math.floor(g.gameTime / 60000))
      if (nextSec !== g.currentSector) { g.currentSector = nextSec; setSectorIndex(nextSec); g.screenShake = 40; playSound(330, 'sine', 0.6) }

      // Buffs & HUD
      Object.keys(g.activeBuffs).forEach(k => { if (g.activeBuffs[k] > 0) g.activeBuffs[k] -= dt })
      const activeKeys = Object.keys(g.activeBuffs).filter(k => g.activeBuffs[k] > 0)
      if (activeKeys.length !== activePowerups.length) setActivePowerups(activeKeys)

      // Drain Logic
      if (g.activeBuffs.siphon <= 0) {
        g.drainTimer += dt
        if (g.drainTimer > 100) {
          g.units = Math.max(0, g.units - (g.config.drainRate * (1 + g.currentSector * 0.5) * 0.1))
          setUnits(Math.floor(g.units)); setIsLowEnergy(g.units <= 5)
          if (checkGameOver()) return
          g.drainTimer = 0
        }
      }

      // Render
      ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      if (g.screenShake > 0) { ctx.translate((Math.random()-0.5)*g.screenShake, (Math.random()-0.5)*g.screenShake); g.screenShake *= 0.9 }

      // Stars
      ctx.fillStyle = SECTORS[g.currentSector].grid; g.stars.forEach(s => {
        s.y += s.speed * (1 + g.currentSector * 0.3); if (s.y > canvas.height) s.y = -10;
        ctx.fillRect(s.x, s.y, s.size, s.size)
      })

      // Spawning
      g.spawnTimer += dt
      const currentInterval = Math.max(600, (g.config.spawnInterval - (g.gameTime/1500)) / (1 + g.currentSector * 0.2))
      if (g.spawnTimer > currentInterval) { spawnItems(); g.spawnTimer = 0 }

      // Drones
      const droneCount = Math.min(12, Math.floor(g.units / 15))
      while (g.drones.length < droneCount) g.drones.push({ x: g.playerX, y: g.playerY, offset: Math.random() * Math.PI * 2 })
      while (g.drones.length > droneCount) g.drones.pop()
      g.drones.forEach(d => {
        const tx = g.playerX + Math.cos(g.gameTime/600 + d.offset) * 70
        const ty = g.playerY + Math.sin(g.gameTime/600 + d.offset) * 50
        d.x += (tx - d.x) * 0.12; d.y += (ty - d.y) * 0.12
        ctx.fillStyle = SECTORS[g.currentSector].primary; ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle
        ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, Math.PI * 2); ctx.fill()
      })

      // Gates
      for (let i = g.gates.length - 1; i >= 0; i--) {
        const gate = g.gates[i]; gate.y += g.config.gateSpeed * (1 + g.currentSector * 0.15)
        if (gate.y > canvas.height) { if (!gate.collected) { g.combo = 0; setCombo(0); g.blastMode = false }; g.gates.splice(i, 1); continue }
        
        let color = gate.type === 'sub' ? '#ff4d4d' : SECTORS[g.currentSector].primary
        ctx.shadowBlur = 15; ctx.shadowColor = color; ctx.strokeStyle = color; ctx.lineWidth = 4
        ctx.strokeRect(gate.x + 10, gate.y, gate.width - 20, gate.height)
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Orbitron'; ctx.textAlign = 'center'
        const label = (gate.type === 'add' ? '+' : gate.type === 'sub' ? '-' : 'x') + gate.value
        ctx.fillText(label, gate.x + gate.width/2, gate.y + gate.height/2 + 10)
        
        let hit = false
        for (let bi = g.bullets.length - 1; bi >= 0; bi--) {
          const b = g.bullets[bi]
          if (b.x > gate.x && b.x < gate.x + gate.width && b.y > gate.y && b.y < gate.y + gate.height) {
            gate.collected = true; applyGateEffect(gate); g.gates.splice(i, 1); g.bullets.splice(bi, 1); hit = true; break
          }
        }
        if (hit) continue
        if (Math.abs(g.playerX - (gate.x + gate.width/2)) < gate.width/2 && Math.abs(g.playerY - (gate.y + gate.height/2)) < 45) {
          gate.collected = true; applyGateEffect(gate); g.gates.splice(i, 1)
        }
      }

      // Hazards & Powerups
      for (let i = g.hazards.length - 1; i >= 0; i--) {
        const h = g.hazards[i]; h.y += g.config.gateSpeed * 1.3; h.rotation += 0.1
        if (h.y > canvas.height + 50) { g.hazards.splice(i, 1); continue }
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rotation); ctx.shadowBlur = 15; ctx.shadowColor = '#ff4d4d'; ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 3; ctx.strokeRect(-15, -15, 30, 30); ctx.restore()
        if (Math.abs(g.playerX - h.x) < 45 && Math.abs(g.playerY - h.y) < 45) {
          if (g.activeBuffs.shield > 0) { g.activeBuffs.shield = 0; g.hazards.splice(i, 1); playSound(800, 'sine', 0.4); g.screenShake = 15 }
          else { g.units = Math.max(0, g.units - 25); g.hazards.splice(i, 1); g.screenShake = 35; playSound(100, 'sawtooth', 0.4); g.combo = 0; setCombo(0); g.blastMode = false; checkGameOver() }
        }
      }
      for (let i = g.powerups.length - 1; i >= 0; i--) {
        const p = g.powerups[i]; p.y += g.config.gateSpeed; if (p.y > canvas.height + 50) { g.powerups.splice(i, 1); continue }
        ctx.shadowBlur = 20; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 25, 0, Math.PI*2); ctx.fill()
        ctx.fillStyle = '#000'; ctx.font = 'bold 16px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(p.type[0].toUpperCase(), p.x, p.y + 6)
        if (Math.abs(g.playerX - p.x) < 45 && Math.abs(g.playerY - p.y) < 45) { g.activeBuffs[p.type] = 10000; g.powerups.splice(i, 1); playSound(1200, 'sine', 0.3) }
      }

      // FX & Ship
      for (let i = g.bullets.length - 1; i >= 0; i--) { const b = g.bullets[i]; b.y -= b.speed; if (b.y < -20) g.bullets.splice(i, 1); else { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill() } }
      for (let i = g.particles.length - 1; i >= 0; i--) { const p = g.particles[i]; p.x += p.vx; p.y += p.vy; p.life -= p.decay; if (p.life <= 0) g.particles.splice(i, 1); else { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1.0 } }
      for (let i = g.floatingTexts.length - 1; i >= 0; i--) { const t = g.floatingTexts[i]; t.y -= 2; t.life -= 0.02; if (t.life <= 0) g.floatingTexts.splice(i, 1); else { ctx.globalAlpha = t.life; ctx.fillStyle = t.color; ctx.font = 'bold 22px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y); ctx.globalAlpha = 1.0 } }
      
      if (g.activeBuffs.shield > 0) { ctx.shadowBlur = 20; ctx.shadowColor = '#00f2ff'; ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.playerX, g.playerY, 55, 0, Math.PI*2); ctx.stroke() }
      ctx.shadowBlur = 25; ctx.shadowColor = SECTORS[g.currentSector].primary; ctx.fillStyle = ctx.shadowColor; ctx.beginPath(); ctx.moveTo(g.playerX, g.playerY - 35); ctx.lineTo(g.playerX - 28, g.playerY + 18); ctx.lineTo(g.playerX, g.playerY + 8); ctx.lineTo(g.playerX + 28, g.playerY + 18); ctx.closePath(); ctx.fill()
      
      ctx.restore(); requestAnimationFrame(loop)
    }

    const handleMove = (e) => { 
      if (g.paused || !g.running) return
      if (audioCtx.current && audioCtx.current.state === 'suspended') audioCtx.current.resume()
      const x = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : (e.clientX || g.playerX)
      g.playerX = x
    }
    const autoShoot = setInterval(() => { if (g.running && !g.paused) shoot() }, 350)
    window.addEventListener('mousemove', handleMove); window.addEventListener('touchmove', handleMove, { passive: false })
    requestAnimationFrame(loop)
    return () => { loopState.active = false; g.running = false; clearInterval(autoShoot); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMove); window.removeEventListener('touchmove', handleMove) }
  }, [difficulty])

  const togglePause = () => { const n = !isPaused; setIsPaused(n); gameState.current.paused = n; if (!n && audioCtx.current) audioCtx.current.resume() }

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a0c' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {/* HUD */}
      <div style={{ position: 'fixed', top: '25px', left: '25px', pointerEvents: 'none', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: SECTORS[sectorIndex].primary, textShadow: `0 0 12px ${SECTORS[sectorIndex].primary}`, marginBottom: '0.5rem' }}>
          <Wind size={26} />
          <span className="orbitron" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{SECTORS[sectorIndex].name}</span>
        </div>
        <div className={`orbitron ${isLowEnergy ? 'low-energy' : ''}`} style={{ fontSize: '3.5rem', color: SECTORS[sectorIndex].primary, textShadow: `0 0 20px ${SECTORS[sectorIndex].primary}`, fontWeight: '900', lineHeight: 1 }}>
          UNITS: {Math.floor(units)}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <AnimatePresence>
            {combo > 0 && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="orbitron" style={{ color: combo >= 5 ? '#fff' : SECTORS[sectorIndex].secondary, textShadow: '0 0 12px currentColor', fontSize: '1.2rem' }}>
                COMBO x{combo} {combo >= 5 && ' — OVERDRIVE ACTIVATED'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: '30px', left: '30px', display: 'flex', gap: '1.2rem', zIndex: 20 }}>
        {activePowerups.map(buff => (
          <motion.div key={buff} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'rgba(0,0,0,0.6)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: `2px solid ${SECTORS[sectorIndex].primary}`, display: 'flex', alignItems: 'center', gap: '0.8rem', color: SECTORS[sectorIndex].primary, boxShadow: `0 0 15px ${SECTORS[sectorIndex].primary}44` }}>
            {buff === 'shield' && <Shield size={18} />}
            {buff === 'overclock' && <Zap size={18} />}
            {buff === 'siphon' && <Award size={18} />}
            <span className="orbitron" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{buff}</span>
          </motion.div>
        ))}
      </div>
      <button onClick={togglePause} style={{ position: 'fixed', top: '25px', right: '25px', background: 'rgba(0,0,0,0.4)', border: `3px solid ${SECTORS[sectorIndex].primary}`, borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SECTORS[sectorIndex].primary, cursor: 'pointer', zIndex: 30, boxShadow: `0 0 20px ${SECTORS[sectorIndex].primary}66` }}>
        {isPaused ? <Play size={36} fill="currentColor" /> : <Pause size={36} fill="currentColor" />}
      </button>
      <AnimatePresence>
        {isPaused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,7,0.9)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.h2 initial={{ y: -50 }} animate={{ y: 0 }} className="orbitron" style={{ fontSize: '5rem', marginBottom: '4rem', color: SECTORS[sectorIndex].primary, textShadow: `0 0 40px ${SECTORS[sectorIndex].primary}` }}>HALTED</motion.h2>
            <div style={{ display: 'flex', gap: '3rem' }}>
              <button className="neon-btn" onClick={togglePause} style={{ minWidth: '220px' }}>RESUME</button>
              <button className="neon-btn" onClick={onExit} style={{ minWidth: '220px', borderColor: '#ff00ff', color: '#ff00ff' }}>ABORT</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Game
