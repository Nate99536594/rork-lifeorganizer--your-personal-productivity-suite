import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Save, Trash2, Target, Clock } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useGoalStore } from '@/store/goalStore';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { goals, updateGoal, deleteGoal, toggleComplete, updateProgress } = useGoalStore();
  
  const goal = goals.find(g => g.id === id);
  
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [progress, setProgress] = useState(goal?.progress || 0);
  
  if (!goal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.errorText, { color: colors.text.secondary }]}>Goal not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.push("/(tabs)")} 
          style={styles.backButton}
        />
      </View>
    );
  }
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Goal title cannot be empty');
      return;
    }
    
    updateGoal(id, {
      title: title.trim(),
      description: description.trim(),
    });
    
    updateProgress(id, progress);
    
    // Navigate to home screen instead of using back
    router.push("/(tabs)");
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteGoal(id);
            router.push("/(tabs)");
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleToggleComplete = () => {
    toggleComplete(id);
    setProgress(goal.completed ? progress : 100);
    
    // Navigate to home screen after toggling
    setTimeout(() => {
      router.push("/(tabs)");
    }, 500);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No target date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getProgressColor = () => {
    if (goal.completed) return colors.success;
    if (progress < 30) return colors.danger;
    if (progress < 70) return colors.warning;
    return colors.primary;
  };

  const getTypeColor = () => {
    return goal.type === 'short-term' ? colors.goalTypes.shortTerm : colors.goalTypes.longTerm;
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.typeContainer, { backgroundColor: getTypeColor() + '20' }]}>
          {goal.type === 'short-term' ? (
            <Clock size={18} color={getTypeColor()} />
          ) : (
            <Target size={18} color={getTypeColor()} />
          )}
          <Text style={[styles.typeText, { color: getTypeColor() }]}>
            {goal.type === 'short-term' ? 'Short Term' : 'Long Term'} Goal
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Trash2 size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={[styles.titleInput, { color: colors.text.primary }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Goal title"
        placeholderTextColor={colors.text.light}
      />
      
      <View style={styles.infoContainer}>
        {goal.targetDate && (
          <View style={styles.infoItem}>
            <Calendar size={18} color={colors.text.secondary} />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>Target Date: {formatDate(goal.targetDate)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Description</Text>
        <TextInput
          style={[styles.descriptionInput, { 
            backgroundColor: colors.background.primary, 
            borderColor: colors.border,
            color: colors.text.primary
          }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add description here..."
          placeholderTextColor={colors.text.light}
          multiline
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.section}>
        <View style={styles.progressHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Progress</Text>
          <Text style={[styles.progressPercentage, { color: colors.primary }]}>{Math.round(progress)}%</Text>
        </View>
        
        <ProgressBar 
          progress={progress} 
          color={getProgressColor()}
          height={10}
          style={styles.progressBar}
        />
        
        <View style={styles.sliderContainer}>
          <TouchableOpacity 
            style={[styles.sliderButton, { 
              backgroundColor: colors.background.primary,
              borderColor: colors.border
            }]}
            onPress={() => setProgress(Math.max(0, progress - 10))}
          >
            <Text style={[styles.sliderButtonText, { color: colors.text.primary }]}>-</Text>
          </TouchableOpacity>
          
          <View style={styles.sliderTrack}>
            {[0, 25, 50, 75, 100].map(value => (
              <TouchableOpacity 
                key={value}
                style={styles.sliderMark}
                onPress={() => setProgress(value)}
              >
                <View 
                  style={[
                    styles.sliderDot,
                    { backgroundColor: colors.border },
                    progress >= value && { backgroundColor: getProgressColor() }
                  ]}
                />
                <Text style={[styles.sliderMarkText, { color: colors.text.secondary }]}>{value}%</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.sliderButton, { 
              backgroundColor: colors.background.primary,
              borderColor: colors.border
            }]}
            onPress={() => setProgress(Math.min(100, progress + 10))}
          >
            <Text style={[styles.sliderButtonText, { color: colors.text.primary }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title={goal.completed ? "Mark as Incomplete" : "Mark as Complete"}
          onPress={handleToggleComplete}
          variant="outline"
          style={styles.completeButton}
        />
        
        <Button
          title="Save Changes"
          onPress={handleSave}
          icon={<Save size={18} color="white" />}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  deleteButton: {
    padding: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    padding: 0,
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    borderWidth: 1,
    fontSize: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sliderButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  sliderTrack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  sliderMark: {
    alignItems: 'center',
  },
  sliderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  sliderMarkText: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  completeButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
});