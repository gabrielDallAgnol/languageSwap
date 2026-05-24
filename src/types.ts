export type TargetLanguage = 'english' | 'portuguese';

export type QuizDirection = 'germanToTarget' | 'targetToGerman';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'number'
  | 'interjection'
  | 'other';

export interface Word {
  id: number;
  /** Bare German word. For nouns this excludes the article (e.g. "Mann"). */
  german: string;
  /** der / die / das for nouns, otherwise null. */
  article: string | null;
  english: string;
  portuguese: string;
  pos: PartOfSpeech;
}

export interface Round {
  wordId: number;
  prompt: string;
  /** German word as displayed (with article); used for audio playback. */
  german: string;
  /** der / die / das for the round's word, or null. */
  article: string | null;
  /** True when the option buttons show German words (reverse direction). */
  optionsAreGerman: boolean;
  leftOption: string;
  rightOption: string;
  correctIsLeft: boolean;
}

export interface WordProgress {
  seen: number;
  correct: number;
  /** Leitner box: 0 = new/unseen, higher = better known. */
  box: number;
  /** Epoch ms when this word is next due for review, or null if new. */
  dueAt: number | null;
  lastSeen: number | null;
}

export type ProgressMap = Record<number, WordProgress>;

export interface Settings {
  targetLanguage: TargetLanguage;
  direction: QuizDirection;
  sessionLength: number;
  autoSpeak: boolean;
}

export interface Stats {
  /** Consecutive days with at least one answered card. */
  dayStreak: number;
  /** Local day (YYYY-MM-DD) of the most recent study activity. */
  lastStudyDay: string | null;
  /** Total cards answered all-time. */
  totalAnswered: number;
}

export const DEFAULT_SETTINGS: Settings = {
  targetLanguage: 'english',
  direction: 'germanToTarget',
  sessionLength: 20,
  autoSpeak: true,
};

export const DEFAULT_STATS: Stats = {
  dayStreak: 0,
  lastStudyDay: null,
  totalAnswered: 0,
};
