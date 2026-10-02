import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Loader2, Copy, Check, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { translateText } from '../services/api';
import { getLanguageByCode } from '../data/languages';

export default function ImageTranslator({ targetLang, tone, domain, apiKey, onSendToMain }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setExtractedText('');
      setTranslatedText('');
      setError(null);
      runOcrAndTranslate(file);
    }
  };

  const runOcrAndTranslate = async (imageSource) => {
    setIsProcessing(true);
    setOcrStatus('Initializing OCR engine...');
    setProgress(10);
    setError(null);

    try {
      // Initialize Tesseract worker
      const worker = await createWorker('eng+spa+fra+deu', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrStatus(`Recognizing text... ${Math.round(m.progress * 100)}%`);
            setProgress(20 + Math.round(m.progress * 60));
          }
        }
      });

      setOcrStatus('Extracting characters from image...');
      const ret = await worker.recognize(imageSource);
      await worker.terminate();

      const text = ret.data.text.trim();
      if (!text) {
        throw new Error('No readable text detected in the image. Please try a clearer photo or higher contrast image.');
      }

      setExtractedText(text);
      setProgress(85);
      setOcrStatus('Translating text with AI...');

      // Translate the extracted text
      const translationResult = await translateText({
        text,
        sourceLang: 'auto',
        targetLang,
        tone,
        domain,
        apiKey
      });

      setTranslatedText(translationResult.translatedText);
      setProgress(100);
      setOcrStatus('Complete!');
    } catch (err) {
      console.error('Image OCR error:', err);
      setError(err.message || 'Failed to extract text from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const targetLangObj = getLanguageByCode(targetLang);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Upload Zone */}
      <div className="p-8 sm:p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md text-center flex flex-col items-center justify-center relative cursor-pointer">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleImageUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
          <ImageIcon className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Upload Image or Photo with Text
        </h3>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-2">
          Supports screenshots, signs, menus, documents, and book pages (PNG, JPG, WEBP).
        </p>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              {ocrStatus}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Side-by-Side Result */}
      {(imageSrc || extractedText) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          
          {/* Left: Image & OCR text */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Source Image & Extracted Text
            </div>

            {imageSrc && (
              <div className="rounded-2xl overflow-hidden max-h-60 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <img src={imageSrc} alt="Uploaded source" className="max-h-60 w-auto object-contain" />
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 min-h-[100px] whitespace-pre-wrap">
              {extractedText || 'Extracting characters...'}
            </div>
          </div>

          {/* Right: Translated Result */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Translation ({targetLangObj.name})</span>
                </div>

                {translatedText && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(translatedText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="text-slate-900 dark:text-slate-100 text-base leading-relaxed whitespace-pre-wrap">
                {translatedText || (isProcessing ? 'Waiting for OCR extraction...' : 'No translation generated.')}
              </div>
            </div>

            {translatedText && onSendToMain && (
              <button
                onClick={() => onSendToMain(extractedText, translatedText)}
                className="w-full mt-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span>Edit in Main Translator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
