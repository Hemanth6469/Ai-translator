import React, { useState } from 'react';
import { Settings, X, Key, Sparkles, Volume2, Check, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  speechRate,
  setSpeechRate,
  autoTranslate,
  setAutoTranslate,
  onResetAll
}) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [savedBadge, setSavedBadge] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(keyInput.trim());
    localStorage.setItem('translator_gemini_key', keyInput.trim());
    setSavedBadge(true);
    setTimeout(() => {
      setSavedBadge(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Preferences & AI Engine</h3>
              <p className="text-xs text-slate-500">Configure AI keys and translation parameters</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Gemini API Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                <span>Google Gemini API Key (Optional)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Paste your Gemini API key (AIzaSy...)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Built-in Free Engine Active by Default</span>
              </div>
              <p>
                If no API key is set, Translator uses the built-in free Universal translation engine. Adding a free Gemini API key unlocks deep context awareness, idiomatic nuances, and detailed linguistic breakdowns.
              </p>
            </div>
          </div>

          {/* Auto Translate Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Real-Time Auto Translate</p>
              <p className="text-xs text-slate-500">Automatically translates as you type with a slight debounce</p>
            </div>
            <button
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoTranslate ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  autoTranslate ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span>Pronunciation Speed</span>
              </span>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {speechRate}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={e => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0.5x (Slow)</span>
              <span>1.0x (Standard)</span>
              <span>1.5x (Fast)</span>
            </div>
          </div>

          {/* Reset All */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">Clear cached history & reset settings</span>
            <button
              onClick={() => {
                if (window.confirm('Reset all saved settings, history, and vocabulary?')) {
                  onResetAll();
                  onClose();
                }
              }}
              className="text-xs font-medium text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              Reset All
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            {savedBadge ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{savedBadge ? 'Saved!' : 'Save Preferences'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
