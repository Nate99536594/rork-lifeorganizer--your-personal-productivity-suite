import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Clock, AlertCircle } from 'lucide-react-native';
import { Task } from '@/types';
import { useColors } from '@/hooks/useColors';
import { useTaskStore } from '@/store/taskStore';
import { useActivityFeedStore } from '@/store/activityFeedStore';
import { useAuthStore } from '@/store/authStore';

interface TaskItemProps {
  task: Task;
  onPress?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
}

export function TaskItem({ task, onPress, onToggle, onDelete }: TaskItemProps) {
  const colors = useColors();
  const toggleComplete = useTaskStore(state => state.toggleComplete);
  const addActivity = useActivityFeedStore(state => state.addActivity);
  const user = useAuthStore(state => state.user);
  const { getGeneralTasks } = useTaskStore();

  const handleToggleComplete = () => {
    const wasCompleted = task.completed;
    if (onToggle) {
      onToggle();
    } else {
      toggleComplete(task.id);
    }
    
    // Add activity to feed when completing a general task (only general tasks count for streaks and activities)
    if (!wasCompleted && user && !task.projectId) {
      const today = new Date().toISOString().split('T')[0];
      const generalTasks = getGeneralTasks();
      const completedToday = generalTasks.filter(t => 
        t.completed && 
        new Date(t.createdAt).toISOString().split('T')[0] === today
      ).length;
      
      const isPublic = user.privacySettings?.accountVisibility === 'public';
      const userName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
      const timestamp = new Date().toISOString();
      
      // If this is the 5th general task completed today, create a milestone activity
      if (completedToday === 4) {
        addActivity({
          userId: user.id,
          userName,
          activityType: 'task',
          description: 'completed 5 tasks today',
          isPublic,
          timestamp
        });
      }
      
      // For high priority general tasks, always create an activity
      if (task.priority === 'high') {
        addActivity({
          userId: user.id,
          userName,
          activityType: 'task',
          description: `completed "${task.title}"`,
          isPublic,
          timestamp
        });
      }
    }
  };

  const getPriorityIcon = () => {
    switch (task.priority) {
      case 'high':
        return <AlertCircle size={16} color={colors.danger} />;
      case 'medium':
        return <Clock size={16} color={colors.warning} />;
      default:
        return null;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      default:
        return colors.text.light;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.background.secondary }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <TouchableOpacity 
        style={[
          styles.checkbox, 
          { 
            borderColor: task.completed ? colors.primary : colors.border,
            backgroundColor: task.completed ? colors.primary : 'transparent'
          }
        ]}
        onPress={handleToggleComplete}
      >
        {task.completed && <Check size={16} color={colors.background.primary} />}
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text 
            style={[
              styles.title, 
              { 
                color: task.completed ? colors.text.light : colors.text.primary,
                textDecorationLine: task.completed ? 'line-through' : 'none'
              }
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {getPriorityIcon()}
        </View>
        
        {task.description && (
          <Text 
            style={[styles.description, { color: colors.text.light }]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}
        
        {task.dueDate && (
          <Text 
            style={[
              styles.dueDate, 
              { 
                color: isOverdue ? colors.danger : colors.text.light 
              }
            ]}
          >
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </Text>
        )}
        
        {task.notes && (
          <Text 
            style={[styles.notes, { color: colors.text.light }]}
            numberOfLines={1}
          >
            {task.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});