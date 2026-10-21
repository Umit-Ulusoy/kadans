/**
 * Keyboard Shortcuts Manager
 * Handles global keyboard shortcuts for the application
 */

import { announceStatus } from './announcer.js';
import { KEYBOARD, BPM } from '../config.js';

export class KeyboardShortcuts {
    /**
     * Initializes keyboard shortcuts
     * @param {Object} app - Application instance with metronome and recorder
     */
    static init(app) {
        this.app = app;
        this.modal = document.getElementById('shortcutsModal');
        this.btnClose = document.getElementById('btnCloseModal');
        this.bpmInput = document.getElementById('bpm');
        this.btnMetronome = document.getElementById('btnMetronome');
        this.btnRecord = document.getElementById('btnRecord');
        this.btnStop = document.getElementById('btnStop');
        
        this.setupEventListeners();
    }
    
    /**
     * Sets up event listeners
     */
    static setupEventListeners() {
        document.addEventListener('keydown', (event) => this.handleKeydown(event));
        this.btnClose.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
    }
    
    /**
     * Handles keyboard events
     * @param {KeyboardEvent} event - Keyboard event
     */
    static handleKeydown(event) {
        const target = event.target;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        // Shift + ? - Toggle shortcuts modal
        if (event.shiftKey && event.key === KEYBOARD.SHORTCUTS_MODAL) {
            event.preventDefault();
            if (this.modal.hidden) {
                this.openModal();
            } else {
                this.closeModal();
            }
            return;
        }

        // Don't trigger shortcuts when typing in input fields
        if (isInputField && target.id !== 'bpm') {
            return;
        }

        const key = event.key.toLowerCase();

        switch (key) {
            case KEYBOARD.METRONOME_TOGGLE:
                // Space - Toggle metronome
                event.preventDefault();
                this.btnMetronome.click();
                break;

            case KEYBOARD.RECORD_START:
                // R - Start recording
                if (!this.btnRecord.disabled) {
                    event.preventDefault();
                    this.btnRecord.click();
                }
                break;

            case KEYBOARD.RECORD_STOP:
                // S - Stop recording
                if (!this.btnStop.disabled) {
                    event.preventDefault();
                    this.btnStop.click();
                }
                break;

            case KEYBOARD.BPM_UP_SMALL:
                // Arrow Up - Increase BPM by 1
                event.preventDefault();
                this.changeBPM(1);
                break;

            case KEYBOARD.BPM_DOWN_SMALL:
                // Arrow Down - Decrease BPM by 1
                event.preventDefault();
                this.changeBPM(-1);
                break;

            case KEYBOARD.BPM_UP_LARGE:
                // Arrow Right - Increase BPM by 2
                event.preventDefault();
                this.changeBPM(2);
                break;

            case KEYBOARD.BPM_DOWN_LARGE:
                // Arrow Left - Decrease BPM by 2
                event.preventDefault();
                this.changeBPM(-2);
                break;

            case KEYBOARD.ESCAPE:
                // Escape - Close modal
                if (!this.modal.hidden) {
                    event.preventDefault();
                    this.closeModal();
                }
                break;
        }
    }
    
    /**
     * Updates BPM value within valid range
     * @param {number} delta - Amount to change BPM by
     */
    static changeBPM(delta) {
        const currentBPM = Number(this.bpmInput.value) || BPM.DEFAULT;
        const newBPM = Math.max(BPM.MIN, Math.min(BPM.MAX, currentBPM + delta));
        this.bpmInput.value = newBPM;
        announceStatus(`BPM ${newBPM} olarak değiştirildi.`);
    }
    
    /**
     * Opens the keyboard shortcuts modal
     */
    static openModal() {
        this.modal.hidden = false;
        this.btnClose.focus();
        announceStatus('Klavye kısayolları penceresi açıldı.');
    }
    
    /**
     * Closes the keyboard shortcuts modal
     */
    static closeModal() {
        this.modal.hidden = true;
        announceStatus('Klavye kısayolları penceresi kapatıldı.');
    }
}
