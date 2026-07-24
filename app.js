const statusRegion = document.getElementById('statusRegion');
const bpmInput = document.getElementById('bpm');
const chkCountIn = document.getElementById('chkCountIn');
const btnMetronome = document.getElementById('btnMetronome');
const btnRecord = document.getElementById('btnRecord');
const btnStop = document.getElementById('btnStop');
const btnShare = document.getElementById('btnShare');
const audioPreview = document.getElementById('audioPreview');

let audioCtx = null;
let isMetronomeRunning = false;
let nextNoteTime = 0.0;
let currentBeat = 0;
let timerID = null;

let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordedAudioUrl = null;

function announceStatus(message) {
    statusRegion.textContent = '';
    setTimeout(() => {
        statusRegion.textContent = message;
    }, 50);
}

/**
 * AudioContext initializer (Must be triggered by user interaction)
 */
function initAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/* ==========================================================================
   METRONOME LOGIC (Web Audio API Timing)
   ========================================================================== */

/**
 * Generates a microsecond-precise click sound using Web Audio API.
 * @param {number} time - Timestamp for when the audio should play
 * @param {boolean} isFirstBeat - Whether it is the first beat of the measure
 */
function scheduleClick(time, isFirstBeat) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Accent (high pitch) on downbeats, lower pitch on other beats
    osc.frequency.value = isFirstBeat ? 1000 : 800;

    // Click sound duration and envelope
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
}

/**
 * Schedules upcoming click timings
 */
function scheduler() {
    // Schedules notes up to 100ms in advance
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        scheduleClick(nextNoteTime, currentBeat % 4 === 0);
        
        // Calculate the duration of the next beat (60 / BPM)
        const bpm = Math.max(40, Math.min(240, Number(bpmInput.value) || 80));
        const secondsPerBeat = 60.0 / bpm;
        nextNoteTime += secondsPerBeat;
        
        currentBeat++;
    }
    timerID = setTimeout(scheduler, 25);
}

function startMetronome() {
    initAudioContext();
    isMetronomeRunning = true;
    currentBeat = 0;
    nextNoteTime = audioCtx.currentTime + 0.05;
    btnMetronome.setAttribute('aria-pressed', 'true');
    btnMetronome.textContent = 'Metronomu Durdur';
    scheduler();
}

function stopMetronome() {
    isMetronomeRunning = false;
    clearTimeout(timerID);
    btnMetronome.setAttribute('aria-pressed', 'false');
    btnMetronome.textContent = 'Metronomu Başlat';
}

btnMetronome.addEventListener('click', () => {
    if (isMetronomeRunning) {
        stopMetronome();
        announceStatus('Metronom durduruldu.');
    } else {
        startMetronome();
        announceStatus(`Metronom ${bpmInput.value} BPM hızında başlatıldı.`);
    }
});

/* ==========================================================================
   AUDIO RECORDING LOGIC (MediaRecorder API)
   ========================================================================== */

/**
 * Plays a 4-beat count-in. 
 * @returns {Promise<void>}
 */
function runCountIn() {
    return new Promise((resolve) => {
        initAudioContext();
        announceStatus('Sayım başladı. 4 tık bekleniyor.');
        
        const bpm = Math.max(40, Math.min(240, Number(bpmInput.value) || 80));
        const secondsPerBeat = 60.0 / bpm;
        let count = 0;
        let startTime = audioCtx.currentTime + 0.1;

        for (let i = 0; i < 4; i++) {
            scheduleClick(startTime + (i * secondsPerBeat), i === 0);
        }

        setTimeout(() => {
            resolve();
        }, (4 * secondsPerBeat) * 1000);
    });
}

async function startRecordingProcess() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        latency: 0
    }
});
        
        if (chkCountIn.checked) {
            await runCountIn();
        }

        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            recordedAudioBlob = new Blob(audioChunks, { type: 'audio/ogg' });
            recordedAudioUrl = URL.createObjectURL(recordedAudioBlob);
            
            audioPreview.src = recordedAudioUrl;
            
            btnShare.disabled = !navigator.canShare;
            
            announceStatus('Kayıt tamamlandı. Ses önizleme alanından dinleyebilirsiniz.');
            
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        
        if (!isMetronomeRunning) {
            startMetronome();
        }

        btnRecord.disabled = true;
        btnStop.disabled = false;
        announceStatus('Kayıt başladı. Metronom çalıyor.');

    } catch (err) {
        announceStatus('Mikrofon erişimi engellendi veya bir hata oluştu.');
        console.error('Kayıt Hatası:', err);
    }
}

function stopRecordingProcess() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (isMetronomeRunning) {
        stopMetronome();
    }
    btnRecord.disabled = false;
    btnStop.disabled = true;
}

btnRecord.addEventListener('click', startRecordingProcess);
btnStop.addEventListener('click', stopRecordingProcess);

/* ==========================================================================
   WEB SHARE API (MOBILE SHARING)
   ========================================================================== */

btnShare.addEventListener('click', async () => {
    if (!recordedAudioBlob) {
        announceStatus('Paylaşılacak dosya bulunamadı.');
        return;
    }

    const file = new File([recordedAudioBlob], 'ses-kaydi.ogg', { type: 'audio/ogg' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Ses Kaydı',
                text: 'Metronom eşliğinde alınan ses kaydı.',
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
});