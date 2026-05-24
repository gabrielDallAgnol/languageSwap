import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { WORDS } from './src/data/words';
import { dueCount, learnedCount, newCount, recordAnswer, registerActivity } from './src/game/logic';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import {
  loadProgress,
  loadSettings,
  loadStats,
  saveProgress,
  saveSettings,
  saveStats,
} from './src/storage/store';
import { theme } from './src/theme';
import { DEFAULT_SETTINGS, DEFAULT_STATS, ProgressMap, Settings, Stats } from './src/types';

type Screen = 'home' | 'game' | 'settings' | 'browse';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    (async () => {
      const [loadedSettings, loadedProgress, loadedStats] = await Promise.all([
        loadSettings(),
        loadProgress(),
        loadStats(),
      ]);
      setSettings(loadedSettings);
      setProgress(loadedProgress);
      setStats(loadedStats);
      setLoaded(true);
    })();
  }, []);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    void saveSettings(next);
  };

  const handleAnswer = (wordId: number, correct: boolean) => {
    setProgress((prev) => {
      const next = recordAnswer(prev, wordId, correct);
      void saveProgress(next);
      return next;
    });
    setStats((prev) => {
      const next = registerActivity(prev);
      void saveStats(next);
      return next;
    });
  };

  const resetProgress = () => {
    setProgress({});
    void saveProgress({});
  };

  const counts = useMemo(
    () => ({
      learned: learnedCount(progress),
      due: dueCount(progress),
      newWords: newCount(WORDS, progress),
    }),
    [progress],
  );

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {screen === 'home' && (
        <HomeScreen
          totalWords={WORDS.length}
          learned={counts.learned}
          due={counts.due}
          newWords={counts.newWords}
          dayStreak={stats.dayStreak}
          settings={settings}
          onStart={() => setScreen('game')}
          onOpenSettings={() => setScreen('settings')}
          onBrowse={() => setScreen('browse')}
        />
      )}
      {screen === 'browse' && (
        <BrowseScreen words={WORDS} progress={progress} onBack={() => setScreen('home')} />
      )}
      {screen === 'game' && (
        <GameScreen
          words={WORDS}
          settings={settings}
          progress={progress}
          onAnswer={handleAnswer}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          maxWords={WORDS.length}
          onChange={updateSettings}
          onResetProgress={resetProgress}
          onBack={() => setScreen('home')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  loading: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
});
