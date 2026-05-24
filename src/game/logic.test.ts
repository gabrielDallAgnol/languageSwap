import { WORDS } from '../data/words';
import { DEFAULT_SETTINGS, ProgressMap, Settings, Word } from '../types';
import {
  buildRounds,
  germanDisplay,
  isLearned,
  learnedCount,
  makeRound,
  recordAnswer,
  selectWords,
  translation,
  weightFor,
} from './logic';

/** Deterministic pseudo-random generator so tests are repeatable. */
function seededRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

const noun: Word = { id: 1, german: 'Mann', article: 'der', english: 'man', portuguese: 'o homem', pos: 'noun' };
const verb: Word = { id: 2, german: 'gehen', article: null, english: 'to go', portuguese: 'ir', pos: 'verb' };

describe('word helpers', () => {
  it('builds the German display string with the article for nouns', () => {
    expect(germanDisplay(noun)).toBe('der Mann');
    expect(germanDisplay(verb)).toBe('gehen');
  });

  it('returns the requested translation', () => {
    expect(translation(noun, 'english')).toBe('man');
    expect(translation(noun, 'portuguese')).toBe('o homem');
  });
});

describe('progress', () => {
  it('marks a word learned only after enough correct answers', () => {
    expect(isLearned(undefined)).toBe(false);
    expect(isLearned({ seen: 2, correct: 2, lastSeen: null })).toBe(false);
    expect(isLearned({ seen: 3, correct: 3, lastSeen: null })).toBe(true);
    expect(isLearned({ seen: 5, correct: 3, lastSeen: null })).toBe(false); // 60% < 80%
  });

  it('weights unseen words above mastered ones', () => {
    const progress: ProgressMap = { 1: { seen: 4, correct: 4, lastSeen: null } };
    expect(weightFor(noun, progress)).toBeLessThan(weightFor(verb, progress));
  });

  it('records answers immutably and counts learned words', () => {
    let progress: ProgressMap = {};
    for (let i = 0; i < 3; i++) progress = recordAnswer(progress, 1, true);
    expect(progress[1].seen).toBe(3);
    expect(progress[1].correct).toBe(3);
    expect(learnedCount(progress)).toBe(1);
  });
});

describe('round generation', () => {
  const settings: Settings = { ...DEFAULT_SETTINGS, sessionLength: 20 };

  it('places the correct answer on the indicated side and a different distractor on the other', () => {
    const rng = seededRng(42);
    for (let i = 0; i < 200; i++) {
      const word = WORDS[i % WORDS.length];
      const round = makeRound(word, WORDS, settings, rng);
      const correct = translation(word, 'english');
      const chosenCorrect = round.correctIsLeft ? round.leftOption : round.rightOption;
      const distractor = round.correctIsLeft ? round.rightOption : round.leftOption;
      expect(chosenCorrect).toBe(correct);
      expect(distractor.toLowerCase()).not.toBe(correct.toLowerCase());
    }
  });

  it('uses the translation as the prompt in the reverse direction', () => {
    const rng = seededRng(7);
    const round = makeRound(noun, WORDS, { ...settings, direction: 'targetToGerman' }, rng);
    expect(round.prompt).toBe('man');
    const correct = round.correctIsLeft ? round.leftOption : round.rightOption;
    expect(correct).toBe('der Mann');
  });

  it('builds a session of the requested length with unique words', () => {
    const rng = seededRng(99);
    const rounds = buildRounds(WORDS, { ...settings, sessionLength: 15 }, {}, rng);
    expect(rounds).toHaveLength(15);
    const ids = new Set(rounds.map((r) => r.wordId));
    expect(ids.size).toBe(15);
  });

  it('caps the session length at the number of available words', () => {
    const tiny = WORDS.slice(0, 5);
    const rounds = buildRounds(tiny, { ...settings, sessionLength: 50 }, {}, seededRng(3));
    expect(rounds).toHaveLength(5);
  });

  it('returns no rounds when there are fewer than two words', () => {
    expect(buildRounds(WORDS.slice(0, 1), settings, {}, seededRng(1))).toHaveLength(0);
  });

  it('selects only existing words without duplicates', () => {
    const picked = selectWords(WORDS, 30, {}, seededRng(123));
    const ids = picked.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(WORDS.some((w) => w.id === id)).toBe(true));
  });
});

describe('data integrity', () => {
  it('has unique ids and complete translations', () => {
    const ids = WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    WORDS.forEach((w) => {
      expect(w.german.length).toBeGreaterThan(0);
      expect(w.english.length).toBeGreaterThan(0);
      expect(w.portuguese.length).toBeGreaterThan(0);
      if (w.pos === 'noun') expect(w.article).toBeTruthy();
    });
  });
});
