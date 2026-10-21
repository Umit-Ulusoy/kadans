/**
 * Kadans - Accessible Metronome & Audio Recorder
 * Main application orchestrator
 */

import { Metronome } from './core/metronome.js';
import { Recorder } from './core/recorder.js';
import { AudioList } from './ui/audio-list.js';
import { KeyboardShortcuts } from './ui/keyboard.js';

/**
 * Application initialization
 */
function init() {
    // Get DOM references
    const bpmInput = document.getElementById('bpm');
    const btnMetronome = document.getElementById('btnMetronome');
    
    // Initialize core modules
    const metronome = new Metronome(bpmInput, btnMetronome);
    const audioList = new AudioList();
    const recorder = new Recorder(metronome, audioList);
    
    // Initialize keyboard shortcuts
    KeyboardShortcuts.init({
        metronome,
        recorder,
        audioList
    });
    
    // Register service worker
    registerServiceWorker();
}

/**
 * Service Worker registration for PWA
 */
const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker başarıyla kaydoldu:', registration.scope);
        } catch (error) {
            console.error('Service Worker kaydı başarısız:', error);
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
