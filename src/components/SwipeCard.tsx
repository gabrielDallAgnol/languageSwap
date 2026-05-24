import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { GermanText } from './GermanText';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.24;
const LEAN_THRESHOLD = 24;
const TAP_THRESHOLD = 8;

interface Props {
  prompt: string;
  promptIsGerman: boolean;
  caption: string;
  locked: boolean;
  highlight?: 'correct' | 'wrong' | null;
  onChoose: (choseLeft: boolean) => void;
  onLeanChange: (lean: number) => void;
  onSpeak?: () => void;
}

export function SwipeCard({
  prompt,
  promptIsGerman,
  caption,
  locked,
  highlight,
  onChoose,
  onLeanChange,
  onSpeak,
}: Props) {
  const pan = useRef(new Animated.ValueXY()).current;

  // Keep the latest props available to the (stable) PanResponder closures.
  const lockedRef = useRef(locked);
  const onChooseRef = useRef(onChoose);
  const onLeanRef = useRef(onLeanChange);
  const onSpeakRef = useRef(onSpeak);
  useEffect(() => {
    lockedRef.current = locked;
    onChooseRef.current = onChoose;
    onLeanRef.current = onLeanChange;
    onSpeakRef.current = onSpeak;
  });

  const springBack = () =>
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        !lockedRef.current && Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (lockedRef.current) return;
        pan.setValue({ x: g.dx, y: g.dy * 0.12 });
        onLeanRef.current(g.dx < -LEAN_THRESHOLD ? -1 : g.dx > LEAN_THRESHOLD ? 1 : 0);
      },
      onPanResponderRelease: (_, g) => {
        const isTap = Math.abs(g.dx) < TAP_THRESHOLD && Math.abs(g.dy) < TAP_THRESHOLD;
        if (isTap) {
          onSpeakRef.current?.();
          return;
        }
        if (lockedRef.current) return;
        if (Math.abs(g.dx) > SWIPE_THRESHOLD) {
          const choseLeft = g.dx < 0;
          onLeanRef.current(choseLeft ? -1 : 1);
          springBack();
          onChooseRef.current(choseLeft);
        } else {
          onLeanRef.current(0);
          springBack();
        }
      },
      onPanResponderTerminate: () => {
        onLeanRef.current(0);
        springBack();
      },
    }),
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  const highlightBorder =
    highlight === 'correct' ? theme.correct : highlight === 'wrong' ? theme.wrong : undefined;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.card,
        highlightBorder ? { borderColor: highlightBorder, borderWidth: 2 } : null,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
      ]}
    >
      <Text style={styles.caption}>{caption}</Text>
      {promptIsGerman ? (
        <GermanText text={prompt} style={styles.prompt} color={theme.text} numberOfLines={2} />
      ) : (
        <Text style={styles.prompt} adjustsFontSizeToFit numberOfLines={2}>
          {prompt}
        </Text>
      )}
      {onSpeak ? (
        <Pressable
          style={styles.listen}
          onPress={() => onSpeak()}
          accessibilityRole="button"
          accessibilityLabel="Hear pronunciation"
        >
          <Text style={styles.listenText}>Listen</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  caption: {
    color: theme.textMuted,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  prompt: {
    color: theme.text,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  listen: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.cardMuted,
  },
  listenText: { color: theme.textMuted, fontSize: 14, fontWeight: '600' },
  spacer: { height: 18 },
});
