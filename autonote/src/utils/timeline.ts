import { TimedKeyword, WordTimestamp } from '@/types/note';

export const chunkTimeline = (timeline: WordTimestamp[], size = 8) => {
  const chunks: { text: string; start: number }[] = [];
  for (let i = 0; i < timeline.length; i += size) {
    const slice = timeline.slice(i, i + size);
    const text = slice.map((w) => w.word).join(' ');
    const start = slice[0]?.start ?? 0;
    chunks.push({ text, start });
  }
  return chunks;
};

export const estimateKeywordTimes = (
  keywords: string[],
  timeline: WordTimestamp[],
): TimedKeyword[] => {
  const normalized = timeline.map((word) => ({
    ...word,
    norm: word.word.toLowerCase(),
  }));

  return keywords.map((keyword) => {
    const key = keyword.toLowerCase().split(' ')[0];
    const found = normalized.find((w) => w.norm.includes(key));
    return {
      keyword,
      time: found?.start ?? 0,
    };
  });
};
