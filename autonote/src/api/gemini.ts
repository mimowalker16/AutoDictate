import { GEMINI_API_KEY } from '@env';
import { WordTimestamp, TimedKeyword } from '@/types/note';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.1,      // near-deterministic — reduces hallucination
    topP: 0.9,
    topK: 20,
    responseMimeType: 'application/json', // forces JSON-only output
  },
});

type GeminiResponse = {
  title?: string;
  title_tr?: string;
  summary: string;
  summary_tr?: string;
  key_points: string[];
  key_points_tr?: string[];
  actions: string[];
  actions_tr?: string[];
  timed_keywords: { word: string; approx_time: string }[];
};

const buildPrompt = (transcript: string, timestamps: WordTimestamp[]) => `
You are a precise academic note-taking assistant. Your job is to extract and organize information STRICTLY FROM THE TRANSCRIPT BELOW.

⚠️ CRITICAL RULES — violating these makes the output useless:
1. NEVER invent, assume, or hallucinate any fact, term, or concept not explicitly present in the transcript.
2. Every key point and every action item MUST be directly traceable to something spoken in the transcript.
3. If the transcript is unclear or incomplete, reflect that honestly — do NOT fill gaps with assumed knowledge.
4. Quote or closely paraphrase actual words from the transcript. Do not rewrite with your own domain knowledge.
5. Return ONLY the JSON object. No markdown, no explanation, no text outside the JSON.

OUTPUT FORMAT (valid JSON only):
{
  "title": "Concise title derived from the transcript topic (max 8 words, English)",
  "title_tr": "Transkriptten türetilmiş kısa başlık (max 8 kelime, Türkçe)",
  "summary": "A thorough paragraph summarizing what was ACTUALLY SAID. Cover the main argument or topic, key concepts introduced, and any conclusions drawn. 3-5 sentences minimum. English only.",
  "summary_tr": "Transkriptte gerçekte söylenenlerin özeti. Ana konu, sunulan kavramlar ve varılan sonuçlar. En az 3-5 cümle. Sadece Türkçe.",
  "key_points": [
    "Specific concept or claim explicitly stated in the transcript — use the speaker's own terminology",
    "Another distinct point actually mentioned — not inferred, not assumed",
    "Continue for every significant point covered (aim for 4-7 items)"
  ],
  "key_points_tr": [
    "Transkriptte açıkça belirtilen kavram veya iddia — konuşmacının kendi terminolojisini kullan",
    "Gerçekten bahsedilen başka bir nokta — çıkarım değil, varsayım değil"
  ],
  "actions": [
    "Specific study task implied or stated — e.g. 'Review the definition of X mentioned at the start'",
    "Only include tasks grounded in what was actually covered — not generic study advice"
  ],
  "actions_tr": [
    "Belirtilen veya ima edilen somut çalışma görevi — örn. 'Başta bahsedilen X tanımını gözden geçir'",
    "Sadece gerçekten ele alınan konulara dayalı görevler ekle"
  ],
  "timed_keywords": [
    { "word": "exact technical term or name spoken in transcript", "approx_time": "MM:SS" }
  ]
}

TRANSCRIPT:
${transcript}`;

const timeToSeconds = (value: string): number => {
  const [m, s] = value.split(':').map((part) => Number(part));
  if (Number.isNaN(m) || Number.isNaN(s)) return 0;
  return m * 60 + s;
};

export async function summarizeWithGemini(
  transcript: string,
  timestamps: WordTimestamp[] = [],
): Promise<{
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  timedKeywords: TimedKeyword[];
}> {
  if (!model) throw new Error('Missing GEMINI_API_KEY in .env');

  const prompt = buildPrompt(transcript, timestamps);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  let parsed: GeminiResponse;
  try {
    // Extract JSON from response - find first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    
    const jsonText = text.slice(firstBrace, lastBrace + 1);
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error('Gemini parse error:', error);
    console.error('Raw response:', text.slice(0, 500)); // Log first 500 chars
    parsed = {
      title: '',
      summary: text.slice(0, 200), // Use first 200 chars as fallback
      key_points: [],
      actions: [],
      timed_keywords: [],
    };
  }

  // Use Turkish or English based on availability (bilingual support)
  // Ensure all fields are properly typed (not stringified JSON)
  const getSafeString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return String(value || '');
  };

  const getSafeArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return [value];
    return [];
  };

  const fallbackFromSummary = getSafeString(parsed.summary || parsed.summary_tr).split('\n')?.[0]?.trim() ?? '';
  const title = (getSafeString(parsed.title || parsed.title_tr) || fallbackFromSummary || 'Başlıksız Not / Untitled Note').trim();
  const summary = getSafeString(parsed.summary_tr || parsed.summary || 'Özet oluşturulamadı / Summary unavailable');
  const keyPoints = getSafeArray(parsed.key_points_tr?.length ? parsed.key_points_tr : parsed.key_points);
  const actionItems = getSafeArray(parsed.actions_tr?.length ? parsed.actions_tr : parsed.actions);
  
  const timedKeywords: TimedKeyword[] =
    parsed.timed_keywords?.map((k) => ({
      keyword: String(k.word || ''),
      time: timeToSeconds(String(k.approx_time || '0:00')),
    })) ?? [];

  return {
    title,
    summary,
    keyPoints,
    actionItems,
    timedKeywords,
  };
}
