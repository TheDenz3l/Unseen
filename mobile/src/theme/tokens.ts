import { palette } from './colors';

// Tamagui tokens (authoritative)
export const tokens = {
  color: {
    silver: palette.silver,
    charcoal: palette.charcoal,
    indianRed: palette.indianRed,
    yellowGreen: palette.yellowGreen,
    white: palette.white,
    bg: palette.charcoal,
    surface: palette.charcoal,
    text: palette.white,
    textMuted: palette.silver,
    accent: palette.yellowGreen,
    danger: palette.indianRed,
    border: palette.silver,
    borderDim: palette.borderDim,
    overlay: palette.overlay,
  },
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
  },
  size: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    true: 20,
  },
  radius: {
    0: 0,
    1: 3,
    2: 5,
    3: 7,
    4: 9,
    true: 9,
  },
} as const;

export const fonts = {
  body: 'System',
  heading: 'System',
};

export const fontSizes = {
  1: 12,
  2: 14,
  3: 15,
  4: 16,
  5: 18,
  6: 20,
  7: 25,
  8: 35,
  9: 60,
};

export const lineHeights = {
  1: 15,
  2: 20,
  3: 25,
  4: 30,
};

export const fontWeights = {
  1: '300',
  2: '400',
  3: '500',
  4: '600',
  5: '700',
};
