/**
 * Audio List Manager
 * Handles recording list UI and playback controls
 */

import { announceStatus } from './announcer.js';
import { createRandomId } from '../utils/helpers.js';
import { AUDIO } from '../config.js';

export class AudioList {
    constructor() {
        this.recordings = [];
        this.container = document.getElementById('audioListContainer');
        this.btnShare = document.getElementById('btnShare');
        
        this.setupShareButton();
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
            duration: '0:00'
        };

        this.recordings.push(newRecord);
        this.render();
        this.btnShare.disabled = false;
    }
    
    /**
     * Renders the audio list in the UI
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (this.recordings.length === 0) {
            this.container.innerHTML = '<p>Kayıt yok</p>';
            return;
        }

        this.recordings.forEach((record, index) => {
            const itemElement = this.createAudioItem(record, index);
            this.container.appendChild(itemElement);
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
            <div class="audio-controls-row button-group">
                <button type="button" class="btn-toggle-play" aria-pressed="false" aria-label="${record.name} Oynat">Oynat</button>
                <button type="button" class="btn-share-item" aria-label="${record.name} Paylaş">Paylaş</button>
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

        // Update duration when audio metadata is loaded
        audioElement.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(audioElement.duration / 60);
            const seconds = Math.floor(audioElement.duration % 60).toString().padStart(2, '0');
            record.duration = `${minutes}:${seconds}`;
            const durationSpan = itemElement.querySelector('.audio-duration');
            if (durationSpan) durationSpan.textContent = record.duration;
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

        // Share item button
        btnShareItem.addEventListener('click', () => {
            this.shareRecording(record);
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
            }
            announceStatus(`${record.name} silindi.`);
        }
    }
    
    /**
     * Shares a recording using Web Share API
     * @param {Object} record - Recording object
     */
    async shareRecording(record) {
        const fileName = `${record.name}${AUDIO.FILE_EXTENSION}`;
        const file = new File([record.blob], fileName, { type: AUDIO.BLOB_TYPE });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: record.name,
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
            this.btnShare.addEventListener('click', () => {
                if (this.recordings.length === 0) {
                    announceStatus('Paylaşılacak kayıt bulunamadı.');
                    return;
                }
                const lastRecord = this.recordings[this.recordings.length - 1];
                this.shareRecording(lastRecord);
            });
        }
    }
}
