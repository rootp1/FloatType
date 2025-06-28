console.log('Smart Input Assistant: Content script loaded');

let state = { enabled: false, mode: 'off', apiKey: '' };
let activeElement = null;
let customInput = null;
let syncTimeout = null;
let observer = null;
let lastCustomValue = '';
const isWhatsApp = window.location.hostname.includes('whatsapp');

function updateState(newState) {
  state = { ...state, ...newState };
  console.log('Smart Input Assistant: Updated state:', state);
  cleanupModes();
  if (state.enabled) {
    if (state.mode === 'habit') {
      runHabitMode();
    } else if (state.mode === 'advanced') {
      runAdvancedMode();
    }
  }
}

function cleanupModes() {
  const existingBox = document.getElementById('custom-input-box');
  if (existingBox) {
    existingBox.remove();
  }
  activeElement = null;
  customInput = null;
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  document.body.classList.remove('custom-input-active');
}
