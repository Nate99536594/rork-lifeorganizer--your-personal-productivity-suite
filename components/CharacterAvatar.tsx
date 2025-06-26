import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Character } from '@/types';
import { characterColors } from '@/constants/colors';

interface CharacterAvatarProps {
  character: Character;
  size?: number;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ 
  character, 
  size = 40 
}) => {
  const getSkinColor = () => {
    // Safely access the skin tone with fallback
    if (!character || !character.skinTone) {
      return '#E5C298'; // Default medium skin tone
    }
    
    // Make sure characterColors exists and has a skin property that is an array
    if (!characterColors || !characterColors.skin || !Array.isArray(characterColors.skin)) {
      return '#E5C298'; // Default medium skin tone
    }
    
    // Use find with null check and provide a fallback
    const skinColor = characterColors.skin.find(s => s && s.id === character.skinTone);
    return skinColor?.value || '#E5C298'; // Default medium skin tone
  };

  const getClothingColor = () => {
    // Safely access the clothing color with fallback
    if (!character || !character.clothingColor) {
      return '#2563EB'; // Default blue
    }
    
    // Make sure characterColors exists and has a clothing property that is an array
    if (!characterColors || !characterColors.clothing || !Array.isArray(characterColors.clothing)) {
      return '#2563EB'; // Default blue
    }
    
    // Use find with null check and provide a fallback
    const clothingColor = characterColors.clothing.find(c => c && c.id === character.clothingColor);
    return clothingColor?.value || '#2563EB'; // Default blue
  };
  
  // Calculate sizes with padding for the circular background
  const backgroundSize = size;
  const characterSize = size * 0.75; // Make character smaller to fit nicely in circle
  const headSize = characterSize * 0.55;
  const torsoWidth = characterSize * 0.7;
  const torsoHeight = characterSize * 0.45;
  const topPadding = size * 0.15; // Space between top of circle and top of head
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Circular Background - Gray slightly lighter than dark mode gray */}
      <View
        style={[
          styles.background,
          {
            width: backgroundSize,
            height: backgroundSize,
            borderRadius: backgroundSize / 2,
            backgroundColor: '#3A3A3C', // Gray slightly lighter than dark mode gray
          },
        ]}
      />
      
      {/* Character Container */}
      <View style={[styles.characterContainer, { paddingTop: topPadding }]}>
        {/* Head - Perfect Circle */}
        <View
          style={[
            styles.head,
            {
              width: headSize,
              height: headSize,
              backgroundColor: getSkinColor(),
              borderRadius: headSize / 2,
            },
          ]}
        />
        
        {/* Torso - Rounded rectangle that fits within the circle */}
        <View
          style={[
            styles.torso,
            {
              width: torsoWidth,
              height: torsoHeight,
              backgroundColor: getClothingColor(),
              borderTopLeftRadius: torsoWidth / 2,
              borderTopRightRadius: torsoWidth / 2,
              borderBottomLeftRadius: torsoHeight * 0.4,
              borderBottomRightRadius: torsoHeight * 0.4,
              marginTop: -headSize * 0.08,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  head: {
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  torso: {
    zIndex: 1,
  },
});