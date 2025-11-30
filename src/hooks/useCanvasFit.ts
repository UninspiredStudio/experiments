import { useEffect } from 'react'
import type { RefObject } from 'react'

import { fitCanvasToContainer } from '@/utils/fitCanvasToContainer'

export function useCanvasFit(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const apply = () => {
      fitCanvasToContainer(canvasRef.current, containerRef.current)
    }

    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [canvasRef, containerRef])
}
