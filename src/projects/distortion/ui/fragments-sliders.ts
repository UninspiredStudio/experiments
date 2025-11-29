export function setupCustomSlider(
  slider: HTMLInputElement,
  valueSpan: HTMLElement,
  minValue: string,
  maxValue: string,
  initialValue: number,
  valueParser: (value: number) => number,
  onUpdatePersistent: () => void,
): void {
  let isDragging = false
  const min = Number.parseFloat(minValue)
  const max = Number.parseFloat(maxValue)
  const range = max - min

  valueSpan.textContent = String(initialValue)
  slider.value = String(initialValue)

  slider.addEventListener('input', event => {
    const target = event.target as HTMLInputElement | null
    if (!target) {return}
    const raw = Number.parseFloat(target.value)
    const value = valueParser(raw)
    valueSpan.textContent = String(value)
    onUpdatePersistent()
  })

  slider.addEventListener('mousedown', event => {
    event.preventDefault()
    isDragging = true
    slider.classList.add('dragging')
    updateSliderPosition(event)
  })

  document.addEventListener('mousemove', event => {
    if (!isDragging) {return}
    updateSliderPosition(event)
  })

  document.addEventListener('mouseup', () => {
    if (!isDragging) {return}
    isDragging = false
    slider.classList.remove('dragging')
  })

  slider.addEventListener(
    'touchstart',
    event => {
      event.preventDefault()
      isDragging = true
      slider.classList.add('dragging')
      if (event.touches.length > 0) {
        updateSliderPosition(event.touches[0])
      }
    },
    { passive: false },
  )

  document.addEventListener(
    'touchmove',
    event => {
      if (!isDragging) {return}
      if (event.touches.length > 0) {
        updateSliderPosition(event.touches[0])
      }
    },
    { passive: false },
  )

  document.addEventListener('touchend', () => {
    if (!isDragging) {return}
    isDragging = false
    slider.classList.remove('dragging')
  })

  function updateSliderPosition(event: MouseEvent | Touch): void {
    if (!isDragging) {return}

    const rect = slider.getBoundingClientRect()
    const clientX = 'clientX' in event ? event.clientX : 0
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const rawValue = min + percentage * range
    const value = valueParser(rawValue)

    slider.value = String(value)
    valueSpan.textContent = String(value)
    onUpdatePersistent()
  }
}
