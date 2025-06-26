import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 100, 
  color = '#5E72E4' 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Main checkmark body */}
        <Path
          d="M30 50 L45 65 L70 35"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Speed lines on the left - horizontal lines */}
        <Path
          d="M8 25 L22 25"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M5 32 L19 32"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M8 39 L22 39"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M5 46 L19 46"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M8 53 L22 53"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M5 60 L19 60"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M8 67 L22 67"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});