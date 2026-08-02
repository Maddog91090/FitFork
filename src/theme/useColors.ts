import { useColorScheme } from 'react-native';
import { palettes, type ThemeColors } from './tokens';

export function useColors(): ThemeColors {
  const scheme = useColorScheme();
  return palettes[scheme === 'dark' ? 'dark' : 'light'];
}
