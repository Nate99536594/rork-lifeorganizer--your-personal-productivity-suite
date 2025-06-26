import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';

interface FlameIconProps {
  size?: number;
  streak?: number;
  color?: string;
}

export const FlameIcon: React.FC<FlameIconProps> = ({ 
  size = 24, 
  streak = 0,
  color = '#0A84FF' // Default blue color
}) => {
  return (
    <View style={styles.container}>
      <Flame
        size={size}
        color={color}
        strokeWidth={2}
        fill={color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});