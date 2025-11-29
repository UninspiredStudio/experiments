import { particleState } from './state'
import type { Particle, ParticleDefinition } from '../types/particle'

const PARTICLE_RETURN_THRESHOLD = 0.05
const PARTICLE_DRIFT_THRESHOLD = 10
const PARTICLE_DRIFT_SPEED = 0.4

function getRandomCharacter(): string {
  const chars = particleState.particleCharacter
  if (chars && chars.length > 0) {
    const index = Math.floor(Math.random() * chars.length)
    return chars.charAt(index)
  }
  return '★'
}

function applyMouseInteraction(particle: Particle): void {
  const mouse = particleState.mouse
  if (mouse.x === null || mouse.y === null) {
    particle.isRepelled = false
    return
  }

  const dx = mouse.x - particle.x
  const dy = mouse.y - particle.y
  const distanceSq = dx * dx + dy * dy
  const radiusSq = mouse.radius * mouse.radius

  if (distanceSq < radiusSq && distanceSq > 0.1) {
    const distance = Math.sqrt(distanceSq)
    const forceDirectionX = dx / distance
    const forceDirectionY = dy / distance
    const maxDistance = mouse.radius
    const force = (maxDistance - distance) / maxDistance
    const effectFactor = 1 / (particleState.mouseEffectSpeedFactor / 10)
    const moveX = forceDirectionX * force * particle.density * effectFactor
    const moveY = forceDirectionY * force * particle.density * effectFactor

    if (particleState.interactionMode === 'repel') {
      particle.x -= moveX
      particle.y -= moveY
    } else {
      particle.x += moveX
      particle.y += moveY
    }
    particle.isRepelled = true
  } else {
    particle.isRepelled = false
  }
}

function applyReturnForce(particle: Particle): void {
  if (particle.isRepelled) {
    return
  }

  const returnDx = particle.initialX - particle.x
  const returnDy = particle.initialY - particle.y
  const distanceSq = returnDx * returnDx + returnDy * returnDy

  if (distanceSq > PARTICLE_RETURN_THRESHOLD * PARTICLE_RETURN_THRESHOLD) {
    const moveX = returnDx / particleState.mouseEffectSpeedFactor
    const moveY = returnDy / particleState.mouseEffectSpeedFactor
    particle.x += moveX
    particle.y += moveY
  } else {
    particle.x = particle.initialX
    particle.y = particle.initialY
  }
}

function applyDrift(particle: Particle): void {
  if (particle.isRepelled) {
    return
  }

  const driftDx = particle.initialX - particle.x
  const driftDy = particle.initialY - particle.y
  const distanceFromInitial = Math.sqrt(driftDx * driftDx + driftDy * driftDy)

  if (distanceFromInitial > PARTICLE_DRIFT_THRESHOLD) {
    particle.x += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED
    particle.y += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  if (particle.currentAlpha <= 0) {
    return
  }

  const size = particleState.particleSize * particle.currentAlpha
  if (size <= 0) {
    return
  }

  const r = Math.round(particle.color.r)
  const g = Math.round(particle.color.g)
  const b = Math.round(particle.color.b)
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.currentAlpha})`

  if (particleState.particleShape === 'circle') {
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()
  } else if (particleState.particleShape === 'square') {
    ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size)
  } else if (particleState.particleShape === 'character') {
    ctx.save()
    ctx.font = `${size * 16}px ${particleState.particleFont}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(particle.assignedCharacter, particle.x, particle.y)
    ctx.restore()
  }
}

export function createParticleFromDefinition(def: ParticleDefinition): Particle {
  const density = Math.random() * 20 + 5

  const base: Omit<Particle, 'update' | 'draw'> = {
    x: def.initialX,
    y: def.initialY,
    initialX: def.initialX,
    initialY: def.initialY,
    color: { ...def.color },
    density,
    currentAlpha: 1,
    isRepelled: false,
    assignedCharacter: getRandomCharacter(),
  }

  const particle: Particle = {
    ...base,
    update() {
      applyMouseInteraction(particle)
      applyReturnForce(particle)
      applyDrift(particle)
    },
    draw(ctx: CanvasRenderingContext2D) {
      drawParticle(ctx, particle)
    },
  }

  return particle
}

export function updateParticleCharacters(): void {
  for (const particle of particleState.particles) {
    particle.assignedCharacter = getRandomCharacter()
  }
}

