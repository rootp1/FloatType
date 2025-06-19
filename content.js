class SmartInputBox {
  constructor() {
    this.isEnabled = true;
    this.habitModeEnabled = true;
    this.currentInput = null;
    this.floatingBox = null;
    this.floatingInput = null;
    this.isFloatingActive = false;
    this.syncInProgress = false;
    this.init();
  }

  async init() {
    await this.loadSettings();
    console.log('Smart Input Box initialized');
  }

  async loadSettings() {
    try {
      const result = await browser.storage.sync.get(['enabled', 'habitMode']);
      this.isEnabled = result.enabled !== false;
      this.habitModeEnabled = result.habitMode !== false;
    } catch (error) {
      console.log('Failed to load settings, using defaults');
    }
  }

  async saveSettings() {
    try {
      await browser.storage.sync.set({
        enabled: this.isEnabled,
        habitMode: this.habitModeEnabled
      });
    } catch (error) {
      console.log('Failed to save settings');
    }
  }
}

if (typeof browser === 'undefined') {
  window.browser = chrome;
}

const smartInputBox = new SmartInputBox();
