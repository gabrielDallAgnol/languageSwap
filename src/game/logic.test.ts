import { WORDS } from '../data/words';
import { DEFAULT_SETTINGS, DEFAULT_STATS, ProgressMap, Settings, Word } from '../types';
import {
  BOX_INTERVALS,
  buildRounds,
  dayKey,
  dueCount,
  germanDisplay,
  isLearned,
  learnedCount,
  LEARNED_BOX,
  makeRound,
  MAX_BOX,
  newCount,
  recordAnswer,
  registerActivity,
  selectSessionWords,
  translation,
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

describe('spaced repetition scheduling', () => {
  it('promotes the box and schedules the next review on a correct answer', () => {
    const now = 1_000_000;
    const p1 = recordAnswer({}, 1, true, now);
    expect(p1[1].box).toBe(1);
    expect(p1[1].dueAt).toBe(now + BOX_INTERVALS[1]);
    const p2 = recordAnswer(p1, 1, true, now);
    expect(p2[1].box).toBe(2);
    expect(p2[1].dueAt).toBe(now + BOX_INTERVALS[2]);
  });

  it('drops back to box 1 on a mistake', () => {
    let progress: ProgressMap = {};
    for (let i = 0; i < 4; i++) progress = recordAnswer(progress, 1, true, 1000);
    expect(progress[1].box).toBe(4);
    progress = recordAnswer(progress, 1, false, 2000);
    expect(progress[1].box).toBe(1);
    expect(progress[1].correct).toBe(4);
    expect(progress[1].seen).toBe(5);
  });

  it('never exceeds the maximum box', () => {
    let progress: ProgressMap = {};
    for (let i = 0; i < 20; i++) progress = recordAnswer(progress, 1, true, 1000);
    expect(progress[1].box).toBe(MAX_BOX);
  });

  it('marks a word learned only once it reaches the learned box', () => {
    expect(isLearned(undefined)).toBe(false);
    expect(isLearned({ seen: 4, correct: 4, box: LEARNED_BOX - 1, dueAt: null, lastSeen: null })).toBe(false);
    expect(isLearned({ seen: 5, correct: 5, box: LEARNED_BOX, dueAt: null, lastSeen: null })).toBe(true);
  });

  it('counts due and new words', () => {
    const now = 10_000;
    const progress: ProgressMap = {
      1: { seen: 1, correct: 1, box: 1, dueAt: now - 1, lastSeen: now },
      2: { seen: 1, correct: 0, box: 1, dueAt: now + 100000, lastSeen: now },
    };
    expect(dueCount(progress, now)).toBe(1);
    expect(newCount(WORDS, progress)).toBe(WORDS.length - 2);
    expect(learnedCount(progress)).toBe(0);
  });
});

describe('session selection', () => {
  it('includes brand-new words even when many cards are already due', () => {
    const now = 100_000;
    const progress: ProgressMap = {};
    // Make the first 50 words due reviews.
    for (let i = 0; i < 50; i++) {
      progress[WORDS[i].id] = { seen: 2, correct: 1, box: 1, dueAt: now - 1, lastSeen: now };
    }
    const picked = selectSessionWords(WORDS, 12, progress, now, seededRng(5));
    const newOnes = picked.filter((w) => !progress[w.id]);
    expect(newOnes.length).toBeGreaterThan(0);
    expect(picked.length).toBe(12);
    expect(new Set(picked.map((w) => w.id)).size).toBe(12);
  });

  it('prefers due reviews over words not yet due', () => {
    const now = 100_000;
    const due = WORDS[0];
    const notDue = WORDS[1];
    const progress: ProgressMap = {
      [due.id]: { seen: 2, correct: 1, box: 1, dueAt: now - 1000, lastSeen: now },
      [notDue.id]: { seen: 2, correct: 2, box: 3, dueAt: now + 1_000_000, lastSeen: now },
    };
    // Only consider these two words and no new ones.
    const picked = selectSessionWords([due, notDue], 1, progress, now, seededRng(9));
    expect(picked[0].id).toBe(due.id);
  });

  it('caps the count at the number of available words', () => {
    const tiny = WORDS.slice(0, 5);
    const picked = selectSessionWords(tiny, 50, {}, Date.now(), seededRng(3));
    expect(picked).toHaveLength(5);
    expect(new Set(picked.map((w) => w.id)).size).toBe(5);
  });
});

describe('round generation', () => {
  const settings: Settings = { ...DEFAULT_SETTINGS, sessionLength: 20 };

  it('places the correct answer on the indicated side with a distinct distractor', () => {
    const rng = seededRng(42);
    for (let i = 0; i < 300; i++) {
      const word = WORDS[i % WORDS.length];
      const round = makeRound(word, WORDS, settings, rng);
      const correct = translation(word, 'english');
      const chosenCorrect = round.correctIsLeft ? round.leftOption : round.rightOption;
      const distractor = round.correctIsLeft ? round.rightOption : round.leftOption;
      expect(chosenCorrect).toBe(correct);
      expect(distractor.toLowerCase()).not.toBe(correct.toLowerCase());
      expect(round.german).toBe(germanDisplay(word));
    }
  });

  it('uses the translation as the prompt and German options in reverse mode', () => {
    const round = makeRound(noun, WORDS, { ...settings, direction: 'targetToGerman' }, seededRng(7));
    expect(round.prompt).toBe('man');
    expect(round.optionsAreGerman).toBe(true);
    const correct = round.correctIsLeft ? round.leftOption : round.rightOption;
    expect(correct).toBe('der Mann');
  });

  it('builds a session of the requested length with unique words', () => {
    const rounds = buildRounds(WORDS, { ...settings, sessionLength: 15 }, {}, Date.now(), seededRng(99));
    expect(rounds).toHaveLength(15);
    expect(new Set(rounds.map((r) => r.wordId)).size).toBe(15);
  });

  it('returns no rounds when there are fewer than two words', () => {
    expect(buildRounds(WORDS.slice(0, 1), settings, {}, Date.now(), seededRng(1))).toHaveLength(0);
  });
});

describe('daily streak', () => {
  it('starts a streak on first activity', () => {
    const updated = registerActivity(DEFAULT_STATS, new Date('2026-05-24T10:00:00'));
    expect(updated.dayStreak).toBe(1);
    expect(updated.lastStudyDay).toBe('2026-05-24');
    expect(updated.totalAnswered).toBe(1);
  });

  it('increments the streak on a consecutive day and only counts within the same day otherwise', () => {
    let stats = registerActivity(DEFAULT_STATS, new Date('2026-05-24T10:00:00'));
    stats = registerActivity(stats, new Date('2026-05-24T22:00:00')); // same day
    expect(stats.dayStreak).toBe(1);
    expect(stats.totalAnswered).toBe(2);
    stats = registerActivity(stats, new Date('2026-05-25T08:00:00')); // next day
    expect(stats.dayStreak).toBe(2);
  });

  it('resets the streak after a missed day', () => {
    let stats = registerActivity(DEFAULT_STATS, new Date('2026-05-24T10:00:00'));
    stats = registerActivity(stats, new Date('2026-05-27T10:00:00')); // gap
    expect(stats.dayStreak).toBe(1);
  });

  it('formats day keys with zero padding', () => {
    expect(dayKey(new Date('2026-01-05T00:00:00'))).toBe('2026-01-05');
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

  it('has a substantial deck', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(300);
  });
});
