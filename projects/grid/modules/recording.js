// recording.js - Handles video recording functionality

import { RECORDING_FRAMERATE, RECORDING_MIME_TYPE, RECORDING_VIDEO_BITRATE } from './constants.js';
import { state } from './state.js';
import { ui } from './ui.js';
import { stopAllAnimations, startBackgroundAnimation } from './animation.js';

// Import these functions dynamically to avoid circular dependencies
let startIntroAnimation;
let animate;

// Function to set the animation functions (called from main.js after all modules are loaded)
export function setAnimationFunctions(introAnim, mainAnim) {
    startIntroAnimation = introAnim;
    animate = mainAnim;
}

// Handle sequence completion
export function completeSequence() {
    console.log("Timed sequence complete.");
    state.isSequenceRecording = false;
    
    if (state.isRecording && state.mediaRecorder && state.mediaRecorder.state === 'recording') {
        handleStopRecording(false);
    }
    
    ui.startButton.textContent = "Record";
    ui.startButton.classList.remove('stop-mode');
    ui.startButton.disabled = false;
    
    if (!state.isRecording) {
        ui.startRecordButton.disabled = false;
    }
    
    state.isStarting = false;
    state.isMainLoopActive = false;
    state.isEnding = false;
    
    startBackgroundAnimation();
}

// Start the timed animation sequence
export function handleStartSequence() {
    console.log("Starting timed sequence and recording...");
    stopAllAnimations();
    state.assignedCellData.clear();
    handleStartRecording(true);
    
    ui.startButton.textContent = "Stop Recording";
    ui.startButton.classList.add('stop-mode');
    ui.startButton.disabled = false;
    ui.startRecordButton.disabled = true;
    ui.stopRecordButton.disabled = true;
    ui.stopRecordButton.style.display = 'none';
    state.time = 0;

    if (state.startAnimationEnabled) {
        console.log("Starting with fade-in.");
        state.isStarting = true;
        state.startAnimationStartTime = performance.now();
        state.startAnimationFrameId = requestAnimationFrame(startIntroAnimation);
    } else {
        console.log("Starting directly into main animation.");
        state.isMainLoopActive = true;
        state.mainAnimationStartTime = performance.now();
        state.mainAnimationEndTime = state.mainAnimationStartTime + (state.overallDuration * 1000);
        state.animationFrameId = requestAnimationFrame(animate);
    }
}

// Handle sequence restart
export function handleRestart() {
    console.log("Stop/Restart triggered...");
    const wasRecordingSequence = state.isSequenceRecording;
    state.isSequenceRecording = false;
    
    if (state.isRecording && wasRecordingSequence) {
        handleStopRecording(false);
    }
    
    stopAllAnimations();
    ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    if (state.bgImageForDrawing) ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
    state.assignedCellData.clear();
    state.time = 0;
    
    ui.startButton.textContent = "Record";
    ui.startButton.classList.remove('stop-mode');
    ui.startButton.disabled = false;
    
    if (!state.isRecording) {
        ui.startRecordButton.disabled = false;
        ui.stopRecordButton.disabled = true;
        ui.stopRecordButton.style.display = 'none';
    }
    
    startBackgroundAnimation();
}

// Start recording
export function handleStartRecording(isFromSequence = false) {
    if (state.isRecording) {
        console.warn("Already recording.");
        return;
    }
    
    if (!ui.canvas.captureStream || !window.MediaRecorder || !MediaRecorder.isTypeSupported(RECORDING_MIME_TYPE)) {
        alert("Error: Recording features not fully supported by your browser.");
        return;
    }

    try {
        console.log(`Attempting capture at ${RECORDING_FRAMERATE}fps.`);
        state.mediaStream = ui.canvas.captureStream(RECORDING_FRAMERATE);
        
        if (!state.mediaStream || state.mediaStream.getTracks().length === 0) {
            throw new Error("captureStream failed.");
        }
        
        console.log("Stream captured.");
        const options = {
            mimeType: RECORDING_MIME_TYPE,
            videoBitsPerSecond: RECORDING_VIDEO_BITRATE
        };
        
        state.mediaRecorder = new MediaRecorder(state.mediaStream, options);
        console.log("MediaRecorder created.");
    } catch (e) {
        console.error("Error setting up MediaRecorder:", e);
        alert(`Error starting recording: ${e.message}.`);
        
        if (state.mediaStream) {
            try {
                state.mediaStream.getTracks().forEach(track => track.stop());
            } catch (err) {}
            state.mediaStream = null;
        }
        
        if (isFromSequence) {
            handleRestart();
        } else {
            ui.startRecordButton.disabled = false;
            ui.stopRecordButton.disabled = true;
            ui.stopRecordButton.style.display = 'none';
            ui.startButton.disabled = false;
        }
        
        return;
    }

    state.recordedChunks = [];
    
    state.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) state.recordedChunks.push(event.data);
    };
    
    state.mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped.");
        const wasSeqRec = state.isSequenceRecording;
        state.isRecording = false;
        state.isSequenceRecording = false;
        
        if (state.mediaStream) {
            try {
                state.mediaStream.getTracks().forEach(track => track.stop());
            } catch(e) {}
            state.mediaStream = null;
        }

        if (state.recordedChunks.length === 0) {
            console.warn("No data recorded.");
            if (!wasSeqRec) alert("Recording stopped, but no video data captured.");
        } else {
            console.log(`Combining ${state.recordedChunks.length} chunks.`);
            try {
                const blob = new Blob(state.recordedChunks, { type: RECORDING_MIME_TYPE });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style.display = 'none';
                a.href = url;
                
                const now = new Date();
                const ts = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
                
                a.download = `noise_creation_${ts}.mp4`;
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                console.log("Recording downloaded.");
            } catch (e) {
                console.error("Error creating/downloading Blob:", e);
                alert("Error processing recorded video.");
            }
        }
        
        ui.stopRecordButton.disabled = true;
        ui.stopRecordButton.style.display = 'none';
        ui.startRecordButton.disabled = false;
        
        if (!state.isSequenceActive()) {
            ui.startButton.textContent = "Start Sequence & Record";
            ui.startButton.classList.remove('stop-mode');
            ui.startButton.disabled = false;
        }
    };
    
    state.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        alert(`Recording error: ${event.error?.name || 'Unknown'}. Stopped.`);
        
        state.isRecording = false;
        state.isSequenceRecording = false;
        
        try {
            if (state.mediaRecorder?.state !== 'inactive') state.mediaRecorder.stop();
        } catch (e) {}
        
        if (state.mediaStream) {
            try {
                state.mediaStream.getTracks().forEach(track => track.stop());
            } catch (e) {}
            state.mediaStream = null;
        }
        
        state.mediaRecorder = null;
        
        ui.stopRecordButton.disabled = true;
        ui.stopRecordButton.style.display = 'none';
        ui.startRecordButton.disabled = false;
        
        if (!state.isSequenceActive()) {
            ui.startButton.textContent = "Start Sequence & Record";
            ui.startButton.classList.remove('stop-mode');
            ui.startButton.disabled = false;
        }
    };

    try {
        state.mediaRecorder.start();
        state.isRecording = true;
        state.isSequenceRecording = isFromSequence;
        
        console.log(isFromSequence ? "Sequence recording started." : "Manual recording started.");
        
        if (isFromSequence) {
            /* Buttons set by handleStartSequence */
        } else {
            ui.startRecordButton.disabled = true;
            ui.stopRecordButton.disabled = false;
            ui.stopRecordButton.style.display = 'inline-block';
            ui.startButton.disabled = true;
            stopAllAnimations(true); // Stop background
        }
    } catch (e) {
        console.error("Error calling mediaRecorder.start():", e);
        alert(`Failed to start MediaRecorder: ${e.message}`);
        
        state.isRecording = false;
        state.isSequenceRecording = false;
        
        if (state.mediaStream) {
            try {
                state.mediaStream.getTracks().forEach(track => track.stop());
            } catch (err) {}
            state.mediaStream = null;
        }
        
        state.mediaRecorder = null;
        
        if (isFromSequence) {
            handleRestart();
        } else {
            ui.startRecordButton.disabled = false;
            ui.stopRecordButton.disabled = true;
            ui.stopRecordButton.style.display = 'none';
            ui.startButton.disabled = false;
        }
    }
}

// Stop recording
export function handleStopRecording(restartBg = true) {
    if (!state.isRecording || !state.mediaRecorder) {
        console.warn("Not recording.");
        return;
    }
    
    console.log("Stopping recording (handleStopRecording)...");
    const wasSequenceRunning = state.isSequenceActive();

    if (state.mediaRecorder.state === "recording" || state.mediaRecorder.state === "paused") {
        try {
            state.mediaRecorder.stop();
            console.log("mediaRecorder.stop() called.");
        } catch (e) {
            console.error("Error calling mediaRecorder.stop():", e);
            state.isRecording = false;
            state.isSequenceRecording = false;
            
            if (state.mediaStream) {
                try {
                    state.mediaStream.getTracks().forEach(track => track.stop());
                } catch (err) {}
                state.mediaStream = null;
            }
            
            state.mediaRecorder = null;
            
            ui.stopRecordButton.disabled = true;
            ui.stopRecordButton.style.display = 'none';
            ui.startRecordButton.disabled = false;
            
            if (!wasSequenceRunning) {
                ui.startButton.disabled = false;
            }
        }
    } else {
        console.warn(`MediaRecorder state was '${state.mediaRecorder.state}'. Cleaning up.`);
        state.isRecording = false;
        state.isSequenceRecording = false;
        
        if (state.mediaStream) {
            try {
                state.mediaStream.getTracks().forEach(track => track.stop());
            } catch (err) {}
            state.mediaStream = null;
        }
        
        state.mediaRecorder = null;
        
        ui.stopRecordButton.disabled = true;
        ui.stopRecordButton.style.display = 'none';
        ui.startRecordButton.disabled = false;
        
        if (!wasSequenceRunning) {
            ui.startButton.disabled = false;
        }
    }

    if (restartBg && !wasSequenceRunning) {
        console.log("Restarting background animation.");
        startBackgroundAnimation();
    } else {
        console.log("Background animation restart skipped.");
    }
} 