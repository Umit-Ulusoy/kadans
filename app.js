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

const recordedAudios = [];

function announceStatus(message) {
    statusRegion.textContent = '';
    setTimeout(() => {
        statusRegion.textContent = message;
    }, 50);
}

/**
 * Random ID generator for modular structure
 */
function createRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
            const audioId = createRandomId(8);
            const audioBlob = new Blob(audioChunks, { type: 'audio/ogg' });
            const audioUrl = URL.createObjectURL(audioBlob);

            const newRecord = {
                id: audioId,
                name: `Kayıt ${recordedAudios.length + 1}`,
                blob: audioBlob,
                url: audioUrl,
                duration: '0:00'
            };

            recordedAudios.push(newRecord);
            
            renderAudioList();
            
            btnShare.disabled = false;
            
            announceStatus('Kayıt tamamlandı ve listeye eklendi.');
            
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

/**
 * Common shared audio function for Web Share API
 */
async function shareAudioRecord(blob, title, fileName) {
    const file = new File([blob], fileName, { type: 'audio/ogg' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: title,
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
}

/* ==========================================================================
   MULTI-AUDIO LIST & UI MANAGEMENT
   ========================================================================== */

/**
 * Updates and renders the audio list in the UI
 */
function renderAudioList() {
    const listContainer = document.getElementById('audioListContainer');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (recordedAudios.length === 0) {
        listContainer.innerHTML = '<p>Kayıt yok</p>';
        return;
    }

    recordedAudios.forEach((record, index) => {
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
            shareAudioRecord(record.blob, record.name, `${record.name}.ogg`);
        });

        // Delete item button
        btnDelete.addEventListener('click', () => {
            audioElement.pause();
            const itemIndex = recordedAudios.findIndex(r => r.id === record.id);
            if (itemIndex > -1) {
                recordedAudios.splice(itemIndex, 1);
                URL.revokeObjectURL(record.url);
                renderAudioList();
                if (recordedAudios.length === 0) {
                    btnShare.disabled = true;
                }
                announceStatus(`${record.name} silindi.`);
            }
        });

        listContainer.appendChild(itemElement);
    });
}

/* ==========================================================================
   WEB SHARE API (MOBILE SHARING - GENERAL)
   ========================================================================== */

if (btnShare) {
    btnShare.addEventListener('click', () => {
        if (recordedAudios.length === 0) {
            announceStatus('Paylaşılacak kayıt bulunamadı.');
            return;
        }
        const lastRecord = recordedAudios[recordedAudios.length - 1];
        shareAudioRecord(lastRecord.blob, lastRecord.name, 'ses-kaydi.ogg');
    });
}

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

if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', registerServiceWorker);
}