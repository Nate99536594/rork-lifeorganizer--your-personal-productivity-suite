import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Achievement, UserAchievement } from '@/types';
import { useColors } from '@/hooks/useColors';
import { useAchievementStore } from '@/store/achievementStore';
import * as Icons from 'lucide-react-native';

interface AchievementItemProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

export function AchievementItem({ 
  achievement, 
  userAchievement, 
  size = 'medium',
  showProgress = true 
}: AchievementItemProps) {
  const colors = useColors();
  const { getAchievementProgress } = useAchievementStore();
  
  const isUnlocked = userAchievement?.isUnlocked || false;
  const progress = getAchievementProgress(achievement.id);
  
  // Get the icon component dynamically
  const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 32,
          title: styles.titleSmall,
          description: styles.descriptionSmall,
          badge: styles.badgeSmall
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 64,
          title: styles.titleLarge,
          description: styles.descriptionLarge,
          badge: styles.badgeLarge
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 48,
          title: styles.titleMedium,
          description: styles.descriptionMedium,
          badge: styles.badgeMedium
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
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
    <View style={[
      sizeStyles.container,
      { backgroundColor: colors.background.primary },
      !isUnlocked && styles.locked
    ]}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: isUnlocked ? achievement.color + '20' : colors.background.secondary }
      ]}>
        <IconComponent 
          size={sizeStyles.icon} 
          color={isUnlocked ? achievement.color : colors.text.light}
        />
        
        {isUnlocked && (
          <View style={[styles.unlockedBadge, { backgroundColor: colors.success }]}>
            <Icons.Check size={12} color="white" />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[
            sizeStyles.title,
            { color: isUnlocked ? colors.text.primary : colors.text.light }
          ]}>
            {achievement.name}
          </Text>
          
          <View style={[
            sizeStyles.badge,
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
        
        <Text style={[
          sizeStyles.description,
          { color: isUnlocked ? colors.text.secondary : colors.text.light }
        ]}>
          {achievement.description}
        </Text>
        
        {showProgress && !isUnlocked && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
              <View style={[
                styles.progressFill,
                { 
                  backgroundColor: achievement.color,
                  width: `${progress}%`
                }
              ]} />
            </View>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}
        
        {isUnlocked && userAchievement?.unlockedAt && (
          <Text style={[styles.unlockedDate, { color: colors.text.light }]}>
            Unlocked {new Date(userAchievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  containerMedium: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  containerLarge: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  locked: {
    opacity: 0.6,
  },
  iconContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  unlockedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  descriptionSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  descriptionMedium: {
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionLarge: {
    fontSize: 16,
    lineHeight: 24,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
  },
  unlockedDate: {
    fontSize: 12,
    marginTop: 4,
  },
});