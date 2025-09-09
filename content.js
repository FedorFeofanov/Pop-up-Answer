// content.js - Handles content script functionality

// Global variables
let apiKey = '';
let checkedButton = true;
let checkedMark = true;
let themeMode = 'auto';
let popupButton = null;
let answerPopup = null;

// Initialize extension
function initializeExtension() {
  // Get user configuration before setting up functionality
  chrome.runtime.sendMessage({ action: "getConfiguration" }, (response) => {
    if (response) {
      apiKey = response.geminiApiKey;
      checkedButton = response.checkButton;
      checkedMark = response.checkMark;
      themeMode = response.theme || 'auto';
      
      // Set up event listeners after configuration is loaded
      setupEventListeners();
    } else {
      console.error("Failed to load configuration");
    }
  });
}

// Set up all event listeners
function setupEventListeners() {
  // Text selection event handler
  document.addEventListener('mouseup', handleTextSelection);
  
  // Click outside handler
  document.addEventListener('mousedown', handleClickOutside);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleBackgroundMessages);
}

// Handle text selection
function handleTextSelection(event) {
  // Ignore if click was inside our UI elements
  if ((popupButton && popupButton.contains(event.target)) || 
      (answerPopup && answerPopup.contains(event.target))) {
    return;
  }

  const selectedText = window.getSelection().toString().trim();

  // Show popup button if text is selected and button is enabled
  if (selectedText && checkedButton) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Show button near selection
    showSelectionButton(
      selectedText, 
      rect.left + window.scrollX, 
      rect.bottom + window.scrollY
    );
  } else {
    // Hide button if no text selected
    hideSelectionButton();
  }
}

// Handle clicks outside selection
function handleClickOutside(event) {
  if (popupButton && !popupButton.contains(event.target)) {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
      hideSelectionButton();
    }
  }
}

// Handle messages from background script
function handleBackgroundMessages(request, sender, sendResponse) {
  if (request.action === "answer" && request.text) {
    showAnswer(request.text);
  }
}

// Show button near text selection
function showSelectionButton(selectedText, x, y) {
  // Remove existing button if any
  hideSelectionButton();

  // Create button element
  popupButton = document.createElement('div');
  popupButton.id = 'my-selection-popupButton';
  
  // Get icon from extension
  const icon16 = chrome.runtime.getURL("icons/icon16.png");
  
  // Create button content
  popupButton.innerHTML = `
    <button id="popupButton-action-button">
      <img src="${icon16}" alt="Answer">
    </button>
  `;

  // Position button
  popupButton.style.position = 'absolute';
  popupButton.style.left = `${x}px`;
  popupButton.style.top = `${y}px`;

  // Add to page
  document.body.appendChild(popupButton);

  // Add click handler
  const actionButton = document.getElementById('popupButton-action-button');
  if (actionButton) {
    actionButton.addEventListener('click', () => {
      showAnswer(selectedText);
      hideSelectionButton();
    });
  }
}

// Hide selection button
function hideSelectionButton() {
  if (popupButton) {
    popupButton.remove();
    popupButton = null;
  }
}

// Show answer popup
async function showAnswer(selectedText) {
  // Create popup element
  answerPopup = document.createElement("div");
  answerPopup.id = "answer-popup";
  
  // Apply theme
  applyThemeToPopup(answerPopup);
  
  // Set base styling
  answerPopup.style.position = "absolute";
  answerPopup.style.border = "1px solid";
  answerPopup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
  answerPopup.style.padding = "10px";
  answerPopup.style.borderRadius = "5px";
  answerPopup.style.maxWidth = "300px";
  answerPopup.style.zIndex = "10000";

  // Try to get answers from local storage
  try {
    // Try to get predefined answers
    const answers = await loadAnswers();
    let found = false;

    // Check for matches in predefined answers
    for (const [question, answer] of Object.entries(answers)) {
      if (question.toLowerCase().includes(selectedText.toLowerCase())) {
        answerPopup.innerText = answer;
        found = true;
        break;
      }
    }

    // If no match found, query Gemini API
    if (!found) {
      const geminiAnswer = await getGeminiAnswer(selectedText);
      answerPopup.innerText = geminiAnswer;
    }
  } catch (error) {
    answerPopup.innerText = "Error searching for answer: " + error.message;
  }

  // Add popup to page
  document.body.appendChild(answerPopup);

  // Position popup near selection
  positionPopup(answerPopup);

  // Add click outside handler
  setupPopupClickOutside(answerPopup);
}

// Position popup near selection
function positionPopup(popup) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
  }
}

// Setup click outside handler for popup
function setupPopupClickOutside(popup) {
  const outsideClickListener = event => {
    if (!popup.contains(event.target) && isVisible(popup)) { 
      popup.style.display = 'none';
      document.removeEventListener('click', outsideClickListener);
    }
  };

  document.addEventListener('click', outsideClickListener);
}

// Load answers from JSON file
async function loadAnswers() {
  try {
    const url = chrome.runtime.getURL("answers.json");
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error loading answers:', error);
    return {};
  }
}

// Get answer from Gemini API
async function getGeminiAnswer(query) {
  if (!apiKey) {
    return "Error: Gemini API Key not set. Please configure it in the extension settings.";
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { 
                  text: `Answer the following question, give the shortest answer possible. 
                         If asked to provide a date, provide the one you're most certain of. 
                         If there seem to be provided answer options after the question, 
                         select the answer from them. Do not use any formatting, 
                         answer in plain text. Here is the question: ${query}`
                }
              ]
            }
          ]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer found";
    if (checkedMark){return "Gemini: " + result;}
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Error with Gemini API: " + error.message;
  }
}

// Apply theme to popup
function applyThemeToPopup(popup) {
  let isDark = false;
  
  // Determine if dark mode based on user preference or system
  if (themeMode === 'auto') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = themeMode === 'dark';
  }
  
  // Apply appropriate theme
  if (isDark) {
    popup.style.backgroundColor = "#222";
    popup.style.color = "#eee";
    popup.style.borderColor = "#444";
  } else {
    popup.style.backgroundColor = "#fff";
    popup.style.color = "#222";
    popup.style.borderColor = "#ddd";
  }
}

// Check if element is visible
function isVisible(element) {
  return !!(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
}

// Initialize extension
initializeExtension();
