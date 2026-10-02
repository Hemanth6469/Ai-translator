# 🌐 AI Translator — Next-Gen Polyglot Translator

**AI Translator** is a state-of-the-art AI-powered translation web application built with **React 18**, **Vite**, **Tailwind CSS**, and **Express.js**.

It provides natural, context-aware translations across 80+ world languages with tone and domain customization, real-time voice conversation, document translation, in-browser OCR image translation, multi-tone style comparison, and linguistic breakdown.

---

## ✨ Key Features

1. **📝 Multi-Language AI Translation**:
   - Over 80+ supported world languages with auto-detection.
   - Dual-pane responsive layout with one-click swap, clear, copy, and export.
   - Shortcut support: Press `Ctrl + Enter` to translate immediately.

2. **🎭 Tone & Domain Adaptation**:
   - **8 Tones**: Standard, Casual, Formal, Professional, Poetic, Academic, Simple (ELI5), and Witty.
   - **6 Context Domains**: General, Tech & Code, Business, Medical, Legal, and Travel.

3. **🎙️ Speech & Voice AI (TTS + STT)**:
   - **Speech-to-Text**: Dictate in your native tongue using browser Web Speech recognition.
   - **Text-to-Speech**: Listen to authentic pronunciations in both source and target languages with customizable speed (0.5x – 1.5x).

4. **💬 Bilingual Live Conversation Mode**:
   - Dual-speaker interactive interface for real-time multilingual conversations.
   - Automatic translation and immediate spoken audio playback for each speaker.
   - Scrollable, searchable transcript with timestamps.

5. **📄 Document Translation**:
   - Drag-and-drop support for **PDF**, **Word (.docx)**, **Markdown (.md)**, **TXT**, **JSON**, and **CSV**.
   - Side-by-side comparison of original extracted text vs translated output.
   - One-click download of the translated document.

6. **📷 Image & Snapshot OCR Translation**:
   - In-browser client-side optical character recognition via **Tesseract.js**.
   - Extract text from photos, signs, documents, and screenshots with zero cloud uploads, then instantly translate.

7. **⚖️ Multi-Tone Style Comparison**:
   - Translates any input sentence simultaneously into 4 styles: *Standard*, *Casual*, *Formal*, and *Poetic*.
   - Compare nuances side-by-side to choose the perfect phrasing.

8. **💡 AI Linguistic Breakdown & Insights**:
   - Deconstructs translations into key vocabulary tables, parts of speech, grammar rules, cultural idioms, and alternative phrasings.

9. **📚 History & Vocabulary Flashcards**:
   - Saves your translation history locally with search, star favorites, and JSON export.
   - Vocabulary Bank with interactive **3D flip flashcard study mode** for language learners, plus CSV / Anki export.

10. **🌓 Sleek Modern UI**:
    - Dark and Light mode with persistent state.
    - Smooth animations, glassmorphism, responsive mobile-first design.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Starts both the backend Express server (port `5001`) and the Vite React frontend (port `5173`) concurrently:
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

AI Translator is engineered with dual-engine flexibility:

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
├── server.js                 # Express backend API & document parsers
├── vite.config.js            # Vite bundler & reverse proxy setup
├── tailwind.config.js        # Tailwind styling & dark mode config
├── index.html                # HTML template with Google Fonts
├── .env                      # Environment variables
├── src/
│   ├── main.jsx              # React DOM entry point
│   ├── App.jsx               # Master application layout & state
│   ├── index.css             # Glassmorphism & custom utility styles
│   ├── data/
│   │   ├── languages.js      # 80+ languages with flags & TTS codes
│   │   └── tones.js          # Tone & domain definitions
│   ├── services/
│   │   └── api.js            # Translation client with auto-fallbacks
│   └── components/
│       ├── Navbar.jsx        # Header navigation & theme switch
│       ├── TranslationBox.jsx# Main dual-pane translation interface
│       ├── LanguageSelectorModal.jsx # Searchable language picker
│       ├── AiInsightsPanel.jsx       # Linguistic breakdown modal
│       ├── ConversationMode.jsx      # Live bilingual audio chat
│       ├── DocumentTranslator.jsx    # File upload & document parser
│       ├── ImageTranslator.jsx       # Client-side Tesseract OCR
│       ├── ComparisonMode.jsx        # 4-tone side-by-side comparison
│       ├── HistoryAndVocab.jsx       # History & flashcards study mode
│       └── SettingsModal.jsx         # API keys & voice speed controls
```
