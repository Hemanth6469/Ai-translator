# 🌐 AI Translator — Clean, Fast, Multi-Language Translator

**AI Translator** is a focused, high-performance translation web application built with **React 18**, **Vite**, **Tailwind CSS**, and **Express.js**.

---

## ✨ Core Features

1. **📝 Multi-Language AI Translator**:
   - Supports 80+ world languages with auto-detection.
   - Dual-pane layout with instant swap, copy, clear, and download.
   - **Speech & Pronunciation (TTS & STT)**: Voice input via microphone and natural pronunciation playback with adjustable speed.
   - **AI Linguistic Insights**: Explains vocabulary meanings, grammar rules, cultural idioms, and alternative phrasings.
   - Keyboard shortcut: Press `Ctrl + Enter` to translate immediately.

2. **🕒 Translation History**:
   - Automatically saves translations locally with search and filtering.
   - Star favorite translations.
   - 1-click load back into the translator.
   - Export history to JSON.

3. **🌓 Clean Modern Interface**:
   - Dark and Light mode toggle.
   - Fully responsive on desktop, tablet, and mobile.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Starts both the Express server (port `5001`) and the Vite React frontend (port `5173`) concurrently:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Run in Production Mode
Build the frontend and run the unified server:
```bash
npm run build
npm start
```
Open **`http://localhost:5001`** in your browser.

---

## 🔑 AI Engine & API Configuration

AI Translator works with dual-engine flexibility:

- **Built-in Universal Engine (Default)**: Works immediately out-of-the-box with **zero API keys required**. Free, fast, and covers 80+ languages.
- **Google Gemini 1.5 AI (Optional)**:
  1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Click the **Settings ⚙️** icon in the website header and paste your key, or add it to `.env`:
     ```env
     PORT=5001
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

---

## 📁 Project Architecture

```
translator/
├── package.json              # Project scripts and dependencies
├── server.js                 # Express backend API & static file server
├── vite.config.js            # Vite bundler & reverse proxy setup
├── tailwind.config.js        # Tailwind styling & dark mode config
├── index.html                # HTML template with Google Fonts
├── .env                      # Environment variables
├── src/
│   ├── main.jsx              # React DOM entry point
│   ├── App.jsx               # Master application layout & state
│   ├── index.css             # Styling & custom utilities
│   ├── data/
│   │   └── languages.js      # 80+ languages with flags & TTS codes
│   ├── services/
│   │   └── api.js            # Translation client with auto-fallbacks
│   └── components/
│       ├── Navbar.jsx        # Header navigation (Translator, History)
│       ├── TranslationBox.jsx# Main dual-pane translation interface
│       ├── LanguageSelectorModal.jsx # Searchable language picker
│       ├── AiInsightsPanel.jsx       # Linguistic breakdown modal
│       ├── History.jsx               # Translation history manager
│       └── SettingsModal.jsx         # API keys & voice speed controls
```
