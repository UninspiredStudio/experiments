// constants.js - Configuration constants for the application

export const INITIAL_CANVAS_SIZE = 1000;
export const MAX_INTERNAL_RESOLUTION = 2000;
export const OVERLAP_FIX = 1.1; // Slightly larger fill to avoid gaps
export const BG_BRIGHTNESS_THRESHOLD = 128;
export const END_THRESHOLD_PERCENT = 0.01;
export const ACCELERATION_FACTOR = 2;
export const START_ACCELERATION_FACTOR = 1;
export const RECORDING_FRAMERATE = 30;
export const RECORDING_MIME_TYPE = 'video/mp4';
export const RECORDING_VIDEO_BITRATE = 9000000; // 9 Mbps
export const DEFAULT_LETTER_COLOR = '#FFFFFF';
export const DEFAULT_LETTER_BG_COLOR = '#000000';
export const IMAGE_VS_LETTER_PROBABILITY = 0.5; // 0.5 = 50% chance of showing image if both available

// Noise frequency parameters
export const BASE_FREQ = 0.008;
export const FREQ_AMPLITUDE = 0.004;
export const FREQ_OSC_FREQ = 0.1;
export const MIN_FREQ = 0.001;
export const SIMPLIFY_FACTOR = 0.25; 