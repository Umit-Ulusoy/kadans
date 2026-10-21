/**
 * Utility Helper Functions
 */

/**
 * Generates a random ID for unique identification
 * @param {number} length - Length of the ID to generate
 * @returns {string} Random alphanumeric string
 */
export function createRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Formats seconds into MM:SS format
 * @param {number} seconds - Total seconds to format
 * @returns {string} Formatted time string (e.g., "2:05")
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
