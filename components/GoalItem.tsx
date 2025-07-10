import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Clock, Trash2 } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { Goal } from '@/types';
import { ProgressBar } from './ProgressBar';

interface GoalItemProps {
  goal: Goal;
  onPress: () => void;
  onDelete: () => void;
}

export const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  onPress,
  onDelete
}) => {
  const colors = useColors();
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No target date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressColor = () => {
    if (goal.completed) return colors.success;
    if (goal.progress < 30) return colors.danger;
    if (goal.progress < 70) return colors.warning;
    return colors.primary;
  };

  const getTypeColor = () => {
    return goal.type === 'short-term' ? colors.goalTypes.shortTerm : colors.goalTypes.longTerm;
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
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
        goal.completed && { borderLeftWidth: 4, borderLeftColor: colors.success }
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.typeTag, { backgroundColor: getTypeColor() }]}>
          <Text style={[styles.typeText, { color: 'white' }]}>
            {goal.type === 'short-term' ? 'Short Term' : 'Long Term'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Trash2 size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {goal.title}
      </Text>
      
      {goal.description && (
        <Text style={[styles.description, { color: colors.text.secondary }]} numberOfLines={2}>
          {goal.description}
        </Text>
      )}
      
      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={goal.progress} 
          color={getProgressColor()}
          showPercentage={true}
        />
      </View>
      
      {goal.targetDate && (
        <View style={styles.deadline}>
          <Clock size={14} color={colors.text.secondary} />
          <Text style={[styles.deadlineText, { color: colors.text.secondary }]}>
            {formatDate(goal.targetDate)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
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
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
});