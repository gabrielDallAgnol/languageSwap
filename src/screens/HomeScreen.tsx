import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { Settings } from '../types';

interface Props {
  totalWords: number;
  learned: number;
  settings: Settings;
  onStart: () => void;
  onOpenSettings: () => void;
}

const directionLabel = (settings: Settings) => {
  const target = settings.targetLanguage === 'english' ? 'EN' : 'PT-BR';
  return settings.direction === 'germanToTarget' ? `DE → ${target}` : `${target} → DE`;
};

export function HomeScreen({ totalWords, learned, settings, onStart, onOpenSettings }: Props) {
  const remaining = Math.max(0, totalWords - learned);
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

      <View style={styles.statsRow}>
        <Stat value={learned} label="Learned" />
        <Stat value={remaining} label="To go" />
        <Stat value={totalWords} label="Total" />
      </View>

      <View style={styles.spacer} />

      <Text style={styles.blurb}>
        See a word, swipe it toward the correct meaning. Mastered words show up less often.
      </Text>

      <Pressable style={styles.start} onPress={onStart}>
        <Text style={styles.startText}>Start a session</Text>
        <Text style={styles.startSub}>{settings.sessionLength} cards</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
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
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  stat: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: { color: theme.text, fontSize: 30, fontWeight: '800' },
  statLabel: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
  spacer: { flex: 1 },
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
