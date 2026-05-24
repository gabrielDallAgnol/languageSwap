import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { speakGerman } from '../audio';
import { GermanText } from '../components/GermanText';
import { germanDisplay, isLearned } from '../game/logic';
import { theme } from '../theme';
import { ProgressMap, Word } from '../types';

interface Props {
  words: Word[];
  progress: ProgressMap;
  onBack: () => void;
}

export function BrowseScreen({ words, progress, onBack }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      (w) =>
        w.german.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q) ||
        w.portuguese.toLowerCase().includes(q),
    );
  }, [query, words]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>Done</Text>
        </Pressable>
        <Text style={styles.title}>Word list</Text>
        <View style={{ width: 48 }} />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search German, English or Portuguese"
        placeholderTextColor={theme.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
        renderItem={({ item }) => {
          const learned = isLearned(progress[item.id]);
          return (
            <Pressable
              style={styles.row}
              onPress={() => speakGerman(germanDisplay(item))}
              accessibilityRole="button"
              accessibilityLabel={`${germanDisplay(item)}, hear pronunciation`}
            >
              <View style={styles.rowText}>
                <GermanText text={germanDisplay(item)} style={styles.german} color={theme.text} />
                <Text style={styles.translation}>
                  {item.english} · {item.portuguese}
                </Text>
              </View>
              {learned && <View style={styles.learnedDot} />}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
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
  search: {
    margin: 20,
    marginBottom: 8,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 16,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  rowText: { flex: 1, marginRight: 12 },
  german: { fontSize: 19, fontWeight: '700', textAlign: 'left' },
  translation: { color: theme.textMuted, fontSize: 14, marginTop: 3 },
  learnedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.correct },
  empty: { color: theme.textMuted, fontSize: 16, textAlign: 'center', marginTop: 40 },
});
