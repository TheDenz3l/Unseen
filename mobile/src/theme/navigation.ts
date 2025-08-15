import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { palette } from './colors';

export const NavDark: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.charcoal,
    card: palette.charcoal,
    text: palette.white,
    border: palette.silver,
    notification: palette.indianRed,
    primary: palette.yellowGreen,
  },
};

export const NavLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.white,
    card: palette.silver,
    text: palette.charcoal,
    border: palette.silver,
    notification: palette.indianRed,
    primary: palette.yellowGreen,
  },
};
