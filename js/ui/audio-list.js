/**
 * Audio List Manager
 * Handles recording list UI and playback controls
 */

import { announceStatus } from './announcer.js';
import { createRandomId } from '../utils/helpers.js';
import { AUDIO } from '../config.js';
import { AudioMixer } from '../core/audio-mixer.js';
import { AudioExporter } from '../core/audio-exporter.js';

export class AudioList {
    constructor() {
        this.recordings = [];
        this.container = document.getElementById('audioListContainer');
        this.btnShare = document.getElementById('btnShare');
        this.btnDownload = document.getElementById('btnDownload');
        this.btnPlayAll = document.getElementById('btnPlayAll');
        this.btnStopAll = document.getElementById('btnStopAll');
        this.playbackControls = document.getElementById('playbackControls');
        
        this.mixer = new AudioMixer();
        this.exporter = new AudioExporter();
        this.isExporting = false;
        
        this.setupShareButton();
        this.setupDownloadButton();
        this.setupPlaybackControls();
    }
    
    /**
     * Adds a new recording to the list
     * @param {Array} audioChunks - Array of audio data chunks
     */
    addRecording(audioChunks) {
        const audioId = createRandomId(8);
        const audioBlob = new Blob(audioChunks, { type: AUDIO.BLOB_TYPE });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newRecord = {
            id: audioId,
            name: `Kayıt ${this.recordings.length + 1}`,
            blob: audioBlob,
            url: audioUrl,
            duration: '0:00',
            volume: 100  // Default volume 100%
        };

        this.recordings.push(newRecord);
        this.render();
        this.btnShare.disabled = false;
        if (this.btnDownload) this.btnDownload.disabled = false;
        
        // Show playback controls if multiple recordings
        this.updatePlaybackControlsVisibility();
    }
    
    /**
     * Renders the audio list in the UI
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.mixer.clear();

        if (this.recordings.length === 0) {
            this.container.innerHTML = '<p>Kayıt yok</p>';
            return;
        }

        this.recordings.forEach((record, index) => {
            const itemElement = this.createAudioItem(record, index);
            this.container.appendChild(itemElement);
            
            // Add audio element to mixer with ID and volume
            const audioElement = itemElement.querySelector('.audio-player-element');
            this.mixer.addTrack(audioElement, record.id);
            this.mixer.setTrackVolume(record.id, record.volume / 100);
        });
    }
    
    /**
     * Creates a single audio item element
     * @param {Object} record - Recording object
     * @param {number} index - Index in the list
     * @returns {HTMLElement} Audio item element
     */
    createAudioItem(record, index) {
        const itemElement = document.createElement('div');
        itemElement.className = 'audio-item-block';
        itemElement.setAttribute('role', 'group');
        itemElement.setAttribute('aria-label', `Kayıt ${index + 1}: ${record.name}`);

        itemElement.innerHTML = `
            <div class="audio-info-row">
                <span class="audio-index">#${index + 1}</span> - 
                <span class="audio-name"><strong>${record.name}</strong></span> 
                (<span class="audio-duration">${record.duration || '0:00'}</span>)
            </div>
            <audio class="audio-player-element" src="${record.url}" style="display:none;"></audio>
            <div class="audio-volume-control">
                <label for="volume-${record.id}" class="volume-label">Ses Seviyesi:</label>
                <input 
                    type="number" 
                    id="volume-${record.id}" 
                    class="volume-input"
                    min="-100" 
                    max="200" 
                    value="${record.volume}" 
                    aria-label="${record.name} ses seviyesi"
                    aria-describedby="volume-help-${record.id}"
                >
                <span id="volume-help-${record.id}" class="volume-display">%${record.volume}</span>
            </div>
            <div class="audio-controls-row button-group">
                <button type="button" class="btn-toggle-play" aria-pressed="false" aria-label="${record.name} Oynat">Oynat</button>
                <button type="button" class="btn-share-item" aria-label="${record.name} Paylaş" disabled>Paylaş</button>
                <button type="button" class="btn-delete" aria-label="${record.name} Sil">Sil</button>
            </div>
        `;

        this.attachItemEvents(itemElement, record);
        return itemElement;
    }
    
    /**
     * Attaches event listeners to an audio item
     * @param {HTMLElement} itemElement - The item element
     * @param {Object} record - Recording object
     */
    attachItemEvents(itemElement, record) {
        const audioElement = itemElement.querySelector('.audio-player-element');
        const btnTogglePlay = itemElement.querySelector('.btn-toggle-play');
        const btnShareItem = itemElement.querySelector('.btn-share-item');
        const btnDelete = itemElement.querySelector('.btn-delete');
        const volumeInput = itemElement.querySelector(`#volume-${record.id}`);
        const volumeDisplay = itemElement.querySelector(`#volume-help-${record.id}`);

        // Update duration when audio metadata is loaded
        audioElement.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(audioElement.duration / 60);
            const seconds = Math.floor(audioElement.duration % 60).toString().padStart(2, '0');
            record.duration = `${minutes}:${seconds}`;
            const durationSpan = itemElement.querySelector('.audio-duration');
            if (durationSpan) durationSpan.textContent = record.duration;
        });
        
        // Volume control
        volumeInput.addEventListener('input', (e) => {
            const newVolume = parseInt(e.target.value);
            record.volume = newVolume;
            volumeDisplay.textContent = `%${newVolume}`;
            
            // Update mixer gain for this track
            this.mixer.setTrackVolume(record.id, newVolume / 100);
            
            // Announce to screen reader
            announceStatus(`${record.name} ses seviyesi: %${newVolume}`);
        });

        // Toggle play/pause button
        btnTogglePlay.addEventListener('click', () => {
            if (audioElement.paused) {
                audioElement.play();
                btnTogglePlay.textContent = 'Durdur';
                btnTogglePlay.setAttribute('aria-pressed', 'true');
                btnTogglePlay.setAttribute('aria-label', `${record.name} Durdur`);
                announceStatus(`${record.name} oynatılıyor.`);
            } else {
                audioElement.pause();
                audioElement.currentTime = 0;
                btnTogglePlay.textContent = 'Oynat';
                btnTogglePlay.setAttribute('aria-pressed', 'false');
                btnTogglePlay.setAttribute('aria-label', `${record.name} Oynat`);
                announceStatus(`${record.name} durduruldu.`);
            }
        });

        audioElement.addEventListener('ended', () => {
            btnTogglePlay.textContent = 'Oynat';
            btnTogglePlay.setAttribute('aria-pressed', 'false');
            btnTogglePlay.setAttribute('aria-label', `${record.name} Oynat`);
        });

        // Share item button (disabled - now only global share)
        btnShareItem.addEventListener('click', () => {
            announceStatus('Lütfen paylaş butonunu kullanın.');
        });

        // Delete item button
        btnDelete.addEventListener('click', () => {
            audioElement.pause();
            this.deleteRecording(record.id);
        });
    }
    
    /**
     * Deletes a recording from the list
     * @param {string} id - Recording ID
     */
    deleteRecording(id) {
        const itemIndex = this.recordings.findIndex(r => r.id === id);
        if (itemIndex > -1) {
            const record = this.recordings[itemIndex];
            URL.revokeObjectURL(record.url);
            this.recordings.splice(itemIndex, 1);
            this.render();
            if (this.recordings.length === 0) {
                this.btnShare.disabled = true;
                if (this.btnDownload) this.btnDownload.disabled = true;
            }
            this.updatePlaybackControlsVisibility();
            announceStatus(`${record.name} silindi.`);
        }
    }
    
    /**
     * Shares recording(s) using Web Share API
     * If multiple recordings exist, mixes them first
     */
    async shareRecording() {
        if (this.recordings.length === 0) {
            announceStatus('Paylaşılacak kayıt bulunamadı.');
            return;
        }
        
        let blob, fileName;
        
        if (this.recordings.length === 1) {
            // Single recording
            blob = this.recordings[0].blob;
            fileName = `${this.recordings[0].name}.ogg`;
        } else {
            // Multiple recordings - mix them
            try {
                announceStatus('Kayıtlar birleştiriliyor...');
                this.isExporting = true;
                blob = await this.exporter.exportMix(this.recordings);
                fileName = 'kadans-mix.wav';
                this.isExporting = false;
                announceStatus('Kayıtlar birleştirildi.');
            } catch (err) {
                this.isExporting = false;
                announceStatus('Birleştirme sırasında bir hata oluştu.');
                console.error('Export error:', err);
                return;
            }
        }

        const file = new File([blob], fileName, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: this.recordings.length === 1 ? this.recordings[0].name : 'Kadans Mix',
                    text: AUDIO.SHARE_TEXT,
                    files: [file]
                });
                announceStatus('Paylaşım menüsü açıldı.');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    announceStatus('Paylaşım sırasında bir hata oluştu.');
                }
            }
        } else {
            announceStatus('Cihazınız dosya paylaşımını desteklemiyor.');
        }
    }
    
    /**
     * Sets up the main share button
     */
    setupShareButton() {
        if (this.btnShare) {
            this.btnShare.addEventListener('click', () => this.shareRecording());
        }
    }
    
    /**
     * Sets up the download button
     */
    setupDownloadButton() {
        if (this.btnDownload) {
            this.btnDownload.addEventListener('click', () => this.downloadRecording());
        }
    }
    
    /**
     * Downloads recording(s) as a file
     * If multiple recordings exist, mixes them first
     */
    async downloadRecording() {
        if (this.recordings.length === 0) {
            announceStatus('İndirilecek kayıt bulunamadı.');
            return;
        }
        
        let blob, fileName;
        
        if (this.recordings.length === 1) {
            // Single recording
            blob = this.recordings[0].blob;
            fileName = `${this.recordings[0].name}.ogg`;
        } else {
            // Multiple recordings - mix them
            try {
                announceStatus('Kayıtlar birleştiriliyor...');
                this.isExporting = true;
                blob = await this.exporter.exportMix(this.recordings);
                fileName = 'kadans-mix.wav';
                this.isExporting = false;
                announceStatus('Kayıtlar birleştirildi.');
            } catch (err) {
                this.isExporting = false;
                announceStatus('Birleştirme sırasında bir hata oluştu.');
                console.error('Export error:', err);
                return;
            }
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        announceStatus(`${fileName} indirildi.`);
    }
    
    /**
     * Sets up playback controls (play all/stop all)
     */
    setupPlaybackControls() {
        if (this.btnPlayAll) {
            this.btnPlayAll.addEventListener('click', () => {
                this.mixer.playAll();
                announceStatus(`${this.recordings.length} kayıt oynatılıyor.`);
            });
        }
        
        if (this.btnStopAll) {
            this.btnStopAll.addEventListener('click', () => {
                this.mixer.stopAll();
                announceStatus('Tüm kayıtlar durduruldu.');
            });
        }
    }
    
    /**
     * Shows/hides playback controls based on recording count
     */
    updatePlaybackControlsVisibility() {
        if (this.playbackControls) {
            this.playbackControls.hidden = this.recordings.length < 2;
        }
    }
}
