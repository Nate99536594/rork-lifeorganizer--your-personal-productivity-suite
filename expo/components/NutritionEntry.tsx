import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Trash2, Edit2 } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { NutritionEntry as NutritionEntryType } from '@/types';

interface NutritionEntryProps {
  entry: NutritionEntryType;
  onPress: () => void;
  onDelete: () => void;
}

export const NutritionEntry: React.FC<NutritionEntryProps> = ({
  entry,
  onPress,
  onDelete
}) => {
  const colors = useColors();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMealTypeColor = () => {
    switch (entry.mealType) {
      case 'breakfast':
        return '#FFC107'; // Amber
      case 'lunch':
        return '#4CAF50'; // Green
      case 'dinner':
        return '#3F51B5'; // Indigo
      case 'snack':
        return '#9C27B0'; // Purple
      default:
        return colors.text.secondary;
    }
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    onDelete();
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.background.primary }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.dateText, { color: colors.text.secondary }]}>
            {formatDate(entry.date)}
          </Text>
          <View style={[styles.mealTypeTag, { backgroundColor: getMealTypeColor() }]}>
            <Text style={styles.mealTypeText}>
              {entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <Edit2 size={16} color={colors.primary} style={styles.editIcon} />
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Trash2 size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[styles.name, { color: colors.text.primary }]}>{entry.foodName}</Text>
      
      <View style={styles.nutritionInfo}>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{entry.calories}</Text>
          <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>calories</Text>
        </View>
        
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{entry.protein || 0}g</Text>
          <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>protein</Text>
        </View>
        
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{entry.carbs || 0}g</Text>
          <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>carbs</Text>
        </View>
        
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{entry.fat || 0}g</Text>
          <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>fat</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mealTypeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
  },
  editIcon: {
    marginRight: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
});