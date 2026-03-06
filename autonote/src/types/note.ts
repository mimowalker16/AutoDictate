export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

export type TimedKeyword = {
  keyword: string;
  time: number;
};

export type Definition = {
  term: string;
  definition: string;
};

export type Flashcard = {
  question: string;
  answer: string;
};

export type Note = {
  id: string;
  title: string;
  audioUri: string;
  duration: number;
  date: string;
  transcript: string;
  tldr: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  examQuestions: string[];
  definitions: Definition[];
  studyPlan: string[];
  flashcards: Flashcard[];
  notes: string;
  timeline: WordTimestamp[];
  timedKeywords: TimedKeyword[];
};
