// background.js - Handles extension initialization and message passing

// Set up context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "answer",
    title: "Answer",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "answer" && info.selectionText) {
    // Inject content script and send the selected text
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      chrome.tabs.sendMessage(tab.id, { 
        action: "answer", 
        text: info.selectionText 
      });
    });
  }
});

// Handle request for user configuration
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getConfiguration") {
    // Get user settings from storage with defaults
    chrome.storage.sync.get({
      'geminiApiKey': '',
      'checkButton': true,
      'checkMark': true,
      'gemini25': false,
      'theme': 'auto'
    }, (data) => {
      sendResponse({
        geminiApiKey: data.geminiApiKey,
        checkButton: data.checkButton,
        checkMark: data.checkMark,
        gemini25: data.gemini25,
        theme: data.theme
      });
    });
    return true; // Required to use sendResponse asynchronously
  }
});
