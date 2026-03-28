import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SharedTodoList, TodoListShare } from '@/types';
import { useColors } from '@/hooks/useColors';
import { 
  CheckCircle, 
  Circle, 
  Calendar, 
  User, 
  Eye, 
  X,
  Check,
  Clock
} from 'lucide-react-native';

interface SharedTodoListItemProps {
  sharedList?: SharedTodoList;
  shareRequest?: TodoListShare;
  onAccept?: (shareId: string) => void;
  onDecline?: (shareId: string) => void;
  onUnshare?: (listId: string) => void;
  onView?: (listId: string) => void;
}

export function SharedTodoListItem({ 
  sharedList, 
  shareRequest, 
  onAccept, 
  onDecline, 
  onUnshare, 
  onView 
}: SharedTodoListItemProps) {
  const colors = useColors();
  
  if (shareRequest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {shareRequest.listTitle}
            </Text>
            <View style={styles.fromSection}>
              <User size={14} color={colors.text.secondary} />
              <Text style={[styles.fromText, { color: colors.text.secondary }]}>
                from {shareRequest.ownerName}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
            <Clock size={12} color={colors.warning} />
            <Text style={[styles.statusText, { color: colors.warning }]}>
              Pending
            </Text>
          </View>
        </View>
        
        {shareRequest.message && (
          <Text style={[styles.message, { color: colors.text.secondary }]}>
            {shareRequest.message}
          </Text>
        )}
        
        <View style={styles.dateSection}>
          <Calendar size={12} color={colors.text.light} />
          <Text style={[styles.dateText, { color: colors.text.light }]}>
            Shared {new Date(shareRequest.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={() => onAccept?.(shareRequest.id)}
          >
            <Check size={16} color="white" />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton, { borderColor: colors.error }]}
            onPress={() => onDecline?.(shareRequest.id)}
          >
            <X size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (sharedList) {
    const completedTasks = sharedList.tasks.filter(task => task.completed).length;
    const totalTasks = sharedList.tasks.length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {sharedList.title}
            </Text>
            <View style={styles.fromSection}>
              <User size={14} color={colors.text.secondary} />
              <Text style={[styles.fromText, { color: colors.text.secondary }]}>
                by {sharedList.ownerName}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
            <Eye size={12} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>
              Shared
            </Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {completedTasks} of {totalTasks} tasks completed
            </Text>
            <Text style={[styles.progressPercentage, { color: colors.primary }]}>
              {Math.round(completionPercentage)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.primary,
                  width: `${completionPercentage}%`
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.taskPreview}>
          {sharedList.tasks.slice(0, 3).map((task, index) => (
            <View key={task.id} style={styles.taskItem}>
              {task.completed ? (
                <CheckCircle size={16} color={colors.success} />
              ) : (
                <Circle size={16} color={colors.text.light} />
              )}
              <Text 
                style={[
                  styles.taskTitle, 
                  { color: task.completed ? colors.text.secondary : colors.text.primary },
                  task.completed && styles.completedTask
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
            </View>
          ))}
          {sharedList.tasks.length > 3 && (
            <Text style={[styles.moreTasksText, { color: colors.text.light }]}>
              +{sharedList.tasks.length - 3} more tasks
            </Text>
          )}
        </View>
        
        <View style={styles.dateSection}>
          <Calendar size={12} color={colors.text.light} />
          <Text style={[styles.dateText, { color: colors.text.light }]}>
            Last updated {new Date(sharedList.lastUpdated).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={() => onView?.(sharedList.id)}
          >
            <Eye size={16} color="white" />
            <Text style={styles.actionButtonText}>View List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.unshareButton, { borderColor: colors.text.light }]}
            onPress={() => onUnshare?.(sharedList.id)}
          >
            <X size={16} color={colors.text.secondary} />
            <Text style={[styles.actionButtonText, { color: colors.text.secondary }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fromSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fromText: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  taskPreview: {
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 14,
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
  },
  moreTasksText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 24,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    // backgroundColor set via props
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  viewButton: {
    // backgroundColor set via props
  },
  unshareButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});