import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { Plus, X, Save, Clock, Flame, Trash2 } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useWorkoutSessionStore, WorkoutSession } from '@/store/workoutSessionStore';
import { useWeeklyWorkoutStore } from '@/store/weeklyWorkoutStore';
import { Button } from './Button';

interface WorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  editingSession?: WorkoutSession | null;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  visible,
  onClose,
  editingSession = null
}) => {
  const colors = useColors();
  const { addSession, updateSession } = useWorkoutSessionStore();
  const { updateWeeklyStreak, updateWeekProgress, getCurrentWeekPlan, completeWorkout } = useWeeklyWorkoutStore();
  
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [calories, setCalories] = useState('');
  
  // Initialize form with editing session data
  useEffect(() => {
    if (editingSession) {
      setDuration(editingSession.duration.toString());
      setExercises(editingSession.exercises.length > 0 ? editingSession.exercises : ['']);
      setNotes(editingSession.notes || '');
      setCalories(editingSession.calories?.toString() || '');
    } else {
      // Reset form for new session
      setDuration('');
      setExercises(['']);
      setNotes('');
      setCalories('');
    }
  }, [editingSession, visible]);
  
  const handleAddExercise = () => {
    setExercises([...exercises, '']);
  };
  
  const handleUpdateExercise = (index: number, value: string) => {
    const newExercises = [...exercises];
    newExercises[index] = value;
    setExercises(newExercises);
  };
  
  const handleRemoveExercise = (index: number) => {
    if (exercises.length > 1) {
      const newExercises = exercises.filter((_, i) => i !== index);
      setExercises(newExercises);
    }
  };
  
  const handleSave = () => {
    if (!duration.trim()) {
      Alert.alert('Error', 'Please enter workout duration');
      return;
    }
    
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Please enter a valid duration in minutes');
      return;
    }
    
    const filteredExercises = exercises.filter(ex => ex.trim().length > 0);
    
    const sessionData = {
      duration: durationNum,
      exercises: filteredExercises,
      notes: notes.trim(),
      calories: calories.trim() ? parseInt(calories) : undefined,
    };
    
    if (editingSession) {
      // Update existing session
      updateSession(editingSession.id, sessionData);
      Alert.alert('Success', 'Workout updated successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    } else {
      // Create new session
      const session = {
        ...sessionData,
        date: new Date().toISOString(),
      };
      
      addSession(session);
      
      // Check if today is a workout day in the weekly plan and complete it
      const currentWeekPlan = getCurrentWeekPlan();
      const today = new Date();
      const todayIndex = today.getDay();
      
      if (currentWeekPlan) {
        const todayPlan = currentWeekPlan.days.find(day => day.dayIndex === todayIndex);
        if (todayPlan?.isWorkoutDay && !todayPlan.isCompleted) {
          completeWorkout(todayIndex);
        }
      }
      
      // Explicitly update the weekly streak and progress
      updateWeeklyStreak(session.date);
      updateWeekProgress([session]);
      
      Alert.alert('Success', 'Workout logged successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    }
    
    // Reset form
    setDuration('');
    setExercises(['']);
    setNotes('');
    setCalories('');
  };
  
  const handleClose = () => {
    // Reset form when closing
    setDuration('');
    setExercises(['']);
    setNotes('');
    setCalories('');
    onClose();
  };
  
  // Get today's planned workout type if available (only for new sessions)
  const getTodaysWorkoutType = () => {
    if (editingSession) return null; // Don't show for editing
    
    const currentWeekPlan = getCurrentWeekPlan();
    const today = new Date();
    const todayIndex = today.getDay();
    
    if (currentWeekPlan) {
      const todayPlan = currentWeekPlan.days.find(day => day.dayIndex === todayIndex);
      if (todayPlan?.isWorkoutDay) {
        if (todayPlan.workoutType === 'custom' && todayPlan.customWorkoutName) {
          return todayPlan.customWorkoutName;
        } else if (todayPlan.workoutType) {
          return todayPlan.workoutType.charAt(0).toUpperCase() + todayPlan.workoutType.slice(1);
        }
      }
    }
    return null;
  };
  
  const todaysWorkoutType = getTodaysWorkoutType();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editingSession ? 'Edit Workout' : 'Log Workout'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          {todaysWorkoutType && !editingSession && (
            <View style={[styles.plannedWorkoutBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
              <Text style={[styles.plannedWorkoutText, { color: colors.primary }]}>
                Today's planned workout: {todaysWorkoutType}
              </Text>
            </View>
          )}
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                Duration (minutes) *
              </Text>
              <View style={styles.inputWithIcon}>
                <Clock size={20} color={colors.text.secondary} />
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border,
                    color: colors.text.primary
                  }]}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="e.g., 45"
                  placeholderTextColor={colors.text.light}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                Calories Burned (optional)
              </Text>
              <View style={styles.inputWithIcon}>
                <Flame size={20} color={colors.warning} />
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border,
                    color: colors.text.primary
                  }]}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="e.g., 300"
                  placeholderTextColor={colors.text.light}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.inputSection}>
              <View style={styles.exercisesHeader}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Exercises
                </Text>
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddExercise}
                >
                  <Plus size={16} color="white" />
                </TouchableOpacity>
              </View>
              
              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <TextInput
                    style={[styles.exerciseInput, { 
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border,
                      color: colors.text.primary
                    }]}
                    value={exercise}
                    onChangeText={(value) => handleUpdateExercise(index, value)}
                    placeholder={`Exercise ${index + 1}`}
                    placeholderTextColor={colors.text.light}
                  />
                  
                  {exercises.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveExercise(index)}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
            
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                Notes (optional)
              </Text>
              <TextInput
                style={[styles.notesInput, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did the workout go?"
                placeholderTextColor={colors.text.light}
                multiline
                textAlignVertical="top"
              />
            </View>
            
            <Button
              title={editingSession ? 'Update Workout' : 'Log Workout'}
              onPress={handleSave}
              icon={<Save size={18} color="white" />}
              style={styles.saveButton}
            />
          </ScrollView>
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
  plannedWorkoutBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  plannedWorkoutText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBody: {
    maxHeight: 500,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
  },
  notesInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 20,
  },
});