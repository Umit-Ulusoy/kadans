/**
 * Audio Mixer Module
 * Handles multi-track playback synchronization
 */

import { getAudioContext } from './audio-context.js';

export class AudioMixer {
    constructor() {
        this.audioCtx = getAudioContext();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);
        this.tracks = [];
        this.isPlaying = false;
        this.sources = [];
    }
    
    /**
     * Adds an audio element as a track to the mixer
     * @param {HTMLAudioElement} audioElement - Audio element to add
     * @param {string} trackId - Unique ID for the track
     */
    addTrack(audioElement, trackId) {
        const source = this.audioCtx.createMediaElementSource(audioElement);
        const gainNode = this.audioCtx.createGain();
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        this.tracks.push({
            id: trackId,
            element: audioElement,
            source: source,
            gain: gainNode
        });
    }
    
    /**
     * Sets the volume for a specific track
     * @param {string} trackId - Track ID
     * @param {number} volume - Volume level (0.0 to 2.0, where 1.0 is 100%)
     */
    setTrackVolume(trackId, volume) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) {
            track.gain.gain.value = volume;
        }
    }
    
    /**
     * Plays all tracks synchronously
     */
    async playAll() {
        if (this.isPlaying) return;
        
        // Reset all tracks to start
        this.tracks.forEach(track => {
            track.element.currentTime = 0;
        });
        
        // Start all tracks at the same time
        const playPromises = this.tracks.map(track => track.element.play());
        
        try {
            await Promise.all(playPromises);
            this.isPlaying = true;
        } catch (err) {
            console.error('Playback error:', err);
        }
    }
    
    /**
     * Stops all tracks
     */
    stopAll() {
        this.tracks.forEach(track => {
            track.element.pause();
            track.element.currentTime = 0;
        });
        this.isPlaying = false;
    }
    
    /**
     * Clears all tracks
     */
    clear() {
        this.stopAll();
        this.tracks = [];
    }
    
    /**
     * Returns the number of tracks
     * @returns {number} Number of tracks
     */
    getTrackCount() {
        return this.tracks.length;
    }
}
