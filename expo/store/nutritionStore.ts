import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionEntry, DailyNutritionLog } from '@/types';

interface PreviousMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  firstLoggedDate: string;
  lastUsedDate: string;
  timesUsed: number;
  meals: Array<{
    id: string;
    name: string;
    foodItems: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  }>;
}

interface NutritionState {
  entries: NutritionEntry[];
  previousMeals: PreviousMeal[];
  dailyNutritionLogs: DailyNutritionLog[];
  lastResetDate: string;
  addEntry: (entry: Omit<NutritionEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<NutritionEntry>) => void;
  deleteEntry: (id: string) => void;
  addFromPreviousMeal: (mealId: string) => void;
  checkAndResetDaily: () => void;
  getDailyNutritionLogs: () => DailyNutritionLog[];
  getPreviousMealsByType: (mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack') => PreviousMeal[];
  searchPreviousMeals: (query: string) => PreviousMeal[];
  cleanupOldLogs: () => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      entries: [],
      previousMeals: [],
      dailyNutritionLogs: [],
      lastResetDate: new Date().toISOString().split('T')[0],
      
      cleanupOldLogs: () => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];
        
        set((state) => ({
          dailyNutritionLogs: state.dailyNutritionLogs.filter(log => log.date >= cutoffDate)
        }));
      },
      
      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastResetDate, entries } = get();
        
        // Clean up old logs first
        get().cleanupOldLogs();
        
        if (lastResetDate !== today && entries.length > 0) {
          // Save current day's entries to daily log
          const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
          const totalProtein = entries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
          const totalCarbs = entries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
          const totalFat = entries.reduce((sum, entry) => sum + (entry.fat || 0), 0);
          
          const dailyLog: DailyNutritionLog = {
            id: Date.now().toString(),
            date: lastResetDate,
            entries: [...entries],
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat
          };
          
          set((state) => ({
            dailyNutritionLogs: [dailyLog, ...state.dailyNutritionLogs],
            entries: [],
            lastResetDate: today
          }));
        } else if (lastResetDate !== today) {
          // Just update the date if no entries
          set({ lastResetDate: today });
        }
      },
      
      addEntry: (entry) => {
        get().checkAndResetDaily();
        
        const newEntry = { ...entry, id: Date.now().toString() };
        
        // Add to current entries
        set((state) => ({
          entries: [...state.entries, newEntry]
        }));
        
        // Add or update in previous meals
        const { previousMeals } = get();
        const entryName = entry.foodName;
        const existingMealIndex = previousMeals.findIndex(meal => 
          meal.name.toLowerCase() === entryName.toLowerCase() &&
          meal.mealType === entry.mealType
        );
        
        if (existingMealIndex >= 0) {
          // Update existing meal
          set((state) => ({
            previousMeals: state.previousMeals.map((meal, index) => 
              index === existingMealIndex 
                ? {
                    ...meal,
                    lastUsedDate: new Date().toISOString(),
                    timesUsed: meal.timesUsed + 1,
                    calories: entry.calories,
                    protein: entry.protein || 0,
                    carbs: entry.carbs || 0,
                    fat: entry.fat || 0,
                    meals: entry.meals || meal.meals
                  }
                : meal
            )
          }));
        } else {
          // Add new meal to previous meals
          const newPreviousMeal: PreviousMeal = {
            id: Date.now().toString() + '_meal',
            name: entryName,
            calories: entry.calories,
            protein: entry.protein || 0,
            carbs: entry.carbs || 0,
            fat: entry.fat || 0,
            mealType: entry.mealType,
            firstLoggedDate: new Date().toISOString(),
            lastUsedDate: new Date().toISOString(),
            timesUsed: 1,
            meals: entry.meals || []
          };
          
          set((state) => ({
            previousMeals: [...state.previousMeals, newPreviousMeal]
          }));
        }
      },
      
      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map(entry => 
            entry.id === id ? { ...entry, ...updates } : entry
          )
        }));
      },
      
      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter(entry => entry.id !== id)
        }));
      },
      
      addFromPreviousMeal: (mealId) => {
        get().checkAndResetDaily();
        
        const { previousMeals } = get();
        const previousMeal = previousMeals.find(meal => meal.id === mealId);
        
        if (previousMeal) {
          const newEntry: NutritionEntry = {
            id: Date.now().toString(),
            foodName: previousMeal.name,
            calories: previousMeal.calories,
            protein: previousMeal.protein,
            carbs: previousMeal.carbs,
            fat: previousMeal.fat,
            mealType: previousMeal.mealType,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            meals: previousMeal.meals
          };
          
          // Add to current entries
          set((state) => ({
            entries: [...state.entries, newEntry]
          }));
          
          // Update usage stats for the previous meal
          set((state) => ({
            previousMeals: state.previousMeals.map(meal => 
              meal.id === mealId 
                ? {
                    ...meal,
                    lastUsedDate: new Date().toISOString(),
                    timesUsed: meal.timesUsed + 1
                  }
                : meal
            )
          }));
        }
      },
      
      getDailyNutritionLogs: () => {
        const { dailyNutritionLogs } = get();
        return dailyNutritionLogs.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      
      getPreviousMealsByType: (mealType) => {
        const { previousMeals } = get();
        const filtered = mealType 
          ? previousMeals.filter(meal => meal.mealType === mealType)
          : previousMeals;
        
        return filtered.sort((a, b) => {
          // Sort by most recently used, then by most used
          const dateA = new Date(a.lastUsedDate).getTime();
          const dateB = new Date(b.lastUsedDate).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return b.timesUsed - a.timesUsed;
        });
      },
      
      searchPreviousMeals: (query) => {
        const { previousMeals } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return previousMeals
          .filter(meal => 
            meal.name.toLowerCase().includes(lowercaseQuery) ||
            meal.meals.some(m => 
              m.name.toLowerCase().includes(lowercaseQuery) ||
              m.foodItems.some(item => item.name.toLowerCase().includes(lowercaseQuery))
            )
          )
          .sort((a, b) => {
            // Sort by most recently used, then by most used
            const dateA = new Date(a.lastUsedDate).getTime();
            const dateB = new Date(b.lastUsedDate).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return b.timesUsed - a.timesUsed;
          });
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);