import React from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { theme } from '../theme';
import { QuizDirection, Settings, TargetLanguage } from '../types';

interface Props {
  settings: Settings;
  maxWords: number;
  onChange: (settings: Settings) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

const MIN_SESSION = 5;
const MAX_SESSION = 50;
const STEP = 5;

export function SettingsScreen({ settings, maxWords, onChange, onResetProgress, onBack }: Props) {
  const setLanguage = (targetLanguage: TargetLanguage) => onChange({ ...settings, targetLanguage });
  const setDirection = (direction: QuizDirection) => onChange({ ...settings, direction });
  const setLength = (sessionLength: number) =>
    onChange({
      ...settings,
      sessionLength: clamp(sessionLength, MIN_SESSION, Math.min(MAX_SESSION, maxWords)),
    });
  const setAutoSpeak = (autoSpeak: boolean) => onChange({ ...settings, autoSpeak });

  const target = settings.targetLanguage === 'english' ? 'EN' : 'PT-BR';

  const confirmReset = () =>
    Alert.alert('Reset progress?', 'This clears all of your learning stats.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: onResetProgress },
    ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>Done</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.section}>Translate into</Text>
        <Segmented
          options={[
            { key: 'english', label: 'English' },
            { key: 'portuguese', label: 'Português (BR)' },
          ]}
          selected={settings.targetLanguage}
          onSelect={(k) => setLanguage(k as TargetLanguage)}
        />

        <Text style={styles.section}>Direction</Text>
        <Segmented
          options={[
            { key: 'germanToTarget', label: `DE → ${target}` },
            { key: 'targetToGerman', label: `${target} → DE` },
          ]}
          selected={settings.direction}
          onSelect={(k) => setDirection(k as QuizDirection)}
        />

        <Text style={styles.section}>Cards per session</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={() => setLength(settings.sessionLength - STEP)}
          >
            <Text style={styles.stepButtonText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{settings.sessionLength}</Text>
          <Pressable
            style={styles.stepButton}
            onPress={() => setLength(settings.sessionLength + STEP)}
          >
            <Text style={styles.stepButtonText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Audio</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Pronounce German words aloud</Text>
          <Switch
            value={settings.autoSpeak}
            onValueChange={setAutoSpeak}
            trackColor={{ true: theme.accent, false: theme.border }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.section}>Article colours</Text>
        <View style={styles.legend}>
          <Text style={[styles.legendItem, { color: theme.der }]}>der</Text>
          <Text style={[styles.legendItem, { color: theme.die }]}>die</Text>
          <Text style={[styles.legendItem, { color: theme.das }]}>das</Text>
        </View>
        <Text style={styles.legendHint}>Noun articles are colour-coded by gender to help you remember them.</Text>

        <Pressable style={styles.reset} onPress={confirmReset}>
          <Text style={styles.resetText}>Reset progress</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

interface Option {
  key: string;
  label: string;
}

function Segmented({
  options,
  selected,
  onSelect,
}: {
  options: Option[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <Pressable
            key={opt.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onSelect(opt.key)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
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
  back: { color: theme.accent, fontSize: 16, fontWeight: '600', width: 48 },
  title: { color: theme.text, fontSize: 18, fontWeight: '700' },
  body: { padding: 24 },
  section: {
    color: theme.textMuted,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  segment: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: theme.accent },
  segmentText: { color: theme.textMuted, fontSize: 15, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 8,
  },
  stepButton: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  stepButtonText: { color: theme.accent, fontSize: 30, fontWeight: '700' },
  stepValue: { color: theme.text, fontSize: 22, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleLabel: { color: theme.text, fontSize: 16, flex: 1, marginRight: 12 },
  legend: { flexDirection: 'row', gap: 20 },
  legendItem: { fontSize: 22, fontWeight: '800' },
  legendHint: { color: theme.textMuted, fontSize: 13, marginTop: 8, lineHeight: 19 },
  reset: {
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.wrong,
    alignItems: 'center',
  },
  resetText: { color: theme.wrong, fontSize: 16, fontWeight: '700' },
});
