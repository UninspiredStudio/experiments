import { particleState } from '../../core/state'
import { domElements } from '../../ui/elements'
import { normalizePathForDuration } from './recorder'

const REPLAY_PATH_COLOR = 'rgba(0, 150, 255, 0.8)'
const REPLAY_PATH_WIDTH = 2

export function startReplay(): void {
  if (particleState.normalizedPath.length < 2) {
    return
  }

  particleState.isReplaying = true
  particleState.replayProgress = 0

  const first = particleState.normalizedPath[0]
  particleState.mouse.x = first.x
  particleState.mouse.y = first.y

  domElements.canvas.classList.add('replaying')
}

export function stopReplay(): void {
  if (!particleState.isReplaying) {
    return
  }

  particleState.isReplaying = false
  particleState.replayProgress = 0

  domElements.canvas.classList.remove('replaying')

  particleState.mouse.x = particleState.actualMouse.x
  particleState.mouse.y = particleState.actualMouse.y
}

export function triggerReplay(): void {
  if (
    particleState.isCountingDown ||
    particleState.isRecording ||
    particleState.isReplaying ||
    !particleState.hasRecordedPath
  ) {
    return
  }

  const ok = normalizePathForDuration()
  if (!ok) {
    return
  }

  startReplay()
}

export function updateReplayPath(
  ctx: CanvasRenderingContext2D,
  deltaSeconds: number,
): void {
  if (
    !particleState.isReplaying ||
    particleState.normalizedPath.length < 2 ||
    particleState.calculatedReplaySpeed <= 0 ||
    particleState.totalReplayPathLength <= 0
  ) {
    return
  }

  const path = particleState.normalizedPath

  particleState.replayProgress += particleState.calculatedReplaySpeed * deltaSeconds

  let virtualX = path[0].x
  let virtualY = path[0].y
  let targetIndex = 0
  let currentLength = 0

  for (let i = 1; i < path.length; i += 1) {
    const p1 = path[i - 1]
    const p2 = path[i]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const segmentLength = Math.sqrt(dx * dx + dy * dy)

    if (currentLength + segmentLength >= particleState.replayProgress) {
      targetIndex = i
      break
    }

    currentLength += segmentLength

    if (i === path.length - 1) {
      targetIndex = i
    }
  }

  if (targetIndex > 0) {
    const p1 = path[targetIndex - 1]
    const p2 = path[targetIndex]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const segmentLength = Math.sqrt(dx * dx + dy * dy)
    const lengthIntoSegment = particleState.replayProgress - currentLength

    let fraction = 0
    if (segmentLength > 0) {
      fraction = Math.max(0, Math.min(1, lengthIntoSegment / segmentLength))
    } else if (particleState.replayProgress >= currentLength) {
      fraction = 1
    }

    virtualX = p1.x + dx * fraction
    virtualY = p1.y + dy * fraction
  } else {
    virtualX = path[0].x
    virtualY = path[0].y
  }

  if (particleState.showReplayPath) {
    ctx.strokeStyle = REPLAY_PATH_COLOR
    ctx.lineWidth = REPLAY_PATH_WIDTH
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < targetIndex; i += 1) {
      ctx.lineTo(path[i].x, path[i].y)
    }
    ctx.lineTo(virtualX, virtualY)
    ctx.stroke()
  }

  particleState.mouse.x = virtualX
  particleState.mouse.y = virtualY

  if (particleState.replayProgress >= particleState.totalReplayPathLength) {
    const lastPoint = path[path.length - 1]
    particleState.mouse.x = lastPoint.x
    particleState.mouse.y = lastPoint.y
    stopReplay()
  }
}
