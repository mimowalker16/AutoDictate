import { GEMINI_API_KEY } from '@env';
import { WordTimestamp, TimedKeyword } from '@/types/note';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-2.5-flash' });

type GeminiResponse = {
  titre?: string;
  resume: string;
  points_importants: string[];
  actions: string[];
  timed_keywords: { word: string; approx_time: string }[];
};

const buildPrompt = (transcript: string, timestamps: WordTimestamp[]) => `
Analyse le texte et retourne un JSON structurÉ obligatoirement.
Retourne :
{
  "titre": "Titre court, clair, max 8 mots",
  "resume": "",
  "points_importants": [],
  "actions": [],
  "timed_keywords": [
    { "word": "...", "approx_time": "00:12" }
  ]
}

Transcription complète :
${transcript}

Timestamps disponibles :
${JSON.stringify(timestamps, null, 2)}
`;

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
    console.error('Erreur Gemini parse:', error);
    parsed = {
      titre: '',
      resume: text,
      points_importants: [],
      actions: [],
      timed_keywords: [],
    };
  }

  const fallbackFromSummary = parsed.resume?.split('\n')?.[0]?.trim() ?? '';
  const title = (parsed.titre || (parsed as any).title || fallbackFromSummary || '').trim();
  const timedKeywords: TimedKeyword[] =
    parsed.timed_keywords?.map((k) => ({
      keyword: k.word,
      time: timeToSeconds(k.approx_time),
    })) ?? [];

  return {
    title,
    summary: parsed.resume ?? '',
    keyPoints: parsed.points_importants ?? [],
    actionItems: parsed.actions ?? [],
    timedKeywords,
  };
}
