/**
 * Metronome Module
 * Handles metronome timing and audio generation using Web Audio API
 */

import { getAudioContext } from './audio-context.js';
import { announceStatus } from '../ui/announcer.js';
import { METRONOME, BPM } from '../config.js';

export class Metronome {
    constructor(bpmInput, btnMetronome) {
        this.bpmInput = bpmInput;
        this.btnMetronome = btnMetronome;
        this.isRunning = false;
        this.nextNoteTime = 0.0;
        this.currentBeat = 0;
        this.timerID = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Generates a microsecond-precise click sound using Web Audio API
     * @param {number} time - Timestamp for when the audio should play
     * @param {boolean} isFirstBeat - Whether it is the first beat of the measure
     */
    scheduleClick(time, isFirstBeat) {
        const audioCtx = getAudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // Accent (high pitch) on downbeats, lower pitch on other beats
        osc.frequency.value = isFirstBeat ? METRONOME.FREQUENCIES.DOWNBEAT : METRONOME.FREQUENCIES.BEAT;

        // Click sound duration and envelope
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + METRONOME.CLICK_DURATION);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + METRONOME.CLICK_DURATION);
    }
    
    /**
     * Schedules upcoming click timings
     */
    scheduler() {
        const audioCtx = getAudioContext();
        // Schedules notes up to lookahead time in advance
        while (this.nextNoteTime < audioCtx.currentTime + METRONOME.LOOKAHEAD_TIME) {
            this.scheduleClick(this.nextNoteTime, this.currentBeat % 4 === 0);
            
            // Calculate the duration of the next beat (60 / BPM)
            const bpm = Math.max(BPM.MIN, Math.min(BPM.MAX, Number(this.bpmInput.value) || BPM.DEFAULT));
            const secondsPerBeat = 60.0 / bpm;
            this.nextNoteTime += secondsPerBeat;
            
            this.currentBeat++;
        }
        this.timerID = setTimeout(() => this.scheduler(), METRONOME.SCHEDULER_INTERVAL);
    }
    
    /**
     * Starts the metronome
     */
    start() {
        const audioCtx = getAudioContext();
        this.isRunning = true;
        this.currentBeat = 0;
        this.nextNoteTime = audioCtx.currentTime + 0.05;
        this.btnMetronome.setAttribute('aria-pressed', 'true');
        this.btnMetronome.textContent = 'Metronomu Durdur';
        this.scheduler();
    }
    
    /**
     * Stops the metronome
     */
    stop() {
        this.isRunning = false;
        clearTimeout(this.timerID);
        this.btnMetronome.setAttribute('aria-pressed', 'false');
        this.btnMetronome.textContent = 'Metronomu Başlat';
    }
    
    /**
     * Sets up event listeners for metronome button
     */
    setupEventListeners() {
        this.btnMetronome.addEventListener('click', () => {
            if (this.isRunning) {
                this.stop();
                announceStatus('Metronom durduruldu.');
            } else {
                this.start();
                announceStatus(`Metronom ${this.bpmInput.value} BPM hızında başlatıldı.`);
            }
        });
    }
}
