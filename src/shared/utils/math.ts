export function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) {
    return outMin;
  }

  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

export function randomBetween(min: number, max: number): number {
  return lerp(min, max, Math.random());
}
