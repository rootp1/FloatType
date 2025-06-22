// Smart Input Box Extension - Background Script

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    browser.storage.sync.set({
      enabled: true,
      habitMode: true,
      advancedMode: false
    });
    
    console.log('Smart Input Box extension installed');
  }
});

// Handle keyboard shortcuts
browser.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'toggle-extension':
      toggleExtension();
      break;
    case 'toggle-habit-mode':
      toggleHabitMode();
      break;
  }
});

async function toggleExtension() {
  try {
    const result = await browser.storage.sync.get(['enabled']);
    const newState = !result.enabled;
    
    await browser.storage.sync.set({ enabled: newState });
    
    // Send message to all content scripts
    const tabs = await browser.tabs.query({});
    tabs.forEach(tab => {
      browser.tabs.sendMessage(tab.id, {
        action: 'toggleExtension',
        enabled: newState
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
    
    // Show notification
    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Smart Input Box',
      message: `Extension ${newState ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling extension:', error);
  }
}

async function toggleHabitMode() {
  try {
    const result = await browser.storage.sync.get(['habitMode']);
    const newState = !result.habitMode;
    
    await browser.storage.sync.set({ habitMode: newState });
    
    // Send message to all content scripts
    const tabs = await browser.tabs.query({});
    tabs.forEach(tab => {
      browser.tabs.sendMessage(tab.id, {
        action: 'toggleHabitMode',
        enabled: newState
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
    
    // Show notification
    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Smart Input Box',
      message: `Habit Mode ${newState ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling habit mode:', error);
  }
}

// Handle messages from content scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings':
      getSettings().then(sendResponse);
      return true; // Will respond asynchronously
      
    case 'saveSettings':
      saveSettings(request.settings).then(sendResponse);
      return true;
  }
});

async function getSettings() {
  try {
    const result = await browser.storage.sync.get([
      'enabled',
      'habitMode',
      'advancedMode'
    ]);
    
    return {
      enabled: result.enabled !== false,
      habitMode: result.habitMode !== false,
      advancedMode: result.advancedMode === true
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      enabled: true,
      habitMode: true,
      advancedMode: false
    };
  }
}

async function saveSettings(settings) {
  try {
    await browser.storage.sync.set(settings);
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
}

// Handle browser action click
browser.browserAction.onClicked.addListener((tab) => {
  // This will open the popup, which is handled by popup.html
});

console.log('Smart Input Box background script loaded');