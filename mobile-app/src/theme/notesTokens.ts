import { colors, radii, spacing } from './tokens';

export const notesColors = {
  ...colors,
  background: '#FAF9F6',
  canvas: '#F5F4F1',
  ink: '#171715',
  muted: '#6F706A',
  card: '#FFFBF0',
  cardBorder: '#F3ECE0',
  cardHoverBorder: '#E8DFD1',
  filter: '#EBE8DF',
  blue: '#029CFE',
  blueDeep: '#0091FF',
  blueLight: '#38BDF8',
  error: '#BA1A1A',
} as const;

export const notesRadii = { ...radii, noteCard: 18, input: 14 } as const;
export const notesSpacing = { ...spacing, cardGrid: 12, cardInset: 14 } as const;
export const noteEditorColors = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  hairline: '#ECEAE4',
  ink: '#171715',
  secondary: '#73726E',
  placeholder: '#9E9D97',
  accent: '#2563EB',
  badge: '#EA4335',
  rose: '#F8EEEE',
  sage: '#EEF3ED',
  sky: '#EEF4FA',
} as const;
