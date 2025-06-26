import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacySettings, User } from '@/types';
import { validateUsername, logRejectedUsername } from '@/utils/usernameFilter';
import { useAchievementStore } from './achievementStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  existingUsernames: string[];
  existingAnonymousUsernames: string[];
  login: (email: string, password: string) => Promise<void>;
  signUp: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updatePrivacySettings: (settings: PrivacySettings) => void;
  switchUsernameType: (type: 'real' | 'anonymous') => void;
  upgradeToPremium: () => Promise<void>;
  logout: () => void;
  generateUniqueUsername: (firstName: string, lastName: string) => Promise<{ username: string; error?: string }>;
  generateUniqueAnonymousUsername: () => string;
  validateAndCheckUsername: (username: string) => Promise<{ isValid: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      existingUsernames: ['johndoe', 'janesmith', 'testuser'],
      existingAnonymousUsernames: ['user123', 'player456', 'guest789'],
      
      validateAndCheckUsername: async (username: string) => {
        // First, validate against language filter
        const filterResult = validateUsername(username);
        
        if (!filterResult.isValid) {
          // Log the rejected username for admin review
          if (filterResult.matchedWords) {
            logRejectedUsername(username, filterResult.error || 'Failed validation', filterResult.matchedWords);
          }
          return {
            isValid: false,
            error: filterResult.error
          };
        }
        
        // Check if username already exists
        const { existingUsernames } = get();
        const normalizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        
        if (existingUsernames.includes(normalizedUsername)) {
          return {
            isValid: false,
            error: 'This username is already taken. Please choose a different one.'
          };
        }
        
        return { isValid: true };
      },
      
      generateUniqueUsername: async (firstName: string, lastName: string) => {
        const { existingUsernames } = get();
        
        // Remove spaces and special characters, convert to lowercase
        const baseUsername = `${firstName.trim()}${lastName.trim()}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        
        // Skip language filter for auto-generated usernames, but validate format
        const baseValidation = validateUsername(baseUsername, true);
        
        if (!baseValidation.isValid && baseUsername.length < 3) {
          // If basic validation fails due to length, try with a fallback
          const fallbackUsername = `user${Math.floor(Math.random() * 9999) + 1}`;
          set(state => ({
            existingUsernames: [...state.existingUsernames, fallbackUsername]
          }));
          return { username: fallbackUsername };
        }
        
        // For auto-generated usernames, we'll be more lenient with the language filter
        // Only check for very explicit content, not all banned words
        const explicitCheck = validateUsername(baseUsername, true);
        if (!explicitCheck.isValid && explicitCheck.severity === 'high') {
          // Only reject if it's high severity explicit content
          const fallbackUsername = `user${Math.floor(Math.random() * 9999) + 1}`;
          set(state => ({
            existingUsernames: [...state.existingUsernames, fallbackUsername]
          }));
          return { username: fallbackUsername };
        }
        
        // Check if base username exists
        if (!existingUsernames.includes(baseUsername)) {
          // Add to existing usernames to prevent future duplicates
          set(state => ({
            existingUsernames: [...state.existingUsernames, baseUsername]
          }));
          return { username: baseUsername };
        }
        
        // If base username exists, add numbers until we find a unique one
        let counter = 1;
        let candidateUsername = `${baseUsername}${counter}`;
        
        while (existingUsernames.includes(candidateUsername)) {
          counter++;
          candidateUsername = `${baseUsername}${counter}`;
          
          // Prevent infinite loop
          if (counter > 9999) {
            const fallbackUsername = `user${Math.floor(Math.random() * 9999) + 1}`;
            set(state => ({
              existingUsernames: [...state.existingUsernames, fallbackUsername]
            }));
            return { username: fallbackUsername };
          }
        }
        
        // Add to existing usernames to prevent future duplicates
        set(state => ({
          existingUsernames: [...state.existingUsernames, candidateUsername]
        }));
        
        return { username: candidateUsername };
      },
      
      generateUniqueAnonymousUsername: () => {
        const { existingAnonymousUsernames } = get();
        const prefixes = ['user', 'player', 'guest', 'member', 'buddy', 'friend'];
        
        let attempts = 0;
        let candidateUsername = '';
        
        do {
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          const number = Math.floor(Math.random() * 9999) + 1;
          candidateUsername = `${prefix}${number}`;
          attempts++;
        } while (existingAnonymousUsernames.includes(candidateUsername) && attempts < 100);
        
        // Add to existing anonymous usernames to prevent future duplicates
        set(state => ({
          existingAnonymousUsernames: [...state.existingAnonymousUsernames, candidateUsername]
        }));
        
        return candidateUsername;
      },
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { generateUniqueUsername, generateUniqueAnonymousUsername } = get();
          const usernameResult = await generateUniqueUsername('John', 'Doe');
          
          if (usernameResult.error) {
            throw new Error(usernameResult.error);
          }
          
          const anonymousUsername = generateUniqueAnonymousUsername();
          
          set({ 
            user: { 
              id: '1', 
              firstName: 'John',
              lastName: 'Doe',
              username: usernameResult.username,
              anonymousUsername,
              usernameType: 'real',
              email,
              name: 'John Doe', // Added for compatibility
              isPremium: false,
              createdAt: new Date().toISOString(),
              privacySettings: {
                accountVisibility: 'friends'
              }
            },
            isAuthenticated: true,
            isLoading: false
          });
          
          // Trigger account creation achievement
          setTimeout(() => {
            const achievementStore = useAchievementStore.getState();
            achievementStore.onAccountCreated();
            achievementStore.checkAndUnlockAchievements();
          }, 1000);
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      signUp: async (firstName, lastName, email, password) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { generateUniqueUsername, generateUniqueAnonymousUsername } = get();
          const usernameResult = await generateUniqueUsername(firstName, lastName);
          
          if (usernameResult.error) {
            set({ isLoading: false });
            throw new Error(usernameResult.error);
          }
          
          const anonymousUsername = generateUniqueAnonymousUsername();
          
          set({ 
            user: { 
              id: Date.now().toString(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              username: usernameResult.username,
              anonymousUsername,
              usernameType: 'real',
              email,
              name: `${firstName.trim()} ${lastName.trim()}`, // Added for compatibility
              isPremium: false,
              createdAt: new Date().toISOString(),
              privacySettings: {
                accountVisibility: 'friends'
              }
            },
            isAuthenticated: true,
            isLoading: false
          });
          
          // Trigger account creation achievement
          setTimeout(() => {
            const achievementStore = useAchievementStore.getState();
            achievementStore.onAccountCreated();
            achievementStore.checkAndUnlockAchievements();
          }, 1000);
        } catch (error) {
          console.error('Signup error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      signInWithApple: async () => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const email = "user@example.com";
          const { generateUniqueUsername, generateUniqueAnonymousUsername } = get();
          const usernameResult = await generateUniqueUsername('Apple', 'User');
          
          if (usernameResult.error) {
            // For social sign-in, use a more generic fallback
            const fallbackUsername = `user${Math.floor(Math.random() * 9999) + 1}`;
            const anonymousUsername = generateUniqueAnonymousUsername();
            
            set({ 
              user: { 
                id: Date.now().toString(),
                firstName: 'Apple',
                lastName: 'User',
                username: fallbackUsername,
                anonymousUsername,
                usernameType: 'real',
                email,
                name: 'Apple User', // Added for compatibility
                isPremium: false,
                createdAt: new Date().toISOString(),
                privacySettings: {
                  accountVisibility: 'friends'
                }
              },
              isAuthenticated: true,
              isLoading: false
            });
            
            // Trigger account creation achievement
            setTimeout(() => {
              const achievementStore = useAchievementStore.getState();
              achievementStore.onAccountCreated();
              achievementStore.checkAndUnlockAchievements();
            }, 1000);
            return;
          }
          
          const anonymousUsername = generateUniqueAnonymousUsername();
          
          set({ 
            user: { 
              id: Date.now().toString(),
              firstName: 'Apple',
              lastName: 'User',
              username: usernameResult.username,
              anonymousUsername,
              usernameType: 'real',
              email,
              name: 'Apple User', // Added for compatibility
              isPremium: false,
              createdAt: new Date().toISOString(),
              privacySettings: {
                accountVisibility: 'friends'
              }
            },
            isAuthenticated: true,
            isLoading: false
          });
          
          // Trigger account creation achievement
          setTimeout(() => {
            const achievementStore = useAchievementStore.getState();
            achievementStore.onAccountCreated();
            achievementStore.checkAndUnlockAchievements();
          }, 1000);
        } catch (error) {
          console.error('Apple sign in error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateProfile: async (updates) => {
        const { user, generateUniqueUsername, validateAndCheckUsername } = get();
        if (!user) {
          return { success: false, error: 'No user logged in' };
        }
        
        let updatedUser = { ...user, ...updates };
        
        // Update name field when first or last name changes
        if (updates.firstName || updates.lastName) {
          const newFirstName = updates.firstName || user.firstName;
          const newLastName = updates.lastName || user.lastName;
          updatedUser.name = `${newFirstName} ${newLastName}`;
          
          const usernameResult = await generateUniqueUsername(newFirstName, newLastName);
          
          if (usernameResult.error) {
            return { success: false, error: usernameResult.error };
          }
          
          updatedUser.username = usernameResult.username;
        }
        
        // If username is being directly updated, validate it
        if (updates.username && updates.username !== user.username) {
          const validation = await validateAndCheckUsername(updates.username);
          if (!validation.isValid) {
            return { success: false, error: validation.error };
          }
          
          // Add the new username to existing usernames
          set(state => ({
            existingUsernames: [...state.existingUsernames, updates.username!.toLowerCase().trim().replace(/[^a-z0-9]/g, '')]
          }));
        }
        
        set({ user: updatedUser });
        return { success: true };
      },
      
      updatePrivacySettings: (settings) => {
        const { user } = get();
        if (user) {
          set({
            user: { 
              ...user, 
              privacySettings: {
                ...user.privacySettings,
                ...settings
              }
            }
          });
        }
      },
      
      switchUsernameType: (type) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              usernameType: type
            }
          });
        }
      },

      upgradeToPremium: async () => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              isPremium: true
            }
          });
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);