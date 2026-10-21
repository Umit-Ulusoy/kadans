# Kadans — Accessible Metronome & Audio Recorder
An accessibility-first web metronome and voice recorder.
A lightweight, web-based audio tool designed with accessibility as a core priority. It combines a microsecond-precise metronome with an integrated voice recorder, making rhythm practice and quick recordings fully accessible to everyone, including visually impaired musicians using screen readers.
## Motivation
Standard web tools often overlook screen reader users, creating hidden barriers in everyday tasks like music practice or quick sound recording. This project was built to solve that problem.
The goal was simple: build a rock-solid, precise metronome and recorder that delivers the exact same seamless experience whether you navigate visually or rely entirely on screen reader feedback. Every interaction, button state, and live status update is designed to be fully audible, responsive, and clear.
## Key Features
* Microsecond-Precise Metronome: Built on the Web Audio API lookahead scheduling algorithm to maintain absolute timing accuracy, even during browser layout shifts or background tasks.
* Distinct Downbeat Accents: High-pitch accent (1000Hz) on the first beat of each measure, paired with lower pitch clicks (800Hz) for sub-beats.
* Optional 4-Beat Count-In: A hands-free preparation count-in before recording starts to ensure you catch the first downbeat smoothly.
* Real-Time Recording Timer: Visual and accessible timebar displays elapsed recording time in MM:SS format with periodic announcements for screen reader users.
* Screen Reader Centric Architecture:
* Dynamic live region announcements for every state change (e.g., metronome start/stop, recording status, count-in playback).
* Comprehensive ARIA attributes (aria-pressed, aria-live) managing interactive UI state.
* Native Mobile File Sharing: Direct integration with the Web Share API allows exporting recorded audio files straight to native OS share sheets on supported mobile devices.
* Zero External Dependencies: Built entirely with vanilla web technologies — lightweight, fast, and serverless.
## Built With
* HTML5 (Semantic Structure)
* CSS3 (Accessible & Responsive Styling)
* Vanilla JavaScript ES6+ Modules
* Web Audio API (Audio Synthesis & Precise Scheduling)
* MediaRecorder API (Microphone Capture)
* Web Share API (Native File Export)

## Project Structure
```
kadans/
├── index.html              # Main HTML file
├── style.css               # Styles
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
│
└── js/                     # JavaScript modules
    ├── app.js              # Application orchestrator
    ├── config.js           # Configuration constants
    │
    ├── core/               # Core functionality
    │   ├── audio-context.js   # AudioContext management
    │   ├── metronome.js       # Metronome logic
    │   └── recorder.js        # Recording logic
    │
    ├── ui/                 # UI components
    │   ├── announcer.js       # Accessibility announcements
    │   ├── audio-list.js      # Recording list manager
    │   └── keyboard.js        # Keyboard shortcuts
    │
    └── utils/              # Utilities
        └── helpers.js         # Helper functions
```
## Getting Started

### Requirements
- Modern web browser with ES6 module support
- Local web server (for development)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/umit-ulusoy/kadans.git
cd kadans
```

2. Start a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Open http://localhost:8000 in your browser

**Note:** ES6 modules require a local server and won't work with `file://` protocol.
## How to Use
1. Metronome: Set your desired BPM and toggle the metronome on or off.
2. Recording: Check "Count-In" if you want a 4-beat intro, then click "Start Recording". The metronome will start automatically alongside your recording session.
3. Review & Export: Stop the recording to load the preview in the audio player. On supported mobile devices, use the share button to export your file.
## License
Distributed under the MIT License.