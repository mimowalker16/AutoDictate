import { GEMINI_API_KEY } from '@env';
import { WordTimestamp, TimedKeyword } from '@/types/note';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
Analyze this academic/lecture content and return ONLY a valid JSON object. Do not include any text before or after the JSON.

Return in both Turkish and English for bilingual students:

{
  "title": "Academic topic title (max 8 words)",
  "title_tr": "Akademik konu başlığı (max 8 kelime)", 
  "summary": "Detailed academic summary in English",
  "summary_tr": "Türkçe detaylı akademik özet",
  "key_points": ["Important academic concepts", "Key learning objectives"],
  "key_points_tr": ["Önemli akademik kavramlar", "Ana öğrenme hedefleri"],
  "actions": ["Study tasks", "Review items", "Research topics"],
  "actions_tr": ["Çalışma görevleri", "Gözden geçirme maddeleri", "Araştırma konuları"],
  "timed_keywords": [
    { "word": "technical term", "approx_time": "00:12" }
  ]
}

CRITICAL: Return ONLY the JSON object above. No explanations, no markdown, no extra text.

Focus on:
- Academic terminology and concepts
- University-level content structure  
- Study-relevant information
- Turkish and international academic context

Transcription:
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
