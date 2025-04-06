chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "answer",
    title: "Answer",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "answer" && info.selectionText) {
    // Send a message to the content script with the selected text
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      chrome.tabs.sendMessage(tab.id, { action: "answer", text: info.selectionText });
    });
  }
});
