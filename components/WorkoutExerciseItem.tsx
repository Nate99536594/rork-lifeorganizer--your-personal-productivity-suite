import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { WorkoutExercise } from '@/types';

interface WorkoutExerciseItemProps {
  exercise: WorkoutExercise;
  onEdit: () => void;
  onDelete: () => void;
}

export const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
  exercise,
  onEdit,
  onDelete
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>{exercise.name}</Text>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>
            {exercise.sets} sets × {exercise.reps} reps
          </Text>
          
          {exercise.weight && (
            <Text style={styles.detailText}>
              {exercise.weight} lbs
            </Text>
          )}
        </View>
        
        {exercise.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {exercise.notes}
          </Text>
        )}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 12,
  },
  notes: {
    fontSize: 12,
    color: colors.text.light,
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 4,
    marginBottom: 8,
  },
});