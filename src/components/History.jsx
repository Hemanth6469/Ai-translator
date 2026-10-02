import React, { useState } from 'react';
import { History as HistoryIcon, Star, Trash2, Search, Download, ArrowRight, Copy, Check } from 'lucide-react';
import { getLanguageByCode } from '../data/languages';

export default function History({
  history = [],
  onClearHistory,
  onDeleteHistoryItem,
  onSelectHistoryItem,
  onToggleStar,
  initialStarredOnly = false
}) {
  const [search, setSearch] = useState('');
  const [starredOnly, setStarredOnly] = useState(initialStarredOnly);
  const [copiedId, setCopiedId] = useState(null);

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

  const exportHistoryJSON = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translator-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Search & Actions Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Translation History</h3>
            <p className="text-xs text-slate-500">{history.length} saved translations</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter translations..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

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
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <HistoryIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
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
                    onClick={() => copyText(item.id, item.translatedText)}
                    title="Copy translated text"
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {onToggleStar && (
                    <button
                      onClick={() => onToggleStar(item.id)}
                      title={item.starred ? "Unstar" : "Star"}
                      className={`p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
                        item.starred ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-current' : ''}`} />
                    </button>
                  )}

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

    </div>
  );
}
