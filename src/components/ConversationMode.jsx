import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, ArrowRightLeft, Trash2, Download, User, Bot, Sparkles, Loader2 } from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import { translateText } from '../services/api';

export default function ConversationMode({ apiKey }) {
  const [person1Lang, setPerson1Lang] = useState('en');
  const [person2Lang, setPerson2Lang] = useState('es');
  const [activeSpeaker, setActiveSpeaker] = useState(null); // 'person1' | 'person2' | null
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'person1',
      original: 'Hello! Welcome to our hotel. How can I help you today?',
      translated: '¡Hola! Bienvenido a nuestro hotel. ¿Cómo puedo ayudarle hoy?',
      fromLang: 'en',
      toLang: 'es',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  const speakAudio = (text, langCode) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langObj = getLanguageByCode(langCode);
    utterance.lang = langObj.speechCode || 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = (speaker) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (activeSpeaker) {
      recognitionRef.current?.stop();
      if (activeSpeaker === speaker) {
        setActiveSpeaker(null);
        return;
      }
    }

    const langCode = speaker === 'person1' ? person1Lang : person2Lang;
    const targetCode = speaker === 'person1' ? person2Lang : person1Lang;
    const langObj = getLanguageByCode(langCode);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langObj.speechCode || 'en-US';

    recognition.onstart = () => {
      setActiveSpeaker(speaker);
      setCurrentTranscript('');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setCurrentTranscript(transcript);
    };

    recognition.onerror = (e) => {
      console.warn('Speech error:', e.error);
      setActiveSpeaker(null);
    };

    recognition.onend = async () => {
      setActiveSpeaker(null);
      if (currentTranscript.trim()) {
        await handleSendMessage(currentTranscript.trim(), speaker, langCode, targetCode);
      }
      setCurrentTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSendMessage = async (text, speaker, fromLang, toLang) => {
    if (!text.trim()) return;
    setIsProcessing(true);

    try {
      const res = await translateText({
        text,
        sourceLang: fromLang,
        targetLang: toLang,
        tone: 'casual',
        apiKey
      });

      const newMsg = {
        id: Date.now(),
        sender: speaker,
        original: text,
        translated: res.translatedText,
        fromLang,
        toLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newMsg]);

      // Automatically speak the translated text to the other person!
      speakAudio(res.translatedText, toLang);
    } catch (err) {
      console.error('Conversation translation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const p1Obj = getLanguageByCode(person1Lang);
  const p2Obj = getLanguageByCode(person2Lang);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[750px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fade-in">
      
      {/* Top Banner / Language Config */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Bilingual Live Conversation Mode
            </h3>
            <p className="text-xs text-slate-500">
              Speak into your microphone. Translations are spoken aloud automatically.
            </p>
          </div>
        </div>

        {/* Clear chat */}
        <button
          onClick={() => setMessages([])}
          title="Clear Conversation"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Transcript */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Mic className="w-10 h-10 opacity-30" />
            <p className="text-sm">Start speaking by clicking on either speaker button below.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isP1 = msg.sender === 'person1';
            const speakerLang = isP1 ? p1Obj : p2Obj;
            const targetLangObj = isP1 ? p2Obj : p1Obj;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isP1 ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-slate-500">
                    {isP1 ? `Speaker 1 (${speakerLang.name})` : `Speaker 2 (${speakerLang.name})`}
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>

                <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-3xl shadow-sm space-y-2 ${
                  isP1 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-sm' 
                    : 'bg-indigo-600 text-white rounded-tr-sm'
                }`}>
                  {/* Original speech */}
                  <div className={`text-xs ${isP1 ? 'text-slate-500 dark:text-slate-400' : 'text-indigo-200'} italic flex items-center justify-between gap-3`}>
                    <span>"{msg.original}"</span>
                    <button
                      onClick={() => speakAudio(msg.original, msg.fromLang)}
                      className="p-1 rounded hover:bg-black/10 transition-colors"
                      title="Listen original"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Translated output */}
                  <div className="text-base font-medium flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                    <span>{msg.translated}</span>
                    <button
                      onClick={() => speakAudio(msg.translated, msg.toLang)}
                      className="p-1 rounded hover:bg-black/10 transition-colors shrink-0"
                      title="Listen translation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Listening Transcript Bubble */}
        {activeSpeaker && currentTranscript && (
          <div className={`flex flex-col ${activeSpeaker === 'person1' ? 'items-start' : 'items-end'} animate-pulse`}>
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-sm italic">
              Listening... "{currentTranscript}"
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating & generating speech...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dual Speaker Controller Footers */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Speaker 1 Controller */}
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
          activeSpeaker === 'person1'
            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Speaker 1
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
              <span>{p1Obj.flag}</span>
              <span>{p1Obj.name}</span>
            </div>
          </div>

          <button
            onClick={() => startListening('person1')}
            className={`p-4 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
              activeSpeaker === 'person1'
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
            }`}
          >
            {activeSpeaker === 'person1' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-xs">{activeSpeaker === 'person1' ? 'Stop' : 'Speak'}</span>
          </button>
        </div>

        {/* Speaker 2 Controller */}
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
          activeSpeaker === 'person2'
            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Speaker 2
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
              <span>{p2Obj.flag}</span>
              <span>{p2Obj.name}</span>
            </div>
          </div>

          <button
            onClick={() => startListening('person2')}
            className={`p-4 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
              activeSpeaker === 'person2'
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
            }`}
          >
            {activeSpeaker === 'person2' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-xs">{activeSpeaker === 'person2' ? 'Stop' : 'Speak'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
