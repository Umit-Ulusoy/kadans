/**
 * Audio Utilities
 * Helper functions for audio buffer manipulation and conversion
 */

/**
 * Converts an AudioBuffer to a WAV Blob
 * @param {AudioBuffer} buffer - Audio buffer to convert
 * @returns {Blob} WAV audio blob
 */
export function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = interleave(buffer);
    const dataLength = data.length * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    floatTo16BitPCM(view, 44, data);
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Interleaves multiple channels into a single array
 * @param {AudioBuffer} buffer - Audio buffer
 * @returns {Float32Array} Interleaved audio data
 */
function interleave(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels;
    const result = new Float32Array(length);
    
    let offset = 0;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            result[offset++] = buffer.getChannelData(channel)[i];
        }
    }
    
    return result;
}

/**
 * Converts float samples to 16-bit PCM
 * @param {DataView} view - DataView to write to
 * @param {number} offset - Offset in the view
 * @param {Float32Array} input - Input float samples
 */
function floatTo16BitPCM(view, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

/**
 * Writes a string to a DataView
 * @param {DataView} view - DataView to write to
 * @param {number} offset - Offset in the view
 * @param {string} string - String to write
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
