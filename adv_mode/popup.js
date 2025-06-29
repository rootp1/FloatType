document.addEventListener("DOMContentLoaded", function () {
  const enabledToggle = document.getElementById("enabled-toggle");
  const modeSection = document.getElementById("mode-section");
  const statusIndicator = document.getElementById("status-indicator");
  const statusDot = statusIndicator.querySelector(".status-dot");
  const habitModeRadio = document.getElementById("habit-mode");
  const advancedModeRadio = document.getElementById("advanced-mode");
  const saveButton = document.getElementById("save-settings");
  const resetButton = document.getElementById("reset-settings");
  const modeCards = document.querySelectorAll(".mode-card");

  let currentState = {
    enabled: false,
    mode: "off",
  };

  loadSettings();
  setupEventListeners();
  updateUI();

  function loadSettings() {
    chrome.storage.local.get(["enabled", "mode"], function (result) {
      currentState = {
        enabled: result.enabled || false,
        mode: result.mode || "off",
      };
      updateUI();
    });
  }

  function updateUI() {
    enabledToggle.checked = currentState.enabled;
    if (currentState.enabled) {
      statusDot.classList.add("active");
      statusIndicator.innerHTML = `
                <div class="status-dot active"></div>
                <span>Active</span>
            `;
    } else {
      statusDot.classList.remove("active");
      statusIndicator.innerHTML = `
                <div class="status-dot"></div>
                <span>Inactive</span>
            `;
    }
    if (currentState.enabled) {
      modeSection.classList.remove("disabled");
    } else {
      modeSection.classList.add("disabled");
    }
    if (currentState.mode === "habit") {
      habitModeRadio.checked = true;
      selectModeCard("habit");
    } else if (currentState.mode === "advanced") {
      advancedModeRadio.checked = true;
      selectModeCard("advanced");
    } else {
      habitModeRadio.checked = false;
      advancedModeRadio.checked = false;
      clearModeCardSelections();
    }
  }

  function selectModeCard(mode) {
    clearModeCardSelections();
    const card = document.querySelector(`[data-mode="${mode}"]`);
    if (card) {
      card.classList.add("selected");
    }
  }

  function clearModeCardSelections() {
    modeCards.forEach((card) => card.classList.remove("selected"));
  }

  function setupEventListeners() {
    enabledToggle.addEventListener("change", function () {
      currentState.enabled = this.checked;
      if (!this.checked) {
        currentState.mode = "off";
        habitModeRadio.checked = false;
        advancedModeRadio.checked = false;
      }
      updateUI();
      saveSettings();
    });

    habitModeRadio.addEventListener("change", function () {
      if (this.checked) {
        currentState.mode = "habit";
        selectModeCard("habit");
        updateUI();
        saveSettings();
      }
    });

    advancedModeRadio.addEventListener("change", function () {
      if (this.checked) {
        currentState.mode = "advanced";
        selectModeCard("advanced");
        updateUI();
        saveSettings();
      }
    });

    modeCards.forEach((card) => {
      card.addEventListener("click", function () {
        if (!currentState.enabled) return;
        const mode = this.getAttribute("data-mode");
        const radio = document.getElementById(`${mode}-mode`);
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change"));
        }
      });
    });

    saveButton.addEventListener("click", function () {
      saveSettings();
      showNotification("Settings saved successfully!", "success");
    });

    resetButton.addEventListener("click", function () {
      if (confirm("Are you sure you want to reset all settings?")) {
        currentState = {
          enabled: false,
          mode: "off",
        };
        updateUI();
        saveSettings();
        showNotification("Settings reset successfully!", "info");
      }
    });
  }

  function saveSettings() {
    chrome.storage.local.set(
      {
        enabled: currentState.enabled,
        mode: currentState.mode,
      },
      function () {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (tabs[0]) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  action: "updateState",
                  state: currentState,
                },
                function (response) {}
              );
            }
          }
        );
      }
    );
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 200px;
        `;
    switch (type) {
      case "success":
        notification.style.background = "#10b981";
        break;
      case "error":
        notification.style.background = "#ef4444";
        break;
      case "info":
      default:
        notification.style.background = "#3b82f6";
        break;
    }
    const style = document.createElement("style");
    style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);
  }

  chrome.browserAction.onClicked.addListener(function () {
    showNotification("Extension popup opened!", "info");
  });
});
