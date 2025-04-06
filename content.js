// Add Google Gemini
async function callGemini(prompt) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY", {
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
  const popup = document.createElement("div");
  popup.id = "answer-popup";
  popup.style.position = "absolute";
  popup.style.backgroundColor = isDarkMode ? "#222" : "white";
  popup.style.color = isDarkMode ? "white" : "black";
  popup.style.border = "1px solid";
  popup.style.borderColor = isDarkMode ? "black": "#ddd"
  popup.style.padding = "10px";
  popup.style.zIndex = 1000;
  popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";

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
      geminiAnswer = "Gemini: " + await callGemini("Give the shortest and most accurate answer: " + selectedText);
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
