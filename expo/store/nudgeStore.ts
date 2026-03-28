import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Nudge } from '@/types';
import { useAuthStore } from './authStore';

interface NudgeState {
  nudges: Nudge[];
  isLoading: boolean;
  error: string | null;
  
  // Nudge actions
  sendNudge: (nudge: Omit<Nudge, 'id' | 'createdAt' | 'read'>) => Promise<Nudge>;
  markAsRead: (nudgeId: string) => void;
  deleteNudge: (nudgeId: string) => void;
  
  // Getters
  getUnreadNudges: () => Nudge[];
  getReceivedNudges: () => Nudge[];
  getSentNudges: () => Nudge[];
  getUnreadCount: () => number;
}

// Predefined nudge messages
export const NUDGE_MESSAGES = [
  "Keep up the good work!",
  "You're doing great!",
  "Don't give up!",
  "You're almost there!",
  "Stay focused!",
  "You can do it!",
  "I believe in you!",
  "Keep pushing!",
  "One more day!",
  "Let's crush this goal!",
  "You're on fire!",
  "Impressive streak!",
  "Keep that streak alive!",
  "You're making progress!",
  "Stay consistent!"
];

export const useNudgeStore = create<NudgeState>()(
  persist(
    (set, get) => ({
      nudges: [
        // Sample nudges for demonstration
        {
          id: '1',
          senderId: '2', // SwiftEagle892
          senderName: 'SwiftEagle892',
          receiverId: '1', // Current user
          receiverName: 'MountainLion123',
          message: "Keep up the good work!",
          read: false,
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
        },
        {
          id: '2',
          senderId: '3', // BraveWolf234
          senderName: 'BraveWolf234',
          receiverId: '1', // Current user
          receiverName: 'MountainLion123',
          message: "You're almost there!",
          read: true,
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
        },
        {
          id: '3',
          senderId: '1', // Current user
          senderName: 'MountainLion123',
          receiverId: '4', // HappyDolphin567
          receiverName: 'HappyDolphin567',
          message: "Don't give up!",
          read: true,
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), // 1 day ago
        },
      ],
      isLoading: false,
      error: null,
      
      sendNudge: async (nudge) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = useAuthStore.getState().user;
          if (!user) {
            throw new Error('User not authenticated');
          }
          
          const newNudge: Nudge = {
            ...nudge,
            id: Date.now().toString(),
            read: false,
            createdAt: new Date().toISOString(),
          };
          
          set((state) => ({
            nudges: [...state.nudges, newNudge],
            isLoading: false,
          }));
          
          return newNudge;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send nudge';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },
      
      markAsRead: (nudgeId) => {
        set((state) => ({
          nudges: state.nudges.map(nudge => 
            nudge.id === nudgeId ? { ...nudge, read: true } : nudge
          ),
        }));
      },
      
      deleteNudge: (nudgeId) => {
        set((state) => ({
          nudges: state.nudges.filter(nudge => nudge.id !== nudgeId),
        }));
      },
      
      getUnreadNudges: () => {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        
        return get().nudges.filter(nudge => 
          nudge.receiverId === user.id && !nudge.read
        ).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      
      getReceivedNudges: () => {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        
        return get().nudges.filter(nudge => 
          nudge.receiverId === user.id
        ).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      
      getSentNudges: () => {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        
        return get().nudges.filter(nudge => 
          nudge.senderId === user.id
        ).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      
      getUnreadCount: () => {
        const user = useAuthStore.getState().user;
        if (!user) return 0;
        
        return get().nudges.filter(nudge => 
          nudge.receiverId === user.id && !nudge.read
        ).length;
      },
    }),
    {
      name: 'nudge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);