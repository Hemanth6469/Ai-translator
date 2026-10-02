import React from 'react';
import { Sparkles, BookOpen, BookmarkPlus, Lightbulb, MessageSquareQuote, Check, X, ShieldAlert } from 'lucide-react';

export default function AiInsightsPanel({ isOpen, onClose, analysis, isLoading, onSaveWord, onApplyAlternative }) {
  const [copiedIndex, setCopiedIndex] = React.useState(null);
  const [savedWordIndex, setSavedWordIndex] = React.useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                AI Linguistic Breakdown & Insights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In-depth vocabulary, grammar mechanics, and cultural nuances
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Deconstructing Translation...</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">Analyzing vocabulary semantics, grammar structure, and cultural idioms.</p>
              </div>
            </div>
          ) : !analysis ? (
            <div className="py-12 text-center text-slate-500">
              No analysis available. Please translate text first.
            </div>
          ) : (
            <>
              {/* Summary */}
              {analysis.summary && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm mb-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Linguistic Overview</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* Vocabulary Breakdown */}
              {analysis.vocabulary && analysis.vocabulary.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Vocabulary & Terms Breakdown
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.vocabulary.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.word}</span>
                            <span className="mx-1.5 text-slate-400">→</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.meaning}</span>
                          </div>
                          {item.pos && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {item.pos}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {item.note}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            if (onSaveWord) onSaveWord(item);
                            setSavedWordIndex(idx);
                            setTimeout(() => setSavedWordIndex(null), 2000);
                          }}
                          className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium self-start pt-1"
                        >
                          {savedWordIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Saved to Flashcards</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              <span>Save to Flashcards</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar Notes */}
              {analysis.grammarNotes && analysis.grammarNotes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                    Grammar & Syntax Mechanics
                  </h4>
                  <ul className="space-y-2">
                    {analysis.grammarNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cultural Context / Idiom Notes */}
              {analysis.culturalContext && (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-sm mb-1.5">
                    <MessageSquareQuote className="w-4 h-4" />
                    <span>Cultural Context & Idioms</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {analysis.culturalContext}
                  </p>
                </div>
              )}

              {/* Alternative Phrasings */}
              {analysis.alternatives && analysis.alternatives.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                    Alternative Styles & Phrasings
                  </h4>
                  <div className="space-y-2.5">
                    {analysis.alternatives.map((alt, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                              {alt.style}
                            </span>
                            {alt.whenToUse && (
                              <span className="text-xs text-slate-500 truncate">({alt.whenToUse})</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                            "{alt.phrasing}"
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(alt.phrasing);
                              setCopiedIndex(idx);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          >
                            {copiedIndex === idx ? 'Copied!' : 'Copy'}
                          </button>
                          {onApplyAlternative && (
                            <button
                              onClick={() => {
                                onApplyAlternative(alt.phrasing);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                            >
                              Use This
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Powered by Deep Linguistic AI Analysis
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
