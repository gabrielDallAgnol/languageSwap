export const theme = {
  bg: '#0F172A',
  card: '#1E293B',
  cardMuted: '#243349',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  accent: '#6366F1',
  accentSoft: 'rgba(99, 102, 241, 0.22)',
  correct: '#22C55E',
  correctSoft: 'rgba(34, 197, 94, 0.22)',
  wrong: '#EF4444',
  wrongSoft: 'rgba(239, 68, 68, 0.22)',
  border: '#334155',
  // der/die/das gender mnemonic colours.
  der: '#60A5FA',
  die: '#F472B6',
  das: '#34D399',
} as const;

export function articleColor(article: string | null | undefined): string {
  switch (article) {
    case 'der':
      return theme.der;
    case 'die':
      return theme.die;
    case 'das':
      return theme.das;
    default:
      return theme.text;
  }
}
