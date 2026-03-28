import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityFeedItem } from '@/types';

interface ActivityFeedState {
  activities: ActivityFeedItem[];
  
  // Activity management
  addActivity: (activity: Omit<ActivityFeedItem, 'id'>) => void;
  getFriendActivities: () => ActivityFeedItem[];
  getUserActivities: (userId: string) => ActivityFeedItem[];
  clearActivities: () => void;
}

export const useActivityFeedStore = create<ActivityFeedState>()(
  persist(
    (set, get) => ({
      activities: [],
      
      addActivity: (activity) => {
        const newActivity: ActivityFeedItem = {
          ...activity,
          id: Date.now().toString(),
          timestamp: activity.timestamp || new Date().toISOString(),
        };
        
        set(state => ({
          activities: [newActivity, ...state.activities].slice(0, 100), // Keep only latest 100 activities
        }));
      },
      
      getFriendActivities: () => {
        const { activities } = get();
        // Return activities from friends (not current user)
        return activities
          .filter(activity => activity.userId !== '1') // Exclude current user
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
      
      getUserActivities: (userId: string) => {
        const { activities } = get();
        return activities
          .filter(activity => activity.userId === userId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
      
      clearActivities: () => {
        set({ activities: [] });
      },
    }),
    {
      name: 'activity-feed-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);