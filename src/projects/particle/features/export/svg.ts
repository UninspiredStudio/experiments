import { particleState } from '../../core/state'
import { domElements } from '../../ui/elements'

function createPathSvgString(): string | null {
  const points =
    particleState.normalizedPath.length > 1
      ? particleState.normalizedPath
      : particleState.recordedPath

  if (!points || points.length < 2) {
    return null
  }

  const width = domElements.canvas.width || 800
  const height = domElements.canvas.height || 600

  const segments: string[] = []
  points.forEach((p, index) => {
    const cmd = index === 0 ? 'M' : 'L'
    segments.push(`${cmd} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
  })

  const d = segments.join(' ')

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

export function downloadPathSvg(): void {
  if (typeof window === 'undefined') {
    return
  }

  const svgString = createPathSvgString()
  if (!svgString) {
    return
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  const baseName = 'particles-path'
  const timestamp = Date.now()

  a.download = `${baseName}_${timestamp}.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export {}
