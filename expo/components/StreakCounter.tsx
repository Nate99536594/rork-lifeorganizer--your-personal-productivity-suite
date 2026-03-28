import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { FlameIcon } from './FlameIcon';

interface StreakCounterProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
  type?: 'daily' | 'weekly';
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  size = 'medium',
  type = 'daily'
}) => {
  const colors = useColors();
  
  const getSize = () => {
    switch (size) {
      case 'small':
        return { icon: 16, text: 12 };
      case 'medium':
        return { icon: 24, text: 16 };
      case 'large':
        return { icon: 32, text: 20 };
      default:
        return { icon: 24, text: 16 };
    }
  };
  
  const { icon, text } = getSize();
  
  // Use orange for daily streaks, blue for weekly streaks
  const flameColor = type === 'daily' ? colors.dailyStreakFlame : colors.streakFlame;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <FlameIcon size={icon} streak={streak} color={flameColor} />
      <Text style={[styles.streakText, { fontSize: text, color: flameColor, fontFamily: colors.fonts.bold }]}>
        {streak}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontWeight: '700',
    marginLeft: 6,
  },
});