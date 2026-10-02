import React, { useState, useMemo } from 'react';
import { Search, X, Check, Globe } from 'lucide-react';
import { LANGUAGES, POPULAR_LANGUAGES } from '../data/languages';

export default function LanguageSelectorModal({ isOpen, onClose, selectedCode, onSelect, allowAuto = false, title = "Select Language" }) {
  const [search, setSearch] = useState('');

  const filteredLanguages = useMemo(() => {
    let list = LANGUAGES;
    if (!allowAuto) {
      list = list.filter(l => l.code !== 'auto');
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.native.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q)
    );
  }, [search, allowAuto]);

  const popularList = useMemo(() => {
    return LANGUAGES.filter(l => POPULAR_LANGUAGES.includes(l.code));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search language name, native script, or code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Quick popular bar */}
        {!search && (
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Popular Languages</p>
            <div className="flex flex-wrap gap-1.5">
              {allowAuto && (
                <button
                  onClick={() => { onSelect('auto'); onClose(); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedCode === 'auto'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ✨ Auto Detect
                </button>
              )}
              {popularList.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onSelect(lang.code); onClose(); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    selectedCode === lang.code
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredLanguages.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              No languages match "{search}"
            </div>
          ) : (
            filteredLanguages.map(lang => {
              const isSelected = selectedCode === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => { onSelect(lang.code); onClose(); }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-medium' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{lang.flag}</span>
                    <div className="truncate">
                      <div className="text-sm truncate font-medium">{lang.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{lang.native}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
          Showing {filteredLanguages.length} languages
        </div>
      </div>
    </div>
  );
}
