document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key-input');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');

  // Load saved API key when the popup opens
  // 'geminiApiKey' is the key we'll use in storage
  chrome.storage.sync.get('geminiApiKey', (data) => {
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey; // Populate the input field
    }
  });

  // Save API key when the button is clicked
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim(); // Get the trimmed value from the input

    if (apiKey) {
      // Save the key using chrome.storage.sync (synced across user's Chrome profiles)
      chrome.storage.sync.set({ 'geminiApiKey': apiKey }, () => {
        statusMessage.textContent = 'API Key saved successfully!';
        statusMessage.style.color = 'green';
        setTimeout(() => {
          statusMessage.textContent = ''; // Clear the message after 2 seconds
        }, 2000);
      });
    } else {
      statusMessage.textContent = 'Please enter an API Key.';
      statusMessage.style.color = 'red';
    }
  });
});
