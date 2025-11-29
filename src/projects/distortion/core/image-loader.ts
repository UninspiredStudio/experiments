export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const toError = (error: unknown): Error =>
    error instanceof Error ? error : new Error(String(error))

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = event => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = error => reject(toError(error))
      img.src = (event.target?.result ?? '') as string
    }

    reader.onerror = error => reject(toError(error))
    reader.readAsDataURL(file)
  })
}

export function coordsFromMouse(canvas: HTMLCanvasElement, event: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY
  return { x, y }
}
