import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyWorkoutPlan, WeeklyWorkoutDay } from '@/types';

interface WeeklyWorkoutState {
  currentWeekStreak: number;
  weeklyStreak: number;
  currentWeekStart: string; // ISO string of Sunday
  lastCompletedWeek: string | null; // ISO string of the last week's Sunday
  weeklyGoal: number; // days per week
  weekProgress: boolean[]; // Array of 7 booleans representing each day of the week (Sunday to Saturday)
  
  // Weekly Plan state
  currentWeeklyWorkoutPlan: WeeklyWorkoutPlan | null;
  weeklyPlans: WeeklyWorkoutPlan[]; // Historical plans
  
  // Core methods
  updateWeeklyStreak: (workoutDate: string) => void;
  resetWeekIfNeeded: () => void;
  getWeekProgress: (sessions: any[]) => boolean[];
  checkAndUpdateWeeklyStreak: (sessions: any[]) => void;
  updateWeekProgress: (sessions: any[]) => void;
  
  // Weekly Plan methods
  createWeeklyWorkoutPlan: () => void;
  updateWeeklyWorkoutDay: (dayIndex: number, updates: Partial<WeeklyWorkoutDay>) => void;
  completeWorkout: (dayIndex: number) => void;
  validateWeeklyWorkoutPlan: (plan: WeeklyWorkoutPlan) => { isValid: boolean; error?: string };
  getCurrentWeekPlan: () => WeeklyWorkoutPlan | null;
  canCompleteWorkout: (dayIndex: number) => boolean;
  getWorkoutTypesForWeek: () => { [key: number]: string };
  
  // Enhanced methods for mid-week plan changes
  preserveCompletionStatus: (originalPlan: WeeklyWorkoutPlan, newPlan: WeeklyWorkoutPlan) => WeeklyWorkoutPlan;
  getOriginalPlanForStreak: () => WeeklyWorkoutPlan | null;
  isPlanActuallyModified: () => boolean;
  checkAndUpdateModificationStatus: () => void;
  isCurrentPlanSameAsOriginal: () => boolean;
}

const getSunday = (date: Date): Date => {
  // Create a new date to avoid mutating the original
  const d = new Date(date.getTime());
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday is 0, so no adjustment needed
  d.setDate(diff);
  // Reset time to start of day to avoid timezone issues
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateString = (date: Date): string => {
  // Use local date string to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if two weeks are consecutive
const areConsecutiveWeeks = (week1: string, week2: string): boolean => {
  const date1 = new Date(week1 + 'T00:00:00');
  const date2 = new Date(week2 + 'T00:00:00');
  
  // Calculate the difference in days
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Consecutive weeks should be 7 days apart
  return diffDays === 7;
};

// Convert a date to day of week index (0 = Sunday, 6 = Saturday)
const getDayOfWeekIndex = (date: Date): number => {
  return date.getDay(); // JavaScript's getDay() already returns 0 for Sunday, 6 for Saturday
};

// Check if a session date is in the current week
const isInCurrentWeek = (sessionDate: string, currentWeekStart: string): boolean => {
  const session = new Date(sessionDate);
  const weekStart = new Date(currentWeekStart + 'T00:00:00');
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return session >= weekStart && session <= weekEnd;
};

// Create default weekly plan
const createDefaultWeeklyWorkoutPlan = (weekStart: string): WeeklyWorkoutPlan => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const days: WeeklyWorkoutDay[] = dayNames.map((dayName, index) => ({
    dayIndex: index,
    dayName,
    isWorkoutDay: index !== 0 && index !== 6, // Default: Monday-Friday workout, Weekend rest
    workoutType: index !== 0 && index !== 6 ? 'Strength Training' : undefined,
    isCompleted: false,
    // Set original plan state
    originalIsWorkoutDay: index !== 0 && index !== 6,
    originalWorkoutType: index !== 0 && index !== 6 ? 'Strength Training' : undefined,
  }));

  return {
    id: Date.now().toString(),
    weekStart,
    days,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isModified: false,
    // Store original days for streak calculation
    originalDays: JSON.parse(JSON.stringify(days)),
  };
};

// Helper function to compare two day plans for equality (ignoring completion status)
const areDaysEqual = (day1: WeeklyWorkoutDay, day2: WeeklyWorkoutDay): boolean => {
  return (
    day1.isWorkoutDay === day2.isWorkoutDay &&
    day1.workoutType === day2.workoutType &&
    day1.customWorkoutName === day2.customWorkoutName
  );
};

// Helper function to compare current plan with truly original plan
const isPlanDifferentFromTrueOriginal = (currentPlan: WeeklyWorkoutPlan): boolean => {
  if (!currentPlan.originalDays) return false;
  
  // Compare current plan with the very first original plan
  for (let i = 0; i < currentPlan.days.length; i++) {
    const currentDay = currentPlan.days[i];
    const originalDay = currentPlan.originalDays[i];
    
    if (!areDaysEqual(currentDay, originalDay)) {
      return true;
    }
  }
  
  return false;
};

// Helper function to check if current plan matches original exactly
const isCurrentPlanSameAsOriginal = (currentPlan: WeeklyWorkoutPlan): boolean => {
  if (!currentPlan.originalDays) return true; // If no original days stored, consider it the same
  
  // Compare current plan with original plan
  for (let i = 0; i < currentPlan.days.length; i++) {
    const currentDay = currentPlan.days[i];
    const originalDay = currentPlan.originalDays[i];
    
    if (!areDaysEqual(currentDay, originalDay)) {
      return false;
    }
  }
  
  return true;
};

export const useWeeklyWorkoutStore = create<WeeklyWorkoutState>()(
  persist(
    (set, get) => ({
      currentWeekStreak: 0,
      weeklyStreak: 0,
      currentWeekStart: formatDateString(getSunday(new Date())),
      lastCompletedWeek: null,
      weeklyGoal: 5, // default goal of 5 days per week
      weekProgress: [false, false, false, false, false, false, false], // Sun, Mon, Tue, Wed, Thu, Fri, Sat
      
      // Weekly Plan state
      currentWeeklyWorkoutPlan: null,
      weeklyPlans: [],
      
      updateWeeklyStreak: (workoutDate) => {
        const { resetWeekIfNeeded, checkAndUpdateWeeklyStreak, updateWeekProgress } = get();
        resetWeekIfNeeded();
        
        const workoutDay = new Date(workoutDate + 'T00:00:00');
        const currentSunday = getSunday(new Date());
        const workoutSunday = getSunday(workoutDay);
        
        // Only update if workout is in current week
        if (formatDateString(workoutSunday) === formatDateString(currentSunday)) {
          // Update the week progress array
          updateWeekProgress([{ date: workoutDate }]);
          
          // We'll calculate streak based on actual sessions in the component
          set((state) => ({ ...state }));
        }
      },
      
      resetWeekIfNeeded: () => {
        const { currentWeekStart, createWeeklyWorkoutPlan } = get();
        const now = new Date();
        const currentSunday = formatDateString(getSunday(now));
        
        if (currentWeekStart !== currentSunday) {
          set({
            currentWeekStart: currentSunday,
            currentWeekStreak: 0,
            weekProgress: [false, false, false, false, false, false, false] // Reset progress for new week
          });
          
          // Create new weekly plan for the new week
          createWeeklyWorkoutPlan();
        }
      },
      
      getWeekProgress: (sessions) => {
        const { currentWeekStart } = get();
        const weekProgress = [false, false, false, false, false, false, false]; // Sun-Sat
        
        // If we have sessions, calculate progress based on them
        if (sessions && sessions.length > 0) {
          sessions.forEach(session => {
            // Check if session is in current week
            if (isInCurrentWeek(session.date, currentWeekStart)) {
              const sessionDate = new Date(session.date);
              const dayIndex = getDayOfWeekIndex(sessionDate);
              weekProgress[dayIndex] = true;
            }
          });
        }
        
        return weekProgress;
      },
      
      updateWeekProgress: (sessions) => {
        const { currentWeekStart } = get();
        
        set(state => {
          const newWeekProgress = [false, false, false, false, false, false, false];
          
          // Update progress for each day that has a workout in current week
          sessions.forEach(session => {
            if (isInCurrentWeek(session.date, currentWeekStart)) {
              const sessionDate = new Date(session.date);
              const dayIndex = getDayOfWeekIndex(sessionDate);
              newWeekProgress[dayIndex] = true;
            }
          });
          
          return { weekProgress: newWeekProgress };
        });
      },
      
      checkAndUpdateWeeklyStreak: (sessions) => {
        const { currentWeekStart, lastCompletedWeek, getWeekProgress, updateWeekProgress, getOriginalPlanForStreak } = get();
        
        // First update the week progress based on sessions
        if (sessions && sessions.length > 0) {
          updateWeekProgress(sessions);
        }
        
        // Check if weekly plan requirements are met using ORIGINAL plan
        let hasMetWeeklyGoal = false;
        
        const originalPlan = getOriginalPlanForStreak();
        if (originalPlan) {
          // Count completed workout days based on ORIGINAL plan
          const completedWorkoutDays = originalPlan.days.filter(day => 
            day.originalIsWorkoutDay && day.isCompleted
          ).length;
          
          // Check if at least one workout day is completed
          hasMetWeeklyGoal = completedWorkoutDays > 0;
        } else {
          // Fallback to old logic if no plan exists
          const weekProgress = getWeekProgress(sessions);
          hasMetWeeklyGoal = weekProgress.some(Boolean);
        }
        
        // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
        const today = new Date();
        const dayOfWeek = today.getDay();
        
        set(state => {
          let newWeeklyStreak = state.weeklyStreak;
          
          // If we have met the weekly goal
          if (hasMetWeeklyGoal) {
            // If this is the first completed week or consecutive with last completed week
            if (!state.lastCompletedWeek || 
                areConsecutiveWeeks(state.lastCompletedWeek, currentWeekStart)) {
              // Increment streak if we haven't already counted this week
              if (state.lastCompletedWeek !== currentWeekStart) {
                newWeeklyStreak += 1;
              }
            } else {
              // Non-consecutive weeks, reset streak to 1
              newWeeklyStreak = 1;
            }
            
            return {
              ...state,
              weeklyStreak: newWeeklyStreak,
              lastCompletedWeek: currentWeekStart
            };
          } 
          // If it's Saturday night and weekly goal not met, reset streak
          else if (dayOfWeek === 6 && today.getHours() >= 23) {
            return {
              ...state,
              weeklyStreak: 0
            };
          }
          
          return state;
        });
      },
      
      // Weekly Plan methods
      createWeeklyWorkoutPlan: () => {
        const { currentWeekStart, weeklyPlans } = get();
        
        // Check if plan already exists for current week
        const existingPlan = weeklyPlans.find(plan => plan.weekStart === currentWeekStart);
        
        if (!existingPlan) {
          const newPlan = createDefaultWeeklyWorkoutPlan(currentWeekStart);
          
          set(state => ({
            currentWeeklyWorkoutPlan: newPlan,
            weeklyPlans: [...state.weeklyPlans, newPlan]
          }));
        } else {
          set({ currentWeeklyWorkoutPlan: existingPlan });
        }
      },
      
      updateWeeklyWorkoutDay: (dayIndex, updates) => {
        const { checkAndUpdateModificationStatus } = get();
        
        set(state => {
          if (!state.currentWeeklyWorkoutPlan) return state;
          
          const today = new Date();
          const todayIndex = today.getDay();
          
          const updatedDays = state.currentWeeklyWorkoutPlan.days.map(day => {
            if (day.dayIndex === dayIndex) {
              const updatedDay = { ...day, ...updates };
              
              // CRITICAL: For past days and current day, NEVER change original requirements
              // This preserves streak calculation integrity
              if (dayIndex <= todayIndex) {
                // Keep original plan state for streak calculation - NEVER change this for past/current days
                updatedDay.originalIsWorkoutDay = day.originalIsWorkoutDay !== undefined ? day.originalIsWorkoutDay : day.isWorkoutDay;
                updatedDay.originalWorkoutType = day.originalWorkoutType !== undefined ? day.originalWorkoutType : day.workoutType;
                
                // If the day was already completed, keep it completed
                if (day.isCompleted) {
                  updatedDay.isCompleted = true;
                  updatedDay.completedAt = day.completedAt;
                }
              } else {
                // For future days, we can update the original plan state
                if (updates.isWorkoutDay !== undefined) {
                  updatedDay.originalIsWorkoutDay = updates.isWorkoutDay;
                }
                if (updates.workoutType !== undefined) {
                  updatedDay.originalWorkoutType = updates.workoutType;
                }
              }
              
              return updatedDay;
            }
            return day;
          });
          
          const updatedPlan = {
            ...state.currentWeeklyWorkoutPlan,
            days: updatedDays,
            updatedAt: new Date().toISOString(),
          };
          
          // Update original days if this is the first modification
          if (!state.currentWeeklyWorkoutPlan.isModified && !state.currentWeeklyWorkoutPlan.originalDays) {
            updatedPlan.originalDays = JSON.parse(JSON.stringify(state.currentWeeklyWorkoutPlan.days));
          }
          
          // Update in weeklyPlans array as well
          const updatedPlans = state.weeklyPlans.map(plan => 
            plan.id === updatedPlan.id ? updatedPlan : plan
          );
          
          const newState = {
            currentWeeklyWorkoutPlan: updatedPlan,
            weeklyPlans: updatedPlans
          };
          
          return newState;
        });
        
        // Check and update modification status after the state update
        setTimeout(() => {
          checkAndUpdateModificationStatus();
        }, 0);
      },
      
      completeWorkout: (dayIndex) => {
        const { canCompleteWorkout, updateWeeklyWorkoutDay } = get();
        
        if (canCompleteWorkout(dayIndex)) {
          updateWeeklyWorkoutDay(dayIndex, {
            isCompleted: true,
            completedAt: new Date().toISOString()
          });
        }
      },
      
      validateWeeklyWorkoutPlan: (plan) => {
        const workoutDays = plan.days.filter(day => day.isWorkoutDay).length;
        const restDays = plan.days.filter(day => !day.isWorkoutDay).length;
        
        if (restDays > 6) {
          return {
            isValid: false,
            error: "You can have a maximum of 6 rest days per week. At least 1 workout day is required."
          };
        }
        
        if (workoutDays === 0) {
          return {
            isValid: false,
            error: "You must have at least 1 workout day per week."
          };
        }
        
        return { isValid: true };
      },
      
      getCurrentWeekPlan: () => {
        const { currentWeeklyWorkoutPlan, currentWeekStart, createWeeklyWorkoutPlan } = get();
        
        if (!currentWeeklyWorkoutPlan || currentWeeklyWorkoutPlan.weekStart !== currentWeekStart) {
          createWeeklyWorkoutPlan();
          return get().currentWeeklyWorkoutPlan;
        }
        
        return currentWeeklyWorkoutPlan;
      },
      
      canCompleteWorkout: (dayIndex) => {
        const { currentWeeklyWorkoutPlan } = get();
        const today = new Date();
        const todayIndex = today.getDay();
        
        if (!currentWeeklyWorkoutPlan) return false;
        
        const dayPlan = currentWeeklyWorkoutPlan.days.find(day => day.dayIndex === dayIndex);
        
        if (!dayPlan || !dayPlan.isWorkoutDay || dayPlan.isCompleted) {
          return false;
        }
        
        // Can only complete workout for today
        return dayIndex === todayIndex;
      },
      
      getWorkoutTypesForWeek: () => {
        const { currentWeeklyWorkoutPlan } = get();
        const workoutTypes: { [key: number]: string } = {};
        
        if (currentWeeklyWorkoutPlan) {
          currentWeeklyWorkoutPlan.days.forEach(day => {
            if (day.isWorkoutDay && day.workoutType) {
              workoutTypes[day.dayIndex] = day.workoutType;
            }
          });
        }
        
        return workoutTypes;
      },
      
      // Enhanced methods for mid-week plan changes
      preserveCompletionStatus: (originalPlan, newPlan) => {
        const today = new Date();
        const todayIndex = today.getDay();
        
        const preservedDays = newPlan.days.map(newDay => {
          const originalDay = originalPlan.days.find(d => d.dayIndex === newDay.dayIndex);
          
          // For past days and current day, preserve completion status and original requirements
          if (newDay.dayIndex <= todayIndex && originalDay) {
            return {
              ...newDay,
              isCompleted: originalDay.isCompleted,
              completedAt: originalDay.completedAt,
              // CRITICAL: Never change original requirements for past/current days
              originalIsWorkoutDay: originalDay.originalIsWorkoutDay !== undefined ? originalDay.originalIsWorkoutDay : originalDay.isWorkoutDay,
              originalWorkoutType: originalDay.originalWorkoutType !== undefined ? originalDay.originalWorkoutType : originalDay.workoutType,
            };
          }
          
          // For future days, update original requirements
          return {
            ...newDay,
            originalIsWorkoutDay: newDay.isWorkoutDay,
            originalWorkoutType: newDay.workoutType,
          };
        });
        
        return {
          ...newPlan,
          days: preservedDays,
          originalDays: originalPlan.originalDays || originalPlan.days,
        };
      },
      
      getOriginalPlanForStreak: () => {
        const { currentWeeklyWorkoutPlan } = get();
        
        if (!currentWeeklyWorkoutPlan) return null;
        
        // If plan has been modified, use original days for streak calculation
        if (currentWeeklyWorkoutPlan.isModified && currentWeeklyWorkoutPlan.originalDays) {
          return {
            ...currentWeeklyWorkoutPlan,
            days: currentWeeklyWorkoutPlan.originalDays.map(originalDay => {
              // Find the current day to get completion status
              const currentDay = currentWeeklyWorkoutPlan.days.find(d => d.dayIndex === originalDay.dayIndex);
              return {
                ...originalDay,
                isCompleted: currentDay?.isCompleted || false,
                completedAt: currentDay?.completedAt,
                originalIsWorkoutDay: originalDay.isWorkoutDay,
                originalWorkoutType: originalDay.workoutType,
              };
            })
          };
        }
        
        // If not modified, use current plan
        return currentWeeklyWorkoutPlan;
      },
      
      isPlanActuallyModified: () => {
        const { currentWeeklyWorkoutPlan } = get();
        
        if (!currentWeeklyWorkoutPlan || !currentWeeklyWorkoutPlan.originalDays) {
          return false;
        }
        
        // Use the improved comparison function that checks against the true original
        return isPlanDifferentFromTrueOriginal(currentWeeklyWorkoutPlan);
      },
      
      isCurrentPlanSameAsOriginal: () => {
        const { currentWeeklyWorkoutPlan } = get();
        
        if (!currentWeeklyWorkoutPlan) return true;
        
        return isCurrentPlanSameAsOriginal(currentWeeklyWorkoutPlan);
      },
      
      checkAndUpdateModificationStatus: () => {
        const { isPlanActuallyModified, isCurrentPlanSameAsOriginal } = get();
        
        set(state => {
          if (!state.currentWeeklyWorkoutPlan) return state;
          
          const actuallyModified = isPlanActuallyModified();
          const sameAsOriginal = isCurrentPlanSameAsOriginal();
          
          // If plan is reverted to original, don't show as modified
          const shouldShowAsModified = actuallyModified && !sameAsOriginal;
          
          const updatedPlan = {
            ...state.currentWeeklyWorkoutPlan,
            isModified: shouldShowAsModified,
            modifiedAt: shouldShowAsModified ? (state.currentWeeklyWorkoutPlan.modifiedAt || new Date().toISOString()) : undefined,
          };
          
          // Update in weeklyPlans array as well
          const updatedPlans = state.weeklyPlans.map(plan => 
            plan.id === updatedPlan.id ? updatedPlan : plan
          );
          
          return {
            currentWeeklyWorkoutPlan: updatedPlan,
            weeklyPlans: updatedPlans
          };
        });
      },
    }),
    {
      name: 'weekly-workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Ensure we have a weekly plan for the current week
            setTimeout(() => {
              const { resetWeekIfNeeded, createWeeklyWorkoutPlan, getCurrentWeekPlan, checkAndUpdateModificationStatus } = state;
              resetWeekIfNeeded();
              if (!getCurrentWeekPlan()) {
                createWeeklyWorkoutPlan();
              }
              // Check modification status on rehydration
              checkAndUpdateModificationStatus();
            }, 0);
          }
        };
      }
    }
  )
);