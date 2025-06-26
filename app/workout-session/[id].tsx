import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Edit2, Save, Trash2, Plus, X, Clock, Flame } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useWorkoutSessionStore, WorkoutSession } from '@/store/workoutSessionStore';
import { Button } from '@/components/Button';

export default function WorkoutSessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { sessions, updateSession, deleteSession, getSessionById } = useWorkoutSessionStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedSession, setEditedSession] = useState<WorkoutSession | null>(null);
  
  // Find the session using the new getSessionById method for better reliability
  const session = getSessionById(id);
  
  useEffect(() => {
    if (session) {
      setEditedSession({ ...session });
    } else {
      // If session is not found, show error and go back
      console.warn(`Workout session with id ${id} not found`);
    }
  }, [session, id]);
  
  if (!session || !editedSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <Stack.Screen options={{ title: 'Workout Not Found' }} />
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text.primary }]}>
            Workout session not found
          </Text>
          <Text style={[styles.notFoundSubtext, { color: colors.text.secondary }]}>
            This workout may have been deleted or the link is invalid.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const handleSave = () => {
    if (!editedSession.duration || editedSession.duration <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }
    
    const filteredExercises = editedSession.exercises.filter(ex => ex.trim().length > 0);
    
    if (filteredExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }
    
    updateSession(session.id, {
      duration: editedSession.duration,
      exercises: filteredExercises,
      notes: editedSession.notes,
      calories: editedSession.calories,
    });
    
    setIsEditing(false);
    Alert.alert('Success', 'Workout updated successfully');
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSession(session.id);
            Alert.alert('Deleted', 'Workout deleted successfully', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };
  
  const handleAddExercise = () => {
    setEditedSession(prev => prev ? {
      ...prev,
      exercises: [...prev.exercises, '']
    } : null);
  };
  
  const handleUpdateExercise = (index: number, value: string) => {
    setEditedSession(prev => prev ? {
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? value : ex)
    } : null);
  };
  
  const handleRemoveExercise = (index: number) => {
    if (editedSession.exercises.length > 1) {
      setEditedSession(prev => prev ? {
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== index)
      } : null);
    } else {
      Alert.alert('Error', 'You must have at least one exercise');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <Stack.Screen 
        options={{ 
          title: isEditing ? 'Edit Workout' : 'Workout Details',
          headerRight: () => (
            <View style={styles.headerButtons}>
              {!isEditing ? (
                <>
                  <TouchableOpacity 
                    onPress={() => setIsEditing(true)}
                    style={styles.headerButton}
                  >
                    <Edit2 size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleDelete}
                    style={styles.headerButton}
                  >
                    <Trash2 size={20} color={colors.danger} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={handleSave}
                    style={styles.headerButton}
                  >
                    <Save size={20} color={colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      setEditedSession({ ...session });
                      setIsEditing(false);
                    }}
                    style={styles.headerButton}
                  >
                    <X size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.dateText, { color: colors.text.primary }]}>
            {formatDate(session.date)}
          </Text>
          <Text style={[styles.timeText, { color: colors.text.secondary }]}>
            {formatTime(session.date)}
          </Text>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.background.primary }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Duration</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.statInput, { 
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border,
                    color: colors.text.primary
                  }]}
                  value={editedSession.duration.toString()}
                  onChangeText={(text) => setEditedSession(prev => prev ? {
                    ...prev,
                    duration: parseInt(text) || 0
                  } : null)}
                  keyboardType="numeric"
                  placeholder="Minutes"
                  placeholderTextColor={colors.text.light}
                />
              ) : (
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {session.duration} min
                </Text>
              )}
            </View>
            
            <View style={styles.statItem}>
              <Flame size={20} color={colors.warning} />
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Calories</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.statInput, { 
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border,
                    color: colors.text.primary
                  }]}
                  value={editedSession.calories?.toString() || ''}
                  onChangeText={(text) => setEditedSession(prev => prev ? {
                    ...prev,
                    calories: text ? parseInt(text) : undefined
                  } : null)}
                  keyboardType="numeric"
                  placeholder="Calories"
                  placeholderTextColor={colors.text.light}
                />
              ) : (
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {session.calories || 0} cal
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.background.primary }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Exercises
            </Text>
            {isEditing && (
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddExercise}
              >
                <Plus size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          {editedSession.exercises.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No exercises recorded
            </Text>
          ) : (
            editedSession.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                {isEditing ? (
                  <View style={styles.exerciseEditRow}>
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
                    
                    {editedSession.exercises.length > 1 && (
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => handleRemoveExercise(index)}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.exerciseText, { color: colors.text.primary }]}>
                    • {exercise}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Notes
          </Text>
          
          {isEditing ? (
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={editedSession.notes || ''}
              onChangeText={(text) => setEditedSession(prev => prev ? {
                ...prev,
                notes: text
              } : null)}
              placeholder="Add notes about your workout..."
              placeholderTextColor={colors.text.light}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text style={[styles.notesText, { color: colors.text.secondary }]}>
              {session.notes || 'No notes added'}
            </Text>
          )}
        </View>
        
        {isEditing && (
          <View style={styles.actionButtons}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              icon={<Save size={18} color="white" />}
              style={styles.saveButton}
            />
            
            <Button
              title="Cancel"
              onPress={() => {
                setEditedSession({ ...session });
                setIsEditing(false);
              }}
              icon={<X size={18} color={colors.text.secondary} />}
              style={[styles.cancelButton, { borderColor: colors.border }]}
              textStyle={{ color: colors.text.secondary }}
              variant="outline"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundSubtext: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statInput: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    borderWidth: 1,
    minWidth: 60,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  exerciseItem: {
    marginBottom: 8,
  },
  exerciseEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInput: {
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
  },
  exerciseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  notesInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 80,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  saveButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
});