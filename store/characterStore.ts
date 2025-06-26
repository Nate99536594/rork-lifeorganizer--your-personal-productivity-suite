import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from '@/types';

interface CharacterState {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  resetCharacter: () => void;
}

const defaultCharacter: Character = {
  id: 'default',
  skinTone: 'light', // Changed from 'gray' to 'light' as default
  hairColor: 'black',
  hairStyle: 'short',
  eyeColor: 'brown',
  outfit: 'casual',
  clothingColor: 'blue',
  accessories: [],
};

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      character: defaultCharacter,
      
      updateCharacter: (updates) =>
        set((state) => ({
          character: { ...state.character, ...updates },
        })),
      
      resetCharacter: () =>
        set({ character: defaultCharacter }),
    }),
    {
      name: 'character-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);