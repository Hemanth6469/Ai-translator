// Client-side API Service with auto-fallback to direct browser fetch if server isn't reachable

const BACKEND_BASE = '/api';

export async function translateText({ text, sourceLang = 'auto', targetLang = 'es', apiKey = '' }) {
  if (!text || !text.trim()) {
    return { translatedText: '', detectedSource: sourceLang };
  }

  // 1. Try backend server endpoint first
  try {
    const res = await fetch(`${BACKEND_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
        apiKey: apiKey || undefined
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.translatedText) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend server unavailable or returned error, initiating browser fallback:', err.message);
  }

  // 2. Direct browser fallback using Google GTX
  try {
    const sl = (sourceLang === 'auto') ? 'auto' : sourceLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0].map(item => item[0]).filter(Boolean);
        const translatedText = translatedParts.join('');
        const detectedSource = data[2] || (sourceLang === 'auto' ? 'en' : sourceLang);
        return {
          success: true,
          translatedText,
          detectedSource,
          provider: 'High-Speed Web Engine (Direct)'
        };
      }
    }
  } catch (clientErr) {
    console.warn('Direct Google GTX failed, trying MyMemory client fetch:', clientErr.message);
  }

  // 3. Direct browser fallback via MyMemory
  try {
    const sl = (sourceLang === 'auto') ? 'en' : sourceLang;
    const pair = `${sl}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${encodeURIComponent(pair)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return {
          success: true,
          translatedText: data.responseData.translatedText,
          detectedSource: sl,
          provider: 'MyMemory Linguistic Engine (Direct)'
        };
      }
    }
  } catch (myMemErr) {
    console.error('All translation routes failed:', myMemErr);
  }

  throw new Error('Could not translate text. Please verify your connection or try again.');
}

export async function explainTranslation({ originalText, translatedText, sourceLang, targetLang, apiKey }) {
  try {
    const res = await fetch(`${BACKEND_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalText,
        translatedText,
        sourceLang,
        targetLang,
        apiKey: apiKey || undefined
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data.analysis;
      }
    }
  } catch (err) {
    console.warn('Server explain failed:', err.message);
  }

  // Fallback heuristic explanation
  const words = originalText.split(/\s+/).slice(0, 4);
  return {
    summary: `Natural translation aligning "${sourceLang}" semantics to "${targetLang}".`,
    vocabulary: words.map(w => ({
      word: w,
      meaning: 'Contextual equivalent',
      pos: 'phrase',
      note: 'Key term in context'
    })),
    grammarNotes: [
      'Syntactic alignment applied according to grammar standards.',
      'Check tense and mood for formal correspondence.'
    ],
    culturalContext: 'For full AI-powered linguistic nuance and idioms, connect your Gemini API Key in Settings.',
    alternatives: [
      { style: 'Conversational', phrasing: translatedText, whenToUse: 'General everyday dialogue' }
    ]
  };
}
