export interface SliceConfig {
  // Slider and toggle configuration for the slice experiment.
  // This will be populated during the migration from the legacy script.
  initialTargetFps: number
  initialJaggednessAmplitude: number
  initialJaggednessFrequency: number
  initialMaxRotation: number
  initialSliceGapBase: number
  initialGapVariability: number
  initialLineProbability: number
  initialMaxLineWidth: number
  initialVDisplacementMax: number
  initialLineGapBase: number
  initialLineGapVariability: number
}
