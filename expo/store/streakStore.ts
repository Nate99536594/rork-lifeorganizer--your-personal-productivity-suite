import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useActivityFeedStore } from './activityFeedStore';
import { useAuthStore } from './authStore';

interface StreakHistory {
  date: string; // YYYY-MM-DD format
  streakCount: number;
}

interface StreakState {
  currentStreak: number;
  lastCompletedDate: string | null;
  longestStreak: number;
  streakHistory: StreakHistory[];
  incrementStreak: () => void;
  resetStreak: () => void;
  checkAndUpdateStreak: () => void;
  getStreakForDate: (date: string) => number;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      lastCompletedDate: null,
      longestStreak: 0,
      streakHistory: [],
      
      getStreakForDate: (date) => {
        const { streakHistory } = get();
        const historyEntry = streakHistory.find(entry => entry.date === date);
        return historyEntry?.streakCount || 0;
      },
      
      incrementStreak: () => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const { lastCompletedDate, currentStreak, longestStreak, streakHistory } = get();
        
        // Only increment if we haven't already completed a general task today
        if (lastCompletedDate !== today) {
          const newStreak = currentStreak + 1;
          
          // Add to streak history
          const updatedHistory = [...streakHistory];
          const existingIndex = updatedHistory.findIndex(entry => entry.date === today);
          
          if (existingIndex >= 0) {
            updatedHistory[existingIndex].streakCount = newStreak;
          } else {
            updatedHistory.push({ date: today, streakCount: newStreak });
          }
          
          // Add activity to feed for streak milestones (3, 7, 14, 30, etc.)
          if (newStreak === 3 || newStreak === 7 || newStreak === 14 || 
              newStreak === 30 || newStreak === 60 || newStreak === 100) {
            const activityFeed = useActivityFeedStore.getState();
            const user = useAuthStore.getState().user;
            
            if (user) {
              const isPublic = user.privacySettings?.accountVisibility === 'public';
              const userName = user.displayName || user.name || user.username;
              
              activityFeed.addActivity({
                userId: user.id,
                userName,
                activityType: 'streak',
                action: 'reached',
                details: `${newStreak} day streak`,
                timestamp: new Date().toISOString(),
                isPublic
              });
            }
          }
          
          set({
            currentStreak: newStreak,
            lastCompletedDate: today,
            longestStreak: Math.max(longestStreak, newStreak),
            streakHistory: updatedHistory
          });
        }
      },
      
      resetStreak: () => {
        set({
          currentStreak: 0,
          lastCompletedDate: null
        });
      },
      
      checkAndUpdateStreak: () => {
        const { lastCompletedDate, resetStreak } = get();
        
        if (!lastCompletedDate) return;
        
        const today = new Date().toISOString().split('T')[0];
        const lastDate = new Date(lastCompletedDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // If the last completed date is not yesterday or today, reset the streak
        if (lastCompletedDate !== yesterdayStr && lastCompletedDate !== today) {
          resetStreak();
        }
      }
    }),
    {
      name: 'streak-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);