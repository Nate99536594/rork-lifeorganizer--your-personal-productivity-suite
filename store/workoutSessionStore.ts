import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWeeklyWorkoutStore } from './weeklyWorkoutStore';
import { useActivityFeedStore } from './activityFeedStore';
import { useAuthStore } from './authStore';
import { useAchievementStore } from './achievementStore';
import { WorkoutSession, SavedAIWorkout, AIWorkoutPlan, WorkoutSpecifics, WeeklyWorkoutDay, DailyWorkoutLog } from '@/types';

interface WorkoutSessionState {
  sessions: WorkoutSession[];
  savedAIWorkouts: SavedAIWorkout[];
  dailyWorkoutLogs: DailyWorkoutLog[];
  lastResetDate: string;
  
  // Session methods
  addSession: (session: Omit<WorkoutSession, 'id'>) => void;
  updateSession: (id: string, updates: Partial<WorkoutSession>) => void;
  deleteSession: (id: string) => void;
  getSessionsForDate: (date: string) => WorkoutSession[];
  getSessionsForWeek: (weekStart: string) => WorkoutSession[];
  getSessionsForMonth: (year: number, month: number) => WorkoutSession[];
  getSessionById: (id: string) => WorkoutSession | undefined;
  getMonthlyWorkoutStats: () => { completed: number; missed: number; total: number };
  checkAndResetDaily: () => void;
  getDailyWorkoutLogs: () => DailyWorkoutLog[];
  cleanupOldLogs: () => void;
  
  // Saved AI Workout methods
  saveAIWorkout: (workout: Omit<SavedAIWorkout, 'id' | 'savedAt'>) => void;
  deleteSavedAIWorkout: (id: string) => void;
  updateSavedAIWorkout: (id: string, updates: Partial<SavedAIWorkout>) => void;
  getSavedAIWorkouts: () => SavedAIWorkout[];
  getSavedAIWorkoutById: (id: string) => SavedAIWorkout | undefined;
  toggleFavoriteAIWorkout: (id: string) => void;
  applySavedWorkoutToWeek: (workoutId: string, weekStart: string, selectedDays: number[]) => void;
}

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      savedAIWorkouts: [],
      dailyWorkoutLogs: [],
      lastResetDate: new Date().toISOString().split('T')[0],
      
      cleanupOldLogs: () => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];
        
        set((state) => ({
          dailyWorkoutLogs: state.dailyWorkoutLogs.filter(log => log.date >= cutoffDate)
        }));
      },
      
      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastResetDate, sessions } = get();
        
        // Clean up old logs first
        get().cleanupOldLogs();
        
        if (lastResetDate !== today && sessions.length > 0) {
          // Get yesterday's sessions
          const yesterdaySessions = sessions.filter(session => {
            const sessionDate = new Date(session.date).toISOString().split('T')[0];
            return sessionDate === lastResetDate;
          });
          
          if (yesterdaySessions.length > 0) {
            const totalDuration = yesterdaySessions.reduce((sum, session) => sum + (session.duration || 0), 0);
            const totalExercises = yesterdaySessions.reduce((sum, session) => sum + session.exercises.length, 0);
            const workoutTypes = [...new Set(yesterdaySessions.map(session => session.name))];
            
            const dailyLog: DailyWorkoutLog = {
              id: Date.now().toString(),
              date: lastResetDate,
              sessions: [...yesterdaySessions],
              totalSessions: yesterdaySessions.length,
              totalDuration,
              totalExercises,
              workoutTypes
            };
            
            set((state) => ({
              dailyWorkoutLogs: [dailyLog, ...state.dailyWorkoutLogs],
              lastResetDate: today
            }));
          } else {
            set({ lastResetDate: today });
          }
        } else if (lastResetDate !== today) {
          // Just update the date if no sessions
          set({ lastResetDate: today });
        }
      },
      
      addSession: (session) => {
        get().checkAndResetDaily();
        
        set((state) => {
          const newSession = { ...session, id: Date.now().toString() };
          const newSessions = [...state.sessions, newSession];
          
          // Update weekly streak after adding a session
          setTimeout(() => {
            const weeklyWorkoutStore = useWeeklyWorkoutStore.getState();
            weeklyWorkoutStore.resetWeekIfNeeded();
            weeklyWorkoutStore.updateWeeklyStreak(session.date);
            weeklyWorkoutStore.updateWeekProgress(newSessions);
            weeklyWorkoutStore.checkAndUpdateWeeklyStreak(newSessions);
            
            // Add activity to feed
            const activityFeed = useActivityFeedStore.getState();
            const user = useAuthStore.getState().user;
            
            if (user) {
              const isPublic = user.privacySettings?.accountVisibility === 'public';
              const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
              const userDisplayName = user.usernameType === 'real' ? userName : user.anonymousUsername;
              const timestamp = new Date().toISOString();
              
              // Create activity for the workout
              activityFeed.addActivity({
                userId: user.id,
                userName: userName,
                userDisplayName: userDisplayName,
                type: 'workout_completed',
                activityType: 'workout',
                content: `completed ${session.duration} minute ${session.exercises.length > 1 ? 'workout' : session.exercises[0]?.name || 'workout'}`,
                timestamp: timestamp,
                createdAt: timestamp,
                isVisible: isPublic
              });
            }
            
            // Update achievements
            const achievementStore = useAchievementStore.getState();
            achievementStore.onWorkoutCompleted(session.date, newSessions.length);
            achievementStore.checkAndUnlockAchievements();
          }, 0);
          
          return { sessions: newSessions };
        });
      },
      
      updateSession: (id, updates) => {
        set((state) => {
          const sessionExists = state.sessions.find(session => session.id === id);
          if (!sessionExists) {
            console.warn(`Workout session with id ${id} not found`);
            return state;
          }
          
          const newSessions = state.sessions.map(session => 
            session.id === id ? { ...session, ...updates } : session
          );
          
          // Update weekly streak after updating a session
          setTimeout(() => {
            const weeklyWorkoutStore = useWeeklyWorkoutStore.getState();
            weeklyWorkoutStore.resetWeekIfNeeded();
            weeklyWorkoutStore.updateWeekProgress(newSessions);
            weeklyWorkoutStore.checkAndUpdateWeeklyStreak(newSessions);
          }, 0);
          
          return { sessions: newSessions };
        });
      },
      
      deleteSession: (id) => {
        set((state) => {
          const deletedSession = state.sessions.find(session => session.id === id);
          if (!deletedSession) {
            console.warn(`Workout session with id ${id} not found`);
            return state;
          }
          
          const newSessions = state.sessions.filter(session => session.id !== id);
          
          // Update weekly streak after deleting a session
          setTimeout(() => {
            const weeklyWorkoutStore = useWeeklyWorkoutStore.getState();
            weeklyWorkoutStore.resetWeekIfNeeded();
            weeklyWorkoutStore.updateWeekProgress(newSessions);
            weeklyWorkoutStore.checkAndUpdateWeeklyStreak(newSessions);
            
            // If the deleted session was today and it was marked as completed in the weekly plan, unmark it
            if (deletedSession) {
              const sessionDate = new Date(deletedSession.date);
              const today = new Date();
              const sessionDay = sessionDate.getDay();
              const todayDay = today.getDay();
              
              // Check if the deleted session was from today
              if (sessionDate.toDateString() === today.toDateString()) {
                const currentWeekPlan = weeklyWorkoutStore.getCurrentWeekPlan();
                if (currentWeekPlan) {
                  const todayPlan = currentWeekPlan.days.find((day: WeeklyWorkoutDay) => day.dayIndex === todayDay);
                  if (todayPlan?.isWorkoutDay && todayPlan.isCompleted) {
                    // Check if there are any other sessions for today
                    const todaySessions = newSessions.filter(session => {
                      const sessionDate = new Date(session.date);
                      return sessionDate.toDateString() === today.toDateString();
                    });
                    
                    // If no other sessions for today, unmark as completed
                    if (todaySessions.length === 0) {
                      weeklyWorkoutStore.updateDayPlan(todayDay, {
                        isCompleted: false,
                        completedAt: undefined
                      });
                    }
                  }
                }
              }
            }
          }, 0);
          
          return { sessions: newSessions };
        });
      },
      
      getSessionsForDate: (date) => {
        const { sessions } = get();
        // Normalize the date to YYYY-MM-DD format for comparison
        const targetDate = new Date(date + 'T00:00:00');
        const targetDateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
        
        return sessions.filter(session => {
          const sessionDate = new Date(session.date);
          const sessionDateString = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
          return sessionDateString === targetDateString;
        });
      },
      
      getSessionsForWeek: (weekStart) => {
        const { sessions } = get();
        const start = new Date(weekStart + 'T00:00:00');
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        return sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= start && sessionDate <= end;
        });
      },
      
      getSessionsForMonth: (year, month) => {
        const { sessions } = get();
        return sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
        });
      },
      
      getSessionById: (id) => {
        const { sessions } = get();
        return sessions.find(session => session.id === id);
      },
      
      getMonthlyWorkoutStats: () => {
        const { sessions } = get();
        const weeklyWorkoutStore = useWeeklyWorkoutStore.getState();
        const currentWeekPlan = weeklyWorkoutStore.getCurrentWeekPlan();
        
        // Get current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Get sessions from this month
        const monthSessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= firstDayOfMonth && sessionDate <= now;
        });
        
        // Count planned workouts for this month
        let plannedWorkouts = 0;
        if (currentWeekPlan) {
          // Count workout days in the current week plan
          const workoutDaysPerWeek = currentWeekPlan.days.filter((day: WeeklyWorkoutDay) => day.isWorkoutDay).length;
          
          // Calculate how many weeks are in the current month up to today
          const weeksInMonth = Math.ceil((now.getDate()) / 7);
          
          // Estimate planned workouts based on workout frequency
          plannedWorkouts = workoutDaysPerWeek * weeksInMonth;
        }
        
        // Ensure we have at least the number of completed workouts
        plannedWorkouts = Math.max(plannedWorkouts, monthSessions.length);
        
        return {
          completed: monthSessions.length,
          missed: plannedWorkouts - monthSessions.length,
          total: plannedWorkouts
        };
      },
      
      getDailyWorkoutLogs: () => {
        const { dailyWorkoutLogs } = get();
        return dailyWorkoutLogs.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      
      // Saved AI Workout methods
      saveAIWorkout: (workout) => {
        set((state) => {
          // Limit to 20 saved workouts
          let newSavedWorkouts = [...state.savedAIWorkouts];
          
          if (newSavedWorkouts.length >= 20) {
            // Remove the oldest non-favorite workout
            const oldestNonFavoriteIndex = newSavedWorkouts.findIndex(w => !w.isFavorite);
            if (oldestNonFavoriteIndex !== -1) {
              newSavedWorkouts.splice(oldestNonFavoriteIndex, 1);
            } else {
              // If all are favorites, remove the oldest one
              newSavedWorkouts.shift();
            }
          }
          
          const newWorkout: SavedAIWorkout = {
            ...workout,
            id: Date.now().toString(),
            savedAt: new Date().toISOString(),
          };
          
          newSavedWorkouts.push(newWorkout);
          
          return { savedAIWorkouts: newSavedWorkouts };
        });
      },
      
      deleteSavedAIWorkout: (id) => {
        set((state) => ({
          savedAIWorkouts: state.savedAIWorkouts.filter(workout => workout.id !== id)
        }));
      },
      
      updateSavedAIWorkout: (id, updates) => {
        set((state) => ({
          savedAIWorkouts: state.savedAIWorkouts.map(workout =>
            workout.id === id ? { ...workout, ...updates } : workout
          )
        }));
      },
      
      getSavedAIWorkouts: () => {
        const { savedAIWorkouts } = get();
        // Sort by favorites first, then by saved date (newest first)
        return savedAIWorkouts.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        });
      },
      
      getSavedAIWorkoutById: (id) => {
        const { savedAIWorkouts } = get();
        return savedAIWorkouts.find(workout => workout.id === id);
      },
      
      toggleFavoriteAIWorkout: (id) => {
        set((state) => ({
          savedAIWorkouts: state.savedAIWorkouts.map(workout =>
            workout.id === id ? { ...workout, isFavorite: !workout.isFavorite } : workout
          )
        }));
      },
      
      applySavedWorkoutToWeek: (workoutId, weekStart, selectedDays) => {
        const { savedAIWorkouts } = get();
        const savedWorkout = savedAIWorkouts.find(w => w.id === workoutId);
        
        if (!savedWorkout) {
          console.warn(`Saved workout with id ${workoutId} not found`);
          return;
        }
        
        // Apply the saved workout to the weekly plan
        const weeklyWorkoutStore = useWeeklyWorkoutStore.getState();
        
        selectedDays.forEach(dayIndex => {
          const workoutPlan = savedWorkout.workoutPlans.find(plan => plan.dayIndex === dayIndex);
          if (workoutPlan) {
            weeklyWorkoutStore.updateDayPlan(dayIndex, {
              isWorkoutDay: true,
              workoutType: workoutPlan.workoutType,
              customWorkoutName: savedWorkout.name,
              notes: `Applied from saved AI workout: ${savedWorkout.name}`
            });
          }
        });
      },
    }),
    {
      name: 'workout-session-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Update weekly streak when store is rehydrated
            setTimeout(() => {
              const weeklyWorkoutStore = useWeeklyWorkoutStore.getState();
              weeklyWorkoutStore.resetWeekIfNeeded();
              weeklyWorkoutStore.updateWeekProgress(state.sessions);
              weeklyWorkoutStore.checkAndUpdateWeeklyStreak(state.sessions);
            }, 0);
          }
        };
      }
    }
  )
);