import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge } from '@/types';

interface ChallengeState {
  challenges: Challenge[];
  isLoading: boolean;
  error?: string;
  
  // Challenge management
  getPendingChallenges: () => Challenge[];
  getActiveChallenges: () => Challenge[];
  getCompletedChallenges: () => Challenge[];
  getUserChallenges: (userId: string) => Challenge[];
  getChallengeById: (id: string) => Challenge | undefined;
  
  // Challenge actions
  createChallenge: (challengeData: {
    creatorId: string;
    creatorName: string;
    participantId: string;
    participantName: string;
    type: 'streak' | 'workout' | 'goal';
    duration: number;
    description?: string;
  }) => Promise<void>;
  
  acceptChallenge: (challengeId: string) => Promise<void>;
  declineChallenge: (challengeId: string) => Promise<void>;
  updateChallengeProgress: (challengeId?: string, userId?: string, progress?: number) => Promise<void>;
  completeChallenge: (challengeId: string, winnerId?: string) => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      challenges: [],
      isLoading: false,
      
      getPendingChallenges: () => {
        const { challenges } = get();
        return challenges
          .filter(challenge => challenge.status === 'pending')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getActiveChallenges: () => {
        const { challenges } = get();
        return challenges
          .filter(challenge => challenge.status === 'active')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getCompletedChallenges: () => {
        const { challenges } = get();
        return challenges
          .filter(challenge => challenge.status === 'completed')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getUserChallenges: (userId: string) => {
        const { challenges } = get();
        return challenges
          .filter(challenge => 
            challenge.creatorId === userId || challenge.participantId === userId
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getChallengeById: (id: string) => {
        const { challenges } = get();
        return challenges.find(challenge => challenge.id === id);
      },
      
      createChallenge: async (challengeData) => {
        set({ isLoading: true, error: undefined });
        
        try {
          // Validate duration
          if (challengeData.duration < 1 || challengeData.duration > 30) {
            throw new Error('Challenge duration must be between 1 and 30 days');
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newChallenge: Challenge = {
            id: Date.now().toString(),
            title: `${challengeData.type} Challenge`,
            description: challengeData.description || `A ${challengeData.duration}-day ${challengeData.type} challenge`,
            type: challengeData.type as 'task' | 'workout' | 'streak' | 'goal',
            difficulty: 'medium',
            duration: challengeData.duration,
            reward: {
              experience: challengeData.duration * 10,
            },
            participants: [],
            createdBy: challengeData.creatorId,
            createdByName: challengeData.creatorName,
            status: 'pending',
            isPublic: false,
            createdAt: new Date().toISOString(),
            creatorId: challengeData.creatorId,
            participantId: challengeData.participantId,
            creatorProgress: 0,
            participantProgress: 0,
          };
          
          set(state => ({
            challenges: [newChallenge, ...state.challenges],
            isLoading: false,
          }));
        } catch (error) {
          console.error('Create challenge error:', error);
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create challenge'
          });
          throw error;
        }
      },
      
      acceptChallenge: async (challengeId: string) => {
        set({ isLoading: true, error: undefined });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => {
            const challenge = state.challenges.find(c => c.id === challengeId);
            if (!challenge) {
              throw new Error('Challenge not found');
            }
            
            const now = new Date();
            // Calculate end date based on challenge duration
            const endDate = new Date(now.getTime() + challenge.duration * 24 * 60 * 60 * 1000);
            
            return {
              challenges: state.challenges.map(c =>
                c.id === challengeId
                  ? {
                      ...c,
                      status: 'active' as const,
                      startDate: now.toISOString(),
                      endDate: endDate.toISOString(),
                      creatorProgress: 0,
                      participantProgress: 0,
                    }
                  : c
              ),
              isLoading: false,
            };
          });
        } catch (error) {
          console.error('Accept challenge error:', error);
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to accept challenge'
          });
          throw error;
        }
      },
      
      declineChallenge: async (challengeId: string) => {
        set({ isLoading: true, error: undefined });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            challenges: state.challenges.map(challenge =>
              challenge.id === challengeId
                ? { ...challenge, status: 'declined' as const }
                : challenge
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Decline challenge error:', error);
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to decline challenge'
          });
          throw error;
        }
      },
      
      updateChallengeProgress: async (challengeId?: string, userId?: string, progress?: number) => {
        set({ isLoading: true, error: undefined });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          
          set(state => {
            // If no parameters provided, just simulate a progress update
            if (!challengeId || !userId) {
              return { isLoading: false };
            }
            
            return {
              challenges: state.challenges.map(challenge => {
                if (challenge.id === challengeId) {
                  if (challenge.creatorId === userId) {
                    return { ...challenge, creatorProgress: progress ?? challenge.creatorProgress };
                  } else if (challenge.participantId === userId) {
                    return { ...challenge, participantProgress: progress ?? challenge.participantProgress };
                  }
                }
                return challenge;
              }),
              isLoading: false,
            };
          });
        } catch (error) {
          console.error('Update challenge progress error:', error);
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update challenge progress'
          });
          throw error;
        }
      },
      
      completeChallenge: async (challengeId: string, winnerId?: string) => {
        set({ isLoading: true, error: undefined });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            challenges: state.challenges.map(challenge =>
              challenge.id === challengeId
                ? {
                    ...challenge,
                    status: 'completed' as const,
                    winnerId,
                    endDate: new Date().toISOString(),
                  }
                : challenge
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Complete challenge error:', error);
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to complete challenge'
          });
          throw error;
        }
      },
    }),
    {
      name: 'challenge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);