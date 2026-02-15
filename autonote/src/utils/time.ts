export const formatMillis = (ms: number): string => {
  if (!ms || Number.isNaN(ms)) return '0:00';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString();
};
