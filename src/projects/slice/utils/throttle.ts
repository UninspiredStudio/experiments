export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  intervalMs: number,
): T {
  let lastTime = 0

  const wrapped = ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= intervalMs) {
      lastTime = now
      fn(...args)
    }
  }) as T

  return wrapped
}
