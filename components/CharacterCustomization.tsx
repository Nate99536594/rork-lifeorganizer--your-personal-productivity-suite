import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { X, Palette, Shirt } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useCharacterStore } from '@/store/characterStore';
import { CharacterAvatar } from './CharacterAvatar';
import { characterColors } from '@/constants/colors';

interface CharacterCustomizationProps {
  onClose: () => void;
}

export const CharacterCustomization: React.FC<CharacterCustomizationProps> = ({ onClose }) => {
  const colors = useColors();
  const { character, updateCharacter } = useCharacterStore();

  const renderSkinToneSelection = () => {
    // Filter out grey from selectable options
    const selectableSkinTones = characterColors.skin.filter(color => color.id !== 'gray');
    
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: colors.fonts.semiBold }]}>Skin Tone</Text>
        <View style={styles.colorGrid}>
          {selectableSkinTones.map((color) => (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.colorOption,
                { 
                  backgroundColor: color.value,
                  borderColor: character.skinTone === color.id ? colors.primary : colors.border,
                  borderWidth: character.skinTone === color.id ? 3 : 1,
                }
              ]}
              onPress={() => updateCharacter({ skinTone: color.id })}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderClothingColorSelection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: colors.fonts.semiBold }]}>Clothing Color</Text>
      <View style={styles.colorGrid}>
        {characterColors.clothing.map((color) => (
          <TouchableOpacity
            key={color.id}
            style={[
              styles.colorOption,
              { 
                backgroundColor: color.value,
                borderColor: character.clothingColor === color.id ? colors.primary : colors.border,
                borderWidth: character.clothingColor === color.id ? 3 : 1,
              }
            ]}
            onPress={() => updateCharacter({ clothingColor: color.id })}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text.primary, fontFamily: colors.fonts.semiBold }]}>Customize Character</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        <CharacterAvatar character={character} size={120} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Palette size={20} color={colors.primary} />
          <Text style={[styles.sectionHeaderText, { color: colors.primary, fontFamily: colors.fonts.semiBold }]}>
            Appearance
          </Text>
        </View>
        {renderSkinToneSelection()}
        
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Shirt size={20} color={colors.secondary} />
          <Text style={[styles.sectionHeaderText, { color: colors.secondary, fontFamily: colors.fonts.semiBold }]}>
            Clothing
          </Text>
        </View>
        {renderClothingColorSelection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    marginTop: 20,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
});