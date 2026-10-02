import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper: Free fallback translation via Google Web RPC & MyMemory API
async function freeTranslateFallback(text, sourceLang, targetLang) {
  const sLang = (!sourceLang || sourceLang === 'auto') ? 'auto' : sourceLang;
  const tLang = targetLang || 'en';

  // Strategy 1: Google Translate GTX endpoint (fast, supports 80+ languages)
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
        let phoneticSpelling = null;
        for (let i = 0; i < data[0].length; i++) {
          const item = data[0][i];
          if (item && item[0]) {
            translatedParts.push(item[0]);
          }
          if (item && !item[0] && (item[2] || item[3])) {
            phoneticSpelling = item[2] || item[3];
          }
        }
        if (!phoneticSpelling && data[0].length > 0) {
          const last = data[0][data[0].length - 1];
          if (last && (last[2] || last[3])) {
            phoneticSpelling = last[2] || last[3];
          }
        }

        const translatedText = translatedParts.join('');
        const detectedSource = data[2] || (sLang === 'auto' ? 'en' : sLang);
        if (translatedText.trim()) {
          return {
            translatedText,
            detectedSource,
            phoneticSpelling: typeof phoneticSpelling === 'string' ? phoneticSpelling.trim() : null,
            provider: 'Universal High-Speed Engine'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Google GTX fallback failed, trying MyMemory:', err.message);
  }

  // Strategy 2: MyMemory API fallback
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
    console.warn('MyMemory fallback failed:', err.message);
  }

  throw new Error('All free translation engines are currently unavailable. Please check your connection or provide a Gemini API key.');
}

// Helper: AI Translation via Gemini
async function geminiTranslate(text, sourceLang, targetLang, apiKey) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error('No Gemini API key provided');
  }

  const genAI = new GoogleGenerativeAI(activeKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a world-class AI Master Translator and Polyglot.
Translate the following text accurately and naturally from ${sourceLang === 'auto' ? 'its automatically detected language' : sourceLang} to ${targetLang}.

Rules:
1. Translate accurately preserving original meaning, context, and nuance.
2. If code, formatting, or placeholders (like {name}, {{var}}, [link](url)) are present, preserve them exactly.
3. Return ONLY the translation. Do NOT include markdown fences, introductory greetings, or meta commentary.

Source Text:
${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const translatedText = response.text().trim();

  return {
    translatedText,
    detectedSource: sourceLang === 'auto' ? 'auto-detected' : sourceLang,
    provider: 'Google Gemini 1.5 AI'
  };
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// 2. Primary Translation Endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'auto', targetLang = 'es', apiKey } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    const trimmed = text.trim();
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    // If Gemini key is available
    if (effectiveKey) {
      try {
        const result = await geminiTranslate(trimmed, sourceLang, targetLang, effectiveKey);
        return res.json({
          success: true,
          ...result
        });
      } catch (geminiError) {
        console.warn('Gemini translation encountered an error, falling back to free engine:', geminiError.message);
      }
    }

    // Free translation engine fallback
    const result = await freeTranslateFallback(trimmed, sourceLang, targetLang);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed'
    });
  }
});

// 3. AI Linguistic Explanation & Analysis
app.post('/api/explain', async (req, res) => {
  try {
    const { originalText, translatedText, sourceLang, targetLang, apiKey } = req.body;

    if (!originalText || !translatedText) {
      return res.status(400).json({ error: 'Both originalText and translatedText are required' });
    }

    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    if (effectiveKey) {
      const genAI = new GoogleGenerativeAI(effectiveKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze this translation from ${sourceLang} to ${targetLang}.
Original: "${originalText}"
Translation: "${translatedText}"

Return a clean JSON object with this exact structure (no markdown fences, just pure JSON):
{
  "summary": "Brief summary of the translation nuance and context",
  "vocabulary": [
    { "word": "source word", "meaning": "target word", "pos": "noun/verb/adj", "note": "brief tip or nuance" }
  ],
  "grammarNotes": [
    "Key grammatical observation 1",
    "Key grammatical observation 2"
  ],
  "culturalContext": "Explanation of cultural or idiomatic meaning if any, or null if straightforward",
  "alternatives": [
    { "style": "Casual/Informal", "phrasing": "alternative translation", "whenToUse": "with close friends" },
    { "style": "Formal/Polite", "phrasing": "alternative translation", "whenToUse": "in business or with elders" }
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(cleaned);
        return res.json({ success: true, analysis: parsed });
      } catch (jsonErr) {
        return res.json({
          success: true,
          analysis: {
            summary: cleaned,
            vocabulary: [],
            grammarNotes: [],
            culturalContext: null,
            alternatives: []
          }
        });
      }
    }

    // Heuristic rule-based fallback analysis
    const words = originalText.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
    res.json({
      success: true,
      analysis: {
        summary: `Direct linguistic mapping between ${sourceLang || 'detected language'} and ${targetLang || 'target'}.`,
        vocabulary: words.map(w => ({
          word: w,
          meaning: 'Translated in context',
          pos: 'word',
          note: 'Key vocabulary term'
        })),
        grammarNotes: [
          'Direct grammatical structure mapping applied.',
          'Verify gender agreements and verb tenses for target dialect.'
        ],
        culturalContext: 'To unlock comprehensive AI nuance, idiom breakdowns, and cultural depth, add a free Gemini API key in Settings.',
        alternatives: [
          { style: 'Formal', phrasing: translatedText, whenToUse: 'General professional contexts' }
        ]
      }
    });
  } catch (error) {
    console.error('Explain error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static frontend assets if built
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(distPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('AI Translator API is running. Build the frontend or run in dev mode.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🌐 AI Translator Server running on http://localhost:${PORT}`);
});
