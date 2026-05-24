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
  leftOption: string;
  rightOption: string;
  correctIsLeft: boolean;
}

export interface WordProgress {
  seen: number;
  correct: number;
  lastSeen: number | null;
}

export type ProgressMap = Record<number, WordProgress>;

export interface Settings {
  targetLanguage: TargetLanguage;
  direction: QuizDirection;
  sessionLength: number;
}

export const DEFAULT_SETTINGS: Settings = {
  targetLanguage: 'english',
  direction: 'germanToTarget',
  sessionLength: 20,
};
