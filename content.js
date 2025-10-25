// content.js - Handles content script functionality with iframe support

// Global variables
let apiKey = '';
let gemini25 = false;
let checkedButton = true;
let checkedMark = true;
let themeMode = 'auto';
let popupButton = null;
let answerPopup = null;

let selectedTextX = 0;
let selectedTextY = 0;

// Initialize extension
function initializeExtension() {
  // Get user configuration before setting up functionality
  chrome.runtime.sendMessage({ action: "getConfiguration" }, (response) => {
    if (response) {
      apiKey = response.geminiApiKey;
      gemini25 = response.gemini25;
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
    
    // Get the position at the end of the selection for better placement
    const rects = range.getClientRects();
    let rect;
    
    if (rects.length > 0) {
      // Use the last rectangle (end of selection) for multi-line selections
      rect = rects[rects.length - 1];
    } else {
      // Fallback to bounding rect
      rect = range.getBoundingClientRect();
    }

    // Store coordinates - we'll adjust them in showSelectionButton based on parent
    // Position at the end of the last line
    selectedTextX = rect.right;
    selectedTextY = rect.bottom;

    // Show button near selection
    showSelectionButton(selectedText);
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

// Get the best parent element for injection
function getParentElement() {
  // Try to find form-specific container first
  let parent = document.getElementById("form-main-content1");
  
  if (parent) {
    // Make sure it's positioned
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    return parent;
  }
  
  // Try other common form containers
  const selectors = [
    '[role="main"]',
    '.main-content',
    '#main-content',
    'main',
    '[data-form-content]'
  ];
  
  for (const selector of selectors) {
    parent = document.querySelector(selector);
    if (parent) {
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      return parent;
    }
  }
  
  // Fallback to body, but use fixed positioning
  return document.body;
}

// Show button near text selection
function showSelectionButton(selectedText) {
  // Remove existing button if any
  hideSelectionButton();

  popupButton = document.createElement('div');
  popupButton.id = 'my-selection-popupButton';
  
  // Get icon from extension
  const icon16 = chrome.runtime.getURL("icons/icon16.png");
  
  // Create button content
  popupButton.innerHTML = `
    <button id="popupButton-action-button" style="
      border: none;
      background: white;
      border-radius: 4px;
      padding: 4px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <img src="${icon16}" alt="Answer" style="display: block;">
    </button>
  `;

  const parentEl = getParentElement();
  const isBodyParent = parentEl === document.body;
  
  // Calculate correct position based on parent element
  let finalX, finalY;
  
  if (isBodyParent) {
    // Use fixed positioning with viewport coordinates
    finalX = selectedTextX;
    finalY = selectedTextY;
    popupButton.style.position = 'fixed';
  } else {
    // Use absolute positioning relative to parent
    const parentRect = parentEl.getBoundingClientRect();
    finalX = selectedTextX - parentRect.left + parentEl.scrollLeft;
    finalY = selectedTextY - parentRect.top + parentEl.scrollTop;
    popupButton.style.position = 'absolute';
  }
  
  popupButton.style.left = `${finalX}px`;
  popupButton.style.top = `${finalY + 5}px`; // 5px below selection
  popupButton.style.zIndex = '2147483647';
  
  // Add to page
  parentEl.appendChild(popupButton);

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
  
  const parentEl = getParentElement();
  const isBodyParent = parentEl === document.body;
  
  // Calculate correct position based on parent element
  let finalX, finalY;
  
  if (isBodyParent) {
    // Use fixed positioning with viewport coordinates
    finalX = selectedTextX;
    finalY = selectedTextY + 5;
    answerPopup.style.position = 'fixed';
  } else {
    // Use absolute positioning relative to parent
    const parentRect = parentEl.getBoundingClientRect();
    finalX = selectedTextX - parentRect.left + parentEl.scrollLeft;
    finalY = selectedTextY - parentRect.top + parentEl.scrollTop + 5;
    answerPopup.style.position = 'absolute';
  }
  
  // Set styling
  answerPopup.style.left = `${finalX}px`;
  answerPopup.style.top = `${finalY}px`;
  answerPopup.style.border = "1px solid";
  answerPopup.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  answerPopup.style.padding = "12px";
  answerPopup.style.borderRadius = "8px";
  answerPopup.style.maxWidth = "400px";
  answerPopup.style.minWidth = "200px";
  answerPopup.style.zIndex = "2147483647";
  answerPopup.style.fontFamily = "system-ui, -apple-system, sans-serif";
  answerPopup.style.fontSize = "14px";
  answerPopup.style.lineHeight = "1.5";

  // Show loading state
  answerPopup.innerText = "Loading...";
  
  // Add popup to page
  parentEl.appendChild(answerPopup);

  // Add click outside handler IMMEDIATELY (before loading)
  setupPopupClickOutside(answerPopup);

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
}

// Setup click outside handler for popup
function setupPopupClickOutside(popup) {
  const outsideClickListener = event => {
    if (!popup.contains(event.target) && isVisible(popup)) { 
      popup.style.display = 'none';
      document.removeEventListener('click', outsideClickListener);
    }
  };

  // Small delay to avoid immediate closing
  setTimeout(() => {
    document.addEventListener('click', outsideClickListener);
  }, 100);
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
  let model = "";
  if(gemini25) model = "gemini-2.5-flash"
  else model = "gemini-2.0-flash"
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, 
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
    if (checkedMark) {
      return model + "Gemini: " + result;
    }
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
