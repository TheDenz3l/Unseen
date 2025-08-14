// Brand palette (HEX) from PRD
export const palette = {
  silver: '#c1c1c1',
  charcoal: '#2c4251',
  indianRed: '#d16666',
  yellowGreen: '#b6c649',
  white: '#ffffff',
  overlay: 'rgba(44,66,81,0.72)',
  borderDim: 'rgba(193,193,193,0.24)',
} as const;

// Semantic mapping (app-wide tokens)
export const semanticColors = {
  bg: palette.charcoal,
  surface: palette.charcoal,
  text: palette.white,
  textMuted: palette.silver,
  accent: palette.yellowGreen,
  danger: palette.indianRed,
  border: palette.silver,
  borderDim: palette.borderDim,
  overlay: palette.overlay,
} as const;

// Ghost Meter specific colors
export const ghostMeterColors = {
  likely: {
    bg: palette.yellowGreen,
    text: palette.white,
    border: palette.silver,
  },
  uncertain: {
    bg: palette.silver,
    text: palette.silver,
    border: palette.silver,
  },
  unlikely: {
    bg: palette.indianRed,
    text: palette.white,
    border: palette.indianRed,
  },
} as const;
