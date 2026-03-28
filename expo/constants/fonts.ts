import { Platform } from 'react-native';

export const FONTS = {
  regular: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System'
  }),
  medium: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto-Medium',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System'
  }),
  bold: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto-Bold',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System'
  }),
  light: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto-Light',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System'
  })
};

export const getFontWeight = (weight: 'light' | 'regular' | 'medium' | 'bold' | 'semibold') => {
  if (Platform.OS === 'ios') {
    // On iOS, use fontWeight with SF Pro Display
    switch (weight) {
      case 'light': return '300';
      case 'regular': return '400';
      case 'medium': return '500';
      case 'semibold': return '600';
      case 'bold': return '700';
      default: return '400';
    }
  } else {
    // On Android and Web, use fontWeight
    switch (weight) {
      case 'light': return '300';
      case 'regular': return '400';
      case 'medium': return '500';
      case 'semibold': return '600';
      case 'bold': return '700';
      default: return '400';
    }
  }
};