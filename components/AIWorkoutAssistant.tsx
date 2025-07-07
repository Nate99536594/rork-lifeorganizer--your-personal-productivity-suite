import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { 
  X, 
  Brain, 
  Target, 
  Calendar, 
  Zap, 
  Trophy, 
  Heart, 
  Dumbbell,
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Settings,
  Clock,
  Users,
  Flame,
  Weight,
  Plus,
  Edit3,
  Save,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Play,
  Trash2,
  Star,
  StarOff,
  Crown
} from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { Button } from './Button';
import { useWeeklyWorkoutStore } from '@/store/weeklyWorkoutStore';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useAuthStore } from '@/store/authStore';
import { 
  TrainingGoalSuggestion,
  AIWorkoutRequest, 
  AIWorkoutResponse,
  AIWorkoutPlan,
  WorkoutSpecifics,
  SavedAIWorkout,
  WeeklyWorkoutDay
} from '@/types';

interface AIWorkoutAssistantProps {
  visible: boolean;
  onClose: () => void;
}

const trainingGoalSuggestions: TrainingGoalSuggestion[] = [
  {
    id: 'hypertrophy',
    name: 'Hypertrophy',
    description: 'Build muscle mass and size'
  },
  {
    id: 'strength',
    name: 'Strength',
    description: 'Increase maximum power and lifting capacity'
  },
  {
    id: 'endurance',
    name: 'Endurance',
    description: 'Improve cardiovascular fitness and stamina'
  },
  {
    id: 'explosiveness',
    name: 'Explosiveness',
    description: 'Develop speed, power, and athletic performance'
  },
  {
    id: 'calisthenics',
    name: 'Calisthenics',
    description: 'Bodyweight exercises for strength and mobility'
  },
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    description: 'Burn calories and reduce body fat'
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    description: 'Improve range of motion and mobility'
  },
  {
    id: 'sport-specific',
    name: 'Sport-Specific',
    description: 'Train for a specific sport or activity'
  },
  {
    id: 'general-fitness',
    name: 'General Fitness',
    description: 'Overall health and wellness'
  }
];

const equipmentOptions = [
  'Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar', 'Kettlebells',
  'Cable Machine', 'Bench', 'Squat Rack', 'Cardio Equipment', 'Yoga Mat',
  'Medicine Ball', 'TRX/Suspension Trainer', 'Bodyweight Only'
];

const focusAreaOptions = [
  'Upper Body', 'Lower Body', 'Core', 'Chest', 'Back', 'Shoulders',
  'Arms', 'Legs', 'Glutes', 'Cardio', 'Flexibility', 'Full Body'
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const workoutTypeDescriptions: { [key: string]: string } = {
  'Strength Training': 'Focus on building muscle strength using weights and resistance exercises',
  'Cardio': 'Cardiovascular exercises to improve heart health and endurance',
  'HIIT': 'High-Intensity Interval Training with short bursts of intense activity',
  'Yoga': 'Flexibility, balance, and mindfulness through various poses and breathing',
  'Pilates': 'Core strengthening and body alignment through controlled movements',
  'Running': 'Endurance running workouts for cardiovascular fitness',
  'Cycling': 'Indoor or outdoor cycling for leg strength and cardio',
  'Swimming': 'Full-body aquatic exercise for strength and endurance',
  'Push': 'Upper body pushing movements (chest, shoulders, triceps)',
  'Pull': 'Upper body pulling movements (back, biceps)',
  'Legs': 'Lower body focused workout (quads, hamstrings, glutes, calves)',
  'Upper Body': 'Combined upper body workout targeting all upper muscle groups',
  'Lower Body': 'Comprehensive lower body training session',
  'Full Body': 'Complete workout targeting all major muscle groups',
  'Core': 'Abdominal and core strengthening exercises',
  'Custom': 'Personalized workout based on specific needs or preferences'
};

export const AIWorkoutAssistant: React.FC<AIWorkoutAssistantProps> = ({
  visible,
  onClose
}) => {
  const colors = useColors();
  const { getCurrentWeekPlan } = useWeeklyWorkoutStore();
  const { 
    saveAIWorkout, 
    getSavedAIWorkouts, 
    deleteSavedAIWorkout, 
    toggleFavoriteAIWorkout,
    applySavedWorkoutToWeek 
  } = useWorkoutSessionStore();
  const { user } = useAuthStore();
  const isPremium = user?.isPremium || false;
  
  const [currentStep, setCurrentStep] = useState<'day-selection' | 'goal-selection' | 'specifics' | 'generating' | 'results' | 'saved-workouts' | 'premium-required'>('saved-workouts');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [workoutSpecifics, setWorkoutSpecifics] = useState<WorkoutSpecifics>({
    workoutDuration: 45,
    includeWarmup: true,
    includeCooldown: true,
    experienceLevel: 'intermediate',
    availableEquipment: ['Bodyweight Only'],
    numberOfExercises: 6,
    repRange: '8-12',
    weightPreference: 'moderate',
    restTime: '1-2 minutes',
    focusAreas: [],
    additionalNotes: ''
  });
  
  // Custom input states
  const [customInputs, setCustomInputs] = useState({
    duration: { enabled: false, value: '' },
    equipment: { enabled: false, value: '' },
    exercises: { enabled: false, value: '' },
    repRange: { enabled: false, value: '' },
    focusAreas: { enabled: false, value: '' }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutResponse, setWorkoutResponse] = useState<AIWorkoutResponse | null>(null);
  
  // Save workout modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveWorkoutName, setSaveWorkoutName] = useState('');
  const [saveWorkoutType, setSaveWorkoutType] = useState('');
  
  // Saved workouts state
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [selectedSavedWorkout, setSelectedSavedWorkout] = useState<SavedAIWorkout | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applySelectedDays, setApplySelectedDays] = useState<number[]>([]);
  
  // Premium upgrade modal
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const resetState = () => {
    setCurrentStep('saved-workouts');
    setSelectedGoal('');
    setSelectedDays([]);
    setWorkoutSpecifics({
      workoutDuration: 45,
      includeWarmup: true,
      includeCooldown: true,
      experienceLevel: 'intermediate',
      availableEquipment: ['Bodyweight Only'],
      numberOfExercises: 6,
      repRange: '8-12',
      weightPreference: 'moderate',
      restTime: '1-2 minutes',
      focusAreas: [],
      additionalNotes: ''
    });
    setCustomInputs({
      duration: { enabled: false, value: '' },
      equipment: { enabled: false, value: '' },
      exercises: { enabled: false, value: '' },
      repRange: { enabled: false, value: '' },
      focusAreas: { enabled: false, value: '' }
    });
    setIsLoading(false);
    setError(null);
    setWorkoutResponse(null);
    setShowSaveModal(false);
    setSaveWorkoutName('');
    setSaveWorkoutType('');
    setExpandedWorkouts(new Set());
    setExpandedExercises(new Set());
    setSelectedSavedWorkout(null);
    setShowApplyModal(false);
    setApplySelectedDays([]);
    setShowPremiumModal(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNextFromDays = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (selectedDays.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one day to get workout help for.');
      return;
    }
    setCurrentStep('goal-selection');
  };

  const handleNextFromGoals = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (!selectedGoal.trim()) {
      Alert.alert('Goal Required', 'Please enter your training goal to continue.');
      return;
    }
    setCurrentStep('specifics');
  };

  const handleNextFromSpecifics = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    generateWorkoutPlan();
  };

  const toggleDaySelection = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  const toggleApplyDaySelection = (dayIndex: number) => {
    setApplySelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  const toggleEquipment = (equipment: string) => {
    setWorkoutSpecifics(prev => ({
      ...prev,
      availableEquipment: prev.availableEquipment.includes(equipment)
        ? prev.availableEquipment.filter(e => e !== equipment)
        : [...prev.availableEquipment, equipment]
    }));
  };

  const toggleFocusArea = (area: string) => {
    setWorkoutSpecifics(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const toggleCustomInput = (type: keyof typeof customInputs) => {
    setCustomInputs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled,
        value: prev[type].enabled ? '' : prev[type].value
      }
    }));
  };

  const updateCustomInput = (type: keyof typeof customInputs, value: string) => {
    setCustomInputs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        value
      }
    }));
  };

  const getEffectiveWorkoutSpecifics = (): WorkoutSpecifics => {
    const specs = { ...workoutSpecifics };
    
    // Apply custom duration if enabled
    if (customInputs.duration.enabled && customInputs.duration.value.trim()) {
      const customDuration = parseInt(customInputs.duration.value);
      if (!isNaN(customDuration) && customDuration > 0) {
        specs.workoutDuration = customDuration;
      }
    }
    
    // Apply custom equipment if enabled
    if (customInputs.equipment.enabled && customInputs.equipment.value.trim()) {
      const customEquipment = customInputs.equipment.value.split(',').map(e => e.trim()).filter(e => e);
      if (customEquipment.length > 0) {
        specs.availableEquipment = [...specs.availableEquipment, ...customEquipment];
      }
    }
    
    // Apply custom number of exercises if enabled
    if (customInputs.exercises.enabled && customInputs.exercises.value.trim()) {
      const customExercises = parseInt(customInputs.exercises.value);
      if (!isNaN(customExercises) && customExercises > 0) {
        specs.numberOfExercises = customExercises;
      }
    }
    
    // Apply custom rep range if enabled
    if (customInputs.repRange.enabled && customInputs.repRange.value.trim()) {
      specs.repRange = customInputs.repRange.value;
    }
    
    // Apply custom focus areas if enabled
    if (customInputs.focusAreas.enabled && customInputs.focusAreas.value.trim()) {
      const customFocusAreas = customInputs.focusAreas.value.split(',').map(a => a.trim()).filter(a => a);
      if (customFocusAreas.length > 0) {
        specs.focusAreas = [...specs.focusAreas, ...customFocusAreas];
      }
    }
    
    return specs;
  };

  const generateWorkoutPlan = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    setCurrentStep('generating');
    setIsLoading(true);
    setError(null);

    try {
      const currentWeekPlan = getCurrentWeekPlan();
      if (!currentWeekPlan) {
        throw new Error('No weekly plan found');
      }

      const effectiveSpecs = getEffectiveWorkoutSpecifics();
      const request: AIWorkoutRequest = {
        trainingGoal: selectedGoal,
        selectedDays,
        weeklyPlan: currentWeekPlan,
        workoutSpecifics: effectiveSpecs
      };

      // Create the AI prompt
      const selectedDayPlans = selectedDays.map(dayIndex => {
        const day = currentWeekPlan.days.find((d: WeeklyWorkoutDay) => d.dayIndex === dayIndex);
        const workoutType = day?.workoutType || 'General';
        const description = workoutTypeDescriptions[workoutType] || 'General fitness workout';
        
        return {
          dayName: dayNames[dayIndex],
          workoutType: workoutType,
          workoutDescription: description,
          isWorkoutDay: day?.isWorkoutDay || false
        };
      });

      const dayPlansText = selectedDayPlans.map(day => 
        `- ${day.dayName}: ${day.isWorkoutDay ? `${day.workoutType} - ${day.workoutDescription}` : 'Rest Day'}`
      ).join('
');

      const prompt = `You are a professional fitness trainer. Create detailed workout plans for the following days based on the user's training goal, workout specifics, and their planned workout types.

Training Goal: ${selectedGoal}

Workout Specifics:
- Duration: ${effectiveSpecs.workoutDuration} minutes
- Experience Level: ${effectiveSpecs.experienceLevel}
- Include Warmup: ${effectiveSpecs.includeWarmup ? 'Yes' : 'No'}
- Include Cooldown: ${effectiveSpecs.includeCooldown ? 'Yes' : 'No'}
- Available Equipment: ${effectiveSpecs.availableEquipment.join(', ')}
- Number of Exercises: ${effectiveSpecs.numberOfExercises}
- Rep Range: ${effectiveSpecs.repRange}
- Weight Preference: ${effectiveSpecs.weightPreference}
- Rest Time: ${effectiveSpecs.restTime}
- Focus Areas: ${effectiveSpecs.focusAreas.length > 0 ? effectiveSpecs.focusAreas.join(', ') : 'No specific focus'}
- Additional Notes: ${effectiveSpecs.additionalNotes || 'None'}

Selected Days and Planned Workouts:
${dayPlansText}

Please provide a detailed workout plan for each selected day that strictly adheres to the workout specifics provided. For workout days, create exercises that align with the planned workout type, training goal, and specified parameters. For rest days, suggest light recovery activities.

Important Requirements:
1. Respect the specified workout duration (${effectiveSpecs.workoutDuration} minutes)
2. Use only the available equipment: ${effectiveSpecs.availableEquipment.join(', ')}
3. Create exactly ${effectiveSpecs.numberOfExercises} exercises per workout day
4. Use the specified rep range: ${effectiveSpecs.repRange}
5. Match the experience level: ${effectiveSpecs.experienceLevel}
6. Include warmup if requested: ${effectiveSpecs.includeWarmup}
7. Include cooldown if requested: ${effectiveSpecs.includeCooldown}
8. Focus on specified areas: ${effectiveSpecs.focusAreas.join(', ') || 'general fitness'}

For each day, include:
1. Workout focus/theme that matches the planned workout type and focus areas
2. Estimated duration matching the specified time
3. Warmup routine (5-10 minutes) if requested
4. Exactly ${effectiveSpecs.numberOfExercises} specific exercises with sets and reps in the ${effectiveSpecs.repRange} range
5. Cooldown routine (5-10 minutes) if requested
6. Brief notes about form, intensity, or recovery

Format your response as a JSON object with this structure:
{
  "workoutPlans": [
    {
      "dayIndex": 1,
      "dayName": "Monday",
      "workoutType": "Push",
      "focus": "Chest and Triceps Push Movements",
      "estimatedDuration": ${effectiveSpecs.workoutDuration},
      "warmup": ["5 minutes light cardio", "Dynamic arm circles", "Push-up prep"],
      "exercises": [
        {
          "name": "Push-ups",
          "sets": 3,
          "reps": "${effectiveSpecs.repRange}",
          "weight": "${effectiveSpecs.weightPreference}",
          "restTime": "${effectiveSpecs.restTime}",
          "notes": "Focus on controlled movement and full range of motion"
        }
      ],
      "cooldown": ["5 minutes stretching", "Deep breathing"],
      "notes": "Focus on progressive overload and proper form"
    }
  ],
  "generalNotes": "Overall training tips and recommendations based on the specified parameters"
}

Make the workouts appropriate for the ${effectiveSpecs.experienceLevel} level and ensure they match the planned workout types and specified equipment. For rest days, focus on recovery activities like light stretching, walking, or mobility work.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional fitness trainer who creates detailed, safe, and effective workout plans. Always respond with valid JSON that matches the requested format exactly. Ensure all workouts respect the specified parameters and equipment limitations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout plan');
      }

      const data = await response.json();
      
      // Parse the AI response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(data.completion);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = data.completion.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid response format from AI');
        }
      }

      const workoutResponse: AIWorkoutResponse = {
        id: Date.now().toString(),
        trainingGoal: selectedGoal,
        generatedAt: new Date().toISOString(),
        workoutPlans: parsedResponse.workoutPlans || [],
        generalNotes: parsedResponse.generalNotes,
        workoutSpecifics: effectiveSpecs
      };

      setWorkoutResponse(workoutResponse);
      setCurrentStep('results');
    } catch (err) {
      console.error('Error generating workout plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate workout plan');
      setCurrentStep('specifics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkout = () => {
    if (!workoutResponse) return;
    
    // Auto-generate name and type if not provided
    const autoName = saveWorkoutName.trim() || `${workoutResponse.trainingGoal} Workout`;
    const autoType = saveWorkoutType.trim() || (workoutResponse.workoutPlans[0]?.workoutType || 'Custom');
    
    const savedWorkout: Omit<SavedAIWorkout, 'id' | 'savedAt'> = {
      name: autoName,
      workoutType: autoType,
      trainingGoal: workoutResponse.trainingGoal,
      workoutPlans: workoutResponse.workoutPlans,
      generalNotes: workoutResponse.generalNotes,
      workoutSpecifics: workoutResponse.workoutSpecifics,
      tags: [workoutResponse.trainingGoal.toLowerCase()],
      isFavorite: false
    };
    
    saveAIWorkout(savedWorkout);
    setShowSaveModal(false);
    setSaveWorkoutName('');
    setSaveWorkoutType('');
    
    Alert.alert('Success', 'Workout saved successfully!');
  };

  const handleDeleteSavedWorkout = (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this saved workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteSavedAIWorkout(workoutId),
          style: 'destructive'
        },
      ]
    );
  };

  const handleApplySavedWorkout = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (!selectedSavedWorkout || applySelectedDays.length === 0) {
      Alert.alert('Selection Required', 'Please select days to apply the workout to.');
      return;
    }
    
    const currentWeekPlan = getCurrentWeekPlan();
    if (!currentWeekPlan) {
      Alert.alert('Error', 'No weekly plan found.');
      return;
    }
    
    applySavedWorkoutToWeek(selectedSavedWorkout.id, currentWeekPlan.weekStart, applySelectedDays);
    setShowApplyModal(false);
    setSelectedSavedWorkout(null);
    setApplySelectedDays([]);
    
    Alert.alert('Success', 'Workout applied to your weekly plan!');
  };

  const toggleExpandWorkout = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  const toggleExpandExercises = (workoutId: string) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };
  
  const handleStartNewWorkout = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    setCurrentStep('day-selection');
  };
  
  const handleApplyWorkout = (workoutId: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    const workout = getSavedAIWorkouts().find(w => w.id === workoutId);
    if (workout) {
      setSelectedSavedWorkout(workout);
      setShowApplyModal(true);
    }
  };

  const renderDaySelection = () => {
    const currentWeekPlan = getCurrentWeekPlan();
    
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Calendar size={24} color={colors.primary} />
          <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
            Which days do you want workout help for?
          </Text>
        </View>
        
        <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>
          Select the days you would like AI-generated workout descriptions and exercise recommendations
        </Text>
        
        <ScrollView style={styles.daysContainer} showsVerticalScrollIndicator={false}>
          {dayNames.map((dayName, index) => {
            const dayPlan = currentWeekPlan?.days.find((d: WeeklyWorkoutDay) => d.dayIndex === index);
            const isSelected = selectedDays.includes(index);
            const isWorkoutDay = dayPlan?.isWorkoutDay || false;
            const workoutType = dayPlan?.workoutType || 'General';
            const workoutDescription = workoutTypeDescriptions[workoutType] || 'General fitness activities';
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayOption,
                  { 
                    backgroundColor: isSelected ? colors.primary + '20' : colors.background.secondary,
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
                onPress={() => toggleDaySelection(index)}
              >
                <View style={styles.dayOptionContent}>
                  <View style={styles.dayInfo}>
                    <View style={styles.dayHeader}>
                      <Text style={[styles.dayName, { color: colors.text.primary }]}>
                        {dayName}
                      </Text>
                      {isSelected ? (
                        <CheckCircle size={20} color={colors.primary} />
                      ) : (
                        <Circle size={20} color={colors.border} />
                      )}
                    </View>
                    
                    <Text style={[styles.dayType, { color: isWorkoutDay ? colors.primary : colors.text.secondary }]}>
                      {isWorkoutDay ? workoutType : 'Rest Day'}
                    </Text>
                    
                    <Text style={[styles.dayDescription, { color: colors.text.light }]}>
                      {isWorkoutDay ? workoutDescription : 'Light recovery activities and rest'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        <Button
          title="Next"
          onPress={handleNextFromDays}
          icon={<ArrowRight size={18} color="white" />}
          style={styles.nextButton}
        />
      </View>
    );
  };

  const renderGoalSelection = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Brain size={24} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
          What is your training goal?
        </Text>
      </View>
      
      <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>
        Describe your specific training objective. You can use the suggestions below or write your own custom goal.
      </Text>
      
      <View style={styles.goalInputContainer}>
        <TextInput
          style={[styles.goalInput, { 
            backgroundColor: colors.background.secondary,
            borderColor: colors.border,
            color: colors.text.primary
          }]}
          value={selectedGoal}
          onChangeText={setSelectedGoal}
          placeholder="Enter your training goal..."
          placeholderTextColor={colors.text.light}
          multiline
          numberOfLines={3}
        />
      </View>
      
      <Text style={[styles.suggestionsTitle, { color: colors.text.primary }]}>
        Suggestions:
      </Text>
      
      <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
        {trainingGoalSuggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[
              styles.suggestionOption,
              { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border
              }
            ]}
            onPress={() => setSelectedGoal(suggestion.name)}
          >
            <View style={styles.suggestionContent}>
              <Text style={[styles.suggestionName, { color: colors.text.primary }]}>
                {suggestion.name}
              </Text>
              <Text style={[styles.suggestionDescription, { color: colors.text.secondary }]}>
                {suggestion.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => setCurrentStep('day-selection')}
          variant="outline"
          icon={<ArrowLeft size={18} color={colors.primary} />}
          style={styles.backButton}
        />
        <Button
          title="Next"
          onPress={handleNextFromGoals}
          icon={<ArrowRight size={18} color="white" />}
          style={styles.generateButton}
        />
      </View>
    </View>
  );

  const renderSpecifics = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Settings size={24} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
          Workout Specifics
        </Text>
      </View>
      
      <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>
        Customize your workout parameters to get the most personalized recommendations
      </Text>
      
      <ScrollView style={styles.specificsContainer} showsVerticalScrollIndicator={false}>
        {/* Duration */}
        <View style={styles.specificSection}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Workout Duration
            </Text>
            <TouchableOpacity
              style={styles.customToggle}
              onPress={() => toggleCustomInput('duration')}
            >
              {customInputs.duration.enabled ? (
                <Edit3 size={16} color={colors.primary} />
              ) : (
                <Plus size={16} color={colors.text.light} />
              )}
            </TouchableOpacity>
          </View>
          
          {customInputs.duration.enabled ? (
            <TextInput
              style={[styles.customInput, { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={customInputs.duration.value}
              onChangeText={(text) => updateCustomInput('duration', text)}
              placeholder="Enter custom duration in minutes..."
              placeholderTextColor={colors.text.light}
              keyboardType="numeric"
            />
          ) : (
            <View style={styles.durationOptions}>
              {[30, 45, 60, 75, 90].map(duration => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    {
                      backgroundColor: workoutSpecifics.workoutDuration === duration 
                        ? colors.primary + '20' 
                        : colors.background.secondary,
                      borderColor: workoutSpecifics.workoutDuration === duration 
                        ? colors.primary 
                        : colors.border
                    }
                  ]}
                  onPress={() => setWorkoutSpecifics(prev => ({ ...prev, workoutDuration: duration }))}
                >
                  <Text style={[
                    styles.durationText,
                    { color: workoutSpecifics.workoutDuration === duration ? colors.primary : colors.text.primary }
                  ]}>
                    {duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Experience Level */}
        <View style={styles.specificSection}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Experience Level
            </Text>
          </View>
          <View style={styles.levelOptions}>
            {['beginner', 'intermediate', 'advanced'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelOption,
                  {
                    backgroundColor: workoutSpecifics.experienceLevel === level 
                      ? colors.primary + '20' 
                      : colors.background.secondary,
                    borderColor: workoutSpecifics.experienceLevel === level 
                      ? colors.primary 
                      : colors.border
                  }
                ]}
                onPress={() => setWorkoutSpecifics(prev => ({ ...prev, experienceLevel: level as any }))}
              >
                <Text style={[
                  styles.levelText,
                  { color: workoutSpecifics.experienceLevel === level ? colors.primary : colors.text.primary }
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Warmup/Cooldown */}
        <View style={styles.specificSection}>
          <View style={styles.sectionHeader}>
            <Flame size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Warmup & Cooldown
            </Text>
          </View>
          <View style={styles.toggleOptions}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                {
                  backgroundColor: workoutSpecifics.includeWarmup 
                    ? colors.primary + '20' 
                    : colors.background.secondary,
                  borderColor: workoutSpecifics.includeWarmup 
                    ? colors.primary 
                    : colors.border
                }
              ]}
              onPress={() => setWorkoutSpecifics(prev => ({ ...prev, includeWarmup: !prev.includeWarmup }))}
            >
              <Text style={[
                styles.toggleText,
                { color: workoutSpecifics.includeWarmup ? colors.primary : colors.text.primary }
              ]}>
                Include Warmup
              </Text>
              {workoutSpecifics.includeWarmup && <CheckCircle size={16} color={colors.primary} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleOption,
                {
                  backgroundColor: workoutSpecifics.includeCooldown 
                    ? colors.primary + '20' 
                    : colors.background.secondary,
                  borderColor: workoutSpecifics.includeCooldown 
                    ? colors.primary 
                    : colors.border
                }
              ]}
              onPress={() => setWorkoutSpecifics(prev => ({ ...prev, includeCooldown: !prev.includeCooldown }))}
            >
              <Text style={[
                styles.toggleText,
                { color: workoutSpecifics.includeCooldown ? colors.primary : colors.text.primary }
              ]}>
                Include Cooldown
              </Text>
              {workoutSpecifics.includeCooldown && <CheckCircle size={16} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Equipment */}
        <View style={styles.specificSection}>
          <View style={styles.sectionHeader}>
            <Weight size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Available Equipment
            </Text>
            <TouchableOpacity
              style={styles.customToggle}
              onPress={() => toggleCustomInput('equipment')}
            >
              {customInputs.equipment.enabled ? (
                <Edit3 size={16} color={colors.primary} />
              ) : (
                <Plus size={16} color={colors.text.light} />
              )}
            </TouchableOpacity>
          </View>
          
          {customInputs.equipment.enabled && (
            <TextInput
              style={[styles.customInput, { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={customInputs.equipment.value}
              onChangeText={(text) => updateCustomInput('equipment', text)}
              placeholder="Enter custom equipment (comma separated)..."
              placeholderTextColor={colors.text.light}
              multiline
            />
          )}
          
          <View style={styles.equipmentGrid}>
            {equipmentOptions.map(equipment => (
              <TouchableOpacity
                key={equipment}
                style={[
                  styles.equipmentOption,
                  {
                    backgroundColor: workoutSpecifics.availableEquipment.includes(equipment)
                      ? colors.primary + '20' 
                      : colors.background.secondary,
                    borderColor: workoutSpecifics.availableEquipment.includes(equipment)
                      ? colors.primary 
                      : colors.border
                  }
                ]}
                onPress={() => toggleEquipment(equipment)}
              >
                <Text style={[
                  styles.equipmentText,
                  { 
                    color: workoutSpecifics.availableEquipment.includes(equipment)
                      ? colors.primary 
                      : colors.text.primary 
                  }
                ]}>
                  {equipment}
                </Text>
                {workoutSpecifics.availableEquipment.includes(equipment) && (
                  <CheckCircle size={14} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Number of Exercises */}
        <View style={styles.specificSection}>
          <View style={styles.sectionHeader}>
            <Dumbbell size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Number of Exercises
            </Text>
            <TouchableOpacity
              style={styles.customToggle}
              onPress={() => toggleCustomInput('exercises')}
            >
              {customInputs.exercises.enabled ? (
                <Edit3 size={16} color={colors.primary} />
              ) : (
                <Plus size={16} color={colors.text.light} />
              )}
            </TouchableOpacity>
          </View>
          
          {customInputs.exercises.enabled ? (
            <TextInput
              style={[styles.customInput, { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={customInputs.exercises.value}
              onChangeText={(text) => updateCustomInput('exercises', text)}
              placeholder="Enter custom number of exercises..."
              placeholderTextColor={colors.text.light}
              keyboardType="numeric"
            />
          ) : (
            <View style={styles.numberOptions}>
              {[4, 5, 6, 7, 8].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.numberOption,
                    {
                      backgroundColor: workoutSpecifics.numberOfExercises === num 
                        ? colors.primary + '20' 
                        : colors.background.secondary,
                      borderColor: workoutSpecifics.numberOfExercises === num 
                        ? colors.primary 
                        : colors.border
                    }
                  ]}
                  onPress={() => setWorkoutSpecifics(prev => ({ ...prev, numberOfExercises: num }))}
                >
                  <Text style={[
                    styles.numberText,
                    { color: workoutSpecifics.numberOfExercises === num ? colors.primary : colors.text.primary }
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Rep Range */}
        <View style={styles.specificSection}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Rep Range
            </Text>
            <TouchableOpacity
              style={styles.customToggle}
              onPress={() => toggleCustomInput('repRange')}
            >
              {customInputs.repRange.enabled ? (
                <Edit3 size={16} color={colors.primary} />
              ) : (
                <Plus size={16} color={colors.text.light} />
              )}
            </TouchableOpacity>
          </View>
          
          {customInputs.repRange.enabled ? (
            <TextInput
              style={[styles.customInput, { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={customInputs.repRange.value}
              onChangeText={(text) => updateCustomInput('repRange', text)}
              placeholder="Enter custom rep range (e.g., 10-15, AMRAP, 30 seconds)..."
              placeholderTextColor={colors.text.light}
            />
          ) : (
            <View style={styles.repOptions}>
              {['6-8', '8-12', '12-15', '15-20', '20+'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.repOption,
                    {
                      backgroundColor: workoutSpecifics.repRange === range 
                        ? colors.primary + '20' 
                        : colors.background.secondary,
                      borderColor: workoutSpecifics.repRange === range 
                        ? colors.primary 
                        : colors.border
                    }
                  ]}
                  onPress={() => setWorkoutSpecifics(prev => ({ ...prev, repRange: range }))}
                >
                  <Text style={[
                    styles.repText,
                    { color: workoutSpecifics.repRange === range ? colors.primary : colors.text.primary }
                  ]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Focus Areas */}
        <View style={styles.specificSection}>
          <View style={styles.sectionHeader}>
            <Zap size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Focus Areas (Optional)
            </Text>
            <TouchableOpacity
              style={styles.customToggle}
              onPress={() => toggleCustomInput('focusAreas')}
            >
              {customInputs.focusAreas.enabled ? (
                <Edit3 size={16} color={colors.primary} />
              ) : (
                <Plus size={16} color={colors.text.light} />
              )}
            </TouchableOpacity>
          </View>
          
          {customInputs.focusAreas.enabled && (
            <TextInput
              style={[styles.customInput, { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={customInputs.focusAreas.value}
              onChangeText={(text) => updateCustomInput('focusAreas', text)}
              placeholder="Enter custom focus areas (comma separated)..."
              placeholderTextColor={colors.text.light}
              multiline
            />
          )}
          
          <View style={styles.focusGrid}>
            {focusAreaOptions.map(area => (
              <TouchableOpacity
                key={area}
                style={[
                  styles.focusOption,
                  {
                    backgroundColor: workoutSpecifics.focusAreas.includes(area)
                      ? colors.primary + '20' 
                      : colors.background.secondary,
                    borderColor: workoutSpecifics.focusAreas.includes(area)
                      ? colors.primary 
                      : colors.border
                  }
                ]}
                onPress={() => toggleFocusArea(area)}
              >
                <Text style={[
                  styles.focusText,
                  { 
                    color: workoutSpecifics.focusAreas.includes(area)
                      ? colors.primary 
                      : colors.text.primary 
                  }
                ]}>
                  {area}
                </Text>
                {workoutSpecifics.focusAreas.includes(area) && (
                  <CheckCircle size={14} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.specificSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Additional Notes (Optional)
          </Text>
          <TextInput
            style={[styles.notesInput, { 
              backgroundColor: colors.background.secondary,
              borderColor: colors.border,
              color: colors.text.primary
            }]}
            value={workoutSpecifics.additionalNotes}
            onChangeText={(text) => setWorkoutSpecifics(prev => ({ ...prev, additionalNotes: text }))}
            placeholder="Any specific preferences, limitations, or requests..."
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>
      
      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => setCurrentStep('goal-selection')}
          variant="outline"
          icon={<ArrowLeft size={18} color={colors.primary} />}
          style={styles.backButton}
        />
        <Button
          title="Generate Plan"
          onPress={handleNextFromSpecifics}
          icon={<Sparkles size={18} color="white" />}
          style={styles.generateButton}
        />
      </View>
    </View>
  );

  const renderGenerating = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingTitle, { color: colors.text.primary }]}>
        Generating Your Workout Plan
      </Text>
      <Text style={[styles.loadingSubtitle, { color: colors.text.secondary }]}>
        Our AI is creating personalized workouts based on your goals and specifications...
      </Text>
    </View>
  );

  const renderResults = () => {
    if (!workoutResponse) return null;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Sparkles size={24} color={colors.primary} />
          <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
            Your AI Workout Plan
          </Text>
        </View>
        
        <Text style={[styles.goalSummary, { color: colors.text.secondary }]}>
          Training Goal: {workoutResponse.trainingGoal}
        </Text>
        
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          {workoutResponse.workoutPlans.map((plan, index) => (
            <View key={index} style={[styles.workoutPlanCard, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planDay, { color: colors.text.primary }]}>
                  {plan.dayName}
                </Text>
                <Text style={[styles.planDuration, { color: colors.text.secondary }]}>
                  {plan.estimatedDuration} min
                </Text>
              </View>
              
              <Text style={[styles.planFocus, { color: colors.primary }]}>
                {plan.focus}
              </Text>
              
              {plan.warmup && plan.warmup.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionBlockTitle, { color: colors.text.primary }]}>
                    Warmup:
                  </Text>
                  {plan.warmup.map((item, idx) => (
                    <Text key={idx} style={[styles.sectionBlockItem, { color: colors.text.secondary }]}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
              
              <View style={styles.exercisesList}>
                <Text style={[styles.exercisesTitle, { color: colors.text.primary }]}>
                  Exercises:
                </Text>
                {plan.exercises.map((exercise, exerciseIndex) => (
                  <View key={exerciseIndex} style={styles.exerciseItem}>
                    <Text style={[styles.exerciseName, { color: colors.text.primary }]}>
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseDetails, { color: colors.text.secondary }]}>
                      {exercise.sets} sets × {exercise.reps}
                      {exercise.weight && ` (${exercise.weight})`}
                    </Text>
                    {exercise.notes && (
                      <Text style={[styles.exerciseNotes, { color: colors.text.light }]}>
                        {exercise.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
              
              {plan.cooldown && plan.cooldown.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionBlockTitle, { color: colors.text.primary }]}>
                    Cooldown:
                  </Text>
                  {plan.cooldown.map((item, idx) => (
                    <Text key={idx} style={[styles.sectionBlockItem, { color: colors.text.secondary }]}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
              
              {plan.notes && (
                <Text style={[styles.planNotes, { color: colors.text.light }]}>
                  💡 {plan.notes}
                </Text>
              )}
            </View>
          ))}
          
          {workoutResponse.generalNotes && (
            <View style={[styles.generalNotesCard, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.generalNotesTitle, { color: colors.primary }]}>
                General Training Tips
              </Text>
              <Text style={[styles.generalNotesText, { color: colors.text.secondary }]}>
                {workoutResponse.generalNotes}
              </Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.resultsButtonRow}>
          <Button
            title="Save Plan"
            onPress={() => setShowSaveModal(true)}
            variant="outline"
            icon={<Bookmark size={16} color={colors.primary} />}
            style={styles.savePlanButton}
          />
          <Button
            title="New Plan"
            onPress={resetState}
            style={styles.newPlanButton}
          />
          <Button
            title="Done"
            onPress={handleClose}
            style={styles.doneButton}
          />
        </View>
      </View>
    );
  };

  const renderSavedWorkouts = () => {
    const savedWorkouts = getSavedAIWorkouts();

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <View style={styles.headerWithBadge}>
            <Bookmark size={24} color={colors.primary} />
            <View style={[styles.premiumHeaderBadge, { backgroundColor: colors.primary }]}>
              <Crown size={14} color="white" />
            </View>
          </View>
          <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
            Saved AI Workouts
          </Text>
        </View>
        
        <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>
          Your saved workout routines ({savedWorkouts.length}/20)
        </Text>
        
        <ScrollView style={styles.savedWorkoutsContainer} showsVerticalScrollIndicator={false}>
          {savedWorkouts.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No saved workouts yet. Generate a workout and save it for later use!
              </Text>
            </View>
          ) : (
            savedWorkouts.map((workout) => {
              const isExpanded = expandedWorkouts.has(workout.id);
              const isExercisesExpanded = expandedExercises.has(workout.id);
              
              return (
                <View key={workout.id} style={[styles.savedWorkoutCard, { backgroundColor: colors.background.secondary }]}>
                  <TouchableOpacity
                    style={styles.savedWorkoutHeader}
                    onPress={() => toggleExpandWorkout(workout.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.savedWorkoutInfo}>
                      <View style={styles.savedWorkoutTitleRow}>
                        <Text style={[styles.savedWorkoutName, { color: colors.text.primary }]}>
                          {workout.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleFavoriteAIWorkout(workout.id)}
                          style={styles.favoriteButton}
                        >
                          {workout.isFavorite ? (
                            <Star size={16} color={colors.warning} fill={colors.warning} />
                          ) : (
                            <StarOff size={16} color={colors.text.light} />
                          )}
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.savedWorkoutType, { color: colors.primary }]}>
                        {workout.workoutType}
                      </Text>
                      <Text style={[styles.savedWorkoutGoal, { color: colors.text.secondary }]}>
                        Goal: {workout.trainingGoal}
                      </Text>
                      <Text style={[styles.savedWorkoutDate, { color: colors.text.light }]}>
                        Saved {new Date(workout.savedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={styles.savedWorkoutActions}>
                      {isExpanded ? (
                        <ChevronUp size={20} color={colors.text.secondary} />
                      ) : (
                        <ChevronDown size={20} color={colors.text.secondary} />
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.savedWorkoutDetails}>
                      <View style={styles.workoutPlansPreview}>
                        {workout.workoutPlans.map((plan, index) => (
                          <View key={index} style={styles.planPreview}>
                            <Text style={[styles.planPreviewDay, { color: colors.text.primary }]}>
                              {plan.dayName}: {plan.focus}
                            </Text>
                            <Text style={[styles.planPreviewDuration, { color: colors.text.secondary }]}>
                              {plan.estimatedDuration} min • {plan.exercises.length} exercises
                            </Text>
                          </View>
                        ))}
                      </View>
                      
                      {/* Exercise Details Toggle */}
                      <TouchableOpacity
                        style={[styles.exerciseToggleButton, { borderColor: colors.border }]}
                        onPress={() => toggleExpandExercises(workout.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.exerciseToggleText, { color: colors.primary }]}>
                          {isExercisesExpanded ? 'Hide Exercises' : 'Show Exercises'}
                        </Text>
                        {isExercisesExpanded ? (
                          <ChevronUp size={16} color={colors.primary} />
                        ) : (
                          <ChevronDown size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                      
                      {/* Exercise Details */}
                      {isExercisesExpanded && (
                        <View style={styles.exerciseDetailsContainer}>
                          {workout.workoutPlans.map((plan, planIndex) => (
                            <View key={planIndex} style={styles.planExerciseSection}>
                              <Text style={[styles.planExerciseTitle, { color: colors.text.primary }]}>
                                {plan.dayName} - {plan.focus}
                              </Text>
                              
                              {plan.warmup && plan.warmup.length > 0 && (
                                <View style={styles.exerciseSection}>
                                  <Text style={[styles.exerciseSectionTitle, { color: colors.primary }]}>
                                    Warmup:
                                  </Text>
                                  {plan.warmup.map((item, idx) => (
                                    <Text key={idx} style={[styles.exerciseSectionItem, { color: colors.text.secondary }]}>
                                      • {item}
                                    </Text>
                                  ))}
                                </View>
                              )}
                              
                              <View style={styles.exerciseSection}>
                                <Text style={[styles.exerciseSectionTitle, { color: colors.primary }]}>
                                  Exercises:
                                </Text>
                                {plan.exercises.map((exercise, exerciseIndex) => (
                                  <View key={exerciseIndex} style={styles.exerciseDetailItem}>
                                    <Text style={[styles.exerciseDetailName, { color: colors.text.primary }]}>
                                      {exercise.name}
                                    </Text>
                                    <Text style={[styles.exerciseDetailSpecs, { color: colors.text.secondary }]}>
                                      {exercise.sets} sets × {exercise.reps}
                                      {exercise.weight && ` (${exercise.weight})`}
                                    </Text>
                                    {exercise.notes && (
                                      <Text style={[styles.exerciseDetailNotes, { color: colors.text.light }]}>
                                        {exercise.notes}
                                      </Text>
                                    )}
                                  </View>
                                ))}
                              </View>
                              
                              {plan.cooldown && plan.cooldown.length > 0 && (
                                <View style={styles.exerciseSection}>
                                  <Text style={[styles.exerciseSectionTitle, { color: colors.primary }]}>
                                    Cooldown:
                                  </Text>
                                  {plan.cooldown.map((item, idx) => (
                                    <Text key={idx} style={[styles.exerciseSectionItem, { color: colors.text.secondary }]}>
                                      • {item}
                                    </Text>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {workout.generalNotes && (
                        <Text style={[styles.savedWorkoutNotes, { color: colors.text.light }]}>
                          {workout.generalNotes}
                        </Text>
                      )}
                      
                      <View style={styles.savedWorkoutButtonRow}>
                        <Button
                          title="Apply to Week"
                          onPress={() => handleApplyWorkout(workout.id)}
                          icon={<Play size={16} color="white" />}
                          style={styles.applyButton}
                        />
                        <TouchableOpacity
                          style={[styles.deleteButton, { borderColor: colors.danger }]}
                          onPress={() => handleDeleteSavedWorkout(workout.id)}
                        >
                          <Trash2 size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
        
        <Button
          title="Generate New Workout"
          onPress={handleStartNewWorkout}
          icon={<Plus size={18} color="white" />}
          style={styles.nextButton}
        />
      </View>
    );
  };
  
  const renderPremiumRequired = () => (
    <View style={styles.premiumRequiredContainer}>
      <View style={styles.premiumIconContainer}>
        <Crown size={48} color={colors.primary} />
      </View>
      <Text style={[styles.premiumRequiredTitle, { color: colors.text.primary }]}>
        Premium Feature
      </Text>
      <Text style={[styles.premiumRequiredDescription, { color: colors.text.secondary }]}>
        AI Workout Assistant is a premium feature that provides personalized workout plans based on your goals, equipment, and preferences.
      </Text>
      <View style={styles.premiumFeaturesList}>
        <View style={styles.premiumFeatureItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
            Personalized workout plans for your specific goals
          </Text>
        </View>
        <View style={styles.premiumFeatureItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
            Customized exercises based on available equipment
          </Text>
        </View>
        <View style={styles.premiumFeatureItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
            Detailed instructions for proper form and technique
          </Text>
        </View>
        <View style={styles.premiumFeatureItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
            Save and reuse your favorite workout plans
          </Text>
        </View>
      </View>
      <Button
        title="Upgrade to Premium"
        onPress={() => setShowPremiumModal(true)}
        icon={<Crown size={18} color="white" />}
        style={styles.upgradeToPremiumButton}
      />
      <TouchableOpacity
        style={styles.backToSavedButton}
        onPress={() => setCurrentStep('saved-workouts')}
      >
        <Text style={[styles.backToSavedText, { color: colors.text.secondary }]}>
          Back to Saved Workouts
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSaveModal = () => (
    <Modal
      visible={showSaveModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSaveModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Save Workout
            </Text>
            <TouchableOpacity onPress={() => setShowSaveModal(false)}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.modalInput, { 
              backgroundColor: colors.background.secondary,
              borderColor: colors.border,
              color: colors.text.primary
            }]}
            value={saveWorkoutName}
            onChangeText={setSaveWorkoutName}
            placeholder="Workout name (optional)"
            placeholderTextColor={colors.text.light}
          />
          
          <TextInput
            style={[styles.modalInput, { 
              backgroundColor: colors.background.secondary,
              borderColor: colors.border,
              color: colors.text.primary
            }]}
            value={saveWorkoutType}
            onChangeText={setSaveWorkoutType}
            placeholder="Workout type (optional)"
            placeholderTextColor={colors.text.light}
          />
          
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={() => setShowSaveModal(false)}
              variant="outline"
              style={styles.backButton}
            />
            <Button
              title="Save"
              onPress={handleSaveWorkout}
              icon={<Save size={18} color="white" />}
              style={styles.generateButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderApplyModal = () => {
    const currentWeekPlan = getCurrentWeekPlan();
    
    return (
      <Modal
        visible={showApplyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Apply Workout to Week
              </Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
              Select which days to apply "{selectedSavedWorkout?.name}" to:
            </Text>
            
            <ScrollView style={styles.applyDaysContainer} showsVerticalScrollIndicator={false}>
              {dayNames.map((dayName, index) => {
                const dayPlan = currentWeekPlan?.days.find((d: WeeklyWorkoutDay) => d.dayIndex === index);
                const isSelected = applySelectedDays.includes(index);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.applyDayOption,
                      { 
                        backgroundColor: isSelected ? colors.primary + '20' : colors.background.secondary,
                        borderColor: isSelected ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => toggleApplyDaySelection(index)}
                  >
                    <View style={styles.applyDayInfo}>
                      <Text style={[styles.applyDayName, { color: colors.text.primary }]}>
                        {dayName}
                      </Text>
                      <Text style={[styles.applyDayStatus, { color: colors.text.secondary }]}>
                        {dayPlan?.isWorkoutDay ? `Current: ${dayPlan.workoutType}` : 'Rest Day'}
                      </Text>
                    </View>
                    {isSelected ? (
                      <CheckCircle size={20} color={colors.primary} />
                    ) : (
                      <Circle size={20} color={colors.border} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                onPress={() => setShowApplyModal(false)}
                variant="outline"
                style={styles.backButton}
              />
              <Button
                title="Apply"
                onPress={handleApplySavedWorkout}
                icon={<Play size={18} color="white" />}
                style={styles.generateButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  const renderPremiumModal = () => (
    <Modal
      visible={showPremiumModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPremiumModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.premiumModalContent, { backgroundColor: colors.background.primary }]}>
          <View style={styles.premiumHeader}>
            <View style={styles.premiumTitleContainer}>
              <Crown size={24} color={colors.primary} />
              <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
                Premium Feature
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPremiumModal(false)}
            >
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.premiumDescription, { color: colors.text.secondary }]}>
            AI Workout Assistant is a premium feature that provides personalized workout plans based on your goals, equipment, and preferences.
          </Text>
          
          <View style={styles.premiumFeaturesList}>
            <View style={styles.premiumFeatureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                Personalized workout plans for your specific goals
              </Text>
            </View>
            <View style={styles.premiumFeatureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                Customized exercises based on available equipment
              </Text>
            </View>
            <View style={styles.premiumFeatureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                Detailed instructions for proper form and technique
              </Text>
            </View>
            <View style={styles.premiumFeatureItem}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                Save and reuse your favorite workout plans
              </Text>
            </View>
          </View>
          
          <View style={styles.premiumPricing}>
            <Text style={[styles.premiumPrice, { color: colors.primary }]}>
              $3.99
            </Text>
            <Text style={[styles.premiumPeriod, { color: colors.text.secondary }]}>
              per month
            </Text>
          </View>
          
          <Button
            title="Upgrade to Premium"
            onPress={() => {
              setShowPremiumModal(false);
              Alert.alert(
                'Premium Upgrade',
                'To upgrade to Premium, please go to the Home screen and tap the Premium button in the top-right corner.',
                [{ text: 'OK' }]
              );
            }}
            icon={<Crown size={18} color="white" />}
            style={styles.upgradeToPremiumButton}
          />
          
          <TouchableOpacity
            style={styles.maybeLaterButton}
            onPress={() => setShowPremiumModal(false)}
          >
            <Text style={[styles.maybeLaterText, { color: colors.text.secondary }]}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorTitle, { color: colors.danger }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>
        {error}
      </Text>
      <Button
        title="Try Again"
        onPress={() => {
          setError(null);
          setCurrentStep('specifics');
        }}
        style={styles.retryButton}
      />
    </View>
  );

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
            <View style={styles.modalTitleContainer}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                AI Workout Assistant
              </Text>
              <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
                <Crown size={14} color="white" />
              </View>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          {error ? renderError() : (
            <>
              {currentStep === 'saved-workouts' && renderSavedWorkouts()}
              {currentStep === 'day-selection' && (isPremium ? renderDaySelection() : renderPremiumRequired())}
              {currentStep === 'goal-selection' && (isPremium ? renderGoalSelection() : renderPremiumRequired())}
              {currentStep === 'specifics' && (isPremium ? renderSpecifics() : renderPremiumRequired())}
              {currentStep === 'generating' && renderGenerating()}
              {currentStep === 'results' && renderResults()}
              {currentStep === 'premium-required' && renderPremiumRequired()}
            </>
          )}
        </View>
      </View>
      
      {renderSaveModal()}
      {renderApplyModal()}
      {renderPremiumModal()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'ios' ? 20 : 10,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 500 : '100%',
    maxHeight: Platform.OS === 'ios' ? '95%' : '98%',
    minHeight: Platform.OS === 'ios' ? 600 : 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWithBadge: {
    position: 'relative',
  },
  premiumHeaderBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  stepContainer: {
    flex: 1,
    minHeight: Platform.OS === 'ios' ? 550 : 450,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  daysContainer: {
    flex: 1,
    marginBottom: 20,
    maxHeight: Platform.OS === 'ios' ? 350 : 400,
  },
  dayOption: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  dayOptionContent: {
    flex: 1,
  },
  dayInfo: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  goalInputContainer: {
    marginBottom: 20,
  },
  goalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionsContainer: {
    flex: 1,
    marginBottom: 20,
    maxHeight: Platform.OS === 'ios' ? 300 : 350,
  },
  suggestionOption: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: 12,
  },
  specificsContainer: {
    flex: 1,
    marginBottom: 20,
    maxHeight: Platform.OS === 'ios' ? 400 : 450,
  },
  specificSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  customToggle: {
    padding: 4,
  },
  customInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleOptions: {
    gap: 8,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  equipmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  numberOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  numberOption: {
    width: 50,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  repOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  repText: {
    fontSize: 14,
    fontWeight: '500',
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  focusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  backButton: {
    flex: 1,
  },
  generateButton: {
    flex: 2,
  },
  resultsButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  savePlanButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
  newPlanButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
  doneButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
  nextButton: {
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    minHeight: Platform.OS === 'ios' ? 300 : 250,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsContainer: {
    flex: 1,
    marginBottom: 20,
    maxHeight: Platform.OS === 'ios' ? 400 : 450,
  },
  goalSummary: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  workoutPlanCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planDay: {
    fontSize: 18,
    fontWeight: '700',
  },
  planDuration: {
    fontSize: 14,
  },
  planFocus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionBlockItem: {
    fontSize: 12,
    marginBottom: 2,
    paddingLeft: 8,
  },
  exercisesList: {
    marginBottom: 12,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  exerciseNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  planNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  generalNotesCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  generalNotesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  generalNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  savedWorkoutsContainer: {
    flex: 1,
    marginBottom: 20,
    maxHeight: Platform.OS === 'ios' ? 400 : 450,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  savedWorkoutCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  savedWorkoutHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedWorkoutInfo: {
    flex: 1,
  },
  savedWorkoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  savedWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  savedWorkoutType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  savedWorkoutGoal: {
    fontSize: 12,
    marginBottom: 2,
  },
  savedWorkoutDate: {
    fontSize: 11,
  },
  savedWorkoutActions: {
    marginLeft: 12,
  },
  savedWorkoutDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  workoutPlansPreview: {
    marginBottom: 12,
  },
  planPreview: {
    marginBottom: 8,
  },
  planPreviewDay: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  planPreviewDuration: {
    fontSize: 12,
  },
  exerciseToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  exerciseToggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  exerciseDetailsContainer: {
    marginBottom: 12,
  },
  planExerciseSection: {
    marginBottom: 16,
  },
  planExerciseTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseSection: {
    marginBottom: 12,
  },
  exerciseSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  exerciseSectionItem: {
    fontSize: 12,
    marginBottom: 2,
    paddingLeft: 8,
  },
  exerciseDetailItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  exerciseDetailName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseDetailSpecs: {
    fontSize: 13,
    marginBottom: 2,
  },
  exerciseDetailNotes: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  savedWorkoutNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  savedWorkoutButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applyButton: {
    flex: 1,
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyDaysContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  applyDayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  applyDayInfo: {
    flex: 1,
  },
  applyDayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  applyDayStatus: {
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    minHeight: Platform.OS === 'ios' ? 300 : 250,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 120,
  },
  // Premium required screen
  premiumRequiredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  premiumIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  premiumRequiredTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumRequiredDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  premiumFeaturesList: {
    width: '100%',
    marginBottom: 24,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  premiumFeatureText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  upgradeToPremiumButton: {
    width: '100%',
    marginBottom: 16,
  },
  backToSavedButton: {
    padding: 12,
  },
  backToSavedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Premium modal
  premiumModalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  premiumDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  premiumPricing: {
    alignItems: 'center',
    marginVertical: 24,
  },
  premiumPrice: {
    fontSize: 36,
    fontWeight: '800',
  },
  premiumPeriod: {
    fontSize: 16,
    fontWeight: '500',
  },
  maybeLaterButton: {
    alignItems: 'center',
    padding: 12,
  },
  maybeLaterText: {
    fontSize: 16,
    fontWeight: '500',
  },
});