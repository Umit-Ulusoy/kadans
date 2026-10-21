/**
 * Audio Context Manager
 * Provides a single AudioContext instance for the entire application
 */

let audioCtx = null;

/**
 * Gets or creates the AudioContext instance
 * @returns {AudioContext} The audio context
 */
export function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Closes the audio context and releases resources
 */
export function closeAudioContext() {
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
}
