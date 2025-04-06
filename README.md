# pop-up-answer

A simple Chrome extension that provides answers for selected questions.

## Original Creator:
```
https://github.com/zenoNong
```

## Table of Contents

 1. Overview
 2. Features
 3. Installation
 4. Usage
 5. File and Structure
 6. How it works

## Overview

This Chrome extension allows users to quickly get answres for questions they select on any webpage. The answer appears in a floating popup near the selected text.
## Features

- Instant Answer: Highlight a question and right-click to get the answer.
- Simple UI: Lightweight and unobtrusive design.


## Installation

1. Clone or Download this Repository:

```bash
  git clone https://github.com/your-username/dictionary-chrome-extension.git

```
2. Load the Extension in Chrome:
- Open Chrome and go to chrome://extensions/.
- Enable Developer mode (toggle switch in the top right).
- Click Load unpacked and select the directory of the extension.
    
## Usage

1. After installing, navigate to any webpage.
2. Select any word or phrase that is part of question by highlighting it with your mouse.
3. Right-click and choose Answer from the context menu.
4. A floating popup will display the answer near your selected text.


## File and Structure

- manifest.json: Configuration file for the extension.
- background.js: Handles context menu creation and messaging.
- content.js: Fetches and displays answers when text is selected.
- popup.html: Basic UI component, though not used for answer display.
- popup.css: Styles for the floating popup.


## Description

manifest.json

- The main configuration file for Chrome extensions, specifying permissions, scripts, and actions.

background.js
- Handles background processes such as creating context menus and communicating with content scripts.

content.js
- Injected into web pages, listens for messages from the background script, and performs the core function of fetching and displaying answers.

popup.html & popup.css
- Provide the basic interface and styling for any popups or UIs used by the extension.
## How it works
1. Context Menu Creation: The extension creates a right-click context menu option, "Answer", when it is installed or updated.
2. Script Injection and Messaging: When "Answer" is selected, the background script injects the content script into the current tab.
3. Answer Retrieval: The content script fetches the answer for the selected question using a JSON file that the user can edit.
4. Popup Display: The fetched answer is displayed in a styled popup near the text selection.
# Commit naming rules
## Psihologija
[year][theme number][lesson number]
For example it commit may contain 2.10.3 Psihologija, that means that the material is from the second grade, theme number is 10 (for example Licnost), the lesson number is 3 (for example 3. Bihevioristicke, humanisticke i socijalno-kognitivne teorije licnosti)
