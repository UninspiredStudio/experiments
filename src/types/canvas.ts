export type CanvasRef = HTMLCanvasElement | null;

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasContextBundle {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}
