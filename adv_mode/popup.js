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
});
