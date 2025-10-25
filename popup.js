// popup.js - Handles the extension popup UI

document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const apiKeyInput = document.getElementById('api-key-input');
  const checkButtonInput = document.getElementById('check-button-input');
  const checkMarkInput = document.getElementById('check-gemini-mark-input');
  const versionInput = document.getElementById('check-gemini-25');
  const themeSelect = document.getElementById('theme-select');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');
  
  // Load saved settings
  loadSettings();
  
  // Apply theme on load
  applyTheme();
  
  // Set up event listeners
  saveButton.addEventListener('click', saveSettings);
  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
  });
  
  // Load saved settings from storage
  function loadSettings() {
    chrome.storage.sync.get({
      'geminiApiKey': '',
      'checkButton': true,
      'checkMark': true,
      'gemini25': false,
      'theme': 'auto'
    }, (data) => {
      // Populate input fields with saved values
      apiKeyInput.value = data.geminiApiKey;
      checkButtonInput.checked = data.checkButton;
      checkMarkInput.checked = data.checkMark;
      versionInput.checked = data.gemini25;
      themeSelect.value = data.theme;
      
      // Apply saved theme
      applyTheme(data.theme);
    });
  }
  
  // Save settings to storage
  function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    const checkButton = checkButtonInput.checked;
    const checkMark = checkMarkInput.checked;
    const gemini25 = versionInput.checked;
    const theme = themeSelect.value;
    
    if (apiKey) {
      // Save settings
      chrome.storage.sync.set({
        'geminiApiKey': apiKey, 
        'checkButton': checkButton,
        'checkMark': checkMark,
        'gemini25': gemini25,
        'theme': theme
      }, () => {
        // Show success message
        showStatus('Settings saved successfully!', 'success');
      });
    } else {
      // Show error for missing API key
      showStatus('API Key is required', 'error');
    }
  }
  
  // Show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type; // 'success' or 'error'
    
    // Clear message after delay
    setTimeout(() => {
      statusMessage.className = '';
    }, 3000);
  }
  
  // Apply theme to popup
  function applyTheme(theme = null) {
    // Use provided theme or get from select
    const currentTheme = theme || themeSelect.value;
    
    if (currentTheme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.className = prefersDark ? 'dark' : 'light';
    } else {
      // Apply selected theme
      document.body.className = currentTheme;
    }
  }
});
