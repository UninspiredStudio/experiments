export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Dimension {
  width: number;
  height: number;
}

export interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
}
