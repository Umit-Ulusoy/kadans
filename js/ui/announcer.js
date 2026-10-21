/**
 * Screen Reader Announcer
 * Manages ARIA live region announcements for accessibility
 */

const statusRegion = document.getElementById('statusRegion');

/**
 * Announces a message to screen readers via live region
 * @param {string} message - The message to announce
 */
export function announceStatus(message) {
    statusRegion.textContent = '';
    setTimeout(() => {
        statusRegion.textContent = message;
    }, 50);
}
