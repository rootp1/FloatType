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
    this.createFloatingBox();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    console.log("Smart Input Box initialized");
  }

  async loadSettings() {
    try {
      const result = await browser.storage.sync.get(["enabled", "habitMode"]);
      this.isEnabled = result.enabled !== false;
      this.habitModeEnabled = result.habitMode !== false;
    } catch (error) {
      console.log("Failed to load settings, using defaults");
    }
  }

  async saveSettings() {
    try {
      await browser.storage.sync.set({
        enabled: this.isEnabled,
        habitMode: this.habitModeEnabled,
      });
    } catch (error) {
      console.log("Failed to save settings");
    }
  }

  createFloatingBox() {
    this.floatingBox = document.createElement("div");
    this.floatingBox.className = "smart-input-floating-container";
    this.floatingBox.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      background: white;
      border: 2px solid #4285f4;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 12px;
      display: none;
      min-width: 400px;
      max-width: 80vw;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
      color: #666;
    `;
    const title = document.createElement("span");
    title.textContent = "📝 Smart Input Box (Habit Mode)";
    title.style.fontWeight = "500";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.onclick = () => this.hideFloatingBox();
    header.appendChild(title);
    header.appendChild(closeBtn);
    this.floatingInput = document.createElement("textarea");
    this.floatingInput.className = "smart-input-floating-input";
    this.floatingInput.style.cssText = `
      width: 100%;
      min-height: 40px;
      max-height: 200px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    `;
    this.floatingInput.placeholder = "Type here - synced with focused input...";
    const info = document.createElement("div");
    info.style.cssText = `
      margin-top: 6px;
      font-size: 11px;
      color: #888;
      text-align: center;
    `;
    info.textContent = "Ctrl+Shift+H to toggle • ESC to close";
    this.floatingBox.appendChild(header);
    this.floatingBox.appendChild(this.floatingInput);
    this.floatingBox.appendChild(info);
    document.body.appendChild(this.floatingBox);
  }

  setupEventListeners() {
    document.addEventListener("focusin", (e) => {
      if (!this.isEnabled || !this.habitModeEnabled) return;
      const target = e.target;
      if (this.isInputElement(target) && target !== this.floatingInput) {
        this.handleInputFocus(target);
      }
    });
    document.addEventListener("focusout", (e) => {
      if (!this.isEnabled || !this.habitModeEnabled) return;
      setTimeout(() => {
        if (
          !this.isFloatingActive &&
          document.activeElement !== this.floatingInput
        ) {
          this.hideFloatingBox();
        }
      }, 100);
    });
    this.floatingInput.addEventListener("input", (e) => {
      if (this.syncInProgress) return;
      this.syncToOriginal();
    });
    this.floatingInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideFloatingBox();
        if (this.currentInput) {
          this.currentInput.focus();
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        if (
          this.currentInput &&
          this.currentInput.tagName.toLowerCase() === "input"
        ) {
          e.preventDefault();
          this.syncToOriginal();
          const enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
          });
          this.currentInput.dispatchEvent(enterEvent);
        }
      }
    });
    this.floatingBox.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    document.addEventListener("click", (e) => {
      if (
        this.floatingBox &&
        this.floatingBox.style.display !== "none" &&
        !this.floatingBox.contains(e.target) &&
        !this.isInputElement(e.target)
      ) {
        this.hideFloatingBox();
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        this.toggleExtension();
      }
      if (e.ctrlKey && e.shiftKey && e.key === "H") {
        e.preventDefault();
        this.toggleHabitMode();
      }
      if (
        e.key === "Escape" &&
        this.floatingBox &&
        this.floatingBox.style.display !== "none"
      ) {
        this.hideFloatingBox();
      }
    });
  }

  isInputElement(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    const type = element.type ? element.type.toLowerCase() : "";
    return (
      tagName === "textarea" ||
      (tagName === "input" &&
        [
          "text",
          "password",
          "email",
          "search",
          "tel",
          "url",
          "number",
        ].includes(type)) ||
      element.contentEditable === "true" ||
      element.isContentEditable
    );
  }

  handleInputFocus(input) {
    this.currentInput = input;
    this.showFloatingBox();
    this.syncFromOriginal();
    setTimeout(() => {
      this.floatingInput.focus();
      this.floatingInput.setSelectionRange(
        this.floatingInput.value.length,
        this.floatingInput.value.length
      );
    }, 50);
  }

  showFloatingBox() {
    if (!this.floatingBox) return;
    this.floatingBox.style.display = "block";
    this.isFloatingActive = true;
    this.floatingBox.style.opacity = "0";
    this.floatingBox.style.transform = "translateX(-50%) translateY(-10px)";
    setTimeout(() => {
      this.floatingBox.style.transition = "all 0.2s ease-out";
      this.floatingBox.style.opacity = "1";
      this.floatingBox.style.transform = "translateX(-50%) translateY(0)";
    }, 10);
  }

  hideFloatingBox() {
    if (!this.floatingBox) return;
    this.floatingBox.style.transition = "all 0.15s ease-in";
    this.floatingBox.style.opacity = "0";
    this.floatingBox.style.transform = "translateX(-50%) translateY(-10px)";
    setTimeout(() => {
      this.floatingBox.style.display = "none";
      this.isFloatingActive = false;
      this.currentInput = null;
    }, 150);
  }

  syncFromOriginal() {
    if (!this.currentInput || this.syncInProgress) return;
    this.syncInProgress = true;
    try {
      let value = "";
      if (
        this.currentInput.tagName.toLowerCase() === "textarea" ||
        this.currentInput.tagName.toLowerCase() === "input"
      ) {
        value = this.currentInput.value;
      } else if (this.currentInput.contentEditable === "true") {
        value = this.currentInput.textContent || this.currentInput.innerText;
      }
      this.floatingInput.value = value;
      this.adjustFloatingInputHeight();
    } finally {
      this.syncInProgress = false;
    }
  }

  syncToOriginal() {
    if (!this.currentInput || this.syncInProgress) return;
    this.syncInProgress = true;
    try {
      const value = this.floatingInput.value;
      if (
        this.currentInput.tagName.toLowerCase() === "textarea" ||
        this.currentInput.tagName.toLowerCase() === "input"
      ) {
        this.currentInput.value = value;
        const inputEvent = new Event("input", { bubbles: true });
        const changeEvent = new Event("change", { bubbles: true });
        this.currentInput.dispatchEvent(inputEvent);
        this.currentInput.dispatchEvent(changeEvent);
      } else if (this.currentInput.contentEditable === "true") {
        this.currentInput.textContent = value;
        const inputEvent = new Event("input", { bubbles: true });
        this.currentInput.dispatchEvent(inputEvent);
      }
      this.adjustFloatingInputHeight();
    } finally {
      this.syncInProgress = false;
    }
  }

  adjustFloatingInputHeight() {
    if (!this.floatingInput) return;
    this.floatingInput.style.height = "auto";
    const scrollHeight = this.floatingInput.scrollHeight;
    const maxHeight = 200;
    this.floatingInput.style.height = Math.min(scrollHeight, maxHeight) + "px";
  }

  toggleExtension() {
    this.isEnabled = !this.isEnabled;
    this.saveSettings();
    if (!this.isEnabled) {
      this.hideFloatingBox();
    }
    this.showNotification(
      `Extension ${this.isEnabled ? "enabled" : "disabled"}`
    );
  }

  toggleHabitMode() {
    this.habitModeEnabled = !this.habitModeEnabled;
    this.saveSettings();
    if (!this.habitModeEnabled) {
      this.hideFloatingBox();
    }
    this.showNotification(
      `Habit Mode ${this.habitModeEnabled ? "enabled" : "disabled"}`
    );
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

if (typeof browser === "undefined") {
  window.browser = chrome;
}

const smartInputBox = new SmartInputBox();
