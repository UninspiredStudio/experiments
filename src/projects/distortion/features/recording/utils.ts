export function getSupportedMimeType(candidates: string[]): string | null {
  if (!('MediaRecorder' in window)) {return null}

  for (const codec of candidates) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(codec)) {
      return codec
    }
  }

  return null
}
