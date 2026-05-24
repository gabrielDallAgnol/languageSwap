import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '../components/ProgressBar';
import { SwipeCard } from '../components/SwipeCard';
import { buildRounds } from '../game/logic';
import { theme } from '../theme';
import { ProgressMap, Round, Settings, Word } from '../types';

interface Props {
  words: Word[];
  settings: Settings;
  progress: ProgressMap;
  onRecord: (wordId: number, correct: boolean) => void;
  onExit: () => void;
}

interface Reveal {
  choseLeft: boolean;
  correct: boolean;
}

const REVEAL_MS = 900;

export function GameScreen({ words, settings, progress, onRecord, onExit }: Props) {
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(words, settings, progress));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [lean, setLean] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const round = rounds[index];

  const restart = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setRounds(buildRounds(words, settings, progress));
    setIndex(0);
    setScore(0);
    setStreak(0);
    setBest(0);
    setLean(0);
    setReveal(null);
    setFinished(false);
  }, [words, settings, progress]);

  const choose = useCallback(
    (choseLeft: boolean) => {
      if (reveal || !round) return;
      const correct = choseLeft === round.correctIsLeft;
      onRecord(round.wordId, correct);
      setReveal({ choseLeft, correct });
      setLean(choseLeft ? -1 : 1);
      if (correct) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const next = s + 1;
          setBest((b) => Math.max(b, next));
          return next;
        });
      } else {
        setStreak(0);
      }
      timer.current = setTimeout(() => {
        if (index >= rounds.length - 1) {
          setFinished(true);
        } else {
          setIndex((i) => i + 1);
          setReveal(null);
          setLean(0);
        }
      }, REVEAL_MS);
    },
    [reveal, round, index, rounds.length, onRecord],
  );

  if (rounds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.message}>Add at least two words to start a session.</Text>
          <Pressable style={styles.primaryButton} onPress={onExit}>
            <Text style={styles.primaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    const total = rounds.length;
    const pct = Math.round((score / total) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.resultsTitle}>Session complete</Text>
          <Text style={styles.bigScore}>
            {score}/{total}
          </Text>
          <Text style={styles.resultsDetail}>{pct}% correct</Text>
          <Text style={styles.resultsDetail}>Best streak: {best}</Text>
          <Pressable style={styles.primaryButton} onPress={restart}>
            <Text style={styles.primaryButtonText}>Play again</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onExit}>
            <Text style={styles.secondaryButtonText}>Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const correctText = round.correctIsLeft ? round.leftOption : round.rightOption;

  const panelColors = (isLeft: boolean) => {
    if (reveal) {
      if (isLeft === round.correctIsLeft) {
        return { backgroundColor: theme.correctSoft, borderColor: theme.correct };
      }
      if (reveal.choseLeft === isLeft) {
        return { backgroundColor: theme.wrongSoft, borderColor: theme.wrong };
      }
      return { backgroundColor: theme.cardMuted, borderColor: theme.border };
    }
    const active = (isLeft && lean === -1) || (!isLeft && lean === 1);
    return active
      ? { backgroundColor: theme.accentSoft, borderColor: theme.accent }
      : { backgroundColor: theme.cardMuted, borderColor: theme.border };
  };

  const renderOption = (isLeft: boolean) => {
    const label = isLeft ? round.leftOption : round.rightOption;
    return (
      <Pressable
        style={[styles.option, panelColors(isLeft)]}
        disabled={reveal !== null}
        onPress={() => choose(isLeft)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.optionText} adjustsFontSizeToFit numberOfLines={3}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
        <Text style={styles.counter}>
          {index + 1}/{rounds.length}
        </Text>
        <Text style={styles.score}>Score {score}</Text>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar fraction={index / rounds.length} />
      </View>

      <View style={styles.main}>
        <SwipeCard
          key={`${round.wordId}-${index}`}
          prompt={round.prompt}
          caption={settings.direction === 'germanToTarget' ? 'German' : labelFor(settings)}
          locked={reveal !== null}
          onChoose={choose}
          onLeanChange={setLean}
        />

        <View style={styles.feedbackWrap}>
          {reveal ? (
            <Text style={[styles.feedback, { color: reveal.correct ? theme.correct : theme.wrong }]}>
              {reveal.correct ? 'Correct!' : `Answer: ${correctText}`}
            </Text>
          ) : (
            <Text style={styles.streak}>{streak > 1 ? `Streak ${streak}` : ' '}</Text>
          )}
        </View>

        <View style={styles.options}>
          {renderOption(true)}
          {renderOption(false)}
        </View>
      </View>
    </SafeAreaView>
  );
}

function labelFor(settings: Settings): string {
  return settings.targetLanguage === 'english' ? 'English' : 'Português';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  close: { color: theme.textMuted, fontSize: 16 },
  counter: { color: theme.text, fontSize: 16, fontWeight: '600' },
  score: { color: theme.accent, fontSize: 16, fontWeight: '700' },
  progressWrap: { paddingHorizontal: 20, paddingTop: 12 },
  main: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  feedbackWrap: { height: 32, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  feedback: { fontSize: 18, fontWeight: '700' },
  streak: { color: theme.textMuted, fontSize: 16 },
  options: { flexDirection: 'row', gap: 14, marginTop: 18 },
  option: {
    flex: 1,
    minHeight: 110,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  optionText: { color: theme.text, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: theme.text, fontSize: 18, textAlign: 'center', marginBottom: 24 },
  resultsTitle: { color: theme.textMuted, fontSize: 18, marginBottom: 8 },
  bigScore: { color: theme.text, fontSize: 64, fontWeight: '800' },
  resultsDetail: { color: theme.textMuted, fontSize: 18, marginTop: 6 },
  primaryButton: {
    backgroundColor: theme.accent,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginTop: 28,
  },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secondaryButton: { paddingVertical: 14, paddingHorizontal: 32, marginTop: 10 },
  secondaryButtonText: { color: theme.textMuted, fontSize: 16, fontWeight: '600' },
});
