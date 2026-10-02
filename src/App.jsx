import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import TranslationBox from './components/TranslationBox';
import LanguageSelectorModal from './components/LanguageSelectorModal';
import AiInsightsPanel from './components/AiInsightsPanel';
import History from './components/History';
import SettingsModal from './components/SettingsModal';
import { translateText, explainTranslation } from './services/api';
import { getLanguageByCode } from './data/languages';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Tab navigation state: only 'translate' | 'image' | 'history'
  const [activeTab, setActiveTab] = useState('translate');

  // Translation core state
  const [sourceText, setSourceText] = useState('The future belongs to those who believe in the beauty of their dreams.');
  const [translatedText, setTranslatedText] = useState('El futuro pertenece a quienes creen en la belleza de sus sueños.');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedSource, setDetectedSource] = useState('en');
  const [provider, setProvider] = useState('Universal High-Speed Engine');

  // Preferences & API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('translator_gemini_key') || localStorage.getItem('omnilingo_gemini_key') || '');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [historyStarredOnly, setHistoryStarredOnly] = useState(false);

  // Modals state
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // AI Linguistic Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // History Persistence
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('translator_history') || localStorage.getItem('omnilingo_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('translator_history', JSON.stringify(history));
  }, [history]);

  // Execute translation
  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);

    try {
      const result = await translateText({
        text: sourceText,
        sourceLang,
        targetLang,
        apiKey
      });

      setTranslatedText(result.translatedText);
      if (result.detectedSource) {
        setDetectedSource(result.detectedSource);
      }
      if (result.provider) {
        setProvider(result.provider);
      }

      // Add to history
      const newRecord = {
        id: Date.now(),
        sourceText,
        translatedText: result.translatedText,
        sourceLang: sourceLang === 'auto' ? (result.detectedSource || 'en') : sourceLang,
        targetLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        starred: false
      };

      setHistory(prev => [newRecord, ...prev.filter(h => h.sourceText !== sourceText).slice(0, 49)]);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, apiKey]);

  // Auto-translate debounce
  const timerRef = useRef(null);
  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText('');
      return;
    }
    if (!autoTranslate) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      handleTranslate();
    }, 450);

    return () => clearTimeout(timerRef.current);
  }, [sourceText, autoTranslate, handleTranslate]);

  // Load AI Insights / Explanation
  const handleOpenInsights = async () => {
    setIsInsightsOpen(true);
    if (!translatedText.trim()) return;

    setIsLoadingAnalysis(true);
    try {
      const result = await explainTranslation({
        originalText: sourceText,
        translatedText,
        sourceLang: sourceLang === 'auto' ? (detectedSource || 'en') : sourceLang,
        targetLang,
        apiKey
      });
      setAnalysis(result);
    } catch (e) {
      console.error('Explain error:', e);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Star / Favorite current translation
  const isCurrentFavorite = history.length > 0 && history[0].sourceText === sourceText && history[0].starred;

  const handleToggleFavorite = () => {
    if (history.length === 0) return;
    setHistory(prev => {
      const updated = [...prev];
      if (updated[0]) {
        updated[0] = { ...updated[0], starred: !updated[0].starred };
      }
      return updated;
    });

    if (!isCurrentFavorite) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  const handleToggleHistoryStar = (id) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, starred: !item.starred } : item));
  };

  const handleResetAll = () => {
    localStorage.clear();
    setHistory([]);
    setApiKey('');
    setAutoTranslate(false);
    setSpeechRate(1.0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(apiKey)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab 1: Text Translator */}
        {activeTab === 'translate' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto mb-2 hidden sm:block">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Translate Any Language with Precision & AI Nuance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Contextual translation, speech-to-text, and instant pronunciations.
              </p>
            </div>

            <TranslationBox
              sourceText={sourceText}
              setSourceText={setSourceText}
              translatedText={translatedText}
              setTranslatedText={setTranslatedText}
              sourceLang={sourceLang}
              setSourceLang={setSourceLang}
              targetLang={targetLang}
              setTargetLang={setTargetLang}
              onTranslate={handleTranslate}
              isTranslating={isTranslating}
              onOpenSourceModal={() => setIsSourceModalOpen(true)}
              onOpenTargetModal={() => setIsTargetModalOpen(true)}
              onOpenInsights={handleOpenInsights}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={handleToggleFavorite}
              provider={provider}
              detectedSource={detectedSource}
              onOpenHistory={() => {
                setHistoryStarredOnly(false);
                setActiveTab('history');
              }}
              onOpenSaved={() => {
                setHistoryStarredOnly(true);
                setActiveTab('history');
              }}
              historyCount={history.length}
              savedCount={history.filter(h => h.starred).length}
            />
          </div>
        )}

        {/* Tab 2: History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab('translate')}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
              >
                <span>←</span>
                <span>Back to Translate</span>
              </button>
            </div>

            <History
              history={history}
              onClearHistory={() => setHistory([])}
              onDeleteHistoryItem={(id) => setHistory(prev => prev.filter(h => h.id !== id))}
              onSelectHistoryItem={(item) => {
                setSourceText(item.sourceText);
                setTranslatedText(item.translatedText);
                setSourceLang(item.sourceLang);
                setTargetLang(item.targetLang);
                setActiveTab('translate');
              }}
              onToggleStar={handleToggleHistoryStar}
              initialStarredOnly={historyStarredOnly}
            />
          </div>
        )}

      </main>

      {/* Language Modals */}
      <LanguageSelectorModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        selectedCode={sourceLang}
        onSelect={(code) => setSourceLang(code)}
        allowAuto={true}
        title="Select Source Language"
      />

      <LanguageSelectorModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        selectedCode={targetLang}
        onSelect={(code) => setTargetLang(code)}
        allowAuto={false}
        title="Select Target Language"
      />

      {/* AI Linguistic Breakdown Panel */}
      <AiInsightsPanel
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        analysis={analysis}
        isLoading={isLoadingAnalysis}
        onSaveWord={() => {}}
        onApplyAlternative={(newText) => setTranslatedText(newText)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        autoTranslate={autoTranslate}
        setAutoTranslate={setAutoTranslate}
        onResetAll={handleResetAll}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Translator — AI Translator</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Web Speech API</span>
            <span>•</span>
            <span>Gemini AI Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
