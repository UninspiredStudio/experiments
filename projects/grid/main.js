// main.js - Main application entry point
import { ui, initializeUIListeners, applyInitialUIValues, setDependencies } from './modules/ui.js';
import { initializeCanvas, updateGridParams } from './modules/canvas.js';
import { startBackgroundAnimation, setCompleteSequenceFunction, startIntroAnimation, animate, stopAllAnimations } from './modules/animation.js';
import { completeSequence, setAnimationFunctions, handleStartSequence, handleRestart, handleStartRecording, handleStopRecording } from './modules/recording.js';
import { handleBgUpload, handleCellImgUpload, setUpdateGridParamsFunction, loadDefaultImages, initializeDeleteListeners } from './modules/imageHandling.js';

/**
 * Initialize the application
 */
function initialize() {
    console.log("Initializing noise grid.");
    
    // Initialize canvas
    initializeCanvas();
    
    // Resolve circular dependencies by passing function references
    setCompleteSequenceFunction(completeSequence);
    setAnimationFunctions(startIntroAnimation, animate);
    setUpdateGridParamsFunction(updateGridParams);
    
    setDependencies({
        updateGridParams,
        handleBgUpload,
        handleCellImgUpload,
        handleStartSequence,
        handleRestart,
        handleStartRecording,
        handleStopRecording,
        startBackgroundAnimation,
        stopAllAnimations
    });
    
    // Set up event listeners
    initializeUIListeners();
    initializeDeleteListeners();
    
    // Apply initial UI values
    applyInitialUIValues();
    
    // Load default images
    loadDefaultImages();
    
    // Start background animation
    startBackgroundAnimation();
    
    console.log("Initialization complete. Background animation started.");
}

// Start the application
initialize();
