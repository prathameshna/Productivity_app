import { colors, radii, spacing } from './tokens';

export const focusColors = {
  background: '#F5F4F1',
  card: colors.surface,
  text: '#080808',
  border: '#E7E6E2',
  secondary: '#71716D',
  accent: '#E06553',
  accentTint: '#FDF2F0',
  segmented: '#EAE8E3',
  sheetRow: '#FBFBFA',
  blockingBg: '#EBF7EE',
  blockingText: '#1E7E34',
  blockingBorder: '#D1F0D9',
  reachedBg: '#FDF2F2',
  reachedText: '#D32F2F',
  reachedBorder: '#FAD2D2',
  pausedBg: '#F5F4F1',
  pausedText: '#71716D',
  pausedBorder: '#E7E6E2',
} as const;

export const focusRadii = { hero: 24, card: 20, appIcon: 12, sheetIcon: 14, sheet: 28 } as const;
export const focusSpacing = spacing;
export const focusBaseRadii = radii;
