import { FONTS } from './fonts';

import { FONTS } from './fonts';

// Light theme colors
export const lightColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  error: '#FF3B30', // Same as danger
  streakFlame: '#007AFF', // Blue flame for weekly streak
  dailyStreakFlame: '#FF9500', // Orange flame for daily streak
  goalTypes: {
    shortTerm: '#0A4D2E', // Darker, more muted green - even darker and less saturated
    longTerm: '#0F766E', // Darker turquoise
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    surface: '#F2F2F7', // Same as secondary
    avatar: '#6B7280', // Dark grey background for avatar in light mode
  },
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    textSecondary: '#3C3C43', // Same as secondary
    tertiary: '#8E8E93',
    light: '#8E8E93',
  },
  border: '#C6C6C8',
  fonts: {
    regular: FONTS.regular,
    medium: FONTS.medium,
    semiBold: FONTS.medium,
    bold: FONTS.bold,
  },
};

// Dark theme colors
export const darkColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  error: '#FF453A', // Same as danger
  streakFlame: '#0A84FF', // Blue flame for weekly streak
  dailyStreakFlame: '#FF9F0A', // Orange flame for daily streak
  goalTypes: {
    shortTerm: '#0A4D2E', // Darker, more muted green - even darker and less saturated
    longTerm: '#0F766E', // Darker turquoise for dark mode
  },
  background: {
    primary: '#1C1C1E',
    secondary: '#2C2C2E',
    surface: '#2C2C2E', // Same as secondary
    avatar: '#FFFFFF', // White background for avatar in dark mode
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    textSecondary: '#EBEBF5', // Same as secondary
    tertiary: '#8E8E93',
    light: '#8E8E93',
  },
  border: '#38383A',
  fonts: {
    regular: FONTS.regular,
    medium: FONTS.medium,
    semiBold: FONTS.medium,
    bold: FONTS.bold,
  },
};

// Font configuration using system fonts
export const fonts = {
  regular: FONTS.regular,
  medium: FONTS.medium,
  semiBold: FONTS.medium,
  bold: FONTS.bold,
};

// Character customization colors
export const characterColors = {
  skin: [
    { id: 'light', value: '#FFE0BD', name: 'Light' },
    { id: 'medium', value: '#E5C298', name: 'Medium' },
    { id: 'tan', value: '#D1A77C', name: 'Tan' },
    { id: 'brown', value: '#A67358', name: 'Brown' },
    { id: 'dark', value: '#7A5C50', name: 'Dark' },
    { id: 'gray', value: '#A0AEC0', name: 'Gray' }, // Keep for default but not selectable
  ],
  hair: [
    { id: 'black', value: '#2D3748', name: 'Black' },
    { id: 'brown', value: '#7B341E', name: 'Brown' },
    { id: 'blonde', value: '#F6E05E', name: 'Blonde' },
    { id: 'red', value: '#C53030', name: 'Red' },
    { id: 'gray', value: '#A0AEC0', name: 'Gray' },
    { id: 'white', value: '#F7FAFC', name: 'White' },
  ],
  eyes: [
    { id: 'brown', value: '#7B341E', name: 'Brown' },
    { id: 'blue', value: '#3182CE', name: 'Blue' },
    { id: 'green', value: '#38A169', name: 'Green' },
    { id: 'hazel', value: '#D69E2E', name: 'Hazel' },
    { id: 'gray', value: '#718096', name: 'Gray' },
  ],
  clothing: [
    { id: 'red', value: '#DC2626', name: 'Red' },
    { id: 'yellow', value: '#FDE047', name: 'Yellow' },
    { id: 'orange', value: '#D97706', name: 'Orange' },
    { id: 'green', value: '#16A34A', name: 'Green' },
    { id: 'darkgreen', value: '#15803D', name: 'Dark Green' },
    { id: 'lightblue', value: '#0EA5E9', name: 'Light Blue' },
    { id: 'blue', value: '#2563EB', name: 'Blue' },
    { id: 'purple', value: '#9333EA', name: 'Purple' },
    { id: 'pink', value: '#EC4899', name: 'Pink' },
    { id: 'black', value: '#1F2937', name: 'Black' },
    { id: 'white', value: '#F9FAFB', name: 'White' },
  ],
  outfits: [
    { id: 'casual', value: '#4299E1', name: 'Casual' },
    { id: 'formal', value: '#2D3748', name: 'Formal' },
    { id: 'sporty', value: '#F56565', name: 'Sporty' },
    { id: 'business', value: '#718096', name: 'Business' },
  ],
};

// Export a combined object for convenience
export const colors = {
  ...lightColors,
  characterColors,
  fonts,
};