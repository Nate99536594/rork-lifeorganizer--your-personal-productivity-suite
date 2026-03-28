import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle,
  ActivityIndicator
} from 'react-native';
import { useColors } from '@/hooks/useColors';

interface SocialButtonProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  isLoading?: boolean;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  title,
  icon,
  onPress,
  style,
  isLoading = false
}) => {
  const colors = useColors();
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: colors.background.primary,
          borderColor: colors.border
        }, 
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.text.primary} />
      ) : (
        icon
      )}
      <Text style={[
        styles.text, 
        { 
          color: colors.text.primary,
          fontFamily: colors.fonts.medium
        }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});