import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.24;
const LEAN_THRESHOLD = 24;

interface Props {
  prompt: string;
  caption: string;
  locked: boolean;
  onChoose: (choseLeft: boolean) => void;
  onLeanChange: (lean: number) => void;
}

export function SwipeCard({ prompt, caption, locked, onChoose, onLeanChange }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;

  // Keep the latest props available to the (stable) PanResponder closures.
  const lockedRef = useRef(locked);
  const onChooseRef = useRef(onChoose);
  const onLeanRef = useRef(onLeanChange);
  useEffect(() => {
    lockedRef.current = locked;
    onChooseRef.current = onChoose;
    onLeanRef.current = onLeanChange;
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
      onMoveShouldSetPanResponder: (_, g) =>
        !lockedRef.current && Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (lockedRef.current) return;
        pan.setValue({ x: g.dx, y: g.dy * 0.12 });
        onLeanRef.current(g.dx < -LEAN_THRESHOLD ? -1 : g.dx > LEAN_THRESHOLD ? 1 : 0);
      },
      onPanResponderRelease: (_, g) => {
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

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.card,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
      ]}
    >
      <Text style={styles.caption}>{caption}</Text>
      <Text style={styles.prompt} adjustsFontSizeToFit numberOfLines={2}>
        {prompt}
      </Text>
      <Text style={styles.hint}>Swipe toward the meaning</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 28,
    paddingVertical: 44,
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
  hint: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 18,
  },
});
