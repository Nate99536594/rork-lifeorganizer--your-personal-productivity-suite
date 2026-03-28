import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { X, Save, Calendar, Settings } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useWeeklyWorkoutStore } from '@/store/weeklyWorkoutStore';
import { WeeklyPlan, DayPlan } from '@/types';
import { Button } from './Button';

interface WeeklyPlanEditorProps {
  visible: boolean;
  onClose: () => void;
}

export const WeeklyPlanEditor: React.FC<WeeklyPlanEditorProps> = ({
  visible,
  onClose
}) => {
  const colors = useColors();
  const { 
    getCurrentWeekPlan, 
    updateDayPlan, 
    validateWeeklyPlan,
    preserveCompletionStatus,
    checkAndUpdateModificationStatus
  } = useWeeklyWorkoutStore();
  
  const [editingPlan, setEditingPlan] = useState<WeeklyPlan | null>(null);
  
  useEffect(() => {
    if (visible) {
      const currentPlan = getCurrentWeekPlan();
      if (currentPlan) {
        setEditingPlan({ ...currentPlan });
      }
    }
  }, [visible]);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const handleToggleWorkoutDay = (dayIndex: number) => {
    if (!editingPlan) return;
    
    const today = new Date();
    const todayIndex = today.getDay();
    
    const updatedDays = editingPlan.days.map(day => {
      if (day.dayIndex === dayIndex) {
        const isWorkoutDay = !day.isWorkoutDay;
        
        // For past days and current day, preserve completion status and original requirements
        if (dayIndex <= todayIndex) {
          return {
            ...day,
            isWorkoutDay,
            workoutType: isWorkoutDay ? (day.workoutType || 'Strength Training') : undefined,
            customWorkoutName: undefined,
            // Keep original plan state for streak calculation
            originalIsWorkoutDay: day.originalIsWorkoutDay !== undefined ? day.originalIsWorkoutDay : day.isWorkoutDay,
            originalWorkoutType: day.originalWorkoutType !== undefined ? day.originalWorkoutType : day.workoutType,
          };
        } else {
          // For future days, we can update both current and original state
          return {
            ...day,
            isWorkoutDay,
            workoutType: isWorkoutDay ? 'Strength Training' : undefined,
            customWorkoutName: undefined,
            originalIsWorkoutDay: isWorkoutDay,
            originalWorkoutType: isWorkoutDay ? 'Strength Training' : undefined,
          };
        }
      }
      return day;
    });
    
    setEditingPlan({
      ...editingPlan,
      days: updatedDays
    });
  };
  
  const handleUpdateWorkoutType = (dayIndex: number, workoutType: string) => {
    if (!editingPlan) return;
    
    const today = new Date();
    const todayIndex = today.getDay();
    
    const updatedDays = editingPlan.days.map(day => {
      if (day.dayIndex === dayIndex) {
        const updatedDay = {
          ...day,
          workoutType: workoutType.trim() || undefined,
          customWorkoutName: undefined,
        };
        
        // For future days, also update original workout type
        if (dayIndex > todayIndex) {
          updatedDay.originalWorkoutType = workoutType.trim() || undefined;
        }
        
        return updatedDay;
      }
      return day;
    });
    
    setEditingPlan({
      ...editingPlan,
      days: updatedDays
    });
  };
  
  const handleSave = () => {
    if (!editingPlan) return;
    
    const validation = validateWeeklyPlan(editingPlan);
    if (!validation.isValid) {
      Alert.alert('Invalid Plan', validation.error);
      return;
    }
    
    // Get the current plan to preserve completion status
    const currentPlan = getCurrentWeekPlan();
    if (currentPlan) {
      const preservedPlan = preserveCompletionStatus(currentPlan, editingPlan);
      
      // Update each day individually
      preservedPlan.days.forEach(day => {
        updateDayPlan(day.dayIndex, {
          isWorkoutDay: day.isWorkoutDay,
          workoutType: day.workoutType,
          customWorkoutName: day.customWorkoutName,
          // Don't override completion status - it's preserved in the store
        });
      });
      
      // Check and update modification status after all updates
      setTimeout(() => {
        checkAndUpdateModificationStatus();
      }, 100);
    }
    
    // Close the modal without showing success popup
    onClose();
  };
  
  const getWorkoutDaysCount = () => {
    if (!editingPlan) return 0;
    return editingPlan.days.filter(day => day.isWorkoutDay).length;
  };
  
  const getRestDaysCount = () => {
    if (!editingPlan) return 0;
    return editingPlan.days.filter(day => !day.isWorkoutDay).length;
  };
  
  if (!editingPlan) {
    return null;
  }
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Edit Weekly Plan
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {getWorkoutDaysCount()}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                  Workout Days
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text.secondary }]}>
                  {getRestDaysCount()}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                  Rest Days
                </Text>
              </View>
            </View>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {editingPlan.days.map((day, index) => (
              <View key={day.dayIndex} style={[styles.dayCard, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayName, { color: colors.text.primary }]}>
                    {dayNames[day.dayIndex]}
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      { 
                        backgroundColor: day.isWorkoutDay ? colors.success : colors.background.primary,
                        borderColor: day.isWorkoutDay ? colors.success : colors.border
                      }
                    ]}
                    onPress={() => handleToggleWorkoutDay(day.dayIndex)}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      { color: day.isWorkoutDay ? 'white' : colors.text.secondary }
                    ]}>
                      {day.isWorkoutDay ? 'Workout' : 'Rest'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {day.isWorkoutDay && (
                  <View style={styles.workoutTypeSection}>
                    <Text style={[styles.workoutTypeLabel, { color: colors.text.secondary }]}>
                      Workout Type:
                    </Text>
                    
                    <TextInput
                      style={[styles.workoutTypeInput, { 
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border,
                        color: colors.text.primary
                      }]}
                      value={day.workoutType || ''}
                      onChangeText={(text) => handleUpdateWorkoutType(day.dayIndex, text)}
                      placeholder="e.g., Strength Training, Cardio, Yoga"
                      placeholderTextColor={colors.text.light}
                    />
                  </View>
                )}
                
                {/* Show completion status for past/current days */}
                {day.isCompleted && (
                  <View style={[styles.completedBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.completedText, { color: colors.success }]}>
                      ✓ Completed
                    </Text>
                  </View>
                )}
                
                {/* Show if this day's requirements were modified for streak calculation */}
                {day.originalIsWorkoutDay !== undefined && 
                 day.originalIsWorkoutDay !== day.isWorkoutDay && 
                 day.dayIndex <= new Date().getDay() && (
                  <View style={[styles.modifiedBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.modifiedText, { color: colors.warning }]}>
                      Modified (streak uses original: {day.originalIsWorkoutDay ? 'Workout' : 'Rest'})
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Save Plan"
              onPress={handleSave}
              icon={<Save size={18} color="white" />}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalBody: {
    maxHeight: 400,
  },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  workoutTypeSection: {
    marginTop: 8,
  },
  workoutTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  workoutTypeInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  completedBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modifiedBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  modifiedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalFooter: {
    marginTop: 20,
  },
  saveButton: {
    marginBottom: 10,
  },
});