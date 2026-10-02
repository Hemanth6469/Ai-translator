import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
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
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer memory storage for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Helper: Free fallback translation via Google Web RPC & MyMemory API
async function freeTranslateFallback(text, sourceLang, targetLang) {
  const sLang = (!sourceLang || sourceLang === 'auto') ? 'auto' : sourceLang;
  const tLang = targetLang || 'en';

  // Strategy 1: Google Translate GTX endpoint (fast, supports 100+ languages)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sLang)}&tl=${encodeURIComponent(tLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0].map(item => item[0]).filter(Boolean);
        const translatedText = translatedParts.join('');
        const detectedSource = data[2] || (sLang === 'auto' ? 'en' : sLang);
        if (translatedText.trim()) {
          return {
            translatedText,
            detectedSource,
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
async function geminiTranslate(text, sourceLang, targetLang, tone = 'standard', domain = 'general', apiKey) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error('No Gemini API key provided');
  }

  const genAI = new GoogleGenerativeAI(activeKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const toneGuidelines = {
    standard: 'Accurate, natural, and balanced.',
    casual: 'Conversational, colloquial, relaxed, and everyday phrasing.',
    formal: 'Polite, respectful, elevated vocabulary, and grammatically impeccable.',
    professional: 'Crisp, corporate, courteous, and business-ready.',
    poetic: 'Expressive, lyrical, metaphor-rich, and emotionally resonant.',
    academic: 'Scholarly, precise, technical terminology, and rigorous syntax.',
    eli5: 'Simple words, easy-to-understand, friendly, and accessible to a 5-year-old.',
    humorous: 'Witty, engaging, playful, while retaining original core intent.'
  };

  const domainGuidelines = {
    general: 'Standard everyday communication.',
    tech: 'Software, IT, engineering, preserving code snippets, variables, and technical terms.',
    business: 'Finance, enterprise, marketing, commerce, and negotiations.',
    medical: 'Healthcare, anatomy, pharmacology, maintaining clinical precision.',
    legal: 'Law, contracts, compliance, precise statutory language.',
    travel: 'Tourism, navigation, dining, local customs, and hospitality.'
  };

  const prompt = `You are a world-class AI Master Translator and Polyglot.
Translate the following text from ${sourceLang === 'auto' ? 'its automatically detected language' : sourceLang} to ${targetLang}.

Style & Tone: ${tone} (${toneGuidelines[tone] || toneGuidelines.standard})
Domain Context: ${domain} (${domainGuidelines[domain] || domainGuidelines.general})

Rules:
1. Translate accurately while adapting naturally to cultural context and the requested tone.
2. If code, formatting, or placeholders (like {name}, {{var}}, [link](url)) are present, preserve them exactly.
3. Return ONLY the translation. Do NOT include markdown fences, introductory greetings, or meta commentary unless explicitly requested.

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
    const { text, sourceLang = 'auto', targetLang = 'es', tone = 'standard', domain = 'general', apiKey } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    const trimmed = text.trim();
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    // If Gemini key is available AND either tone/domain requires AI or explicit key provided
    if (effectiveKey) {
      try {
        const result = await geminiTranslate(trimmed, sourceLang, targetLang, tone, domain, effectiveKey);
        return res.json({
          success: true,
          ...result,
          tone,
          domain
        });
      } catch (geminiError) {
        console.warn('Gemini translation encountered an error, falling back to free engine:', geminiError.message);
        // Fallback gracefully below
      }
    }

    // Free translation engine fallback
    const result = await freeTranslateFallback(trimmed, sourceLang, targetLang);
    return res.json({
      success: true,
      ...result,
      tone,
      domain
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

// 4. Document Parsing & Translation
app.post('/api/document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { sourceLang = 'auto', targetLang = 'es', tone = 'standard', domain = 'general', apiKey } = req.body;
    const file = req.file;
    const originalName = file.originalname;
    const ext = originalName.split('.').pop().toLowerCase();

    let extractedText = '';

    if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'csv') {
      extractedText = file.buffer.toString('utf-8');
    } else if (ext === 'pdf') {
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
    } else if (ext === 'docx') {
      const docxData = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = docxData.value;
    } else {
      return res.status(400).json({ error: `Unsupported file type: .${ext}. Supported formats: .txt, .md, .pdf, .docx, .json, .csv` });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'The uploaded document contains no readable text.' });
    }

    // Split text into reasonable chunks (paragraphs) to avoid payload limits
    const paragraphs = extractedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const maxParagraphs = 30; // Protect against giant documents crashing
    const selectedParagraphs = paragraphs.slice(0, maxParagraphs);

    const translatedParagraphs = [];
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    for (const paragraph of selectedParagraphs) {
      if (effectiveKey) {
        try {
          const resAI = await geminiTranslate(paragraph.slice(0, 2000), sourceLang, targetLang, tone, domain, effectiveKey);
          translatedParagraphs.push(resAI.translatedText);
          continue;
        } catch (e) {
          // fallback
        }
      }
      const resFree = await freeTranslateFallback(paragraph.slice(0, 1500), sourceLang, targetLang);
      translatedParagraphs.push(resFree.translatedText);
    }

    const translatedFull = translatedParagraphs.join('\n\n');
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    res.json({
      success: true,
      fileName: originalName,
      fileType: ext,
      wordCount,
      paragraphCount: selectedParagraphs.length,
      originalText: extractedText,
      translatedText: translatedFull
    });
  } catch (error) {
    console.error('Document error:', error);
    res.status(500).json({ success: false, error: error.message || 'Document processing failed' });
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
