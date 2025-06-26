import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Logo } from './Logo';

interface AppTitleProps {
  logoSize?: number;
  fontSize?: number;
  color?: string;
  horizontal?: boolean;
}

export const AppTitle: React.FC<AppTitleProps> = ({
  logoSize = 40,
  fontSize = 24,
  color,
  horizontal = true
}) => {
  const colors = useColors();
  const titleColor = color || colors.primary;
  
  return (
    <View style={[
      styles.container, 
      horizontal ? styles.horizontal : styles.vertical
    ]}>
      <Logo size={logoSize} color={titleColor} />
      <Text style={[
        styles.title, 
        { 
          fontSize, 
          color: titleColor,
          fontFamily: colors.fonts.bold
        },
        horizontal && styles.horizontalText
      ]}>
        StreakScheduler
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  title: {
    fontWeight: '700',
  },
  horizontalText: {
    marginLeft: 8,
  },
});