export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

export type TimedKeyword = {
  keyword: string;
  time: number;
};

export type Note = {
  id: string;
  title: string;
  audioUri: string;
  duration: number;
  date: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  notes: string;
  timeline: WordTimestamp[];
  timedKeywords: TimedKeyword[];
};
