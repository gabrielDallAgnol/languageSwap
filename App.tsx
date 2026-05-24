import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { WORDS } from './src/data/words';
import { learnedCount, recordAnswer } from './src/game/logic';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { loadProgress, loadSettings, saveProgress, saveSettings } from './src/storage/store';
import { theme } from './src/theme';
import { DEFAULT_SETTINGS, ProgressMap, Settings } from './src/types';

type Screen = 'home' | 'game' | 'settings';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    (async () => {
      const [loadedSettings, loadedProgress] = await Promise.all([loadSettings(), loadProgress()]);
      setSettings(loadedSettings);
      setProgress(loadedProgress);
      setLoaded(true);
    })();
  }, []);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    void saveSettings(next);
  };

  const handleRecord = (wordId: number, correct: boolean) => {
    setProgress((prev) => {
      const next = recordAnswer(prev, wordId, correct);
      void saveProgress(next);
      return next;
    });
  };

  const resetProgress = () => {
    setProgress({});
    void saveProgress({});
  };

  const learned = useMemo(() => learnedCount(progress), [progress]);

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
          learned={learned}
          settings={settings}
          onStart={() => setScreen('game')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          words={WORDS}
          settings={settings}
          progress={progress}
          onRecord={handleRecord}
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
