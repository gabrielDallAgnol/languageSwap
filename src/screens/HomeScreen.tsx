import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '../components/ProgressBar';
import { theme } from '../theme';
import { Settings } from '../types';

interface Props {
  totalWords: number;
  learned: number;
  due: number;
  newWords: number;
  dayStreak: number;
  totalAnswered: number;
  settings: Settings;
  onStart: () => void;
  onOpenSettings: () => void;
  onBrowse: () => void;
}

const directionLabel = (settings: Settings) => {
  const target = settings.targetLanguage === 'english' ? 'EN' : 'PT-BR';
  return settings.direction === 'germanToTarget' ? `DE → ${target}` : `${target} → DE`;
};

export function HomeScreen({
  totalWords,
  learned,
  due,
  newWords,
  dayStreak,
  totalAnswered,
  settings,
  onStart,
  onOpenSettings,
  onBrowse,
}: Props) {
  const masteryFraction = totalWords > 0 ? learned / totalWords : 0;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>LanguageSwap</Text>
          <Text style={styles.subtitle}>German vocabulary · {directionLabel(settings)}</Text>
        </View>
        <Pressable onPress={onOpenSettings} hitSlop={12}>
          <Text style={styles.gear}>Settings</Text>
        </Pressable>
      </View>

      {dayStreak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>
            {dayStreak}-day streak · keep it going
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <Stat value={due} label="Due" highlight={due > 0} />
        <Stat value={newWords} label="New" />
        <Stat value={learned} label="Learned" />
      </View>
      <Pressable onPress={onBrowse} hitSlop={8}>
        <Text style={styles.totalLine}>Browse all {totalWords} words →</Text>
      </Pressable>

      <View style={styles.middle}>
        <View style={styles.masteryCard}>
          <View style={styles.masteryHeader}>
            <Text style={styles.masteryLabel}>Mastery</Text>
            <Text style={styles.masteryCount}>
              {learned} / {totalWords}
            </Text>
          </View>
          <ProgressBar fraction={masteryFraction} />
          <Text style={styles.masterySub}>
            {totalAnswered > 0
              ? `${totalAnswered} ${totalAnswered === 1 ? 'card' : 'cards'} answered all-time`
              : 'Answer cards to start mastering the deck'}
          </Text>
        </View>
      </View>

      <Text style={styles.blurb}>
        See a word, swipe it toward the correct meaning. Words you miss come back sooner; mastered
        words fade out.
      </Text>

      <Pressable style={styles.start} onPress={onStart}>
        <Text style={styles.startText}>Start a session</Text>
        <Text style={styles.startSub}>
          {settings.sessionLength} cards{due > 0 ? ` · ${due} due` : ''}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 },
  title: { color: theme.text, fontSize: 32, fontWeight: '800' },
  subtitle: { color: theme.textMuted, fontSize: 15, marginTop: 4 },
  gear: { color: theme.accent, fontSize: 16, fontWeight: '600' },
  streakBadge: {
    marginTop: 20,
    alignSelf: 'flex-start',
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  streakText: { color: theme.accent, fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  stat: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statHighlight: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  statValue: { color: theme.text, fontSize: 30, fontWeight: '800' },
  statValueHighlight: { color: theme.accent },
  statLabel: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
  totalLine: { color: theme.textMuted, fontSize: 13, marginTop: 12, textAlign: 'center' },
  middle: { flex: 1, justifyContent: 'center' },
  masteryCard: {
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  masteryLabel: {
    color: theme.textMuted,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  masteryCount: { color: theme.text, fontSize: 16, fontWeight: '700' },
  masterySub: { color: theme.textMuted, fontSize: 13, marginTop: 10 },
  blurb: { color: theme.textMuted, fontSize: 16, lineHeight: 23, marginBottom: 20 },
  start: {
    backgroundColor: theme.accent,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  startText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  startSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
});
