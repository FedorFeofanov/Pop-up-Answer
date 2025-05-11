// Add Google Gemini
async function callGemini(prompt) {
  const responseFromBg = await chrome.runtime.sendMessage({ action: "getGeminiApiKey" });
  const apiKey = responseFromBg.geminiApiKey;
  if (!apiKey) return "Error: Gemini API Key not set. Please configure it in the extension settings.";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
  },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    })
  });
  if (!response.ok) return "Error with API";
  const data = await response.json();
  const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return result;
}

let popupButton = null; // To keep a reference to popupButton
let popup = null;

// Function to create and show the popupButton
function showSelectionPopupButton(selectedText, x, y) {
  // Remove existing popupButton if any
  if (popupButton) {
    popupButton.remove();
  }

  // Create the popupButton element
  popupButton = document.createElement('div');
  popupButton.id = 'my-selection-popupButton'; // For styling
  icon16 = chrome.runtime.getURL("icons/icon16.png");
  popupButton.innerHTML = `
    <button id="popupButton-action-button"><img src="${icon16}" alt="icon not found"></button>
  `; // Keep it simple

  // Basic styling 
  popupButton.style.position = 'absolute';
  popupButton.style.left = `${x}px`;
  popupButton.style.top = `${y}px`; // Position slightly below the selection

  document.body.appendChild(popupButton);

  // Add event listener for the button inside the popupButton
  const actionButton = document.getElementById('popupButton-action-button');
  if (actionButton) {
    actionButton.addEventListener('click', () => {
      showAnswer(selectedText) 
      hideSelectionPopupButton();
    });
  }
}

function hideSelectionPopupButton() {
  if (popupButton) {
    popupButton.remove();
    popupButton = null;
  }
}

// Listen for mouseup event
document.addEventListener('mouseup', function(event) {
  // Don't show popupButton if the click was inside our own popupButton
  if (popupButton && popupButton.contains(event.target) || popup && popup.contains(event.target)) {
    return;
  }

  const selectedText = window.getSelection().toString().trim();

  if (selectedText) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return; // No selection range

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Show popupButton near the selection
    // rect.left is relative to viewport, window.scrollX for absolute page position
    showSelectionPopupButton(selectedText, rect.left + window.scrollX, rect.bottom + window.scrollY);
  } else {
    // If no text is selected, hide the popupButton (e.g., user clicked away)
    hideSelectionPopupButton();
  }
});

// Optional: Listen for clicks elsewhere on the page to dismiss the popupButton
document.addEventListener('mousedown', function(event) {
  // If a popupButton exists and the click is outside of it
  if (popupButton && !popupButton.contains(event.target)) {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) { // Only hide if there's no active selection
        hideSelectionPopupButton();
    }
  }
});
// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "answer" && request.text) {
    showAnswer(request.text);
  }
});

function hideOnClickOutside(popup) {
    const outsideClickListener = event => {
        if (!popup.contains(event.target) && isVisible(popup)) { 
          popup.style.display = 'none';
          removeClickListener();
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener);
    }

    document.addEventListener('click', outsideClickListener);
}

const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );

async function showAnswer(selectedText) {
  // Create the popup element
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  popup = document.createElement("div");
  popup.id = "answer-popup";
  popup.style.position = "absolute";
  popup.style.backgroundColor = isDarkMode ? "#222" : "white";
  popup.style.color = isDarkMode ? "white" : "black";
  popup.style.borderColor = isDarkMode ? "black": "#ddd";
  popup.style.border = "1px solid";
  popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
  popup.style.padding = "5px";
  popup.style.borderRadius = "3px";

  let answers = {};
  try {
      const url = chrome.runtime.getURL("answers.json");
      const response = await fetch(url);
      answers = await response.json();
    } catch (error) {
      console.error('Error loading answers:', error);
    }
    try {
    let found = false;

    for (const [question, answer] of Object.entries(answers)) {
      if (question.toLowerCase().includes(selectedText.toLowerCase())) {
        popup.innerText = answer;
        found = true;
        break;
      }
    }

    if (!found) {
      geminiAnswer = "Gemini: " + await callGemini("Answer the following question, give the shortest answer possible. If asked to provide a date, provide the one you're most certain of. If there seem to be provided answer options after the question, select the answer from them. Do not use any formating, answer in plain text. Here is the question: " + selectedText);
      popup.innerText = geminiAnswer;
    }
  } catch (error) {
    popup.innerText = "Error searching for answer.";
  }

  // Append the popup to the body
  document.body.appendChild(popup);

  // Position the popup near the selection
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
  }

  hideOnClickOutside(popup);
}
