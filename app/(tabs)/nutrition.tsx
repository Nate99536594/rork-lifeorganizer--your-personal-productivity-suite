import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X, Save, Activity, Clock, Flame, Edit2, Brain, Info, Crown, Search, History, Star, ChevronRight, Check } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { NutritionEntry as NutritionEntryComponent } from '@/components/NutritionEntry';
import { WeeklyWorkoutTracker } from '@/components/WeeklyWorkoutTracker';
import { WeeklyPlanEditor } from '@/components/WeeklyPlanEditor';
import { WorkoutLogger } from '@/components/WorkoutLogger';
import { AIWorkoutAssistant } from '@/components/AIWorkoutAssistant';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useWeeklyWorkoutStore } from '@/store/weeklyWorkoutStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { NutritionEntry } from '@/types';

export default function HealthScreen() {
  const router = useRouter();
  const colors = useColors();
  const { 
    entries, 
    deleteEntry, 
    addEntry, 
    updateEntry, 
    previousMeals,
    addFromPreviousMeal,
    checkAndResetDaily,
    getPreviousMealsByType,
    searchPreviousMeals
  } = useNutritionStore();
  const { sessions } = useWorkoutSessionStore();
  const { checkAndUpdateWeeklyStreak, resetWeekIfNeeded } = useWeeklyWorkoutStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout'>('workout');
  const [nutritionSubTab, setNutritionSubTab] = useState<'today' | 'previous'>('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWorkoutLogger, setShowWorkoutLogger] = useState(false);
  const [showWeeklyPlanEditor, setShowWeeklyPlanEditor] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);
  
  // Previous meals state
  const [previousMealsFilter, setPreviousMealsFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const [previousMealsSearch, setPreviousMealsSearch] = useState('');
  
  // Add nutrition entry form state
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntryCalories, setNewEntryCalories] = useState('');
  const [newEntryProtein, setNewEntryProtein] = useState('');
  const [newEntryCarbs, setNewEntryCarbs] = useState('');
  const [newEntryFat, setNewEntryFat] = useState('');
  const [newEntryMealType, setNewEntryMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  
  // Check for daily reset when component mounts and when sessions change
  useEffect(() => {
    checkAndResetDaily();
    resetWeekIfNeeded();
    checkAndUpdateWeeklyStreak(sessions);
    
    // Set up an interval to check for date changes
    const intervalId = setInterval(() => {
      checkAndResetDaily();
      resetWeekIfNeeded();
      checkAndUpdateWeeklyStreak(sessions);
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [sessions]);
  
  const handleDeleteEntry = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this nutrition entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteEntry(id);
            Alert.alert('Success', 'Entry deleted successfully');
          },
          style: 'destructive'
        },
      ]
    );
  };

  const handleEditEntry = (entry: NutritionEntry) => {
    setEditingEntry(entry);
    setNewEntryName(entry.foodName || '');
    setNewEntryCalories(entry.calories.toString());
    setNewEntryProtein((entry.protein || 0).toString());
    setNewEntryCarbs((entry.carbs || 0).toString());
    setNewEntryFat((entry.fat || 0).toString());
    setNewEntryMealType(entry.mealType);
    setShowEditModal(true);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !newEntryName.trim() || !newEntryCalories.trim()) {
      Alert.alert('Error', 'Please fill in at least the name and calories');
      return;
    }

    const calories = parseInt(newEntryCalories) || 0;
    const protein = parseInt(newEntryProtein) || 0;
    const carbs = parseInt(newEntryCarbs) || 0;
    const fat = parseInt(newEntryFat) || 0;

    // Get existing meal data or create new structure
    const existingMeal = editingEntry.meals && editingEntry.meals.length > 0 ? editingEntry.meals[0] : null;
    const existingFoodItem = existingMeal && existingMeal.foodItems && existingMeal.foodItems.length > 0 ? existingMeal.foodItems[0] : null;

    const updatedEntry = {
      foodName: newEntryName.trim(),
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      mealType: newEntryMealType,
      meals: [{
        id: existingMeal?.id || Date.now().toString(),
        name: newEntryName.trim(),
        foodItems: [{
          id: existingFoodItem?.id || Date.now().toString(),
          name: newEntryName.trim(),
          quantity: 1,
          unit: 'serving',
          calories: calories,
          protein: protein,
          carbs: carbs,
          fat: fat,
        }]
      }]
    };

    updateEntry(editingEntry.id, updatedEntry);
    
    // Reset form and close modal
    resetForm();
    setShowEditModal(false);
    setEditingEntry(null);
    
    Alert.alert('Success', 'Nutrition entry updated successfully');
  };
  
  const handleAddNutritionEntry = () => {
    if (!newEntryName.trim() || !newEntryCalories.trim()) {
      Alert.alert('Error', 'Please fill in at least the name and calories');
      return;
    }
    
    const calories = parseInt(newEntryCalories) || 0;
    const protein = parseInt(newEntryProtein) || 0;
    const carbs = parseInt(newEntryCarbs) || 0;
    const fat = parseInt(newEntryFat) || 0;
    
    const newEntry = {
      foodName: newEntryName.trim(),
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      mealType: newEntryMealType,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      meals: [{
        id: Date.now().toString(),
        name: newEntryName.trim(),
        foodItems: [{
          id: Date.now().toString(),
          name: newEntryName.trim(),
          quantity: 1,
          unit: 'serving',
          calories: calories,
          protein: protein,
          carbs: carbs,
          fat: fat,
        }]
      }]
    };
    
    addEntry(newEntry);
    
    // Reset form
    resetForm();
    setShowAddModal(false);
    
    Alert.alert('Success', 'Nutrition entry added successfully');
  };

  const resetForm = () => {
    setNewEntryName('');
    setNewEntryCalories('');
    setNewEntryProtein('');
    setNewEntryCarbs('');
    setNewEntryFat('');
    setNewEntryMealType('breakfast');
  };
  
  const handleAddItem = () => {
    if (activeTab === 'workout') {
      setShowWorkoutLogger(true);
    } else {
      resetForm();
      setShowAddModal(true);
    }
  };
  
  const getTotalCalories = () => {
    return entries.reduce((total, entry) => total + entry.calories, 0);
  };
  
  const getTotalNutrients = () => {
    return entries.reduce(
      (totals, entry) => {
        return {
          protein: totals.protein + (entry.protein || 0),
          carbs: totals.carbs + (entry.carbs || 0),
          fat: totals.fat + (entry.fat || 0),
        };
      },
      { protein: 0, carbs: 0, fat: 0 }
    );
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getRecentWorkoutSessions = () => {
    // Get sessions from the last 7 days, sorted by date (newest first)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return sessions
      .filter(session => new Date(session.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Show only the 5 most recent
  };

  const handleAIAssistantPress = () => {
    if (!user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setShowAIAssistant(true);
  };

  const handleAddFromPreviousMeal = (mealId: string) => {
    addFromPreviousMeal(mealId);
    Alert.alert('Success', 'Meal added to today\'s nutrition log');
  };

  const getFilteredPreviousMeals = () => {
    let filtered = previousMealsSearch 
      ? searchPreviousMeals(previousMealsSearch)
      : getPreviousMealsByType(previousMealsFilter === 'all' ? undefined : previousMealsFilter);
    
    return filtered;
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };
  
  const renderNutritionModal = (isEdit: boolean = false) => {
    const isVisible = isEdit ? showEditModal : showAddModal;
    const onClose = () => {
      if (isEdit) {
        setShowEditModal(false);
        setEditingEntry(null);
      } else {
        setShowAddModal(false);
      }
      resetForm();
    };
    const onSubmit = isEdit ? handleUpdateEntry : handleAddNutritionEntry;
    const title = isEdit ? 'Edit Nutrition Entry' : 'Add Nutrition Entry';
    const buttonText = isEdit ? 'Update Entry' : 'Add Entry';

    return (
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Food Name</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                placeholder="Enter food name"
                value={newEntryName}
                onChangeText={setNewEntryName}
                placeholderTextColor={colors.text.light}
              />
              
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Calories</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                placeholder="Enter calories"
                value={newEntryCalories}
                onChangeText={setNewEntryCalories}
                keyboardType="numeric"
                placeholderTextColor={colors.text.light}
              />
              
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Protein (g)</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                placeholder="Enter protein in grams"
                value={newEntryProtein}
                onChangeText={setNewEntryProtein}
                keyboardType="numeric"
                placeholderTextColor={colors.text.light}
              />
              
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Carbs (g)</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                placeholder="Enter carbs in grams"
                value={newEntryCarbs}
                onChangeText={setNewEntryCarbs}
                keyboardType="numeric"
                placeholderTextColor={colors.text.light}
              />
              
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Fat (g)</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                placeholder="Enter fat in grams"
                value={newEntryFat}
                onChangeText={setNewEntryFat}
                keyboardType="numeric"
                placeholderTextColor={colors.text.light}
              />
              
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Meal Type</Text>
              <View style={styles.mealTypeContainer}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealTypeButton,
                      { borderColor: colors.border },
                      newEntryMealType === type && { 
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary
                      }
                    ]}
                    onPress={() => setNewEntryMealType(type)}
                  >
                    <Text style={[
                      styles.mealTypeText,
                      { color: colors.text.secondary },
                      newEntryMealType === type && { 
                        color: colors.primary,
                        fontWeight: '600'
                      }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Button
                title={buttonText}
                onPress={onSubmit}
                icon={<Save size={18} color="white" />}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMacronutrientModal = () => {
    return (
      <Modal
        visible={showMacroModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMacroModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.macroModalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Macronutrient Breakdown
              </Text>
              <TouchableOpacity onPress={() => setShowMacroModal(false)}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.macroModalBody} showsVerticalScrollIndicator={false}>
              {/* Protein Section */}
              <View style={styles.macroSection}>
                <View style={[styles.macroHeader, { backgroundColor: colors.primary + '15' }]}>
                  <View style={[styles.macroIcon, { backgroundColor: colors.primary }]}>
                    <Text style={styles.macroIconText}>P</Text>
                  </View>
                  <Text style={[styles.macroTitle, { color: colors.text.primary }]}>Protein</Text>
                </View>
                
                <View style={styles.macroContent}>
                  <Text style={[styles.macroDescription, { color: colors.text.secondary }]}>
                    Protein is essential for muscle growth, repair, immune function, and the production of hormones and enzymes. It is made up of amino acids, which are the building blocks of body tissues.
                  </Text>
                  
                  <Text style={[styles.macroSubtitle, { color: colors.text.primary }]}>Food Sources:</Text>
                  <View style={styles.macroFoodList}>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Lean meats (chicken, turkey, beef)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Fish (salmon, tuna, tilapia)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Eggs</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Dairy products (Greek yogurt, cottage cheese)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Plant-based sources (tofu, tempeh, beans, lentils)</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Carbohydrates Section */}
              <View style={styles.macroSection}>
                <View style={[styles.macroHeader, { backgroundColor: colors.secondary + '15' }]}>
                  <View style={[styles.macroIcon, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.macroIconText}>C</Text>
                  </View>
                  <Text style={[styles.macroTitle, { color: colors.text.primary }]}>Carbohydrates</Text>
                </View>
                
                <View style={styles.macroContent}>
                  <Text style={[styles.macroDescription, { color: colors.text.secondary }]}>
                    Carbohydrates provide the body with energy, especially for physical activity and brain function. They are the body's primary and preferred source of fuel.
                  </Text>
                  
                  <Text style={[styles.macroSubtitle, { color: colors.text.primary }]}>Food Sources:</Text>
                  <View style={styles.macroFoodList}>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Whole grains (brown rice, quinoa, oats)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Fruits (bananas, berries, apples)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Vegetables (sweet potatoes, leafy greens)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Legumes (beans, lentils, chickpeas)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Whole grain breads and pasta</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Fats Section */}
              <View style={styles.macroSection}>
                <View style={[styles.macroHeader, { backgroundColor: colors.warning + '15' }]}>
                  <View style={[styles.macroIcon, { backgroundColor: colors.warning }]}>
                    <Text style={styles.macroIconText}>F</Text>
                  </View>
                  <Text style={[styles.macroTitle, { color: colors.text.primary }]}>Fats</Text>
                </View>
                
                <View style={styles.macroContent}>
                  <Text style={[styles.macroDescription, { color: colors.text.secondary }]}>
                    Fats are crucial for energy storage, hormone production, and cell function. They help absorb certain vitamins and provide insulation for body organs.
                  </Text>
                  
                  <Text style={[styles.macroSubtitle, { color: colors.text.primary }]}>Types of Fats:</Text>
                  <View style={styles.macroFoodList}>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.success }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>
                        <Text style={{ fontWeight: '600' }}>Unsaturated Fats (Healthy):</Text> Avocados, olive oil, nuts, seeds, fatty fish
                      </Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>
                        <Text style={{ fontWeight: '600' }}>Saturated Fats (Moderate):</Text> Dairy, coconut oil, red meat
                      </Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.danger }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>
                        <Text style={{ fontWeight: '600' }}>Trans Fats (Avoid):</Text> Processed foods, some margarines, fried foods
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.macroSubtitle, { color: colors.text.primary }]}>Healthy Fat Sources:</Text>
                  <View style={styles.macroFoodList}>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Avocados</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Olive oil and other plant oils</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Nuts and seeds (almonds, walnuts, flaxseeds)</Text>
                    </View>
                    <View style={styles.macroFoodItem}>
                      <View style={[styles.macroFoodDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.macroFoodText, { color: colors.text.secondary }]}>Fatty fish (salmon, mackerel, sardines)</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
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
          
          <ScrollView style={styles.premiumFeaturesContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.premiumFeaturesList}>
              <View style={styles.premiumFeatureItem}>
                <Check size={20} color={colors.success} />
                <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                  Personalized workout plans for your specific goals
                </Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Check size={20} color={colors.success} />
                <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                  Customized exercises based on available equipment
                </Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Check size={20} color={colors.success} />
                <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                  Detailed instructions for proper form and technique
                </Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Check size={20} color={colors.success} />
                <Text style={[styles.premiumFeatureText, { color: colors.text.secondary }]}>
                  Save and reuse your favorite workout plans
                </Text>
              </View>
            </View>
          </ScrollView>
          
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
  
  const renderNutritionTab = () => {
    const totalNutrients = getTotalNutrients();
    
    return (
      <View style={styles.tabContent}>
        {/* Nutrition Sub-tabs */}
        <View style={styles.nutritionSubTabs}>
          <TouchableOpacity
            style={[
              styles.nutritionSubTab,
              nutritionSubTab === 'today' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => setNutritionSubTab('today')}
          >
            <Text style={[
              styles.nutritionSubTabText,
              { color: nutritionSubTab === 'today' ? colors.primary : colors.text.secondary }
            ]}>
              Today
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.nutritionSubTab,
              nutritionSubTab === 'previous' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => setNutritionSubTab('previous')}
          >
            <History size={16} color={nutritionSubTab === 'previous' ? colors.primary : colors.text.secondary} />
            <Text style={[
              styles.nutritionSubTabText,
              { color: nutritionSubTab === 'previous' ? colors.primary : colors.text.secondary }
            ]}>
              Previous Meals
            </Text>
          </TouchableOpacity>
        </View>

        {nutritionSubTab === 'today' ? (
          <>
            <View style={[styles.summaryCard, { backgroundColor: colors.background.primary }]}>
              <View style={styles.summaryHeader}>
                <Text style={[styles.summaryTitle, { color: colors.text.secondary }]}>Today's Summary</Text>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => setShowMacroModal(true)}
                >
                  <Info size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.calorieContainer}>
                <Text style={[styles.calorieValue, { color: colors.primary }]}>{getTotalCalories()}</Text>
                <Text style={[styles.calorieLabel, { color: colors.text.secondary }]}>calories</Text>
              </View>
              
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: colors.text.primary }]}>{totalNutrients.protein}g</Text>
                  <Text style={[styles.nutrientLabel, { color: colors.text.secondary }]}>Protein</Text>
                </View>
                
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: colors.text.primary }]}>{totalNutrients.carbs}g</Text>
                  <Text style={[styles.nutrientLabel, { color: colors.text.secondary }]}>Carbs</Text>
                </View>
                
                <View style={styles.nutrientItem}>
                  <Text style={[styles.nutrientValue, { color: colors.text.primary }]}>{totalNutrients.fat}g</Text>
                  <Text style={[styles.nutrientLabel, { color: colors.text.secondary }]}>Fat</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Today's Entries</Text>
            </View>
            
            {entries.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No nutrition entries yet. Add your first meal!
                </Text>
              </View>
            ) : (
              <View style={styles.entriesContainer}>
                {entries.map(entry => (
                  <NutritionEntryComponent
                    key={entry.id}
                    entry={entry}
                    onPress={() => handleEditEntry(entry)}
                    onDelete={() => handleDeleteEntry(entry.id)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Previous Meals Section */}
            <View style={styles.previousMealsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Previous Meals</Text>
              <Text style={[styles.previousMealsSubtitle, { color: colors.text.secondary }]}>
                Quickly add meals you've logged before
              </Text>
            </View>

            {/* Search and Filter */}
            <View style={styles.previousMealsControls}>
              <View style={styles.searchContainer}>
                <Search size={16} color={colors.text.light} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text.primary }]}
                  placeholder="Search previous meals..."
                  value={previousMealsSearch}
                  onChangeText={setPreviousMealsSearch}
                  placeholderTextColor={colors.text.light}
                />
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterScrollView}
                contentContainerStyle={styles.filterContainer}
              >
                {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterChip,
                      { borderColor: colors.border },
                      previousMealsFilter === filter && { 
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary
                      }
                    ]}
                    onPress={() => setPreviousMealsFilter(filter)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: colors.text.secondary },
                      previousMealsFilter === filter && { 
                        color: colors.primary,
                        fontWeight: '600'
                      }
                    ]}>
                      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Previous Meals List */}
            <View style={styles.previousMealsList}>
              {getFilteredPreviousMeals().length === 0 ? (
                <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
                  <History size={48} color={colors.text.light} />
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    {previousMealsSearch 
                      ? 'No meals match your search' 
                      : previousMealsFilter === 'all'
                      ? 'No previous meals yet. Start logging meals to build your library!'
                      : `No ${previousMealsFilter} meals found`}
                  </Text>
                </View>
              ) : (
                getFilteredPreviousMeals().map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={[styles.previousMealCard, { backgroundColor: colors.background.primary }]}
                    onPress={() => handleAddFromPreviousMeal(meal.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.previousMealHeader}>
                      <View style={styles.previousMealInfo}>
                        <Text style={[styles.previousMealName, { color: colors.text.primary }]}>
                          {meal.name}
                        </Text>
                        <View style={styles.previousMealMeta}>
                          <View style={[styles.mealTypeBadge, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={[styles.mealTypeBadgeText, { color: colors.primary }]}>
                              {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                            </Text>
                          </View>
                          <View style={styles.previousMealStats}>
                            <Star size={12} color={colors.warning} />
                            <Text style={[styles.previousMealUsage, { color: colors.text.light }]}>
                              Used {meal.timesUsed} times
                            </Text>
                          </View>
                        </View>
                      </View>
                      <ChevronRight size={20} color={colors.text.light} />
                    </View>
                    
                    <View style={styles.previousMealNutrition}>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: colors.primary }]}>{meal.calories}</Text>
                        <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>cal</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{meal.protein}g</Text>
                        <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{meal.carbs}g</Text>
                        <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>carbs</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{meal.fat}g</Text>
                        <Text style={[styles.nutritionLabel, { color: colors.text.secondary }]}>fat</Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.previousMealLastUsed, { color: colors.text.light }]}>
                      Last used: {formatLastUsed(meal.lastUsedDate)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </View>
    );
  };
  
  const renderWorkoutTab = () => {
    const recentSessions = getRecentWorkoutSessions();
    
    return (
      <View style={styles.tabContent}>
        <WeeklyWorkoutTracker onEditPlan={() => setShowWeeklyPlanEditor(true)} />
        
        {/* AI Assistant Button */}
        <TouchableOpacity
          style={[styles.aiAssistantButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
          onPress={handleAIAssistantPress}
          activeOpacity={0.7}
        >
          <View style={styles.aiButtonContent}>
            <View style={[styles.aiIcon, { backgroundColor: colors.primary }]}>
              <Brain size={20} color="white" />
            </View>
            <View style={styles.aiTextContent}>
              <Text style={[styles.aiButtonTitle, { color: colors.primary }]}>
                Get AI Workout Help
              </Text>
              <Text style={[styles.aiButtonSubtitle, { color: colors.text.secondary }]}>
                Personalized workout plans based on your goals
              </Text>
            </View>
            <View style={styles.premiumFeatureTag}>
              <Crown size={16} color={colors.primary} />
              <Text style={[styles.premiumFeatureText, { color: colors.primary }]}>
                Premium
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Workouts Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Recent Workouts</Text>
        </View>
        
        {recentSessions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No recent workouts. Log your first workout!
            </Text>
          </View>
        ) : (
          recentSessions.map(session => (
            <TouchableOpacity
              key={session.id}
              style={[styles.workoutSessionCard, { backgroundColor: colors.background.primary }]}
              onPress={() => router.push(`/workout-session/${session.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.sessionHeader}>
                <Text style={[styles.sessionDate, { color: colors.text.primary }]}>
                  {formatDate(session.date)}
                </Text>
                <View style={styles.sessionStats}>
                  <View style={styles.sessionStat}>
                    <Clock size={14} color={colors.text.secondary} />
                    <Text style={[styles.sessionStatText, { color: colors.text.secondary }]}>
                      {formatDuration(session.duration || 0)}
                    </Text>
                  </View>
                  <Edit2 size={16} color={colors.primary} />
                </View>
              </View>
              
              {session.exercises.length > 0 && (
                <View style={styles.sessionExercises}>
                  <Text style={[styles.exercisesPreview, { color: colors.text.secondary }]}>
                    {session.exercises.slice(0, 2).map(ex => ex.name).join(', ')}
                    {session.exercises.length > 2 && ` +${session.exercises.length - 2} more`}
                  </Text>
                </View>
              )}
              
              {session.notes && (
                <Text style={[styles.sessionNotes, { color: colors.text.light }]} numberOfLines={1}>
                  {session.notes}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.tabs, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'workout' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('workout')}
        >
          <Text 
            style={[
              styles.tabText,
              { color: activeTab === 'workout' ? colors.primary : colors.text.secondary }
            ]}
          >
            Workout
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'nutrition' && { borderBottomColor: colors.primary }
          ]}
          onPress={() => setActiveTab('nutrition')}
        >
          <Text 
            style={[
              styles.tabText,
              { color: activeTab === 'nutrition' ? colors.primary : colors.text.secondary }
            ]}
          >
            Nutrition
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'nutrition' ? renderNutritionTab() : renderWorkoutTab()}
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleAddItem}
      >
        {activeTab === 'workout' ? (
          <Activity size={24} color="white" />
        ) : (
          <Plus size={24} color="white" />
        )}
      </TouchableOpacity>
      
      {renderNutritionModal(false)}
      {renderNutritionModal(true)}
      {renderMacronutrientModal()}
      {renderPremiumModal()}
      
      <WorkoutLogger 
        visible={showWorkoutLogger}
        onClose={() => setShowWorkoutLogger(false)}
      />
      
      <WeeklyPlanEditor 
        visible={showWeeklyPlanEditor}
        onClose={() => setShowWeeklyPlanEditor(false)}
      />
      
      <AIWorkoutAssistant
        visible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  tabContent: {
    flex: 1,
  },
  nutritionSubTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  nutritionSubTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  nutritionSubTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoButton: {
    padding: 4,
  },
  calorieContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  calorieLabel: {
    fontSize: 14,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  nutrientLabel: {
    fontSize: 14,
  },
  previousMealsHeader: {
    marginBottom: 20,
  },
  previousMealsSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  previousMealsControls: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  filterScrollView: {
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previousMealsList: {
    gap: 12,
  },
  previousMealCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previousMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previousMealInfo: {
    flex: 1,
  },
  previousMealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  previousMealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  previousMealStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previousMealUsage: {
    fontSize: 12,
  },
  previousMealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 10,
  },
  previousMealLastUsed: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  aiAssistantButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiTextContent: {
    flex: 1,
  },
  aiButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  aiButtonSubtitle: {
    fontSize: 14,
  },
  premiumFeatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  entriesContainer: {
    gap: 12,
  },
  workoutSessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionStatText: {
    fontSize: 12,
    marginLeft: 4,
  },
  sessionExercises: {
    marginBottom: 4,
  },
  exercisesPreview: {
    fontSize: 14,
  },
  sessionNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  macroModalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalForm: {
    maxHeight: 400,
  },
  macroModalBody: {
    maxHeight: '90%',
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  mealTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  mealTypeText: {
    fontSize: 14,
  },
  modalButton: {
    marginTop: 16,
  },
  // Macronutrient modal styles
  macroSection: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  macroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  macroIconText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  macroTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  macroContent: {
    padding: 16,
  },
  macroDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  macroSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  macroFoodList: {
    marginBottom: 16,
  },
  macroFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroFoodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  macroFoodText: {
    fontSize: 14,
    flex: 1,
  },
  // Premium modal styles
  premiumModalContent: {
    width: '90%',
    maxHeight: '85%',
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
  premiumFeaturesContainer: {
    flex: 1,
    marginBottom: 24,
  },
  premiumFeaturesList: {
    width: '100%',
    paddingBottom: 16,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  upgradeToPremiumButton: {
    width: '100%',
    marginBottom: 16,
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