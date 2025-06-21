// Smart Input Box Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const extensionToggle = document.getElementById('extensionToggle');
  const habitModeToggle = document.getElementById('habitModeToggle');
  const statusDiv = document.getElementById('status');
  
  // Load current settings
  await loadSettings();
  
  // Set up event listeners
  extensionToggle.addEventListener('change', handleExtensionToggle);
  habitModeToggle.addEventListener('change', handleHabitModeToggle);
  
  async function loadSettings() {
    try {
      const settings = await browser.storage.sync.get([
        'enabled',
        'habitMode'
      ]);
      
      // Set toggle states
      extensionToggle.checked = settings.enabled !== false;
      habitModeToggle.checked = settings.habitMode !== false;
      
      // Update status
      updateStatus();
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Failed to load settings');
    }
  }
  
  async function handleExtensionToggle() {
    try {
      const enabled = extensionToggle.checked;
      await browser.storage.sync.set({ enabled });
      
      // Send message to content scripts
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, {
          action: 'toggleExtension',
          enabled
        }).catch(() => {
          // Content script might not be loaded yet
        });
      }
      
      updateStatus();
      showSuccess(`Extension ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling extension:', error);
      showError('Failed to toggle extension');
    }
  }
  
  async function handleHabitModeToggle() {
    try {
      const enabled = habitModeToggle.checked;
      await browser.storage.sync.set({ habitMode: enabled });
      
      // Send message to content scripts
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, {
          action: 'toggleHabitMode',
          enabled
        }).catch(() => {
          // Content script might not be loaded yet
        });
      }
      
      updateStatus();
      showSuccess(`Habit Mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling habit mode:', error);
      showError('Failed to toggle habit mode');
    }
  }
  
  function updateStatus() {
    const extensionEnabled = extensionToggle.checked;
    const habitModeEnabled = habitModeToggle.checked;
    
    let statusText = '';
    let statusClass = '';
    
    if (!extensionEnabled) {
      statusText = '❌ Extension Disabled';
      statusClass = 'disabled';
    } else if (habitModeEnabled) {
      statusText = '✅ Habit Mode Active';
      statusClass = 'enabled';
    } else {
      statusText = '⚠️ No Mode Active';
      statusClass = 'disabled';
    }
    
    statusDiv.textContent = statusText;
    statusDiv.className = `status ${statusClass}`;
  }
  
  function showSuccess(message) {
    statusDiv.textContent = `✅ ${message}`;
    statusDiv.className = 'status enabled';
    
    setTimeout(() => {
      updateStatus();
    }, 2000);
  }
  
  function showError(message) {
    statusDiv.textContent = `❌ ${message}`;
    statusDiv.className = 'status disabled';
    
    setTimeout(() => {
      updateStatus();
    }, 3000);
  }
});

// Handle browser compatibility
if (typeof browser === 'undefined') {
  window.browser = chrome;
}