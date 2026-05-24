import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { articleColor } from '../theme';

const ARTICLES = ['der', 'die', 'das'];

/**
 * Renders a German word, colouring a leading der/die/das article by grammatical
 * gender as a memory aid. Non-German strings render normally.
 */
export function GermanText({
  text,
  style,
  color,
  numberOfLines,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  color: string;
  numberOfLines?: number;
}) {
  const [first, ...rest] = text.split(' ');
  if (ARTICLES.includes(first) && rest.length > 0) {
    return (
      <Text style={[style, { color }]} numberOfLines={numberOfLines} adjustsFontSizeToFit>
        <Text style={{ color: articleColor(first) }}>{first} </Text>
        {rest.join(' ')}
      </Text>
    );
  }
  return (
    <Text style={[style, { color }]} numberOfLines={numberOfLines} adjustsFontSizeToFit>
      {text}
    </Text>
  );
}
