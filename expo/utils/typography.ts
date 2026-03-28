import { TextStyle } from 'react-native';
import { FONTS, getFontWeight } from '@/constants/fonts';

export const typography = {
  // Headings
  h1: {
    fontFamily: FONTS.bold,
    fontWeight: getFontWeight('bold'),
    fontSize: 32,
    lineHeight: 40,
  } as TextStyle,
  
  h2: {
    fontFamily: FONTS.bold,
    fontWeight: getFontWeight('bold'),
    fontSize: 24,
    lineHeight: 32,
  } as TextStyle,
  
  h3: {
    fontFamily: FONTS.bold,
    fontWeight: getFontWeight('semibold'),
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,
  
  h4: {
    fontFamily: FONTS.medium,
    fontWeight: getFontWeight('semibold'),
    fontSize: 18,
    lineHeight: 24,
  } as TextStyle,
  
  // Body text
  body: {
    fontFamily: FONTS.regular,
    fontWeight: getFontWeight('regular'),
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  
  bodyMedium: {
    fontFamily: FONTS.medium,
    fontWeight: getFontWeight('medium'),
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  
  bodySemibold: {
    fontFamily: FONTS.medium,
    fontWeight: getFontWeight('semibold'),
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  
  // Small text
  caption: {
    fontFamily: FONTS.regular,
    fontWeight: getFontWeight('regular'),
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  
  captionMedium: {
    fontFamily: FONTS.medium,
    fontWeight: getFontWeight('medium'),
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  
  // Labels
  label: {
    fontFamily: FONTS.medium,
    fontWeight: getFontWeight('medium'),
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  
  labelBold: {
    fontFamily: FONTS.bold,
    fontWeight: getFontWeight('bold'),
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  
  // Button text
  button: {
    fontFamily: FONTS.medium,
    fontWeight: getFontWeight('semibold'),
    fontSize: 16,
    lineHeight: 20,
  } as TextStyle,
  
  buttonSmall: {
    fontFamily: FONTS.medium,
    fontWeight: getFontWeight('semibold'),
    fontSize: 14,
    lineHeight: 18,
  } as TextStyle,
};