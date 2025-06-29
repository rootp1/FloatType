console.log("Smart Input Assistant: Background script loaded");

chrome.runtime.onInstalled.addListener(function (details) {
  console.log("Smart Input Assistant: Extension installed/updated");
  chrome.storage.local.set(
    {
      enabled: false,
      mode: "off",
      apiKey: "",
    },
    function () {
      console.log("Smart Input Assistant: Default settings initialized");
    }
  );
  updateBadge(false);
  if (details.reason === "install") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Smart Input Assistant Installed!",
      message: "Click the extension icon to get started with enhanced typing.",
    });
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "local" && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

function updateBadge(enabled) {
  if (enabled) {
    chrome.browserAction.setBadgeText({ text: "ON" });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#10b981" });
    chrome.browserAction.setTitle({ title: "Smart Input Assistant - Active" });
  } else {
    chrome.browserAction.setBadgeText({ text: "" });
    chrome.browserAction.setTitle({
      title: "Smart Input Assistant - Click to activate",
    });
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Smart Input Assistant: Message received:", request);
  switch (request.action) {
    case "getSettings":
      chrome.storage.local.get(
        ["enabled", "mode", "apiKey"],
        function (result) {
          sendResponse({
            enabled: result.enabled || false,
            mode: result.mode || "off",
            apiKey: result.apiKey || "",
          });
        }
      );
      return true;
    case "updateSettings":
      chrome.storage.local.set(request.settings, function () {
        updateBadge(request.settings.enabled);
        sendResponse({ success: true });
      });
      return true;
    case "showNotification":
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: request.title || "Smart Input Assistant",
        message: request.message,
      });
      sendResponse({ success: true });
      break;
    case "logError":
      console.error("Smart Input Assistant Error:", request.error);
      sendResponse({ success: true });
      break;
    default:
      console.log("Smart Input Assistant: Unknown action:", request.action);
      sendResponse({ error: "Unknown action" });
  }
});

chrome.browserAction.onClicked.addListener(function (tab) {
  console.log("Smart Input Assistant: Browser action clicked");
  chrome.storage.local.get(["enabled"], function (result) {
    const newState = !result.enabled;
    chrome.storage.local.set({ enabled: newState }, function () {
      updateBadge(newState);
      chrome.tabs.sendMessage(tab.id, {
        action: "updateState",
        state: { enabled: newState },
      });
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Smart Input Assistant",
        message: newState ? "Extension activated!" : "Extension deactivated!",
      });
    });
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.local.get(["enabled"], function (result) {
      if (result.enabled) {
        console.log("Smart Input Assistant: Tab updated, extension is enabled");
      }
    });
  }
});

fetch(chrome.runtime.getURL('adv_mode/.env'))
  .then(response => response.text())
  .then(text => {
    const match = text.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
    if (match) {
      chrome.storage.local.set({ apiKey: match[1].trim() });
      console.log('Smart Input Assistant: API key loaded from .env');
    }
  })
  .catch(err => {
    console.warn('Smart Input Assistant: Could not load .env file', err);
  });
