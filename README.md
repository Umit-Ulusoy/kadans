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
* Vanilla JavaScript (ES6+)
* Web Audio API (Audio Synthesis & Precise Scheduling)
* MediaRecorder API (Microphone Capture)
* Web Share API (Native File Export)
## Getting Started
No build steps, node modules, or complex setup required.
1. Clone the repository:
git clone https://github.com/umit-ulusoy/kadans.git
2. Open index.html in any modern web browser.
## How to Use
1. Metronome: Set your desired BPM and toggle the metronome on or off.
2. Recording: Check "Count-In" if you want a 4-beat intro, then click "Start Recording". The metronome will start automatically alongside your recording session.
3. Review & Export: Stop the recording to load the preview in the audio player. On supported mobile devices, use the share button to export your file.
## License
Distributed under the MIT License.