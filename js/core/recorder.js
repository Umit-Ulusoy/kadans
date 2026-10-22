/**
 * Audio Recorder Module
 * Handles audio recording using MediaRecorder API
 */

import { getAudioContext } from './audio-context.js';
import { announceStatus } from '../ui/announcer.js';
import { formatTime } from '../utils/helpers.js';
import { RECORDING, BPM } from '../config.js';

export class Recorder {
    constructor(metronome, audioList) {
        this.metronome = metronome;
        this.audioList = audioList;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStartTime = 0;
        this.recordingTimerInterval = null;
        
        // DOM references
        this.btnRecord = document.getElementById('btnRecord');
        this.btnStop = document.getElementById('btnStop');
        this.chkCountIn = document.getElementById('chkCountIn');
        this.chkMetronomeDuringRecording = document.getElementById('chkMetronomeDuringRecording');
        this.chkPlaybackDuringRecording = document.getElementById('chkPlaybackDuringRecording');
        this.recordingTimeBar = document.getElementById('recordingTimeBar');
        this.recordingTimeDisplay = document.getElementById('recordingTime');
        
        this.setupEventListeners();
    }
    
    /**
     * Plays a 4-beat count-in before recording
     * @returns {Promise<void>}
     */
    runCountIn() {
        return new Promise((resolve) => {
            const audioCtx = getAudioContext();
            announceStatus('Sayım başladı. 4 tık bekleniyor.');
            
            const bpm = Math.max(BPM.MIN, Math.min(BPM.MAX, Number(this.metronome.bpmInput.value) || BPM.DEFAULT));
            const secondsPerBeat = 60.0 / bpm;
            let startTime = audioCtx.currentTime + 0.1;

            for (let i = 0; i < 4; i++) {
                this.metronome.scheduleClick(startTime + (i * secondsPerBeat), i === 0);
            }

            setTimeout(() => {
                resolve();
            }, (4 * secondsPerBeat) * 1000);
        });
    }
    
    /**
     * Starts the recording timer display
     */
    startRecordingTimer() {
        this.recordingStartTime = Date.now();
        this.recordingTimeBar.hidden = false;
        this.recordingTimeDisplay.textContent = '0:00';
        
        this.recordingTimerInterval = setInterval(() => {
            const elapsedSeconds = (Date.now() - this.recordingStartTime) / 1000;
            const formattedTime = formatTime(elapsedSeconds);
            this.recordingTimeDisplay.textContent = formattedTime;
            
            // Announce time every 30 seconds for screen reader users
            if (Math.floor(elapsedSeconds) % 30 === 0 && Math.floor(elapsedSeconds) > 0) {
                announceStatus(`Kayıt süresi: ${formattedTime}`);
            }
        }, RECORDING.TIME_UPDATE_INTERVAL);
    }
    
    /**
     * Stops and hides the recording timer
     */
    stopRecordingTimer() {
        if (this.recordingTimerInterval) {
            clearInterval(this.recordingTimerInterval);
            this.recordingTimerInterval = null;
        }
        this.recordingTimeBar.hidden = true;
    }
    
    /**
     * Starts the recording process
     */
    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: RECORDING.AUDIO_CONSTRAINTS
            });
            
            if (this.chkCountIn.checked) {
                await this.runCountIn();
            }

            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.audioList.addRecording(this.audioChunks);
                announceStatus('Kayıt tamamlandı ve listeye eklendi.');
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            
            // Start recording timer
            this.startRecordingTimer();
            
            if (this.chkMetronomeDuringRecording.checked && !this.metronome.isRunning) {
                this.metronome.start();
            }
            
            // Play existing recordings if enabled
            if (this.chkPlaybackDuringRecording && this.chkPlaybackDuringRecording.checked) {
                if (this.audioList.mixer.getTrackCount() > 0) {
                    this.audioList.mixer.playAll();
                }
            }

            this.btnRecord.disabled = true;
            this.btnStop.disabled = false;
            
            if (this.chkMetronomeDuringRecording.checked) {
                announceStatus('Kayıt başladı. Metronom çalıyor.');
            } else {
                announceStatus('Kayıt başladı.');
            }

        } catch (err) {
            announceStatus('Mikrofon erişimi engellendi veya bir hata oluştu.');
            console.error('Kayıt Hatası:', err);
        }
    }
    
    /**
     * Stops the recording process
     */
    stop() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // Stop recording timer
        this.stopRecordingTimer();
        
        // Stop playback if it was started
        if (this.audioList.mixer.isPlaying) {
            this.audioList.mixer.stopAll();
        }
        
        // Only stop metronome if it was started by recording process
        if (this.metronome.isRunning && this.chkMetronomeDuringRecording.checked) {
            this.metronome.stop();
        }
        this.btnRecord.disabled = false;
        this.btnStop.disabled = true;
    }
    
    /**
     * Sets up event listeners for recording buttons
     */
    setupEventListeners() {
        this.btnRecord.addEventListener('click', () => this.start());
        this.btnStop.addEventListener('click', () => this.stop());
    }
}
