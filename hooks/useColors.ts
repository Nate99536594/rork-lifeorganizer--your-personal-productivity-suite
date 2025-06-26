import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export const useColors = () => {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useThemeStore();
  
  // Determine the actual color scheme to use
  let effectiveColorScheme: 'light' | 'dark';
  
  if (themeMode === 'system') {
    effectiveColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  } else {
    effectiveColorScheme = themeMode;
  }
  
  return effectiveColorScheme === 'dark' ? darkColors : lightColors;
};