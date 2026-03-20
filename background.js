// background.js - Handles extension initialization and message passing

// Set up context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "answer",
    title: "Answer",
    contexts: ["selection", "image"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "answer") {
    if (info.mediaType === "image") {
      try {
        const response = await fetch(info.srcUrl);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });

        chrome.tabs.sendMessage(tab.id, {
          action: "answer",
          image: base64,
          mimeType: blob.type
        });
      } catch (error) {
        console.error("Error fetching image:", error);
        chrome.tabs.sendMessage(tab.id, {
          action: "answer",
          error: "Failed to load image: " + error.message
        });
      }
    } else if (info.selectionText) {
      chrome.tabs.sendMessage(tab.id, {
        action: "answer",
        text: info.selectionText
      });
    }
  }
});


