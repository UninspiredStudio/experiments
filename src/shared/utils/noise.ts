import { createNoise3D } from 'simplex-noise';

export type Noise3DFn = (x: number, y: number, z: number) => number;

export function createNoise3DInstance(): Noise3DFn {
  return createNoise3D();
}

export function createNoise3DFactory(): Noise3DFn {
  return createNoise3DInstance();
}
