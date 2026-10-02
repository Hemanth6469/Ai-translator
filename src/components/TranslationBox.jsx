import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRightLeft, Volume2, Mic, MicOff, Copy, Check, Star, 
  Sparkles, Download, Trash2, Maximize2, Minimize2, ClipboardPaste, 
  ChevronDown, Flame, BookMarked, Globe, Loader2
} from 'lucide-react';
import { getLanguageByCode } from '../data/languages';

export default function TranslationBox({
  sourceText,
  setSourceText,
  translatedText,
  setTranslatedText,
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  onTranslate,
  isTranslating,
  onOpenSourceModal,
  onOpenTargetModal,
  onOpenInsights,
  isFavorite,
  onToggleFavorite,
  provider,
  detectedSource
}) {
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
  const recognitionRef = useRef(null);

  // Setup Web Speech Recognition for voice input
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = sourceLang === 'auto' ? 'en-US' : (getLanguageByCode(sourceLang).speechCode || 'en-US');

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSourceText(transcript);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [sourceLang, setSourceText]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = sourceLang === 'auto' ? 'en-US' : (getLanguageByCode(sourceLang).speechCode || 'en-US');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Text-To-Speech Pronunciation
  const speakText = (text, langCode, isSource = false) => {
    if (!window.speechSynthesis || !text.trim()) return;

    window.speechSynthesis.cancel(); // cancel any ongoing speech

    const langObj = getLanguageByCode(langCode);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langObj.speechCode || 'en-US';
    utterance.rate = 0.95;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (targetVoice) utterance.voice = targetVoice;

    if (isSource) {
      setIsSpeakingSource(true);
      utterance.onend = () => setIsSpeakingSource(false);
      utterance.onerror = () => setIsSpeakingSource(false);
    } else {
      setIsSpeakingTarget(true);
      utterance.onend = () => setIsSpeakingTarget(false);
      utterance.onerror = () => setIsSpeakingTarget(false);
    }

    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSourceText(text);
    } catch (e) {
      console.warn('Clipboard read failed');
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      if (detectedSource && detectedSource !== 'auto') {
        const newSource = targetLang;
        setTargetLang(detectedSource);
        setSourceLang(newSource);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
      }
      return;
    }
    const tempSource = sourceLang;
    const tempText = sourceText;
    setSourceLang(targetLang);
    setTargetLang(tempSource);
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const downloadTranslation = () => {
    if (!translatedText) return;
    const element = document.createElement('a');
    const file = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `translation-${sourceLang}-to-${targetLang}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const sourceLangObj = getLanguageByCode(sourceLang);
  const targetLangObj = getLanguageByCode(targetLang);

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const charCount = sourceText.length;

  return (
    <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-40 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-y-auto' : 'w-full'}`}>
      
      {/* Main Dual Box Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
        
        {/* Source Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-[380px] sm:h-[420px] transition-all focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10">
          
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onOpenSourceModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold text-sm text-slate-800 dark:text-slate-200"
            >
              <span className="text-lg">{sourceLangObj.flag}</span>
              <span>{sourceLangObj.name}</span>
              {detectedSource && sourceLang === 'auto' && (
                <span className="text-xs font-normal text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                  Detected: {getLanguageByCode(detectedSource).name}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-center gap-1">
              {sourceText && (
                <button
                  onClick={() => setSourceText('')}
                  title="Clear text"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 p-5 relative">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  onTranslate();
                }
              }}
              placeholder="Enter text, phrase, or paragraph to translate (or speak, or paste)... [Ctrl + Enter to Translate]"
              className="w-full h-full resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base sm:text-lg leading-relaxed focus:outline-none"
            />
          </div>

          {/* Bottom Actions */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 rounded-b-3xl">
            <div className="flex items-center gap-1.5">
              {/* Mic Speech-to-Text */}
              <button
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : 'Speak to translate'}
                className={`p-2 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text to Speech */}
              <button
                onClick={() => speakText(sourceText, detectedSource || sourceLang, true)}
                disabled={!sourceText.trim() || isSpeakingSource}
                title="Listen to pronunciation"
                className={`p-2 rounded-xl transition-colors ${
                  isSpeakingSource 
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 animate-bounce' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {/* Paste button */}
              <button
                onClick={handlePaste}
                title="Paste from clipboard"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex"
              >
                <ClipboardPaste className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {charCount} chars • {wordCount} words
            </div>
          </div>
        </div>

        {/* Swap button in the center (responsive floating) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            onClick={handleSwapLanguages}
            title="Swap source & target languages"
            className="p-3 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-500 hover:scale-110 active:scale-95 shadow-lg shadow-black/5 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Target Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-[380px] sm:h-[420px] transition-all">
          
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onOpenTargetModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold text-sm text-slate-800 dark:text-slate-200"
            >
              <span className="text-lg">{targetLangObj.flag}</span>
              <span>{targetLangObj.name}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-center gap-2">
              {provider && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  {provider}
                </span>
              )}

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Text Area / Translation Display */}
          <div className="flex-1 p-5 relative overflow-y-auto">
            {isTranslating ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm font-medium animate-pulse">Generating accurate contextual translation...</span>
              </div>
            ) : translatedText ? (
              <div className="text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-wrap select-text">
                {translatedText}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm italic">
                Translation will appear here instantly...
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 rounded-b-3xl">
            <div className="flex items-center gap-1.5">
              {/* Text-to-Speech Target */}
              <button
                onClick={() => speakText(translatedText, targetLang, false)}
                disabled={!translatedText.trim() || isSpeakingTarget}
                title="Listen to translation pronunciation"
                className={`p-2 rounded-xl transition-colors ${
                  isSpeakingTarget 
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 animate-bounce' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {/* Copy */}
              <button
                onClick={() => copyToClipboard(translatedText)}
                disabled={!translatedText.trim()}
                title="Copy translation"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Star / Favorite */}
              <button
                onClick={onToggleFavorite}
                disabled={!translatedText.trim()}
                title={isFavorite ? "Remove from starred" : "Star translation"}
                className={`p-2 rounded-xl transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                  isFavorite 
                    ? 'text-amber-500 hover:text-amber-600' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Download */}
              <button
                onClick={downloadTranslation}
                disabled={!translatedText.trim()}
                title="Download as .txt"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors hidden sm:inline-flex"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* AI Insights Button */}
            {translatedText && (
              <button
                onClick={onOpenInsights}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Insights & Grammar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Button Bar */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Enter</kbd>
          <span>to translate instantly</span>
        </div>

        <button
          onClick={onTranslate}
          disabled={!sourceText.trim() || isTranslating}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Translate Now</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
