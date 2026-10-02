import React, { useState } from 'react';
import { History, BookOpen, Star, Trash2, Search, Download, ArrowRight, Check, Volume2, RotateCcw } from 'lucide-react';
import { getLanguageByCode } from '../data/languages';

export default function HistoryAndVocab({
  history = [],
  onClearHistory,
  onDeleteHistoryItem,
  onSelectHistoryItem,
  vocabulary = [],
  onDeleteWord,
  onClearVocab
}) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'vocab'
  const [search, setSearch] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter history
  const filteredHistory = history.filter(item => {
    if (starredOnly && !item.starred) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.sourceText?.toLowerCase().includes(q) ||
      item.translatedText?.toLowerCase().includes(q) ||
      item.sourceLang?.toLowerCase().includes(q) ||
      item.targetLang?.toLowerCase().includes(q)
    );
  });

  // Filter vocab
  const filteredVocab = vocabulary.filter(v => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.word?.toLowerCase().includes(q) ||
      v.meaning?.toLowerCase().includes(q)
    );
  });

  const exportHistoryJSON = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translator-history-${Date.now()}.json`;
    a.click();
  };

  const exportVocabCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Word,Meaning,Part of Speech,Note", ...vocabulary.map(v => `"${v.word}","${v.meaning}","${v.pos || ''}","${v.note || ''}"`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `translator-vocab-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Tab Switcher & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'vocab'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vocabulary Bank ({vocabulary.length})</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter items..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeTab === 'history' ? (
            <>
              <button
                onClick={() => setStarredOnly(!starredOnly)}
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  starredOnly
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={starredOnly ? "Showing Starred Only" : "Show All"}
              >
                <Star className={`w-4 h-4 ${starredOnly ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={exportHistoryJSON}
                disabled={history.length === 0}
                title="Export History (JSON)"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={onClearHistory}
                disabled={history.length === 0}
                title="Clear All History"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStudyMode(!studyMode)}
                disabled={vocabulary.length === 0}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  studyMode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {studyMode ? 'Exit Flashcards' : 'Study Flashcards'}
              </button>

              <button
                onClick={exportVocabCSV}
                disabled={vocabulary.length === 0}
                title="Export Vocab to CSV / Anki"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={onClearVocab}
                disabled={vocabulary.length === 0}
                title="Clear All Vocab"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'history' ? (
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No translation records found</p>
              <p className="text-xs text-slate-500 mt-0.5">Translations you perform will be saved here automatically.</p>
            </div>
          ) : (
            filteredHistory.map(item => {
              const srcObj = getLanguageByCode(item.sourceLang);
              const tgtObj = getLanguageByCode(item.targetLang);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <span>{srcObj.flag}</span>
                        <span>{srcObj.name}</span>
                        <span>→</span>
                        <span>{tgtObj.flag}</span>
                        <span>{tgtObj.name}</span>
                      </span>
                      {item.tone && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          {item.tone}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>

                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      "{item.sourceText}"
                    </div>
                    <div className="text-sm text-indigo-600 dark:text-indigo-400 truncate">
                      → "{item.translatedText}"
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onSelectHistoryItem(item)}
                      title="Load in Translator"
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      title="Delete record"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : studyMode && vocabulary.length > 0 ? (
        /* Flashcard Study Mode */
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center max-w-xl mx-auto space-y-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Card {currentFlashcardIndex + 1} of {vocabulary.length}
          </div>

          {/* Flashcard with 3D Flip style */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-64 rounded-3xl p-8 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border-2 border-indigo-200 dark:border-indigo-800/80 cursor-pointer flex flex-col items-center justify-center text-center shadow-md select-none transition-transform hover:scale-[1.02]"
          >
            {!isFlipped ? (
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-indigo-500">Source Word</span>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {vocabulary[currentFlashcardIndex]?.word}
                </h3>
                <p className="text-xs text-slate-400">(Click to reveal meaning)</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs uppercase font-bold text-emerald-500">Meaning & Nuance</span>
                <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {vocabulary[currentFlashcardIndex]?.meaning}
                </h3>
                {vocabulary[currentFlashcardIndex]?.note && (
                  <p className="text-xs text-slate-500 max-w-xs">{vocabulary[currentFlashcardIndex]?.note}</p>
                )}
              </div>
            )}
          </div>

          {/* Controller */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentFlashcardIndex((prev) => (prev > 0 ? prev - 1 : vocabulary.length - 1));
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Previous
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentFlashcardIndex((prev) => (prev < vocabulary.length - 1 ? prev + 1 : 0));
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        /* Vocabulary Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVocab.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No saved vocabulary words</p>
              <p className="text-xs text-slate-500 mt-0.5">Save words from translation AI Insights to build your flashcard deck.</p>
            </div>
          ) : (
            filteredVocab.map((v, i) => (
              <div 
                key={i}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{v.word}</h4>
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{v.meaning}</p>
                    </div>
                    {v.pos && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {v.pos}
                      </span>
                    )}
                  </div>
                  {v.note && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{v.note}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => speak(v.word)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                    title="Pronounce"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteWord(i)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500"
                    title="Remove word"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
