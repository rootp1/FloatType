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
