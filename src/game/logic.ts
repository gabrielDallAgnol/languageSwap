import {
  ProgressMap,
  QuizDirection,
  Round,
  Settings,
  TargetLanguage,
  Word,
  WordProgress,
} from '../types';

export type Rng = () => number;

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
  if (!progress || progress.seen < 3) return false;
  return accuracy(progress) >= 0.8;
}

export function learnedCount(progress: ProgressMap): number {
  return Object.values(progress).filter(isLearned).length;
}

/** Selection weight: unseen words come first, mastered ones least often. */
export function weightFor(word: Word, progress: ProgressMap): number {
  const p = progress[word.id];
  if (!p || p.seen === 0) return 3;
  if (isLearned(p)) return 0.5;
  return 2 - accuracy(p);
}

function weightedRandomIndex(weights: number[], rng: Rng): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return Math.floor(rng() * weights.length);
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i;
  }
  return weights.length - 1;
}

export function selectWords(
  words: Word[],
  count: number,
  progress: ProgressMap,
  rng: Rng = Math.random,
): Word[] {
  const pool = [...words];
  const result: Word[] = [];
  const target = Math.min(count, words.length);
  while (result.length < target && pool.length > 0) {
    const weights = pool.map((w) => weightFor(w, progress));
    const index = weightedRandomIndex(weights, rng);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
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
  let prompt: string;
  let correctAnswer: string;
  let optionText: (w: Word) => string;

  if (settings.direction === 'germanToTarget') {
    prompt = germanDisplay(word);
    correctAnswer = translation(word, lang);
    optionText = (w) => translation(w, lang);
  } else {
    prompt = translation(word, lang);
    correctAnswer = germanDisplay(word);
    optionText = (w) => germanDisplay(w);
  }

  const distractor = pickDistractor(word, words, optionText, correctAnswer, rng);
  const correctIsLeft = rng() < 0.5;
  return {
    wordId: word.id,
    prompt,
    leftOption: correctIsLeft ? correctAnswer : distractor,
    rightOption: correctIsLeft ? distractor : correctAnswer,
    correctIsLeft,
  };
}

export function buildRounds(
  words: Word[],
  settings: Settings,
  progress: ProgressMap,
  rng: Rng = Math.random,
): Round[] {
  if (words.length < 2) return [];
  const count = Math.min(Math.max(settings.sessionLength, 1), words.length);
  return selectWords(words, count, progress, rng).map((word) =>
    makeRound(word, words, settings, rng),
  );
}

export function recordAnswer(
  progress: ProgressMap,
  wordId: number,
  correct: boolean,
): ProgressMap {
  const prev = progress[wordId] ?? { seen: 0, correct: 0, lastSeen: null };
  return {
    ...progress,
    [wordId]: {
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
      lastSeen: Date.now(),
    },
  };
}
