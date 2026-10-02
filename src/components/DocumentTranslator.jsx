import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Download, Copy, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { uploadDocument, translateText } from '../services/api';
import { getLanguageByCode } from '../data/languages';

export default function DocumentTranslator({ sourceLang, targetLang, tone, domain, apiKey }) {
  const [file, setFile] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [docResult, setDocResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
      setDocResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
      setDocResult(null);
    }
  };

  const handleProcessDocument = async () => {
    if (!file) return;
    setIsTranslating(true);
    setError(null);

    try {
      // 1. Try server endpoint
      const result = await uploadDocument({
        file,
        sourceLang,
        targetLang,
        tone,
        domain,
        apiKey
      });

      setDocResult(result);
    } catch (err) {
      console.warn('Backend document upload failed, attempting client-side text parse:', err.message);

      // Client fallback for text files (.txt, .md, .csv, .json)
      const ext = file.name.split('.').pop().toLowerCase();
      if (['txt', 'md', 'json', 'csv'].includes(ext)) {
        try {
          const text = await file.text();
          const chunks = text.split(/\n\s*\n/).filter(Boolean).slice(0, 20);
          const translatedChunks = [];

          for (const chunk of chunks) {
            const res = await translateText({
              text: chunk.slice(0, 1500),
              sourceLang,
              targetLang,
              tone,
              domain,
              apiKey
            });
            translatedChunks.push(res.translatedText);
          }

          setDocResult({
            fileName: file.name,
            fileType: ext,
            wordCount: text.split(/\s+/).length,
            paragraphCount: chunks.length,
            originalText: text,
            translatedText: translatedChunks.join('\n\n')
          });
        } catch (clientErr) {
          setError(clientErr.message || 'Failed to parse and translate document');
        }
      } else {
        setError(`Could not process .${ext} file. Make sure the Translator backend server is running.`);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const downloadTranslatedFile = () => {
    if (!docResult?.translatedText) return;
    const blob = new Blob([docResult.translatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${docResult.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const targetLangObj = getLanguageByCode(targetLang);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Upload Box */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="p-8 sm:p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md transition-all text-center flex flex-col items-center justify-center cursor-pointer relative"
      >
        <input 
          type="file" 
          accept=".pdf,.docx,.txt,.md,.json,.csv"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          {file ? file.name : 'Upload Document for AI Translation'}
        </h3>
        
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-3">
          Drag and drop or browse your device. Supports <strong className="text-indigo-600 dark:text-indigo-400">PDF, Word (.docx), Markdown (.md), TXT, JSON, CSV</strong>.
        </p>

        {file && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <FileText className="w-4 h-4" />
            <span>{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        )}
      </div>

      {/* Action CTA */}
      {file && !docResult && (
        <div className="flex justify-center">
          <button
            onClick={handleProcessDocument}
            disabled={isTranslating}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting & Translating Document into {targetLangObj.name}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Translate Document to {targetLangObj.name}</span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Comparison Pane */}
      {docResult && (
        <div className="space-y-4 animate-slide-up">
          {/* Stats Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{docResult.fileName}</p>
                <p className="text-xs text-slate-500">
                  {docResult.wordCount} words translated • {docResult.paragraphCount} sections processed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(docResult.translatedText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                onClick={downloadTranslatedFile}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Translated File</span>
              </button>
            </div>
          </div>

          {/* Side by side preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Original Text Extracted
              </div>
              <div className="flex-1 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {docResult.originalText}
              </div>
            </div>

            {/* Translated */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm flex flex-col h-[500px]">
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Translated Output ({targetLangObj.name})</span>
              </div>
              <div className="flex-1 overflow-y-auto text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                {docResult.translatedText}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
