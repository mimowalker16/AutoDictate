import { GEMINI_API_KEY } from '@env';
import { WordTimestamp, TimedKeyword } from '@/types/note';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.1,
    topP: 0.9,
    topK: 20,
    responseMimeType: 'application/json',
  },
});

type GeminiResponse = {
  title: string;
  summary: string;
  key_points: string[];
  study_topics: string[];
  timed_keywords: { word: string; approx_time: string }[];
};

const buildPrompt = (transcript: string) => `
You are a precise academic note-taking assistant. Extract and organize information STRICTLY FROM THE TRANSCRIPT BELOW.

⚠️ CRITICAL RULES:
1. DETECT the language of the transcript and respond ENTIRELY in that same language. If the lecture is in Turkish, write everything in Turkish. If English, write in English. Never translate or mix languages.
2. NEVER invent, assume, or add any fact, term, or concept not explicitly present in the transcript.
3. Every key point and every study topic MUST be directly traceable to something spoken in the transcript.
4. If the transcript is unclear or incomplete, reflect that honestly.
5. Return ONLY the JSON object. No markdown, no explanation, no text outside the JSON.

OUTPUT FORMAT (valid JSON only):
{
  "title": "Concise title from the transcript topic (max 8 words, in the transcript's language)",
  "summary": "A thorough paragraph summarizing what was ACTUALLY SAID — the main argument, concepts introduced, and conclusions drawn. Minimum 3-5 sentences. Written in the transcript's language.",
  "key_points": [
    "A specific concept or claim explicitly stated — use the speaker's own words/terminology",
    "Another distinct point actually mentioned (aim for 4-7 items total)"
  ],
  "study_topics": [
    "A specific topic from this lecture the student should study more deeply — e.g. 'The definition and types of X introduced in this session'",
    "A concept that was mentioned but deserves further reading — e.g. 'The relationship between Y and Z discussed mid-lecture'",
    "Aim for 3-6 targeted study topics directly tied to what was covered"
  ],
  "timed_keywords": [
    { "word": "exact technical term or name spoken", "approx_time": "MM:SS" }
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

  const prompt = buildPrompt(transcript);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: GeminiResponse;
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON found');
    parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error('Gemini parse error:', error);
    console.error('Raw response:', text.slice(0, 500));
    parsed = { title: '', summary: text.slice(0, 300), key_points: [], study_topics: [], timed_keywords: [] };
  }

  const safe = (v: any): string => (typeof v === 'string' ? v : String(v ?? ''));
  const safeArr = (v: any): string[] => (Array.isArray(v) ? v.map(safe).filter(Boolean) : []);

  const summary = safe(parsed.summary);
  const title = safe(parsed.title) || summary.split(' ').slice(0, 6).join(' ') || 'Untitled Note';

  return {
    title: title.trim(),
    summary,
    keyPoints: safeArr(parsed.key_points),
    actionItems: safeArr(parsed.study_topics),
    timedKeywords: (parsed.timed_keywords ?? []).map((k) => ({
      keyword: safe(k.word),
      time: timeToSeconds(safe(k.approx_time) || '0:00'),
    })),
  };
}
