# Quizora — Interactive Quiz Game

A responsive quiz application built with **HTML, CSS and vanilla JavaScript**. Questions are loaded dynamically from the supplied JSON question bank.

## Features
- Category and difficulty filters
- Selectable quiz length and per-question timer
- Shuffled questions on each attempt
- Animated progress and countdown bars
- Immediate correct/incorrect visual feedback
- Sound effects with an on/off toggle
- Score percentage and correct/incorrect summary
- Answer review screen, including skipped questions
- Responsive layout for mobile, tablet and desktop

## Run locally (Windows)

A local server is recommended because browsers may block `fetch()` when the page is opened directly with `file://`.

### Option 1: Python
1. Extract the ZIP file.
2. Open the extracted `Quiz_Game_Professional` folder.
3. Click the folder address bar, type `powershell`, and press Enter.
4. Run:

```powershell
py -m http.server 5500
```

5. Open `http://localhost:5500` in your browser.

### Option 2: VS Code
1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

## Deploy with GitHub Pages
1. Create a GitHub repository, for example `Quiz_Game`.
2. Upload all files and folders from this project (keep the `assets` folder).
3. Open **Settings → Pages** in the repository.
4. Under Build and deployment, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. Wait for the deployment URL to appear in the Pages section.

## Important note about the supplied question bank
The provided `quiz_questions_seed.json` contains 75 records, but its question text is generic placeholder text (`Sample question ...`) and its choices are generic (`Option A`–`Option D`). The app intentionally preserves the supplied data and its `correctIndex` values. Replace those placeholder questions and options with real question content before presenting the app as a knowledge quiz. The app does not invent missing question content.

## Project structure

```text
Quiz_Game_Professional/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── quiz_questions_seed.json
```
