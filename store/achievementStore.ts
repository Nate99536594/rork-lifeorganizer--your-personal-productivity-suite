import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, UserAchievement, AchievementProgress, AchievementCategory } from '@/types';

interface AchievementState {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementProgress: AchievementProgress;
  pendingNotifications: string[]; // Achievement IDs pending notification
  
  // Getters
  getAllAchievements: () => Achievement[];
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getUserAchievements: (userId?: string) => UserAchievement[];
  getUnlockedAchievements: (userId?: string) => Achievement[];
  getLockedAchievements: (userId?: string) => Achievement[];
  getAchievementProgress: (achievementId: string) => number;
  getPendingNotifications: () => Achievement[];
  
  // Actions
  unlockAchievement: (achievementId: string) => void;
  updateProgress: (achievementId: string, progress: number, metadata?: any) => void;
  checkAndUnlockAchievements: () => void;
  markNotificationShown: (achievementId: string) => void;
  clearPendingNotifications: () => void;
  
  // Trigger functions for different events
  onWorkoutCompleted: (workoutDate: string, workoutCount: number) => void;
  onFriendAdded: (friendCount: number) => void;
  onChallengeCompleted: () => void;
  onAccountCreated: () => void;
  onStreakUpdated: (currentStreak: number, weeklyStreak: number) => void;
  onWeekendWorkout: (date: string) => void;
  onStreakBroken: () => void;
  onStreakRestarted: () => void;
}

// Define all achievements
const ACHIEVEMENTS: Achievement[] = [
  // Streak-Based Achievements
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Complete workouts for 7 days in a row',
    category: 'streak',
    icon: 'Flame',
    color: '#FF6B35',
    criteria: { type: 'workout_streak', target: 7 },
    rarity: 'common'
  },
  {
    id: 'momentum_master',
    name: 'Momentum Master',
    description: 'Maintain a five week workout streak',
    category: 'streak',
    icon: 'Zap',
    color: '#8B5CF6',
    criteria: { type: 'workout_streak', target: 35 },
    rarity: 'epic'
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete workouts every Saturday and Sunday for 4 weeks',
    category: 'streak',
    icon: 'Calendar',
    color: '#10B981',
    criteria: { type: 'weekend_workouts', target: 4 },
    rarity: 'rare'
  },
  {
    id: 'back_at_it',
    name: 'Back at It',
    description: 'Restart a streak after breaking it',
    category: 'streak',
    icon: 'RotateCcw',
    color: '#F59E0B',
    criteria: { type: 'streak_restart' },
    rarity: 'common'
  },
  
  // Milestone/Usage Achievements
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Log your first workout',
    category: 'milestone',
    icon: 'Play',
    color: '#06B6D4',
    criteria: { type: 'workout_count', target: 1 },
    rarity: 'common'
  },
  {
    id: 'ten_and_counting',
    name: 'Ten and Counting',
    description: 'Log 10 workouts',
    category: 'milestone',
    icon: 'Target',
    color: '#3B82F6',
    criteria: { type: 'workout_count', target: 10 },
    rarity: 'common'
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Log 100 workouts',
    category: 'milestone',
    icon: 'Trophy',
    color: '#F59E0B',
    criteria: { type: 'workout_count', target: 100 },
    rarity: 'legendary'
  },
  {
    id: 'consistency_key',
    name: 'Consistency is Key',
    description: 'Log at least 3 workouts a week for a month',
    category: 'milestone',
    icon: 'CheckCircle',
    color: '#10B981',
    criteria: { type: 'consistency', target: 3, duration: 30 },
    rarity: 'rare'
  },
  
  // Social Achievements
  {
    id: 'first_friend',
    name: 'First Friend',
    description: 'Add your first friend',
    category: 'social',
    icon: 'UserPlus',
    color: '#EC4899',
    criteria: { type: 'friend_count', target: 1 },
    rarity: 'common'
  },
  {
    id: 'social_starter',
    name: 'Social Starter',
    description: 'Add 5 friends',
    category: 'social',
    icon: 'Users',
    color: '#8B5CF6',
    criteria: { type: 'friend_count', target: 5 },
    rarity: 'rare'
  },
  {
    id: 'friendly_competition',
    name: 'Friendly Competition',
    description: 'Complete a challenge with a friend',
    category: 'social',
    icon: 'Swords',
    color: '#F59E0B',
    criteria: { type: 'challenge_complete', target: 1 },
    rarity: 'rare'
  },
  
  // Account Longevity Achievements
  {
    id: 'welcome_aboard',
    name: 'Welcome Aboard',
    description: 'Create an account',
    category: 'longevity',
    icon: 'Sparkles',
    color: '#06B6D4',
    criteria: { type: 'account_age', target: 0 },
    rarity: 'common'
  },
  {
    id: 'month_one',
    name: 'Month One',
    description: 'Use the app for 30 days',
    category: 'longevity',
    icon: 'Calendar',
    color: '#10B981',
    criteria: { type: 'account_age', target: 30 },
    rarity: 'common'
  },
  {
    id: 'year_strong',
    name: 'Year Strong',
    description: 'Active user for one full year',
    category: 'longevity',
    icon: 'Award',
    color: '#8B5CF6',
    criteria: { type: 'account_age', target: 365 },
    rarity: 'epic'
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Use the app for 2+ years',
    category: 'longevity',
    icon: 'Crown',
    color: '#F59E0B',
    criteria: { type: 'account_age', target: 730 },
    rarity: 'legendary'
  }
];

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: ACHIEVEMENTS,
      userAchievements: [],
      achievementProgress: {},
      pendingNotifications: [],
      
      getAllAchievements: () => {
        return get().achievements;
      },
      
      getAchievementsByCategory: (category: AchievementCategory) => {
        return get().achievements.filter(achievement => achievement.category === category);
      },
      
      getUserAchievements: (userId?: string) => {
        return get().userAchievements;
      },
      
      getUnlockedAchievements: (userId?: string) => {
        const { achievements, userAchievements } = get();
        const unlockedIds = userAchievements
          .filter(ua => ua.isUnlocked)
          .map(ua => ua.achievementId);
        
        return achievements.filter(achievement => unlockedIds.includes(achievement.id));
      },
      
      getLockedAchievements: (userId?: string) => {
        const { achievements, userAchievements } = get();
        const unlockedIds = userAchievements
          .filter(ua => ua.isUnlocked)
          .map(ua => ua.achievementId);
        
        return achievements.filter(achievement => !unlockedIds.includes(achievement.id));
      },
      
      getAchievementProgress: (achievementId: string) => {
        const { achievementProgress } = get();
        return achievementProgress[achievementId]?.progress || 0;
      },
      
      getPendingNotifications: () => {
        const { achievements, pendingNotifications } = get();
        return achievements.filter(achievement => pendingNotifications.includes(achievement.id));
      },
      
      unlockAchievement: (achievementId: string) => {
        set(state => {
          const existingAchievement = state.userAchievements.find(ua => ua.achievementId === achievementId);
          
          if (existingAchievement && existingAchievement.isUnlocked) {
            return state; // Already unlocked
          }
          
          const newUserAchievement: UserAchievement = {
            achievementId,
            unlockedAt: new Date().toISOString(),
            progress: 100,
            isUnlocked: true,
            notificationShown: false
          };
          
          const updatedUserAchievements = existingAchievement
            ? state.userAchievements.map(ua => 
                ua.achievementId === achievementId ? newUserAchievement : ua
              )
            : [...state.userAchievements, newUserAchievement];
          
          return {
            userAchievements: updatedUserAchievements,
            pendingNotifications: [...state.pendingNotifications, achievementId]
          };
        });
      },
      
      updateProgress: (achievementId: string, progress: number, metadata?: any) => {
        set(state => {
          const updatedProgress = {
            ...state.achievementProgress,
            [achievementId]: {
              progress: Math.min(100, Math.max(0, progress)),
              lastUpdated: new Date().toISOString(),
              metadata: metadata || state.achievementProgress[achievementId]?.metadata
            }
          };
          
          // Update user achievement progress
          const existingUserAchievement = state.userAchievements.find(ua => ua.achievementId === achievementId);
          let updatedUserAchievements = state.userAchievements;
          
          if (existingUserAchievement) {
            updatedUserAchievements = state.userAchievements.map(ua =>
              ua.achievementId === achievementId
                ? { ...ua, progress: updatedProgress[achievementId].progress }
                : ua
            );
          } else {
            updatedUserAchievements = [
              ...state.userAchievements,
              {
                achievementId,
                unlockedAt: '',
                progress: updatedProgress[achievementId].progress,
                isUnlocked: false,
                notificationShown: false
              }
            ];
          }
          
          return {
            achievementProgress: updatedProgress,
            userAchievements: updatedUserAchievements
          };
        });
      },
      
      checkAndUnlockAchievements: () => {
        const { achievements, achievementProgress, userAchievements, unlockAchievement } = get();
        
        achievements.forEach(achievement => {
          const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
          const progress = achievementProgress[achievement.id];
          
          if (!userAchievement?.isUnlocked && progress?.progress >= 100) {
            unlockAchievement(achievement.id);
          }
        });
      },
      
      markNotificationShown: (achievementId: string) => {
        set(state => ({
          userAchievements: state.userAchievements.map(ua =>
            ua.achievementId === achievementId
              ? { ...ua, notificationShown: true }
              : ua
          ),
          pendingNotifications: state.pendingNotifications.filter(id => id !== achievementId)
        }));
      },
      
      clearPendingNotifications: () => {
        set({ pendingNotifications: [] });
      },
      
      onWorkoutCompleted: (workoutDate: string, workoutCount: number) => {
        const { updateProgress } = get();
        
        // Update workout count achievements
        updateProgress('first_steps', workoutCount >= 1 ? 100 : 0);
        updateProgress('ten_and_counting', Math.min(100, (workoutCount / 10) * 100));
        updateProgress('century_club', Math.min(100, (workoutCount / 100) * 100));
        
        // Check if it's a weekend workout
        const workoutDay = new Date(workoutDate).getDay();
        if (workoutDay === 0 || workoutDay === 6) { // Sunday or Saturday
          get().onWeekendWorkout(workoutDate);
        }
      },
      
      onFriendAdded: (friendCount: number) => {
        const { updateProgress } = get();
        
        updateProgress('first_friend', friendCount >= 1 ? 100 : 0);
        updateProgress('social_starter', Math.min(100, (friendCount / 5) * 100));
      },
      
      onChallengeCompleted: () => {
        const { updateProgress } = get();
        updateProgress('friendly_competition', 100);
      },
      
      onAccountCreated: () => {
        const { updateProgress } = get();
        updateProgress('welcome_aboard', 100);
      },
      
      onStreakUpdated: (currentStreak: number, weeklyStreak: number) => {
        const { updateProgress } = get();
        
        // Daily streak achievements
        updateProgress('on_fire', Math.min(100, (currentStreak / 7) * 100));
        updateProgress('momentum_master', Math.min(100, (currentStreak / 35) * 100));
      },
      
      onWeekendWorkout: (date: string) => {
        const { achievementProgress, updateProgress } = get();
        const currentProgress = achievementProgress['weekend_warrior'];
        const metadata = currentProgress?.metadata || { weekendStreakCount: 0 };
        
        // Logic to track consecutive weekend workouts would go here
        // For now, we'll increment the counter
        const newCount = (metadata.weekendStreakCount || 0) + 1;
        updateProgress('weekend_warrior', Math.min(100, (newCount / 8) * 100), {
          ...metadata,
          weekendStreakCount: newCount,
          lastWorkoutDate: date
        });
      },
      
      onStreakBroken: () => {
        const { achievementProgress, updateProgress } = get();
        const currentProgress = achievementProgress['back_at_it'];
        const metadata = currentProgress?.metadata || {};
        
        updateProgress('back_at_it', 0, {
          ...metadata,
          streakBroken: true,
          streakRestarted: false
        });
      },
      
      onStreakRestarted: () => {
        const { achievementProgress, updateProgress } = get();
        const currentProgress = achievementProgress['back_at_it'];
        const metadata = currentProgress?.metadata || {};
        
        if (metadata.streakBroken) {
          updateProgress('back_at_it', 100, {
            ...metadata,
            streakRestarted: true
          });
        }
      }
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Check for account longevity achievements on app start
            setTimeout(() => {
              const { updateProgress } = state;
              
              // This would normally use the actual account creation date
              // For now, we'll simulate based on stored data
              const accountAge = 30; // Mock 30 days
              
              updateProgress('month_one', accountAge >= 30 ? 100 : Math.min(100, (accountAge / 30) * 100));
              updateProgress('year_strong', accountAge >= 365 ? 100 : Math.min(100, (accountAge / 365) * 100));
              updateProgress('veteran', accountAge >= 730 ? 100 : Math.min(100, (accountAge / 730) * 100));
              
              state.checkAndUnlockAchievements();
            }, 1000);
          }
        };
      }
    }
  )
);