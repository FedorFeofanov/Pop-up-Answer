# pop-up-answer

A simple Chrome extension that provides answers for selected questions.

## Credits:
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

3. API key
- To get yourself an API key that is going to be used, go to https://aistudio.google.com/apikey
- Select Create API key
- Search for Gemini and press Create API key
- Copy the key over to the extension window and press save
    
## Usage

1. After installing, navigate to any webpage.
2. Select the question by highlighting it with your mouse.
3. Press the button that appeared on the screen or right-click and choose Answer from the context menu.
4. A floating popup will display the answer near your selected text.


## File and Structure

- answers.json: Contains questions and answers that are predefined by users. 
- manifest.json: Configuration file for the extension.
- background.js: Handles context menu creation and messaging.
- content.js: Fetches and displays answers when text is selected.
- popup.html: Basic UI component, though not used for answer display.
- popup.css: Styles for the floating popup.


# Adding answers rules
If you want to share answers added to the answers.json, which is highly appreciated by the community, you should follow the naming rules, so that they could be found later on 
## Psihologija
"Answers": "[year][theme]"

# How can you contribute?
## Adding answers
The easiest way of adding answers is by opeining answers.json file right on github, clicking *Edit this file* and adding questions with answers following the standart, both of them should be inside of double quotes "", there should be colon : after key and comma , at the end of the line. After you done editing the file, press commit changes and add a short description. Create a pull request to request adding your work to the project.  
## Giving feedback
If you used the extension and thought of anything that can be improved or change, please head to the Issues section on GitHub and add a new issue.
## Improving the code
If you have any ideas and want to make them into existing yourself, you are very welcome!
