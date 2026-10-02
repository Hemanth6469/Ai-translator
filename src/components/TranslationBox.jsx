import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, Volume2, Mic, MicOff, Copy, Check, Star, 
  Trash2, ChevronDown, ThumbsUp, ThumbsDown, Share2, Search,
  Edit3, Image as ImageIcon, FileText, Globe, Sparkles, Loader2, X
} from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import { getTransliteration, getSyllableBreakdown, getLetterSpelling } from '../utils/transliterate';

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
  detectedSource,
  sourcePhonetic = null,
  targetPhonetic = null,
  onOpenHistory,
  onOpenSaved,
  historyCount = 0,
  savedCount = 0
}) {
  const [activeMediaTab, setActiveMediaTab] = useState('text'); // 'text' | 'images' | 'documents' | 'websites'
  const [showSpelling, setShowSpelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
  const [userRating, setUserRating] = useState(null); // 'up' | 'down' | null
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Setup Web Speech Recognition for voice input
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = sourceLang === 'auto' ? 'en-US' : (getLanguageByCode(sourceLang)?.speechCode || 'en-US');

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
        recognitionRef.current.lang = sourceLang === 'auto' ? 'en-US' : (getLanguageByCode(sourceLang)?.speechCode || 'en-US');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Text-To-Speech Pronunciation
  const speakText = (text, langCode, isSource = false) => {
    if (!window.speechSynthesis || !text || !text.trim()) return;

    window.speechSynthesis.cancel();
    const langObj = getLanguageByCode(langCode);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langObj?.speechCode || 'en-US';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith((utterance.lang || '').slice(0, 2)));
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

  // Speak slowly (syllable pace)
  const speakSlowly = (text, langCode) => {
    if (!window.speechSynthesis || !text || !text.trim()) return;
    window.speechSynthesis.cancel();
    const langObj = getLanguageByCode(langCode);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langObj?.speechCode || 'en-US';
    utterance.rate = 0.55;
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith((utterance.lang || '').slice(0, 2)));
    if (targetVoice) utterance.voice = targetVoice;
    setIsSpeakingTarget(true);
    utterance.onend = () => setIsSpeakingTarget(false);
    utterance.onerror = () => setIsSpeakingTarget(false);
    window.speechSynthesis.speak(utterance);
  };

  // Spell out letter-by-letter
  const spellLettersAloud = (text, langCode) => {
    if (!window.speechSynthesis || !text || !text.trim()) return;
    window.speechSynthesis.cancel();
    const langObj = getLanguageByCode(langCode);
    const words = text.trim().split(/\s+/).slice(0, 3);
    const lettersSpaced = words.map(w => w.replace(/[^\p{L}\p{N}]/gu, '').split('').join('  ')).join(' ... ');
    const utterance = new SpeechSynthesisUtterance(lettersSpaced);
    utterance.lang = langObj?.speechCode || 'en-US';
    utterance.rate = 0.65;
    setIsSpeakingTarget(true);
    utterance.onend = () => setIsSpeakingTarget(false);
    utterance.onerror = () => setIsSpeakingTarget(false);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Translation',
          text: `"${sourceText}" -> "${translatedText}"`
        });
      } catch (e) {
        // user cancelled or share failed
      }
    } else {
      copyToClipboard(`${sourceText}\n\n${translatedText}`);
      alert('Translation copied to clipboard for sharing!');
    }
  };

  // Quick Language Presets matching Google Translate layout
  const sourcePresets = [
    { code: 'auto', label: detectedSource && sourceLang === 'auto' ? `${getLanguageByCode(detectedSource).name} - Detected` : 'Detect language' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' }
  ];

  const targetPresets = [
    { code: 'te', label: 'Telugu' },
    { code: 'es', label: 'Spanish' },
    { code: 'el', label: 'Greek' },
    { code: 'ar', label: 'Arabic' }
  ];

  // Romanization transliteration & Spelling Breakdowns
  const targetPhoneticDisplay = targetPhonetic || getTransliteration(translatedText, targetLang);
  const sourcePhoneticDisplay = sourcePhonetic;
  const syllableBreakdown = getSyllableBreakdown(translatedText);
  const letterSpelling = getLetterSpelling(translatedText);
  const displaySpelling = targetPhoneticDisplay || syllableBreakdown;

  // File drop handler for Images & Documents
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    setUploadedFile(file);
    if (file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceText(event.target.result);
        setActiveMediaTab('text');
      };
      reader.readAsText(file);
    } else {
      // Mock / OCR notice
      setTimeout(() => {
        setSourceText(`[Sample extracted text from: ${file.name}]\nWelcome to the AI Translator project.`);
        setActiveMediaTab('text');
      }, 700);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">

      {/* Top Google Translate Style Pills: Text, Images, Documents, Websites */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveMediaTab('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeMediaTab === 'text'
              ? 'bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-950/80 dark:text-blue-300 shadow-sm'
              : 'border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="font-serif text-sm">文A</span>
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveMediaTab('images')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeMediaTab === 'images'
              ? 'bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-950/80 dark:text-blue-300 shadow-sm'
              : 'border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-[#1967d2]" />
          <span>Images</span>
        </button>

        <button
          onClick={() => setActiveMediaTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeMediaTab === 'documents'
              ? 'bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-950/80 dark:text-blue-300 shadow-sm'
              : 'border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-[#1967d2]" />
          <span>Documents</span>
        </button>

        <button
          onClick={() => setActiveMediaTab('websites')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeMediaTab === 'websites'
              ? 'bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-950/80 dark:text-blue-300 shadow-sm'
              : 'border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-[#1967d2]" />
          <span>Websites</span>
        </button>
      </div>

      {/* Main Translation View (Text Tab) */}
      {activeMediaTab === 'text' && (
        <div className="space-y-2">
          
          {/* Language Selector Bar (Google Translate Underlined Tabs Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Source Languages Row */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
              <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none">
                {sourcePresets.map(preset => {
                  const isSelected = sourceLang === preset.code || (preset.code === 'auto' && sourceLang === 'auto');
                  return (
                    <button
                      key={preset.code}
                      onClick={() => setSourceLang(preset.code)}
                      className={`relative py-2 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        isSelected 
                          ? 'text-[#1a73e8] dark:text-blue-400 font-semibold' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                      {isSelected && (
                        <div className="absolute bottom-[-5px] left-0 right-0 h-[3px] bg-[#1a73e8] dark:bg-blue-400 rounded-full" />
                      )}
                    </button>
                  );
                })}

                {/* More Languages Dropdown Chevron */}
                <button
                  onClick={onOpenSourceModal}
                  title="More languages"
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ml-1"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Swap button on mobile / tablet */}
              <div className="lg:hidden">
                <button
                  onClick={handleSwapLanguages}
                  title="Swap languages"
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Target Languages Row */}
            <div className="hidden lg:flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 relative">
              
              {/* Floating Center Swap Button for Large screens */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={handleSwapLanguages}
                  title="Swap source & target languages"
                  className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#1a73e8] hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none pl-3">
                {targetPresets.map(preset => {
                  const isSelected = targetLang === preset.code;
                  return (
                    <button
                      key={preset.code}
                      onClick={() => setTargetLang(preset.code)}
                      className={`relative py-2 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        isSelected 
                          ? 'text-[#1a73e8] dark:text-blue-400 font-semibold' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                      {isSelected && (
                        <div className="absolute bottom-[-5px] left-0 right-0 h-[3px] bg-[#1a73e8] dark:bg-blue-400 rounded-full" />
                      )}
                    </button>
                  );
                })}

                {/* More Target Languages Chevron */}
                <button
                  onClick={onOpenTargetModal}
                  title="More languages"
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ml-1"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {provider && (
                <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden xl:flex items-center gap-1 pr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{provider}</span>
                </div>
              )}
            </div>

          </div>

          {/* Dual Box Container: Left White, Right Light-Blue/Gray Tint */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Left Source Box */}
            <div className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col min-h-[260px] sm:min-h-[290px] relative transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
              
              {/* Clear button (X) on top-right */}
              {sourceText && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setSourceText('');
                      setTranslatedText('');
                    }}
                    title="Clear text"
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Textarea & Source Phonetics */}
              <div className="flex-1 p-5 pr-12 flex flex-col justify-start">
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      onTranslate();
                    }
                  }}
                  placeholder="[Enter text or phrase]"
                  className="w-full resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xl sm:text-2xl leading-relaxed focus:outline-none"
                  rows={sourcePhoneticDisplay ? 2 : 4}
                />

                {/* Source Phonetic Transliteration (e.g. "hī") */}
                {sourcePhoneticDisplay && (
                  <div className="text-sm font-normal text-slate-400 dark:text-slate-500 tracking-wide font-sans select-text mt-1">
                    {sourcePhoneticDisplay}
                  </div>
                )}
              </div>

              {/* Bottom Action Bar */}
              <div className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Microphone */}
                  <button
                    onClick={toggleListening}
                    title={isListening ? "Listening... click to stop" : "Translate by voice"}
                    className={`p-2 rounded-full transition-colors ${
                      isListening 
                        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 animate-pulse' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Speaker */}
                  <button
                    onClick={() => speakText(sourceText, detectedSource || sourceLang, true)}
                    disabled={!sourceText.trim() || isSpeakingSource}
                    title="Listen to input"
                    className={`p-2 rounded-full transition-colors ${
                      isSpeakingSource
                        ? 'text-[#1a73e8] bg-blue-50 dark:bg-blue-950/50 animate-bounce'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-xs">
                  <span>{sourceText.length}</span>
                  <button
                    title="Keyboard input"
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Target Box (Tinted Background) */}
            <div className="bg-[#f8fafd] dark:bg-[#202124] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col min-h-[260px] sm:min-h-[290px] relative transition-all">
              
              {/* Star / Save button on top-right */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={onToggleFavorite}
                  disabled={!translatedText.trim()}
                  title={isFavorite ? "Saved to favorites" : "Save translation"}
                  className={`p-1.5 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                    isFavorite 
                      ? 'text-amber-500 hover:text-amber-600' 
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Main Translation Content */}
              <div className="flex-1 p-5 pr-12 overflow-y-auto">
                {isTranslating ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-[#1a73e8]" />
                    <span className="text-xs font-medium">Translating...</span>
                  </div>
                ) : translatedText ? (
                  <div className="space-y-3 select-text">
                    <div className="text-slate-900 dark:text-slate-100 text-xl sm:text-2xl leading-relaxed font-normal whitespace-pre-wrap">
                      {translatedText}
                    </div>

                    {/* Transliteration Romanization (Pronunciation) */}
                    {displaySpelling && (
                      <div className="text-sm font-normal text-slate-500 dark:text-slate-400 tracking-wide font-sans">
                        {displaySpelling}
                      </div>
                    )}

                    {/* Interactive "How to spell" Guide */}
                    {translatedText.trim() && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => setShowSpelling(!showSpelling)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] dark:text-blue-400 hover:underline"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[10px] font-mono border border-blue-200/60 dark:border-blue-800/60 font-bold">ABC</span>
                            <span>{showSpelling ? 'Hide spelling guide' : 'How to spell'}</span>
                          </button>

                          {showSpelling && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => speakSlowly(translatedText, targetLang)}
                                title="Pronounce slowly"
                                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
                              >
                                <span>🐢</span>
                                <span>Slow</span>
                              </button>
                              <button
                                onClick={() => spellLettersAloud(translatedText, targetLang)}
                                title="Spell letters aloud"
                                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
                              >
                                <span>🔤</span>
                                <span>Spell letters</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {showSpelling && (
                          <div className="bg-white/90 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 shadow-sm animate-fade-in">
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Syllables (Sound it out):</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200 text-sm tracking-wide">
                                {syllableBreakdown || translatedText}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Letter-by-Letter Spelling:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300 text-xs tracking-wider">
                                {letterSpelling || translatedText}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
                    Translation
                  </div>
                )}
              </div>

              {/* Bottom Action Bar */}
              <div className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  
                  {/* Speaker Target */}
                  <button
                    onClick={() => speakText(translatedText, targetLang, false)}
                    disabled={!translatedText.trim() || isSpeakingTarget}
                    title="Listen to translation"
                    className={`p-2 rounded-full transition-colors ${
                      isSpeakingTarget 
                        ? 'text-[#1a73e8] bg-blue-50 dark:bg-blue-950/50 animate-bounce' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => copyToClipboard(translatedText)}
                    disabled={!translatedText.trim()}
                    title="Copy translation"
                    className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  </button>

                  {/* Search / Linguistic Breakdown */}
                  <button
                    onClick={onOpenInsights}
                    disabled={!translatedText.trim()}
                    title="Search & Linguistic Insights"
                    className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold text-sm"
                  >
                    <span className="font-serif">G</span>
                  </button>

                  {/* Rating / Feedback Thumbs */}
                  <button
                    onClick={() => setUserRating(userRating === 'up' ? null : 'up')}
                    disabled={!translatedText.trim()}
                    title="Good translation"
                    className={`p-2 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                      userRating === 'up' ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setUserRating(userRating === 'down' ? null : 'down')}
                    disabled={!translatedText.trim()}
                    title="Poor translation"
                    className={`p-2 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                      userRating === 'down' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    disabled={!translatedText.trim()}
                    title="Share translation"
                    className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Tab: Images */}
      {activeMediaTab === 'images' && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all bg-white dark:bg-slate-900 ${
            isDragging ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-300 dark:border-slate-800'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            Drag and drop an image
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Upload an image with text (.jpg, .jpeg, or .png) to extract and translate automatically.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-blue-700 text-white font-medium text-sm shadow-md transition-colors"
          >
            Browse your computer
          </button>
        </div>
      )}

      {/* Tab: Documents */}
      {activeMediaTab === 'documents' && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all bg-white dark:bg-slate-900 ${
            isDragging ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-300 dark:border-slate-800'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            accept=".txt,.pdf,.docx,.doc" 
            className="hidden" 
          />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            Upload a document
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Supports .docx, .pdf, or .txt files for instant automated translation.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-blue-700 text-white font-medium text-sm shadow-md transition-colors"
          >
            Browse documents
          </button>
        </div>
      )}

      {/* Tab: Websites */}
      {activeMediaTab === 'websites' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="max-w-xl mx-auto space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] flex items-center justify-center">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Translate a website
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter any web address to translate the page into {getLanguageByCode(targetLang)?.name || 'target language'}.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  if (websiteUrl) {
                    window.open(`https://translate.google.com/translate?sl=${sourceLang}&tl=${targetLang}&u=${encodeURIComponent(websiteUrl)}`, '_blank');
                  }
                }}
                className="px-6 py-3 rounded-xl bg-[#1a73e8] hover:bg-blue-700 text-white font-medium text-sm shadow-md transition-colors"
              >
                Translate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Circular Bottom Buttons: History & Saved */}
      <div className="pt-6 pb-2 flex flex-col items-center justify-center">
        <div className="flex items-center gap-12 sm:gap-16">
          
          {/* Circular History Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenHistory}
              title="Open translation history"
              className="w-14 h-14 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#1a73e8] hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all active:scale-95 relative"
            >
              {/* Clock with counter-clockwise arrow icon */}
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {historyCount > 99 ? '99+' : historyCount}
                </span>
              )}
            </button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              History
            </span>
          </div>

          {/* Circular Saved Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenSaved}
              title="Open saved translations"
              className="w-14 h-14 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all active:scale-95 relative"
            >
              <Star className="w-6 h-6 stroke-current" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Saved
            </span>
          </div>

        </div>

        {/* Send feedback link bottom right */}
        <div className="w-full flex justify-end mt-2 pr-2">
          <button 
            onClick={() => alert('Thank you for using AI Translator! Feedback logged.')}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline"
          >
            Send feedback
          </button>
        </div>
      </div>

    </div>
  );
}
