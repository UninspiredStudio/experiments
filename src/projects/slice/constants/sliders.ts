export interface SliderConfigDefinition {
  id: string
  label: string
  min: number
  max: number
  defaultValue: number
  unit?: string
}

/**
 * Placeholder for slice slider definitions.
 * Concrete values will be ported from the legacy HTML + script.
 */
export const SLICE_SLIDERS: Record<string, SliderConfigDefinition> = {}
