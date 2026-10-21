/**
 * Application Configuration
 * All constants and magic numbers in one place
 */

export const METRONOME = {
    FREQUENCIES: {
        DOWNBEAT: 1000, // Hz
        BEAT: 800       // Hz
    },
    CLICK_DURATION: 0.05,      // seconds
    SCHEDULER_INTERVAL: 25,     // milliseconds - Web Audio API best practice
    LOOKAHEAD_TIME: 0.1        // seconds
};

export const BPM = {
    MIN: 40,
    MAX: 240,
    DEFAULT: 80
};

export const RECORDING = {
    ANNOUNCE_INTERVAL: 30000,  // 30 seconds
    TIME_UPDATE_INTERVAL: 1000, // 1 second
    AUDIO_CONSTRAINTS: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        latency: 0
    }
};

export const KEYBOARD = {
    METRONOME_TOGGLE: ' ',
    RECORD_START: 'r',
    RECORD_STOP: 's',
    SHORTCUTS_MODAL: '?',
    BPM_UP_SMALL: 'arrowup',
    BPM_DOWN_SMALL: 'arrowdown',
    BPM_UP_LARGE: 'arrowright',
    BPM_DOWN_LARGE: 'arrowleft',
    ESCAPE: 'escape'
};

export const AUDIO = {
    BLOB_TYPE: 'audio/ogg',
    FILE_EXTENSION: '.ogg',
    SHARE_TEXT: 'Metronom eşliğinde alınan ses kaydı.'
};
