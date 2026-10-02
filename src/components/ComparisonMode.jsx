import React, { useState } from 'react';
import { Sparkles, Copy, Check, Volume2, ArrowRight, Loader2 } from 'lucide-react';
import { translateText } from '../services/api';
import { getLanguageByCode } from '../data/languages';

const COMPARISON_TONES = [
  { id: 'standard', title: 'Standard / Balanced', badge: 'Natural', color: 'indigo' },
  { id: 'casual', title: 'Casual & Conversational', badge: 'Everyday', color: 'emerald' },
  { id: 'formal', title: 'Formal & Polite', badge: 'Respectful', color: 'blue' },
  { id: 'poetic', title: 'Poetic & Expressive', badge: 'Creative', color: 'purple' }
];

export default function ComparisonMode({ sourceLang, targetLang, apiKey }) {
  const [inputText, setInputText] = useState('Could you please give me more details about your schedule for tomorrow?');
  const [results, setResults] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCompare = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setResults({});

    try {
      const promises = COMPARISON_TONES.map(async (toneObj) => {
        try {
          const res = await translateText({
            text: inputText,
            sourceLang,
            targetLang,
            tone: toneObj.id,
            apiKey
          });
          return { id: toneObj.id, text: res.translatedText };
        } catch (e) {
          return { id: toneObj.id, text: 'Translation failed for this tone.' };
        }
      });

      const outcomeList = await Promise.all(promises);
      const newResults = {};
      outcomeList.forEach(item => {
        newResults[item.id] = item.text;
      });
      setResults(newResults);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const langObj = getLanguageByCode(targetLang);
    u.lang = langObj.speechCode || 'en-US';
    window.speechSynthesis.speak(u);
  };

  const copy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const targetLangObj = getLanguageByCode(targetLang);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Input Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Compare Translation Across 4 Linguistic Tones
          </h3>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            Target: {targetLangObj.name}
          </span>
        </div>

        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Enter text to see how its phrasing shifts across standard, casual, formal, and poetic styles..."
          className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
        />

        <div className="flex justify-end">
          <button
            onClick={handleCompare}
            disabled={!inputText.trim() || isTranslating}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Comparing styles...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compare All 4 Styles</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMPARISON_TONES.map(t => {
          const trans = results[t.id];
          return (
            <div 
              key={t.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-48 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {t.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {trans && (
                      <>
                        <button
                          onClick={() => speak(trans)}
                          title="Listen"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copy(t.id, trans)}
                          title="Copy"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {copiedKey === t.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  {trans ? (
                    `"${trans}"`
                  ) : isTranslating ? (
                    <span className="text-slate-400 animate-pulse">Generating translation...</span>
                  ) : (
                    <span className="text-slate-400">Click "Compare All 4 Styles" to view.</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
