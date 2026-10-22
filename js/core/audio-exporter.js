/**
 * Audio Exporter Module
 * Handles mixing and exporting multiple tracks to a single file
 */

import { getAudioContext } from './audio-context.js';
import { audioBufferToWav } from '../utils/audio-utils.js';

export class AudioExporter {
    constructor() {
        this.audioCtx = getAudioContext();
    }
    
    /**
     * Exports multiple recordings as a single mixed file
     * @param {Array} recordings - Array of recording objects with blob and volume properties
     * @returns {Promise<Blob>} Mixed audio blob
     */
    async exportMix(recordings) {
        if (recordings.length === 0) {
            throw new Error('No recordings to export');
        }
        
        if (recordings.length === 1) {
            // Single recording, return as-is
            return recordings[0].blob;
        }
        
        // Load all audio buffers
        const buffers = await Promise.all(
            recordings.map(r => this.loadAudioBuffer(r.blob))
        );
        
        // Find the longest duration
        const maxDuration = Math.max(...buffers.map(b => b.duration));
        const sampleRate = buffers[0].sampleRate;
        const numberOfChannels = 2; // Stereo output
        
        // Create offline context for rendering
        const offlineCtx = new OfflineAudioContext(
            numberOfChannels,
            maxDuration * sampleRate,
            sampleRate
        );
        
        // Add all buffers to the offline context with volume
        buffers.forEach((buffer, index) => {
            const source = offlineCtx.createBufferSource();
            const gainNode = offlineCtx.createGain();
            
            source.buffer = buffer;
            
            // Apply volume from recording settings
            const volumeLevel = (recordings[index].volume || 100) / 100;
            gainNode.gain.value = volumeLevel;
            
            source.connect(gainNode);
            gainNode.connect(offlineCtx.destination);
            source.start(0);
        });
        
        // Render the mixed audio
        const renderedBuffer = await offlineCtx.startRendering();
        
        // Convert to WAV blob (browser-compatible format)
        return audioBufferToWav(renderedBuffer);
    }
    
    /**
     * Loads an audio blob and decodes it to AudioBuffer
     * @param {Blob} blob - Audio blob
     * @returns {Promise<AudioBuffer>} Decoded audio buffer
     */
    async loadAudioBuffer(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        return await this.audioCtx.decodeAudioData(arrayBuffer);
    }
}
