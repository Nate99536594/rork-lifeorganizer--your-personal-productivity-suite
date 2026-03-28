import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, DailyGoalLog } from '@/types';

interface GoalState {
  goals: Goal[];
  dailyGoalLogs: DailyGoalLog[];
  lastResetDate: string;
  addGoal: (goal: Omit<Goal, 'id'>, isPremium?: boolean) => { success: boolean; message: string };
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleComplete: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  getMonthlyGoalStats: () => { completed: number; inProgress: number; total: number };
  getGoalLimits: (isPremium?: boolean) => { total: number };
  checkAndResetDaily: () => void;
  getDailyGoalLogs: () => DailyGoalLog[];
  cleanupOldLogs: () => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      dailyGoalLogs: [],
      lastResetDate: new Date().toISOString().split('T')[0],
      
      getGoalLimits: (isPremium = false) => ({
        total: isPremium ? 12 : 3
      }),
      
      cleanupOldLogs: () => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];
        
        set((state) => ({
          dailyGoalLogs: state.dailyGoalLogs.filter(log => log.date >= cutoffDate)
        }));
      },
      
      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastResetDate, goals } = get();
        
        // Clean up old logs first
        get().cleanupOldLogs();
        
        if (lastResetDate !== today) {
          // Check if there were any goal updates yesterday
          const yesterdayGoals = goals.filter(goal => {
            const goalDate = new Date(goal.createdAt).toISOString().split('T')[0];
            return goalDate === lastResetDate;
          });
          
          // Create a daily log if there were goals or updates
          if (yesterdayGoals.length > 0 || goals.length > 0) {
            const completedGoals = goals.filter(goal => goal.status === 'completed').length;
            
            const dailyLog: DailyGoalLog = {
              id: Date.now().toString(),
              date: lastResetDate,
              goals: [...goals],
              totalGoals: goals.length,
              completedGoals,
              progressUpdates: [] // This would be populated if we tracked progress changes
            };
            
            set((state) => ({
              dailyGoalLogs: [dailyLog, ...state.dailyGoalLogs],
              lastResetDate: today
            }));
          } else {
            set({ lastResetDate: today });
          }
        }
      },
      
      addGoal: (goal, isPremium = false) => {
        get().checkAndResetDaily();
        
        const { goals } = get();
        const limits = get().getGoalLimits(isPremium);
        
        // Check goal limit
        if (goals.length >= limits.total) {
          return {
            success: false,
            message: isPremium 
              ? `You've reached the maximum of ${limits.total} goals.`
              : `You've reached the maximum of ${limits.total} goals. Upgrade to Premium for up to 12 goals!`
          };
        }
        
        const newGoal = { 
          ...goal, 
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        set((state) => ({
          goals: [...state.goals, newGoal]
        }));
        
        return {
          success: true,
          message: "Goal added successfully!"
        };
      },
      
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map(goal => 
            goal.id === id ? { ...goal, ...updates } : goal
          )
        }));
      },
      
      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter(goal => goal.id !== id)
        }));
      },
      
      toggleComplete: (id) => {
        set((state) => ({
          goals: state.goals.map(goal => 
            goal.id === id ? { 
              ...goal, 
              status: goal.status === 'completed' ? 'active' : 'completed',
              progress: goal.status === 'completed' ? goal.progress : 100,
              completedAt: goal.status === 'completed' ? undefined : new Date().toISOString()
            } : goal
          )
        }));
      },
      
      updateProgress: (id, progress) => {
        set((state) => ({
          goals: state.goals.map(goal => 
            goal.id === id ? { 
              ...goal, 
              progress,
              status: progress >= 100 ? 'completed' : 'active',
              completedAt: progress >= 100 ? new Date().toISOString() : undefined
            } : goal
          )
        }));
      },
      
      getMonthlyGoalStats: () => {
        const { goals } = get();
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get goals created or updated this month
        const monthlyGoals = goals.filter(goal => {
          const createdDate = new Date(goal.createdAt);
          return createdDate >= firstDayOfMonth && createdDate <= now;
        });
        
        const completed = monthlyGoals.filter(goal => goal.status === 'completed').length;
        const inProgress = monthlyGoals.filter(goal => goal.status !== 'completed').length;
        
        return {
          completed,
          inProgress,
          total: monthlyGoals.length
        };
      },
      
      getDailyGoalLogs: () => {
        const { dailyGoalLogs } = get();
        return dailyGoalLogs.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
    }),
    {
      name: 'goal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);