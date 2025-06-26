import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Animated, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { Achievement } from '@/types';
import { useColors } from '@/hooks/useColors';
import * as Icons from 'lucide-react-native';

interface AchievementPopupProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function AchievementPopup({ achievement, visible, onClose }: AchievementPopupProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible && achievement) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, achievement]);
  
  if (!achievement) return null;
  
  // Get the icon component dynamically
  const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;
  
  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'common':
        return colors.text.secondary;
      case 'rare':
        return colors.primary;
      case 'epic':
        return '#8B5CF6';
      case 'legendary':
        return '#F59E0B';
      default:
        return colors.text.secondary;
    }
  };
  
  const getRarityText = () => {
    return achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1);
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.popup,
            { backgroundColor: colors.background.primary },
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.sparkles}>
              <Icons.Sparkles size={20} color={colors.warning} />
              <Icons.Sparkles size={16} color={colors.primary} />
              <Icons.Sparkles size={18} color={colors.secondary} />
            </View>
            
            <Text style={[styles.headerText, { color: colors.text.primary }]}>
              Achievement Unlocked!
            </Text>
          </View>
          
          {/* Achievement Content */}
          <View style={styles.achievementContent}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: achievement.color + '20' }
            ]}>
              <IconComponent size={64} color={achievement.color} />
              
              <View style={[styles.unlockedBadge, { backgroundColor: colors.success }]}>
                <Icons.Check size={16} color="white" />
              </View>
            </View>
            
            <View style={styles.textContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.achievementName, { color: colors.text.primary }]}>
                  {achievement.name}
                </Text>
                
                <View style={[
                  styles.rarityBadge,
                  { backgroundColor: getRarityColor() + '20' }
                ]}>
                  <Text style={[
                    styles.rarityText,
                    { color: getRarityColor() }
                  ]}>
                    {getRarityText()}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.achievementDescription, { color: colors.text.secondary }]}>
                {achievement.description}
              </Text>
            </View>
          </View>
          
          {/* Action Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popup: {
    width: Math.min(screenWidth - 40, 320),
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sparkles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  unlockedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  textContent: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  achievementDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});