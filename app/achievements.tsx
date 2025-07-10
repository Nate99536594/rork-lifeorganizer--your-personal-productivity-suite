import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Flame, Target, Users, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAchievementStore } from '@/store/achievementStore';
import { AchievementCategory } from '@/types';
import { AchievementItem } from '@/components/AchievementItem';

const CATEGORY_INFO = {
  streak: {
    icon: Flame,
    name: 'Streak',
    description: 'Consistency and momentum achievements'
  },
  milestone: {
    icon: Target,
    name: 'Milestone',
    description: 'Progress and usage achievements'
  },
  social: {
    icon: Users,
    name: 'Social',
    description: 'Friend and community achievements'
  },
  longevity: {
    icon: Calendar,
    name: 'Longevity',
    description: 'Time-based achievements'
  }
};

export default function AchievementsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { 
    getAchievementsByCategory, 
    getUserAchievements, 
    getUnlockedAchievements,
    getLockedAchievements 
  } = useAchievementStore();
  
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  
  const userAchievements = getUserAchievements();
  const unlockedAchievements = getUnlockedAchievements();
  const lockedAchievements = getLockedAchievements();
  
  const getAchievementsToShow = () => {
    let achievements;
    if (selectedCategory === 'all') {
      achievements = [...unlockedAchievements, ...lockedAchievements];
    } else {
      achievements = getAchievementsByCategory(selectedCategory);
    }
    
    // Sort by rarity: common -> rare -> epic -> legendary
    const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
    return achievements.sort((a, b) => {
      const aOrder = rarityOrder[a.rarity] || 0;
      const bOrder = rarityOrder[b.rarity] || 0;
      return aOrder - bOrder;
    });
  };
  
  const achievementsToShow = getAchievementsToShow();
  
  const getUnlockedCount = (category: AchievementCategory | 'all') => {
    if (category === 'all') {
      return unlockedAchievements.length;
    }
    const categoryAchievements = getAchievementsByCategory(category);
    return categoryAchievements.filter(achievement => 
      unlockedAchievements.some(unlocked => unlocked.id === achievement.id)
    ).length;
  };
  
  const getTotalCount = (category: AchievementCategory | 'all') => {
    if (category === 'all') {
      return unlockedAchievements.length + lockedAchievements.length;
    }
    return getAchievementsByCategory(category).length;
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Stats Overview */}
      <View style={[styles.statsContainer, { backgroundColor: colors.background.primary }]}>
        <View style={styles.statItem}>
          <Trophy size={24} color={colors.warning} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {unlockedAchievements.length}/{unlockedAchievements.length + lockedAchievements.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Unlocked
          </Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Target size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {Math.round((unlockedAchievements.length / (unlockedAchievements.length + lockedAchievements.length)) * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Complete
          </Text>
        </View>
      </View>
      
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilter}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && { backgroundColor: colors.primary + '20' },
            { borderColor: colors.border }
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Trophy 
            size={20} 
            color={selectedCategory === 'all' ? colors.primary : colors.text.secondary} 
          />
          <Text style={[
            styles.categoryButtonText,
            { color: selectedCategory === 'all' ? colors.primary : colors.text.secondary }
          ]}>
            All ({getUnlockedCount('all')}/{getTotalCount('all')})
          </Text>
        </TouchableOpacity>
        
        {Object.entries(CATEGORY_INFO).map(([key, info]) => {
          const category = key as AchievementCategory;
          const IconComponent = info.icon;
          const isSelected = selectedCategory === category;
          
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                isSelected && { backgroundColor: colors.primary + '20' },
                { borderColor: colors.border }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <IconComponent 
                size={20} 
                color={isSelected ? colors.primary : colors.text.secondary} 
              />
              <Text style={[
                styles.categoryButtonText,
                { color: isSelected ? colors.primary : colors.text.secondary }
              ]}>
                {info.name} ({getUnlockedCount(category)}/{getTotalCount(category)})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Category Description */}
      {selectedCategory !== 'all' && (
        <View style={[styles.categoryDescription, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.categoryDescriptionText, { color: colors.text.secondary }]}>
            {CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO].description}
          </Text>
        </View>
      )}
      
      {/* Achievements List */}
      <ScrollView 
        style={styles.achievementsList}
        contentContainerStyle={styles.achievementsContent}
        showsVerticalScrollIndicator={false}
      >
        {achievementsToShow.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
            <Trophy size={48} color={colors.text.light} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No achievements yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              Start working out and connecting with friends to unlock achievements!
            </Text>
          </View>
        ) : (
          achievementsToShow.map(achievement => {
            const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
            
            return (
              <AchievementItem
                key={achievement.id}
                achievement={achievement}
                userAchievement={userAchievement}
                size="medium"
                showProgress={true}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 1,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryDescription: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  categoryDescriptionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  achievementsList: {
    flex: 1,
  },
  achievementsContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});