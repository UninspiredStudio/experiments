import { particleState } from '../../core/state'
import { domElements } from '../../ui/elements'
import { PARTICLE_ANIMATION_FPS } from '../../constants/animation'

const REPLAY_TARGET_FPS = PARTICLE_ANIMATION_FPS

export function startPathCountdown(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (
    particleState.isCountingDown ||
    particleState.isRecording ||
    particleState.isReplaying
  ) {
    return
  }

  particleState.isCountingDown = true
  particleState.hasRecordedPath = false
  particleState.originalRecordingDuration = 0
  particleState.countdownValue = 3
  particleState.countdownType = 'path'

  if (domElements.countdownDisplay) {
    domElements.countdownDisplay.textContent = String(particleState.countdownValue)
    domElements.countdownDisplay.style.display = 'block'
  }

  if (particleState.countdownIntervalId !== null) {
    window.clearInterval(particleState.countdownIntervalId)
  }

  const intervalId = window.setInterval(() => {
    particleState.countdownValue -= 1

    if (domElements.countdownDisplay) {
      domElements.countdownDisplay.textContent = String(particleState.countdownValue)
    }

    if (particleState.countdownValue <= 0) {
      window.clearInterval(intervalId)
      particleState.countdownIntervalId = null

      if (domElements.countdownDisplay) {
        domElements.countdownDisplay.style.display = 'none'
      }

      particleState.isCountingDown = false
      particleState.countdownType = null

      startTracking()
    }
  }, 1000)

  particleState.countdownIntervalId = intervalId
}

function startTracking(): void {
  if (typeof window === 'undefined') {
    return
  }

  particleState.isRecording = true
  particleState.recordedPath = []

  const now = performance.now()

  if (particleState.actualMouse.x !== null && particleState.actualMouse.y !== null) {
    particleState.recordedPath.push({
      x: particleState.actualMouse.x,
      y: particleState.actualMouse.y,
      timestamp: now,
    })
  } else {
    particleState.recordedPath.push({
      x: -1,
      y: -1,
      timestamp: now,
    })
  }

  const durationSeconds = parseFloat(domElements.trackingDurationInput.value)
  const trackingDurationMs =
    !Number.isNaN(durationSeconds) && durationSeconds > 0 ? durationSeconds * 1000 : 0

  if (particleState.trackingTimeoutId !== null) {
    window.clearTimeout(particleState.trackingTimeoutId)
  }

  if (trackingDurationMs > 0) {
    const timeoutId = window.setTimeout(() => {
      stopTracking()
    }, trackingDurationMs)
    particleState.trackingTimeoutId = timeoutId
  } else {
    particleState.trackingTimeoutId = null
  }
}

export function stopTracking(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!particleState.isRecording) {
    return
  }

  if (particleState.trackingTimeoutId !== null) {
    window.clearTimeout(particleState.trackingTimeoutId)
    particleState.trackingTimeoutId = null
  }

  particleState.isRecording = false

  if (particleState.actualMouse.x !== null && particleState.actualMouse.y !== null) {
    const now = performance.now()
    const path = particleState.recordedPath
    const lastTimestamp =
      path.length > 0 ? path[path.length - 1].timestamp : now - 1
    let finalTimestamp = now

    if (finalTimestamp <= lastTimestamp) {
      finalTimestamp = lastTimestamp + 0.1
    }

    path.push({
      x: particleState.actualMouse.x,
      y: particleState.actualMouse.y,
      timestamp: finalTimestamp,
    })
  }

  const path = particleState.recordedPath

  if (path.length > 1 && path[0].x === -1) {
    path.shift()
  }

  if (path.length > 1) {
    particleState.hasRecordedPath = true
    particleState.originalRecordingDuration =
      path[path.length - 1].timestamp - path[0].timestamp
  } else {
    particleState.hasRecordedPath = false
    particleState.originalRecordingDuration = 0
  }
}

export function normalizePathForDuration(): boolean {
  const path = particleState.recordedPath

  particleState.normalizedPath = []
  particleState.totalReplayPathLength = 0

  if (!particleState.hasRecordedPath || path.length < 2) {
    return false
  }

  let originalPathLength = 0

  for (let i = 1; i < path.length; i += 1) {
    const p1 = path[i - 1]
    const p2 = path[i]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    originalPathLength += Math.sqrt(dx * dx + dy * dy)
  }

  particleState.totalReplayPathLength = originalPathLength

  if (originalPathLength <= 0) {
    return false
  }

  if (particleState.originalRecordingDuration <= 0) {
    return false
  }

  particleState.calculatedReplaySpeed =
    originalPathLength / (particleState.originalRecordingDuration / 1000)

  const numSteps = Math.max(
    Math.ceil((particleState.originalRecordingDuration / 1000) * REPLAY_TARGET_FPS),
    2,
  )
  const stepLength = originalPathLength / (numSteps - 1)

  const normalized = []
  normalized.push({ ...path[0] })

  let currentLength = 0
  let currentPathIndex = 0

  for (let step = 1; step < numSteps; step += 1) {
    const targetDistance = step * stepLength

    while (currentPathIndex < path.length - 1) {
      const p1 = path[currentPathIndex]
      const p2 = path[currentPathIndex + 1]
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const segmentLength = Math.sqrt(dx * dx + dy * dy)

      if (segmentLength > 0 && currentLength + segmentLength >= targetDistance - 0.001) {
        const remainingDistance = targetDistance - currentLength
        const fraction = remainingDistance / segmentLength
        const interpX = p1.x + dx * fraction
        const interpY = p1.y + dy * fraction

        normalized.push({
          x: interpX,
          y: interpY,
          timestamp: p2.timestamp,
        })
        break
      } else {
        currentLength += segmentLength
        currentPathIndex += 1

        if (currentPathIndex >= path.length - 1) {
          break
        }
      }
    }

    if (currentPathIndex >= path.length - 1 && normalized.length <= step) {
      break
    }
  }

  const lastOriginalPoint = path[path.length - 1]
  const lastNormalizedPoint = normalized[normalized.length - 1]

  if (
    lastNormalizedPoint.x !== lastOriginalPoint.x ||
    lastNormalizedPoint.y !== lastOriginalPoint.y
  ) {
    normalized.push({ ...lastOriginalPoint })
  }

  particleState.normalizedPath = normalized
  return true
}
