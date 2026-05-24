import {
  ProgressMap,
  Round,
  Settings,
  Stats,
  TargetLanguage,
  Word,
  WordProgress,
} from '../types';

export type Rng = () => number;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Leitner intervals indexed by box (box 0 is unused; first answer moves to box 1). */
export const BOX_INTERVALS = [0, 10 * MINUTE, HOUR, DAY, 3 * DAY, 7 * DAY, 30 * DAY];
export const MAX_BOX = BOX_INTERVALS.length - 1;
/** A word counts as "learned" once it reaches this box. */
export const LEARNED_BOX = 5;

export function germanDisplay(word: Word): string {
  return word.article ? `${word.article} ${word.german}` : word.german;
}

export function translation(word: Word, language: TargetLanguage): string {
  return language === 'english' ? word.english : word.portuguese;
}

export function accuracy(progress: WordProgress | undefined): number {
  if (!progress || progress.seen === 0) return 0;
  return progress.correct / progress.seen;
}

export function isLearned(progress: WordProgress | undefined): boolean {
  return !!progress && progress.box >= LEARNED_BOX;
}

export function learnedCount(progress: ProgressMap): number {
  return Object.values(progress).filter(isLearned).length;
}

export function dueCount(progress: ProgressMap, now = Date.now()): number {
  return Object.values(progress).filter((p) => p.dueAt !== null && p.dueAt <= now).length;
}

export function newCount(words: Word[], progress: ProgressMap): number {
  return words.filter((w) => !progress[w.id] || progress[w.id].seen === 0).length;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks the words for a session. Priority: due reviews and a fresh-word quota first,
 * then more reviews, then words approaching their due date. The result is shuffled so
 * new and review cards interleave.
 */
export function selectSessionWords(
  words: Word[],
  count: number,
  progress: ProgressMap,
  now = Date.now(),
  rng: Rng = Math.random,
): Word[] {
  const target = Math.min(Math.max(count, 0), words.length);
  if (target === 0) return [];

  const isNew = (w: Word) => !progress[w.id] || progress[w.id].seen === 0;
  const dueAt = (w: Word) => progress[w.id]?.dueAt ?? Infinity;

  const newWords = shuffle(words.filter(isNew), rng);
  const seenWords = words.filter((w) => !isNew(w));
  const dueWords = seenWords
    .filter((w) => dueAt(w) <= now)
    .sort((a, b) => dueAt(a) - dueAt(b));
  const upcoming = seenWords
    .filter((w) => dueAt(w) > now)
    .sort((a, b) => dueAt(a) - dueAt(b));

  const selected: Word[] = [];
  const taken = new Set<number>();
  const take = (pool: Word[]) => {
    for (const word of pool) {
      if (selected.length >= target) break;
      if (taken.has(word.id)) continue;
      selected.push(word);
      taken.add(word.id);
    }
  };

  // Reserve roughly a third of the session for brand-new words when available.
  const newQuota = Math.min(newWords.length, Math.ceil(target / 3));
  take(newWords.slice(0, newQuota));
  take(dueWords);
  take(newWords);
  take(upcoming);

  return shuffle(selected, rng);
}

function pickDistractor(
  word: Word,
  words: Word[],
  optionText: (w: Word) => string,
  exclude: string,
  rng: Rng,
): string {
  const samePos = words.filter((w) => w.id !== word.id && w.pos === word.pos);
  const base = samePos.length > 0 ? samePos : words.filter((w) => w.id !== word.id);
  const candidates = base
    .map(optionText)
    .filter((text) => text.toLowerCase() !== exclude.toLowerCase());
  if (candidates.length === 0) return exclude;
  return candidates[Math.floor(rng() * candidates.length)];
}

export function makeRound(
  word: Word,
  words: Word[],
  settings: Settings,
  rng: Rng = Math.random,
): Round {
  const lang = settings.targetLanguage;
  const german = germanDisplay(word);
  let prompt: string;
  let correctAnswer: string;
  let optionText: (w: Word) => string;
  const optionsAreGerman = settings.direction === 'targetToGerman';

  if (settings.direction === 'germanToTarget') {
    prompt = german;
    correctAnswer = translation(word, lang);
    optionText = (w) => translation(w, lang);
  } else {
    prompt = translation(word, lang);
    correctAnswer = german;
    optionText = (w) => germanDisplay(w);
  }

  const distractor = pickDistractor(word, words, optionText, correctAnswer, rng);
  const correctIsLeft = rng() < 0.5;
  return {
    wordId: word.id,
    prompt,
    german,
    article: word.article,
    optionsAreGerman,
    leftOption: correctIsLeft ? correctAnswer : distractor,
    rightOption: correctIsLeft ? distractor : correctAnswer,
    correctIsLeft,
  };
}

export function buildRounds(
  words: Word[],
  settings: Settings,
  progress: ProgressMap,
  now = Date.now(),
  rng: Rng = Math.random,
): Round[] {
  if (words.length < 2) return [];
  const count = Math.min(Math.max(settings.sessionLength, 1), words.length);
  return selectSessionWords(words, count, progress, now, rng).map((word) =>
    makeRound(word, words, settings, rng),
  );
}

export function recordAnswer(
  progress: ProgressMap,
  wordId: number,
  correct: boolean,
  now = Date.now(),
): ProgressMap {
  const prev = progress[wordId] ?? { seen: 0, correct: 0, box: 0, dueAt: null, lastSeen: null };
  // Correct answers promote one box; mistakes drop back to box 1 for a quick re-review.
  const box = correct ? Math.min(prev.box + 1, MAX_BOX) : 1;
  return {
    ...progress,
    [wordId]: {
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
      box,
      dueAt: now + BOX_INTERVALS[box],
      lastSeen: now,
    },
  };
}

/** Local calendar day key (YYYY-MM-DD) for streak tracking. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Updates the daily streak given study activity at `now`. */
export function registerActivity(stats: Stats, now = new Date()): Stats {
  const today = dayKey(now);
  if (stats.lastStudyDay === today) {
    return { ...stats, totalAnswered: stats.totalAnswered + 1 };
  }
  const yesterday = dayKey(new Date(now.getTime() - DAY));
  const dayStreak = stats.lastStudyDay === yesterday ? stats.dayStreak + 1 : 1;
  return {
    dayStreak,
    lastStudyDay: today,
    totalAnswered: stats.totalAnswered + 1,
  };
}
