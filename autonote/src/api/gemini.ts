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
Analyze this academic/lecture content and return a structured JSON response.

IMPORTANT: Respond in both Turkish and English for bilingual students:

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
    const cleaned = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini parse error:', error);
    parsed = {
      title: '',
      summary: text,
      key_points: [],
      actions: [],
      timed_keywords: [],
    };
  }

  // Use Turkish or English based on availability (bilingual support)
  const fallbackFromSummary = (parsed.summary || parsed.summary_tr || '').split('\n')?.[0]?.trim() ?? '';
  const title = (parsed.title || parsed.title_tr || fallbackFromSummary || '').trim();
  const summary = parsed.summary_tr || parsed.summary || '';
  const keyPoints = parsed.key_points_tr?.length ? parsed.key_points_tr : parsed.key_points || [];
  const actionItems = parsed.actions_tr?.length ? parsed.actions_tr : parsed.actions || [];
  
  const timedKeywords: TimedKeyword[] =
    parsed.timed_keywords?.map((k) => ({
      keyword: k.word,
      time: timeToSeconds(k.approx_time),
    })) ?? [];

  return {
    title,
    summary,
    keyPoints,
    actionItems,
    timedKeywords,
  };
}
