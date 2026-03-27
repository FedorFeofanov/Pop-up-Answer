/**
 * content.js - Handles content script functionality
 * simplified and refactored
 */

(function () {
  class AnswerExtension {
    constructor() {
      this.config = {
        geminiApiKey: '',
        promptContext: '',
        gemini25: false,
        checkButton: true,
        checkMark: true,
        theme: 'auto'
      };
      this.popupButton = null;
      this.answerPopup = null;
      this.selectedText = '';
      this.selectionCoords = { x: 0, y: 0 };
    }

    async init() {
      await this.loadConfiguration();
      this.setupEventListeners();
    }

    async loadConfiguration() {
      return new Promise((resolve) => {
        chrome.storage.sync.get({
          'geminiApiKey': '',
          'promptContext': '',
          'checkButton': true,
          'checkMark': true,
          'gemini25': false,
          'theme': 'auto'
        }, (data) => {
          this.config = { ...this.config, ...data };
          resolve();
        });
      });
    }

    setupEventListeners() {
      document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
      document.addEventListener('mousedown', (e) => this.handleClickOutside(e));
      document.addEventListener('contextmenu', (e) => this.handleRightClick(e));

      // Listen for storage changes
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
          for (let [key, { newValue }] of Object.entries(changes)) {
            if (key in this.config) {
              this.config[key] = newValue;
            }
          }
        }
      });

      chrome.runtime.onMessage.addListener((req, sender, sendResponse) => this.handleBackgroundMessages(req, sender, sendResponse));
    }

    handleRightClick(event) {
      if (this.isEventInsideUI(event)) return;

      this.selectionCoords = {
        x: event.pageX,
        y: event.pageY
      };
    }

    handleTextSelection(event) {
      if (this.isEventInsideUI(event)) return;

      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && this.config.checkButton) {
        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        this.selectionCoords = {
          x: rect.right + window.scrollX,
          y: rect.bottom + window.scrollY
        };
        this.selectedText = text;

        this.showSelectionButton();
      } else {
        this.hideSelectionButton();
      }
    }

    handleClickOutside(event) {
      if (this.popupButton && !this.popupButton.contains(event.target)) {
        const text = window.getSelection().toString().trim();
        if (!text) {
          this.hideSelectionButton();
        }
      }
    }

    handleBackgroundMessages(request, sender, sendResponse) {
      if (window.self !== window.top) return;
      try {
        if (request.action === "answer") {
          if (request.error) {
            this.showError(request.error);
          } else if (request.image) {
            this.selectedText = null;
            this.showAnswer(null, request);
          } else if (request.text) {
            const selection = window.getSelection();
            // Checking if selection matches the text we are answering
            if (selection && selection.rangeCount > 0 && selection.toString().trim() === request.text) {
              const rect = selection.getRangeAt(0).getBoundingClientRect();
              this.selectionCoords = {
                x: rect.right + window.scrollX,
                y: rect.bottom + window.scrollY
              };
            }
            this.selectedText = request.text;
            this.showAnswer(request.text);
          }
        }
      } catch (e) {
        console.error("Error in handleBackgroundMessages:", e);
      }
      return false; // Expecting no asynchronous response
    }

    isEventInsideUI(event) {
      return (this.popupButton && this.popupButton.contains(event.target)) ||
        (this.answerPopup && this.answerPopup.contains(event.target));
    }

    createButtonElement() {
      const btn = document.createElement('div');
      btn.id = 'my-selection-popupButton';
      const iconUrl = chrome.runtime.getURL("icons/icon16.png");

      btn.innerHTML = `
        <button style="
          border: none; background: white; border-radius: 4px; padding: 4px;
          cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: flex;
          align-items: center; justify-content: center;
        ">
          <img src="${iconUrl}" alt="Answer" style="display: block;">
        </button>
      `;

      btn.style.position = 'absolute';
      btn.style.zIndex = '2147483647';
      return btn;
    }

    showSelectionButton() {
      this.hideSelectionButton();

      this.popupButton = this.createButtonElement();
      this.updatePosition(this.popupButton, 0, 5);

      const actionBtn = this.popupButton.querySelector('button');
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showAnswer(this.selectedText);
        this.hideSelectionButton();
      });

      document.body.appendChild(this.popupButton);
    }

    hideSelectionButton() {
      if (this.popupButton) {
        this.popupButton.remove();
        this.popupButton = null;
      }
    }

    showError(message) {
      this.createPopup("Error: " + message);
    }

    createPopup(initialText) {
      if (this.answerPopup) this.answerPopup.remove();

      this.answerPopup = document.createElement("div");
      this.answerPopup.id = "answer-popup";

      Object.assign(this.answerPopup.style, {
        position: 'absolute',
        zIndex: '2147483647',
        padding: '12px',
        borderRadius: '8px',
        maxWidth: '400px',
        minWidth: '200px',
        border: '1px solid',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5'
      });

      this.applyTheme(this.answerPopup);
      this.answerPopup.innerText = initialText;

      this.updatePosition(this.answerPopup, 0, 5);
      document.body.appendChild(this.answerPopup);

      setTimeout(() => {
        const closeHandler = (e) => {
          if (this.answerPopup && !this.answerPopup.contains(e.target)) {
            this.answerPopup.remove();
            this.answerPopup = null;
            document.removeEventListener('click', closeHandler);
          }
        };
        document.addEventListener('click', closeHandler);
      }, 100);

      return this.answerPopup;
    }

    async showAnswer(text, imageRequest = null) {
      const popup = this.createPopup("Loading...");

      try {
        let answer;
        if (imageRequest && imageRequest.image) {
          answer = await this.getAnswer(null, imageRequest);
        } else {
          answer = await this.getAnswer(text);
        }

        if (this.answerPopup) {
          this.answerPopup.innerText = answer;
        }
      } catch (err) {
        if (this.answerPopup) {
          this.answerPopup.innerText = "Error: " + err.message;
        }
      }
    }

    updatePosition(element, offsetX = 0, offsetY = 0) {
      if (!element) return;
      element.style.left = `${this.selectionCoords.x + offsetX}px`;
      element.style.top = `${this.selectionCoords.y + offsetY}px`;
    }

    applyTheme(element) {
      let isDark = this.config.theme === 'dark';
      if (this.config.theme === 'auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        element.style.backgroundColor = "#222";
        element.style.color = "#eee";
        element.style.borderColor = "#444";
      } else {
        element.style.backgroundColor = "#fff";
        element.style.color = "#222";
        element.style.borderColor = "#ddd";
      }
    }

    async getAnswer(query, imageInfo = null) {
      if (query && !imageInfo) {
        try {
          const localAnswers = await this.loadLocalAnswers();
          const lowerQuery = query.toLowerCase();
          for (const [q, a] of Object.entries(localAnswers)) {
            if (q.toLowerCase().includes(lowerQuery)) {
              return a;
            }
          }
        } catch (e) {
          console.warn("Failed to load local answers", e);
        }
      }

      return this.fetchGeminiAnswer(query, imageInfo);
    }

    async loadLocalAnswers() {
      const url = chrome.runtime.getURL("answers.json");
      const res = await fetch(url);
      return res.json();
    }

    async fetchGeminiAnswer(query, imageInfo) {
      if (!this.config.geminiApiKey) {
        return "Please configure API Key in extension settings.";
      }

      const modelName = this.config.gemini25 ? "gemini-2.5-flash" : "gemini-3.1-flash-lite-preview";

      let contentsObj;
      const contextPrefix = this.config.promptContext ? `Custom Context: ${this.config.promptContext}\n\n` : '';

      if (imageInfo) {
        contentsObj = {
          parts: [
            { text: `${contextPrefix}Answer the question in the image. Keep your answer concise, without compromising the fullness of information.
                       If asked to provide a date, provide the one you're most certain of. 
                       If there seem to be provided answer options after the question, 
                       select the answer from them. Do not use any formatting, 
                       answer in plain text.` },
            {
              inline_data: {
                mime_type: imageInfo.mimeType || "image/jpeg",
                data: imageInfo.image
              }
            }
          ]
        };
      } else {
        contentsObj = {
          parts: [{
            text: `${contextPrefix}Answer the following question, give the shortest answer possible. 
                       If asked to provide a date, provide the one you're most certain of. 
                       If there seem to be provided answer options after the question, 
                       select the answer from them. Do not use any formatting, 
                       answer in plain text. Here is the question: ${query}`
          }]
        };
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.config.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [contentsObj]
          })
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer found";

      return this.config.checkMark ? `Gemini: ${result}` : result;
    }
  }

  new AnswerExtension().init();
})();
