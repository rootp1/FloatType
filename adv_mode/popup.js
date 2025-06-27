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

    apiKeyInput.addEventListener("input", function () {
      currentState.apiKey = this.value;
    });

    apiKeyInput.addEventListener("blur", function () {
      saveSettings();
    });

    toggleApiVisibility.addEventListener("click", function () {
      const input = apiKeyInput;
      const icon = this.querySelector("svg");
      if (input.type === "password") {
        input.type = "text";
        icon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06L17.94 17.94Z" stroke="currentColor" stroke-width="2"/>
                <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            `;
      } else {
        input.type = "password";
        icon.innerHTML = `
                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            `;
      }
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
          apiKey: "",
        };
        updateUI();
        saveSettings();
        showNotification("Settings reset successfully!", "info");
      }
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

function selectModeCard(mode) {
    clearModeCardSelections();
    const card = document.querySelector(`[data-mode="${mode}"]`);
    if (card) {
        card.classList.add('selected');
    }
}

function clearModeCardSelections() {
    modeCards.forEach(card => card.classList.remove('selected'));
}
