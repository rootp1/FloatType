document.addEventListener("DOMContentLoaded", function () {
  const enabledToggle = document.getElementById("enabled-toggle");
  const modeSection = document.getElementById("mode-section");
  const apiSection = document.getElementById("api-section");
  const statusIndicator = document.getElementById("status-indicator");
  const statusDot = statusIndicator.querySelector(".status-dot");
  const habitModeRadio = document.getElementById("habit-mode");
  const advancedModeRadio = document.getElementById("advanced-mode");
  const apiKeyInput = document.getElementById("api-key");
  const toggleApiVisibility = document.getElementById("toggle-api-visibility");
  const saveButton = document.getElementById("save-settings");
  const resetButton = document.getElementById("reset-settings");
  const modeCards = document.querySelectorAll(".mode-card");

  let currentState = {
    enabled: false,
    mode: "off",
    apiKey: "",
  };

  loadSettings();
  setupEventListeners();
  updateUI();

  function loadSettings() {
    chrome.storage.local.get(["enabled", "mode", "apiKey"], function (result) {
      currentState = {
        enabled: result.enabled || false,
        mode: result.mode || "off",
        apiKey: result.apiKey || "",
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
    if (currentState.mode === "advanced" && currentState.enabled) {
      apiSection.classList.remove("hidden");
    } else {
      apiSection.classList.add("hidden");
    }
    apiKeyInput.value = currentState.apiKey;
  }
});
