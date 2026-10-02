import { GoogleGenerativeAI } from '@google/generative-ai';

async function freeTranslateFallback(text, sourceLang, targetLang) {
  const sLang = (!sourceLang || sourceLang === 'auto') ? 'auto' : sourceLang;
  const tLang = targetLang || 'en';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sLang)}&tl=${encodeURIComponent(tLang)}&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = [];
        let targetPhonetic = null;
        let sourcePhonetic = null;
        for (let i = 0; i < data[0].length; i++) {
          const item = data[0][i];
          if (item && item[0]) {
            translatedParts.push(item[0]);
          }
          if (item && !item[0]) {
            if (item[2]) targetPhonetic = item[2];
            if (item[3]) sourcePhonetic = item[3];
          }
        }
        if ((!targetPhonetic || !sourcePhonetic) && data[0].length > 0) {
          const last = data[0][data[0].length - 1];
          if (last) {
            targetPhonetic = targetPhonetic || last[2] || null;
            sourcePhonetic = sourcePhonetic || last[3] || null;
          }
        }

        const translatedText = translatedParts.join('');
        const detectedSource = data[2] || (sLang === 'auto' ? 'en' : sLang);
        if (translatedText.trim()) {
          return {
            translatedText,
            detectedSource,
            targetPhonetic: typeof targetPhonetic === 'string' ? targetPhonetic.trim() : null,
            sourcePhonetic: typeof sourcePhonetic === 'string' ? sourcePhonetic.trim() : null,
            phoneticSpelling: typeof targetPhonetic === 'string' ? targetPhonetic.trim() : null,
            provider: 'Universal High-Speed Engine'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Google GTX fallback failed:', err);
  }

  try {
    const memSource = (sLang === 'auto') ? 'en' : sLang;
    const pair = `${memSource}|${tLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 1000))}&langpair=${encodeURIComponent(pair)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return {
          translatedText: data.responseData.translatedText,
          detectedSource: memSource,
          provider: 'MyMemory Linguistic Engine'
        };
      }
    }
  } catch (err) {
    console.warn('MyMemory fallback failed:', err);
  }

  throw new Error('All free translation engines are currently unavailable.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, sourceLang = 'auto', targetLang = 'es', apiKey } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for translation' });
  }

  const trimmed = text.trim();
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveKey) {
    try {
      const genAI = new GoogleGenerativeAI(effectiveKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Translate the following text accurately and naturally from ${sourceLang === 'auto' ? 'its detected language' : sourceLang} to ${targetLang}. Return ONLY the translation.\n\n${trimmed}`;
      const result = await model.generateContent(prompt);
      const translatedText = result.response.text().trim();
      return res.status(200).json({
        success: true,
        translatedText,
        detectedSource: sourceLang === 'auto' ? 'auto-detected' : sourceLang,
        provider: 'Google Gemini 1.5 AI'
      });
    } catch (e) {
      // fallback
    }
  }

  try {
    const result = await freeTranslateFallback(trimmed, sourceLang, targetLang);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
