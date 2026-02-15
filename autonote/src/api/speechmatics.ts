import { SPEECHMATICS_API_KEY } from '@env';
import { WordTimestamp } from '@/types/note';

const BASE_URL = 'https://asr.api.speechmatics.com/v2';

const authHeader = () => {
  if (!SPEECHMATICS_API_KEY) {
    throw new Error('Missing SPEECHMATICS_API_KEY in .env');
  }
  return { Authorization: `Bearer ${SPEECHMATICS_API_KEY}` };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Upload audio and return job id
export async function uploadToSpeechmatics(audioUri: string, language: string = 'tr') {
  if (!audioUri) throw new Error('Audio file is missing');
  const lower = audioUri.toLowerCase();
  const isWav = lower.endsWith('.wav');
  const mime = isWav ? 'audio/wav' : 'audio/m4a';
  const name = isWav ? 'recording.wav' : 'recording.m4a';
  const formData = new FormData();
  formData.append(
    'config',
    JSON.stringify({
      type: 'transcription',
      transcription_config: {
        language,
      },
    }),
  );
  formData.append('data_file', {
    uri: audioUri,
    type: mime,
    name,
  } as any);
  const response = await fetch(`${BASE_URL}/jobs/`, {
    method: 'POST',
    headers: {
      ...authHeader(),
      Accept: 'application/json',
    },
    body: formData,
  });
  const json = await response.json();
  if (!response.ok) {
    const reason = json?.message || json?.error || JSON.stringify(json);
    throw new Error(reason || 'Erreur lors de l’envoi à Speechmatics');
  }
  return json.id;
}

// Job status
export async function getSpeechmaticsJob(jobId: string) {
  const response = await fetch(`${BASE_URL}/jobs/${jobId}`, {
    method: 'GET',
    headers: { ...authHeader(), Accept: 'application/json' },
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message ?? 'Erreur statut Speechmatics');
  }
  return json;
}

// Transcript endpoint
export async function getSpeechmaticsTranscript(jobId: string) {
  const response = await fetch(`${BASE_URL}/jobs/${jobId}/transcript?format=json-v2`, {
    method: 'GET',
    headers: { ...authHeader(), Accept: 'application/json' },
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message ?? 'Erreur récupération transcription Speechmatics');
  }
  return json;
}

export function parseSpeechmaticsTimestamps(result: any): WordTimestamp[] {
  if (!result || !result.results) return [];

  const words: WordTimestamp[] = [];
  const resultsArr = Array.isArray(result.results) ? result.results : [];

  resultsArr.forEach((res: any) => {
    // direct words array
    if (Array.isArray(res.words)) {
      res.words.forEach((w: any) =>
        words.push({
          word: w.word ?? w.text ?? '',
          start: Number(w.start_time ?? w.start ?? 0),
          end: Number(w.end_time ?? w.end ?? 0),
        }),
      );
      return;
    }

    // nested results.words (json-v2)
    if (Array.isArray(res.results) && res.results[0]?.words) {
      res.results[0].words.forEach((w: any) =>
        words.push({
          word: w.word ?? w.text ?? '',
          start: Number(w.start_time ?? w.start ?? 0),
          end: Number(w.end_time ?? w.end ?? 0),
        }),
      );
      return;
    }

    // alternatives-only structure
    if (Array.isArray(res.alternatives)) {
      res.alternatives.forEach((alt: any) => {
        const word = alt.content ?? alt.word ?? alt.text ?? '';
        const start = Number(alt.start_time ?? alt.start ?? res.start_time ?? res.start ?? 0);
        const end = Number(alt.end_time ?? alt.end ?? res.end_time ?? res.end ?? start);
        if (word) {
          words.push({ word, start, end });
        }
      });
    }
  });

  return words;
}

const extractTranscriptText = (json: any) => {
  const resultsArr = Array.isArray(json?.results) ? json.results : [];
  // Candidates
  const fromAlternatives =
    json?.results?.[0]?.alternatives?.[0]?.transcript ??
    json?.results?.alternatives?.[0]?.transcript ??
    null;
  const fromTranscriptsArray = json?.results?.transcripts?.[0]?.transcript ?? null;
  const fromText =
    json?.results?.[0]?.text ??
    json?.results?.[0]?.results?.[0]?.text ??
    json?.text ??
    null;

  if (fromAlternatives) return fromAlternatives;
  if (fromTranscriptsArray) return fromTranscriptsArray;
  if (fromText) return fromText;

  // Build from any alternatives content
  const altWords: string[] = [];
  resultsArr.forEach((res: any) => {
    if (Array.isArray(res.alternatives)) {
      res.alternatives.forEach((a: any) => {
        const w = a.content ?? a.word ?? a.text ?? '';
        if (w) altWords.push(w);
      });
    }
  });
  if (altWords.length) return altWords.join(' ').trim();

  // Build from words array
  const words = parseSpeechmaticsTimestamps(json);
  if (words.length) return words.map((w) => w.word).join(' ').trim();

  return '';
};

export async function pollSpeechmaticsTranscript(
  jobId: string,
  onStatus?: (status: string) => void,
  maxAttempts = 20,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const job = await getSpeechmaticsJob(jobId);
    const status = job?.job?.status ?? job?.status;
    onStatus?.(status);
    if (status === 'done' || status === 'complete') {
      let transcriptJson = await getSpeechmaticsTranscript(jobId);
      let timeline = parseSpeechmaticsTimestamps(transcriptJson);
      let transcriptText = extractTranscriptText(transcriptJson);
      if (!transcriptText && timeline.length) {
        transcriptText = timeline.map((w) => w.word).join(' ').trim();
      }
      return {
        transcriptJson,
        transcriptText: transcriptText || '',
        timeline,
      };
    }
    if (status === 'failed' || status === 'rejected') {
      throw new Error(job?.job?.error ?? 'Speechmatics job failed');
    }
    await sleep(3000);
  }
  throw new Error('Speechmatics transcription still processing, réessaie dans un instant.');
}

