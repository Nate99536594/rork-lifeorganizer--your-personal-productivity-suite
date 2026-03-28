import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useTaskStore } from '@/store/taskStore';

interface DailyTaskProgressProps {
  testId?: string;
}

export const DailyTaskProgress: React.FC<DailyTaskProgressProps> = ({ testId }) => {
  const colors = useColors();
  const { getGeneralTasks } = useTaskStore();
  
  const generalTasks = getGeneralTasks();
  const completedTasks = generalTasks.filter(task => task.completed);
  const totalTasks = generalTasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  
  if (totalTasks === 0) {
    return null;
  }
  
  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background.primary }]} 
      testID={testId}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <CheckCircle size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
            Today's Progress
          </Text>
        </View>
        <Text style={[styles.stats, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
          {completedTasks.length}/{totalTasks} tasks
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: completionPercentage === 100 ? colors.success : colors.primary,
                width: `${completionPercentage}%` 
              }
            ]} 
          />
        </View>
        <Text style={[styles.percentage, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
          {Math.round(completionPercentage)}% complete
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    gap: 8,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});