import { GEMINI_API_KEY } from '@env';
import { WordTimestamp, TimedKeyword } from '@/types/note';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.1,
    topP: 0.9,
    topK: 20,
    responseMimeType: 'application/json',
  },
});

type GeminiResponse = {
  title: string;
  tldr: string;
  summary: string;
  key_points: string[];
  study_topics: string[];
  exam_questions: string[];
  definitions: { term: string; definition: string }[];
  study_plan: string[];
  flashcards: { question: string; answer: string }[];
  timed_keywords: { word: string; approx_time: string }[];
};

const buildPrompt = (transcript: string) => `
You are a precise academic note-taking assistant for a university student. Extract and organize information STRICTLY FROM THE TRANSCRIPT BELOW.

⚠️ CRITICAL RULES:
1. DETECT the language of the transcript and respond ENTIRELY in that same language. If Turkish, write everything in Turkish. If English, write in English. Never mix languages.
2. NEVER invent, assume, or add any fact, term, or concept not explicitly present in the transcript.
3. Every item in every array MUST be directly traceable to something spoken in the transcript.
4. If the transcript is unclear or incomplete, reflect that honestly.
5. Return ONLY the JSON object. No markdown, no explanation, no text outside the JSON.

OUTPUT FORMAT (valid JSON only):
{
  "title": "Concise title summarizing the lecture topic (max 8 words, in the transcript's language)",

  "tldr": "One single sentence — the most important takeaway from this lecture. The student reads ONLY this if they have 5 seconds.",

  "summary": "A structured 4–6 sentence paragraph: (1) what the lecture was about, (2) the main concepts or arguments covered, (3) any examples or evidence given, (4) what the lecturer emphasized or concluded. Written in the transcript's language.",

  "key_points": [
    "A specific concept, rule, or claim explicitly stated — include the lecturer's exact terminology",
    "Another distinct point from the lecture (aim for 5–8 items, each on a separate topic)"
  ],

  "exam_questions": [
    "A question a professor would likely ask on an exam based on what was emphasized in this lecture",
    "Another probable exam question — can be definition, comparison, application, or analysis type",
    "Aim for 4–6 questions that cover the most-discussed topics"
  ],

  "definitions": [
    { "term": "exact technical term or named concept from the lecture", "definition": "clear explanation of that term as used in this lecture — do not define terms not mentioned" }
  ],

  "study_plan": [
    "Memorize: [specific item] — because the lecturer stated it explicitly",
    "Understand: [concept] — because it was explained with examples and may appear applied on exams",
    "Review: [topic] — the lecturer only briefly mentioned this; look it up in the textbook",
    "Practice: [type of problem or exercise] — if applicable based on the content"
  ],

  "flashcards": [
    { "question": "What is [term]?", "answer": "The exact definition or explanation given in the lecture" },
    { "question": "How does [X] relate to [Y]?", "answer": "The relationship as described in the lecture" }
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
  tldr: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  examQuestions: string[];
  definitions: { term: string; definition: string }[];
  studyPlan: string[];
  flashcards: { question: string; answer: string }[];
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
    parsed = { title: '', tldr: '', summary: text.slice(0, 300), key_points: [], study_topics: [], exam_questions: [], definitions: [], study_plan: [], flashcards: [], timed_keywords: [] };
  }

  const safe = (v: any): string => (typeof v === 'string' ? v : String(v ?? ''));
  const safeArr = (v: any): string[] => (Array.isArray(v) ? v.map(safe).filter(Boolean) : []);

  const summary = safe(parsed.summary);
  const title = safe(parsed.title) || summary.split(' ').slice(0, 6).join(' ') || 'Untitled Note';

  const definitions = Array.isArray(parsed.definitions)
    ? parsed.definitions
        .filter((d) => d && typeof d === 'object' && d.term && d.definition)
        .map((d) => ({ term: safe(d.term), definition: safe(d.definition) }))
    : [];

  const flashcards = Array.isArray(parsed.flashcards)
    ? parsed.flashcards
        .filter((f) => f && typeof f === 'object' && f.question && f.answer)
        .map((f) => ({ question: safe(f.question), answer: safe(f.answer) }))
    : [];

  return {
    title: title.trim(),
    tldr: safe(parsed.tldr),
    summary,
    keyPoints: safeArr(parsed.key_points),
    actionItems: safeArr(parsed.study_topics),
    examQuestions: safeArr(parsed.exam_questions),
    definitions,
    studyPlan: safeArr(parsed.study_plan),
    flashcards,
    timedKeywords: (parsed.timed_keywords ?? []).map((k) => ({
      keyword: safe(k.word),
      time: timeToSeconds(safe(k.approx_time) || '0:00'),
    })),
  };
}
