// state.js - Manages application state

import { createNoise3D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js';
import { INITIAL_CANVAS_SIZE } from './constants.js';

// Create the noise generator with random seed
export const noise3D = createNoise3D(Math.random);

// Application state object
export const state = {
    // Time and animation
    time: 0,
    timeStep: 0.001, // Will be updated from controls
    
    // Grid parameters
    gridAmount: 10, // Will be updated from controls
    calculatedCellSize: INITIAL_CANVAS_SIZE / 10,
    numCellsX: 10,
    numCellsY: 10,
    
    // Noise and fill
    noiseThreshold: 0.5, // Will be updated from controls
    isSimplified: false, // Will be updated from controls
    
    // Image handling
    cellImages: [], 
    isCellImageLoading: false,
    bgImage: null,
    bgImageForDrawing: null,
    bgPixelData: null,
    bgPixelDataWidth: 0,
    
    // Animation area
    animationAreaMode: 'everywhere',
    
    // Letter cell state
    currentLetters: '',
    letterColor: '#FFFFFF',
    letterBgColor: '#000000',
    
    // Animation sequence state
    isStarting: false,
    isMainLoopActive: false,
    isEnding: false,
    isBackgroundLoopActive: false,
    
    // Animation control
    startAnimationEnabled: false,
    endAnimationEnabled: false,
    startAnimationDuration: 1.0,
    endAnimationDuration: 1.0,
    overallDuration: 5.0,
    
    // Timestamps for sequence control
    startAnimationStartTime: 0,
    mainAnimationStartTime: 0,
    mainAnimationEndTime: 0,
    fadeOutStartTime: 0,
    
    // requestAnimationFrame IDs
    startAnimationFrameId: null,
    animationFrameId: null,
    fadeOutFrameId: null,
    backgroundFrameId: null,
    
    // Fade-out helpers
    initialVisibleCount: 0,
    
    // Cell data map - Stores assigned data for each cell (type and content)
    // Map<`${x},${y}`, { type: 'image' | 'letter', content: Image | string, fg?: string, bg?: string }>
    assignedCellData: new Map(),
    
    // Recording state
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    isSequenceRecording: false,
    mediaStream: null,
    
    // Helper methods
    isSequenceActive() {
        return this.isStarting || this.isMainLoopActive || this.isEnding;
    },
    
    clearAssignedData() {
        this.assignedCellData.clear();
    }
};

// Export separate references to the main objects for convenience
export const assignedCellData = state.assignedCellData; 