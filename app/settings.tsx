import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextInput,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Eye, 
  Users, 
  Globe,
  Save,
  LogOut,
  Moon,
  Sun,
  Settings as SettingsIcon,
  Smartphone,
  Check,
  Shield,
  Archive,
  Calendar,
  Flame,
  CheckCircle,
  X,
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  AtSign,
  ToggleLeft,
  ToggleRight,
  Utensils,
  Dumbbell,
  Target,
  Folder,
  Trash2
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, ThemeMode } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useGoalStore } from '@/store/goalStore';
import { useProjectStore } from '@/store/projectStore';
import { useStreakStore } from '@/store/streakStore';
import { useFriendStore } from '@/store/friendStore';
import { useChallengeStore } from '@/store/challengeStore';
import { useAchievementStore } from '@/store/achievementStore';
import { useActivityFeedStore } from '@/store/activityFeedStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWeeklyWorkoutStore } from '@/store/weeklyWorkoutStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DailySession, TaskSnapshot } from '@/types';

type ExpandedSection = 'theme' | 'profile' | 'password' | 'privacy' | 'archive' | 'support' | 'delete' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, updateProfile, updatePrivacySettings, switchUsernameType, logout, deleteAccount } = useAuthStore();
  const { themeMode, setTheme } = useThemeStore();
  const { dailySessions, addReflection, getDailyTaskLogs } = useTaskStore();
  const { getDailyNutritionLogs } = useNutritionStore();
  const { getDailyWorkoutLogs } = useWorkoutSessionStore();
  const { getDailyGoalLogs } = useGoalStore();
  const { getDailyProjectLogs } = useProjectStore();
  const { getStreakForDate } = useStreakStore();
  
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [activeSection, setActiveSection] = useState<'main' | 'archive'>('main');
  const [archiveTab, setArchiveTab] = useState<'tasks' | 'nutrition' | 'workouts' | 'goals' | 'projects'>('tasks');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountVisibility, setAccountVisibility] = useState<'private' | 'friends' | 'public'>(
    user?.privacySettings?.accountVisibility || 'friends'
  );
  const [reflectionText, setReflectionText] = useState('');
  const [editingReflection, setEditingReflection] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleSaveProfile = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Error', 'First name, last name, and email are required');
      return;
    }
    
    updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });
    
    Alert.alert('Success', 'Profile updated successfully');
  };
  
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    
    // In a real app, this would make an API call
    Alert.alert('Success', 'Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const handleSavePrivacySettings = () => {
    updatePrivacySettings({
      accountVisibility
    });
    
    Alert.alert('Success', 'Privacy settings updated successfully');
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => {
            logout();
            router.replace('/');
          },
          style: 'destructive'
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all data within the app of your account will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Clear all store data
              const taskStore = useTaskStore.getState();
              const nutritionStore = useNutritionStore.getState();
              const workoutStore = useWorkoutSessionStore.getState();
              const goalStore = useGoalStore.getState();
              const projectStore = useProjectStore.getState();
              const streakStore = useStreakStore.getState();
              const friendStore = useFriendStore.getState();
              const challengeStore = useChallengeStore.getState();
              const achievementStore = useAchievementStore.getState();
              const activityFeedStore = useActivityFeedStore.getState();
              const characterStore = useCharacterStore.getState();
              const weeklyWorkoutStore = useWeeklyWorkoutStore.getState();
              
              // Reset all stores to initial state
              taskStore.tasks = [];
              taskStore.dailySessions = [];
              taskStore.dailyTaskLogs = [];
              taskStore.sharedTodoLists = [];
              taskStore.todoListShares = [];
              
              nutritionStore.entries = [];
              nutritionStore.previousMeals = [];
              nutritionStore.dailyNutritionLogs = [];
              
              workoutStore.sessions = [];
              workoutStore.savedAIWorkouts = [];
              workoutStore.dailyWorkoutLogs = [];
              
              goalStore.goals = [];
              goalStore.dailyGoalLogs = [];
              
              projectStore.projects = [];
              projectStore.projectShares = [];
              projectStore.sharedProjects = [];
              projectStore.dailyProjectLogs = [];
              
              streakStore.currentStreak = 0;
              streakStore.lastCompletedDate = null;
              streakStore.longestStreak = 0;
              streakStore.streakHistory = [];
              
              friendStore.friends = [];
              friendStore.friendRequests = [];
              friendStore.searchResults = [];
              friendStore.contactSuggestions = [];
              
              challengeStore.challenges = [];
              
              achievementStore.unlockedAchievements = [];
              achievementStore.progress = {};
              
              activityFeedStore.activities = [];
              
              characterStore.character = {
                id: '1',
                name: 'My Character',
                level: 1,
                experience: 0,
                experienceToNext: 100,
                appearance: {
                  skinTone: '#F4C2A1',
                  hairColor: '#8B4513',
                  hairStyle: 'short',
                  eyeColor: '#4A90E2',
                  outfit: 'casual'
                },
                stats: {
                  strength: 1,
                  endurance: 1,
                  focus: 1,
                  creativity: 1
                },
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              };
              
              weeklyWorkoutStore.currentWeekPlan = null;
              weeklyWorkoutStore.weeklyStreak = 0;
              weeklyWorkoutStore.lastWeekStart = null;
              
              // Delete the account
              await deleteAccount();
              
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleSaveReflection = (date: string) => {
    if (reflectionText.trim()) {
      addReflection(date, reflectionText.trim());
      setEditingReflection(null);
      setReflectionText('');
      Alert.alert('Success', 'Reflection saved successfully');
    }
  };
  
  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const handleUsernameTypeSwitch = () => {
    if (!user) return;
    
    const newType = user.usernameType === 'real' ? 'anonymous' : 'real';
    const newUsername = newType === 'real' ? user.username : user.anonymousUsername;
    
    Alert.alert(
      'Change Username Display',
      `Switch to ${newType === 'real' ? 'real name' : 'anonymous'} username?

New username: ${newUsername}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch', 
          onPress: () => {
            switchUsernameType(newType);
            Alert.alert('Success', 'Username display changed successfully');
          }
        },
      ]
    );
  };
  
  const getVisibilityIcon = (type: 'private' | 'friends' | 'public') => {
    switch (type) {
      case 'private':
        return <Eye size={20} color={accountVisibility === type ? colors.primary : colors.text.secondary} />;
      case 'friends':
        return <Users size={20} color={accountVisibility === type ? colors.primary : colors.text.secondary} />;
      case 'public':
        return <Globe size={20} color={accountVisibility === type ? colors.primary : colors.text.secondary} />;
    }
  };
  
  const getVisibilityDescription = (type: 'private' | 'friends' | 'public') => {
    switch (type) {
      case 'private':
        return 'Only you can view your streaks and goals';
      case 'friends':
        return 'Share streaks and goals with mutual friends';
      case 'public':
        return 'Share your streaks and goals publicly';
    }
  };

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return <Sun size={20} color={themeMode === mode ? colors.primary : colors.text.secondary} />;
      case 'dark':
        return <Moon size={20} color={themeMode === mode ? colors.primary : colors.text.secondary} />;
      case 'system':
        return <Smartphone size={20} color={themeMode === mode ? colors.primary : colors.text.secondary} />;
    }
  };

  const getThemeDescription = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Always use light theme';
      case 'dark':
        return 'Always use dark theme';
      case 'system':
        return 'Follow device system settings';
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
  
  const renderTaskSnapshot = (tasks: TaskSnapshot[]) => {
    const displayTasks = tasks.slice(0, 5);
    const remainingCount = tasks.length - displayTasks.length;
    
    return (
      <View style={styles.taskSnapshot}>
        {displayTasks.map((task) => (
          <View key={task.id} style={styles.taskSnapshotItem}>
            {task.completed ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <X size={16} color={colors.text.light} />
            )}
            <Text 
              style={[
                styles.taskSnapshotText, 
                { color: task.completed ? colors.text.primary : colors.text.light },
                task.completed && { textDecorationLine: 'line-through' }
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={[styles.moreTasksText, { color: colors.text.secondary }]}>
            +{remainingCount} more
          </Text>
        )}
      </View>
    );
  };

  const renderNutritionSnapshot = (entries: any[]) => {
    const displayEntries = entries.slice(0, 3);
    const remainingCount = entries.length - displayEntries.length;
    
    return (
      <View style={styles.nutritionSnapshot}>
        {displayEntries.map((entry) => (
          <View key={entry.id} style={styles.nutritionSnapshotItem}>
            <Utensils size={16} color={colors.primary} />
            <View style={styles.nutritionSnapshotContent}>
              <Text style={[styles.nutritionSnapshotName, { color: colors.text.primary }]} numberOfLines={1}>
                {entry.foodName || entry.name}
              </Text>
              <Text style={[styles.nutritionSnapshotDetails, { color: colors.text.secondary }]}>
                {entry.calories} cal • {entry.protein || 0}g protein • {entry.mealType}
              </Text>
            </View>
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={[styles.moreEntriesText, { color: colors.text.secondary }]}>
            +{remainingCount} more entries
          </Text>
        )}
      </View>
    );
  };

  const renderWorkoutSnapshot = (sessions: any[]) => {
    const displaySessions = sessions.slice(0, 3);
    const remainingCount = sessions.length - displaySessions.length;
    
    return (
      <View style={styles.workoutSnapshot}>
        {displaySessions.map((session) => (
          <View key={session.id} style={styles.workoutSnapshotItem}>
            <Dumbbell size={16} color={colors.primary} />
            <View style={styles.workoutSnapshotContent}>
              <Text style={[styles.workoutSnapshotName, { color: colors.text.primary }]} numberOfLines={1}>
                {session.name}
              </Text>
              <Text style={[styles.workoutSnapshotDetails, { color: colors.text.secondary }]}>
                {session.duration || 0} min • {session.exercises.length} exercises
              </Text>
            </View>
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={[styles.moreEntriesText, { color: colors.text.secondary }]}>
            +{remainingCount} more sessions
          </Text>
        )}
      </View>
    );
  };

  const renderGoalSnapshot = (goals: any[]) => {
    const displayGoals = goals.slice(0, 3);
    const remainingCount = goals.length - displayGoals.length;
    
    return (
      <View style={styles.goalSnapshot}>
        {displayGoals.map((goal) => (
          <View key={goal.id} style={styles.goalSnapshotItem}>
            <Target size={16} color={goal.status === 'completed' ? colors.success : colors.primary} />
            <View style={styles.goalSnapshotContent}>
              <Text style={[styles.goalSnapshotName, { color: colors.text.primary }]} numberOfLines={1}>
                {goal.title}
              </Text>
              <Text style={[styles.goalSnapshotDetails, { color: colors.text.secondary }]}>
                {goal.progress}% • {goal.status} • {goal.category}
              </Text>
            </View>
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={[styles.moreEntriesText, { color: colors.text.secondary }]}>
            +{remainingCount} more goals
          </Text>
        )}
      </View>
    );
  };

  const renderProjectSnapshot = (projects: any[]) => {
    const displayProjects = projects.slice(0, 3);
    const remainingCount = projects.length - displayProjects.length;
    
    return (
      <View style={styles.projectSnapshot}>
        {displayProjects.map((project) => (
          <View key={project.id} style={styles.projectSnapshotItem}>
            <Folder size={16} color={project.status === 'completed' ? colors.success : colors.primary} />
            <View style={styles.projectSnapshotContent}>
              <Text style={[styles.projectSnapshotName, { color: colors.text.primary }]} numberOfLines={1}>
                {project.name}
              </Text>
              <Text style={[styles.projectSnapshotDetails, { color: colors.text.secondary }]}>
                {project.status} • {project.progress || 0}% complete
              </Text>
            </View>
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={[styles.moreEntriesText, { color: colors.text.secondary }]}>
            +{remainingCount} more projects
          </Text>
        )}
      </View>
    );
  };
  
  const renderArchiveSection = () => {
    const dailyTaskLogs = getDailyTaskLogs();
    const dailyNutritionLogs = getDailyNutritionLogs();
    const dailyWorkoutLogs = getDailyWorkoutLogs();
    const dailyGoalLogs = getDailyGoalLogs();
    const dailyProjectLogs = getDailyProjectLogs();
    
    return (
      <View style={styles.archiveContainer}>
        <View style={styles.archiveHeader}>
          <Text style={[styles.archiveTitle, { color: colors.text.primary }]}>
            Daily Archive
          </Text>
          <Text style={[styles.archiveSubtitle, { color: colors.text.secondary }]}>
            Your daily productivity and wellness journey
          </Text>
        </View>

        {/* Archive Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.archiveTabsContainer}>
          <View style={styles.archiveTabs}>
            <TouchableOpacity
              style={[
                styles.archiveTab,
                archiveTab === 'tasks' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setArchiveTab('tasks')}
            >
              <Text style={[
                styles.archiveTabText,
                { color: archiveTab === 'tasks' ? colors.primary : colors.text.secondary }
              ]}>
                Tasks ({dailyTaskLogs.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.archiveTab,
                archiveTab === 'nutrition' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setArchiveTab('nutrition')}
            >
              <Text style={[
                styles.archiveTabText,
                { color: archiveTab === 'nutrition' ? colors.primary : colors.text.secondary }
              ]}>
                Nutrition ({dailyNutritionLogs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.archiveTab,
                archiveTab === 'workouts' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setArchiveTab('workouts')}
            >
              <Text style={[
                styles.archiveTabText,
                { color: archiveTab === 'workouts' ? colors.primary : colors.text.secondary }
              ]}>
                Workouts ({dailyWorkoutLogs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.archiveTab,
                archiveTab === 'goals' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setArchiveTab('goals')}
            >
              <Text style={[
                styles.archiveTabText,
                { color: archiveTab === 'goals' ? colors.primary : colors.text.secondary }
              ]}>
                Goals ({dailyGoalLogs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.archiveTab,
                archiveTab === 'projects' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setArchiveTab('projects')}
            >
              <Text style={[
                styles.archiveTabText,
                { color: archiveTab === 'projects' ? colors.primary : colors.text.secondary }
              ]}>
                Projects ({dailyProjectLogs.length})
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Archive Content */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.archiveContent}>
          {archiveTab === 'tasks' && (
            dailyTaskLogs.length === 0 ? (
              <View style={[styles.emptyArchive, { backgroundColor: colors.background.primary }]}>
                <Calendar size={48} color={colors.text.light} />
                <Text style={[styles.emptyArchiveText, { color: colors.text.secondary }]}>
                  No task history yet
                </Text>
                <Text style={[styles.emptyArchiveSubtext, { color: colors.text.light }]}>
                  Complete some daily tasks to start building your archive
                </Text>
              </View>
            ) : (
              dailyTaskLogs.map((log) => (
                <View key={log.id} style={[styles.sessionCard, { backgroundColor: colors.background.primary }]}>
                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionDate, { color: colors.text.primary }]}>
                      {formatDate(log.date)}
                    </Text>
                    <View style={styles.sessionStats}>
                      <View style={styles.streakBadge}>
                        <Flame size={14} color={colors.primary} />
                        <Text style={[styles.streakText, { color: colors.primary }]}>
                          Day {log.streakCount}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.sessionContent}>
                    <View style={styles.taskSummary}>
                      <Text style={[styles.taskSummaryTitle, { color: colors.text.secondary }]}>
                        Tasks ({log.completedTasksCount}/{log.totalTasksCount} completed)
                      </Text>
                      {renderTaskSnapshot(log.tasks)}
                    </View>
                  </View>
                </View>
              ))
            )
          )}

          {archiveTab === 'nutrition' && (
            dailyNutritionLogs.length === 0 ? (
              <View style={[styles.emptyArchive, { backgroundColor: colors.background.primary }]}>
                <Utensils size={48} color={colors.text.light} />
                <Text style={[styles.emptyArchiveText, { color: colors.text.secondary }]}>
                  No nutrition history yet
                </Text>
                <Text style={[styles.emptyArchiveSubtext, { color: colors.text.light }]}>
                  Log some meals to start building your nutrition archive
                </Text>
              </View>
            ) : (
              dailyNutritionLogs.map((log) => (
                <View key={log.id} style={[styles.sessionCard, { backgroundColor: colors.background.primary }]}>
                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionDate, { color: colors.text.primary }]}>
                      {formatDate(log.date)}
                    </Text>
                    <View style={styles.nutritionSummaryStats}>
                      <Text style={[styles.nutritionCalories, { color: colors.primary }]}>
                        {log.totalCalories} cal
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sessionContent}>
                    <View style={styles.nutritionSummary}>
                      <Text style={[styles.nutritionSummaryTitle, { color: colors.text.secondary }]}>
                        Nutrition Summary
                      </Text>
                      
                      <View style={styles.nutritionMacros}>
                        <View style={styles.macroItem}>
                          <Text style={[styles.macroValue, { color: colors.text.primary }]}>{log.totalProtein}g</Text>
                          <Text style={[styles.macroLabel, { color: colors.text.secondary }]}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={[styles.macroValue, { color: colors.text.primary }]}>{log.totalCarbs}g</Text>
                          <Text style={[styles.macroLabel, { color: colors.text.secondary }]}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={[styles.macroValue, { color: colors.text.primary }]}>{log.totalFat}g</Text>
                          <Text style={[styles.macroLabel, { color: colors.text.secondary }]}>Fat</Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.nutritionEntriesTitle, { color: colors.text.secondary }]}>
                        Meals ({log.entries.length} entries)
                      </Text>
                      {renderNutritionSnapshot(log.entries)}
                    </View>
                  </View>
                </View>
              ))
            )
          )}

          {archiveTab === 'workouts' && (
            dailyWorkoutLogs.length === 0 ? (
              <View style={[styles.emptyArchive, { backgroundColor: colors.background.primary }]}>
                <Dumbbell size={48} color={colors.text.light} />
                <Text style={[styles.emptyArchiveText, { color: colors.text.secondary }]}>
                  No workout history yet
                </Text>
                <Text style={[styles.emptyArchiveSubtext, { color: colors.text.light }]}>
                  Complete some workouts to start building your fitness archive
                </Text>
              </View>
            ) : (
              dailyWorkoutLogs.map((log) => (
                <View key={log.id} style={[styles.sessionCard, { backgroundColor: colors.background.primary }]}>
                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionDate, { color: colors.text.primary }]}>
                      {formatDate(log.date)}
                    </Text>
                    <View style={styles.workoutSummaryStats}>
                      <Text style={[styles.workoutDuration, { color: colors.primary }]}>
                        {log.totalDuration} min
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sessionContent}>
                    <View style={styles.workoutSummary}>
                      <Text style={[styles.workoutSummaryTitle, { color: colors.text.secondary }]}>
                        Workout Summary
                      </Text>
                      
                      <View style={styles.workoutStats}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: colors.text.primary }]}>{log.totalSessions}</Text>
                          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Sessions</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: colors.text.primary }]}>{log.totalExercises}</Text>
                          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Exercises</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: colors.text.primary }]}>{log.workoutTypes.length}</Text>
                          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Types</Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.workoutSessionsTitle, { color: colors.text.secondary }]}>
                        Sessions ({log.sessions.length} completed)
                      </Text>
                      {renderWorkoutSnapshot(log.sessions)}
                    </View>
                  </View>
                </View>
              ))
            )
          )}

          {archiveTab === 'goals' && (
            dailyGoalLogs.length === 0 ? (
              <View style={[styles.emptyArchive, { backgroundColor: colors.background.primary }]}>
                <Target size={48} color={colors.text.light} />
                <Text style={[styles.emptyArchiveText, { color: colors.text.secondary }]}>
                  No goal history yet
                </Text>
                <Text style={[styles.emptyArchiveSubtext, { color: colors.text.light }]}>
                  Create and work on goals to start building your achievement archive
                </Text>
              </View>
            ) : (
              dailyGoalLogs.map((log) => (
                <View key={log.id} style={[styles.sessionCard, { backgroundColor: colors.background.primary }]}>
                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionDate, { color: colors.text.primary }]}>
                      {formatDate(log.date)}
                    </Text>
                    <View style={styles.goalSummaryStats}>
                      <Text style={[styles.goalProgress, { color: colors.primary }]}>
                        {log.completedGoals}/{log.totalGoals} completed
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sessionContent}>
                    <View style={styles.goalSummary}>
                      <Text style={[styles.goalSummaryTitle, { color: colors.text.secondary }]}>
                        Goal Summary
                      </Text>
                      
                      <Text style={[styles.goalEntriesTitle, { color: colors.text.secondary }]}>
                        Goals ({log.goals.length} total)
                      </Text>
                      {renderGoalSnapshot(log.goals)}
                    </View>
                  </View>
                </View>
              ))
            )
          )}

          {archiveTab === 'projects' && (
            dailyProjectLogs.length === 0 ? (
              <View style={[styles.emptyArchive, { backgroundColor: colors.background.primary }]}>
                <Folder size={48} color={colors.text.light} />
                <Text style={[styles.emptyArchiveText, { color: colors.text.secondary }]}>
                  No project history yet
                </Text>
                <Text style={[styles.emptyArchiveSubtext, { color: colors.text.light }]}>
                  Create and manage projects to start building your project archive
                </Text>
              </View>
            ) : (
              dailyProjectLogs.map((log) => (
                <View key={log.id} style={[styles.sessionCard, { backgroundColor: colors.background.primary }]}>
                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionDate, { color: colors.text.primary }]}>
                      {formatDate(log.date)}
                    </Text>
                    <View style={styles.projectSummaryStats}>
                      <Text style={[styles.projectProgress, { color: colors.primary }]}>
                        {log.completedProjects}/{log.totalProjects} completed
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sessionContent}>
                    <View style={styles.projectSummary}>
                      <Text style={[styles.projectSummaryTitle, { color: colors.text.secondary }]}>
                        Project Summary
                      </Text>
                      
                      <Text style={[styles.projectEntriesTitle, { color: colors.text.secondary }]}>
                        Projects ({log.projects.length} total)
                      </Text>
                      {renderProjectSnapshot(log.projects)}
                    </View>
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      </View>
    );
  };

  const renderCollapsibleSection = (
    id: ExpandedSection,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedSection === id;
    
    return (
      <View style={[styles.collapsibleSection, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity
          style={styles.sectionToggle}
          onPress={() => toggleSection(id)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionToggleLeft}>
            {icon}
            <Text style={[styles.sectionToggleTitle, { color: colors.text.primary }]}>
              {title}
            </Text>
          </View>
          {isExpanded ? (
            <ChevronDown size={20} color={colors.text.secondary} />
          ) : (
            <ChevronRight size={20} color={colors.text.secondary} />
          )}
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            {content}
          </View>
        )}
      </View>
    );
  };
  
  const renderMainSettings = () => {
    return (
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Style Section */}
        {renderCollapsibleSection(
          'theme',
          'App Style',
          <SettingsIcon size={20} color={colors.primary} />,
          <View>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Choose your preferred theme appearance
            </Text>
            
            <View style={styles.themeOptions}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    { borderColor: themeMode === mode ? colors.primary : colors.border },
                    themeMode === mode && { backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => setTheme(mode)}
                >
                  <View style={styles.themeOptionHeader}>
                    {getThemeIcon(mode)}
                    <Text style={[
                      styles.themeOptionTitle,
                      { color: themeMode === mode ? colors.primary : colors.text.primary }
                    ]}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                    </Text>
                    {themeMode === mode && (
                      <Check size={16} color={colors.primary} style={styles.checkIcon} />
                    )}
                  </View>
                  
                  <Text style={[
                    styles.themeOptionDescription,
                    { color: themeMode === mode ? colors.text.primary : colors.text.secondary }
                  ]}>
                    {getThemeDescription(mode)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Profile Section */}
        {renderCollapsibleSection(
          'profile',
          'Profile Information',
          <User size={20} color={colors.primary} />,
          <View>
            {/* Username Display and Type Switcher */}
            <View style={[styles.usernameContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
              <View style={styles.usernameHeader}>
                <AtSign size={16} color={colors.text.secondary} />
                <Text style={[styles.usernameLabel, { color: colors.text.secondary }]}>Username</Text>
              </View>
              
              <View style={styles.usernameContent}>
                <View style={styles.usernameDisplay}>
                  <Text style={[styles.usernameText, { color: colors.text.primary }]}>
                    {user?.usernameType === 'real' ? user?.username : user?.anonymousUsername}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.usernameToggle}
                  onPress={handleUsernameTypeSwitch}
                >
                  {user?.usernameType === 'real' ? (
                    <ToggleRight size={24} color={colors.primary} />
                  ) : (
                    <ToggleLeft size={24} color={colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.usernameNote, { color: colors.text.light }]}>
                Toggle between your real name username ({user?.username}) and anonymous username ({user?.anonymousUsername})
              </Text>
            </View>

            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.nameField}>
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  autoCapitalize="words"
                />
              </View>
            </View>
            
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Button
              title="Save Profile"
              onPress={handleSaveProfile}
              icon={<Save size={18} color="white" />}
              style={styles.saveButton}
            />
          </View>
        )}
        
        {/* Password Section */}
        {renderCollapsibleSection(
          'password',
          'Change Password',
          <Lock size={20} color={colors.primary} />,
          <View>
            <Input
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              isPassword
            />
            
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              isPassword
            />
            
            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              isPassword
            />
            
            <Button
              title="Change Password"
              onPress={handleChangePassword}
              icon={<Lock size={18} color="white" />}
              style={styles.saveButton}
              variant="outline"
            />
          </View>
        )}
        
        {/* Privacy Settings Section */}
        {renderCollapsibleSection(
          'privacy',
          'Privacy Settings',
          <Shield size={20} color={colors.primary} />,
          <View>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Control who can see your activities, streaks, and goals
            </Text>
            
            <View style={styles.visibilityOptions}>
              {(['private', 'friends', 'public'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.visibilityOption,
                    { borderColor: accountVisibility === type ? colors.primary : colors.border },
                    accountVisibility === type && { backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => setAccountVisibility(type)}
                >
                  <View style={styles.visibilityOptionHeader}>
                    {getVisibilityIcon(type)}
                    <Text style={[
                      styles.visibilityOptionTitle,
                      { color: accountVisibility === type ? colors.primary : colors.text.primary }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} Mode
                    </Text>
                    {accountVisibility === type && (
                      <Check size={16} color={colors.primary} style={styles.checkIcon} />
                    )}
                  </View>
                  
                  <Text style={[
                    styles.visibilityOptionDescription,
                    { color: accountVisibility === type ? colors.text.primary : colors.text.secondary }
                  ]}>
                    {getVisibilityDescription(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Button
              title="Save Privacy Settings"
              onPress={handleSavePrivacySettings}
              icon={<Shield size={18} color="white" />}
              style={styles.saveButton}
            />
          </View>
        )}
        
        {/* Archive Section */}
        {renderCollapsibleSection(
          'archive',
          'Archive',
          <Archive size={20} color={colors.primary} />,
          <View>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              View your daily productivity sessions, task history, nutrition logs, workout sessions, goals, and project updates
            </Text>
            
            <Button
              title="View Archive"
              onPress={() => setActiveSection('archive')}
              icon={<Archive size={18} color="white" />}
              style={styles.saveButton}
            />
          </View>
        )}
        
        {/* Support Section */}
        {renderCollapsibleSection(
          'support',
          'Support',
          <HelpCircle size={20} color={colors.primary} />,
          <View>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Need help or have feedback? Get in touch with our support team
            </Text>
            
            <Button
              title="Contact Support"
              onPress={() => router.push('/support')}
              icon={<MessageCircle size={18} color="white" />}
              style={styles.saveButton}
            />
          </View>
        )}

        {/* Delete Account Section */}
        {renderCollapsibleSection(
          'delete',
          'Delete Account',
          <Trash2 size={20} color={colors.danger} />,
          <View>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Text>
            
            <Button
              title={isDeleting ? "Deleting Account..." : "Delete Account"}
              onPress={handleDeleteAccount}
              icon={<Trash2 size={18} color={colors.danger} />}
              style={[styles.saveButton, { borderColor: colors.danger }]}
              textStyle={{ color: colors.danger }}
              variant="outline"
              disabled={isDeleting}
            />
          </View>
        )}
        
        {/* Logout Section */}
        <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
          <View style={styles.sectionContent}>
            <Button
              title="Logout"
              onPress={handleLogout}
              icon={<LogOut size={18} color={colors.danger} />}
              style={[styles.saveButton, { borderColor: colors.danger }]}
              textStyle={{ color: colors.danger }}
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (activeSection === 'archive') {
              setActiveSection('main');
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {activeSection === 'archive' ? 'Archive' : 'Settings'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      {activeSection === 'archive' ? renderArchiveSection() : renderMainSettings()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  collapsibleSection: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  usernameContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  usernameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usernameLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  usernameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usernameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  usernameToggle: {
    padding: 4,
  },
  usernameNote: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
  },
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  themeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  themeOptionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  visibilityOptions: {
    gap: 12,
  },
  visibilityOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  visibilityOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  visibilityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  visibilityOptionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  archiveContainer: {
    flex: 1,
    padding: 16,
  },
  archiveHeader: {
    marginBottom: 24,
  },
  archiveTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  archiveSubtitle: {
    fontSize: 16,
  },
  archiveTabsContainer: {
    marginBottom: 20,
  },
  archiveTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  archiveTab: {
    paddingVertical: 8, // Reduced from 12 to 8
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 100,
  },
  archiveTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  archiveContent: {
    flex: 1,
  },
  emptyArchive: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderRadius: 12,
  },
  emptyArchiveText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyArchiveSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  sessionDate: {
    fontSize: 18,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionCalories: {
    fontSize: 16,
    fontWeight: '600',
  },
  workoutSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgress: {
    fontSize: 16,
    fontWeight: '600',
  },
  projectSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectProgress: {
    fontSize: 16,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  sessionContent: {
    gap: 16,
  },
  taskSummary: {},
  taskSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskSnapshot: {
    gap: 6,
  },
  taskSnapshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskSnapshotText: {
    fontSize: 14,
    flex: 1,
  },
  moreTasksText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  nutritionSummary: {},
  nutritionSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  nutritionMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 12,
  },
  nutritionEntriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  nutritionSnapshot: {
    gap: 8,
  },
  nutritionSnapshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutritionSnapshotContent: {
    flex: 1,
  },
  nutritionSnapshotName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  nutritionSnapshotDetails: {
    fontSize: 12,
  },
  moreEntriesText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  workoutSummary: {},
  workoutSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
  },
  workoutSessionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  workoutSnapshot: {
    gap: 8,
  },
  workoutSnapshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutSnapshotContent: {
    flex: 1,
  },
  workoutSnapshotName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  workoutSnapshotDetails: {
    fontSize: 12,
  },
  goalSummary: {},
  goalSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  goalEntriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalSnapshot: {
    gap: 8,
  },
  goalSnapshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalSnapshotContent: {
    flex: 1,
  },
  goalSnapshotName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  goalSnapshotDetails: {
    fontSize: 12,
  },
  projectSummary: {},
  projectSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  projectEntriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  projectSnapshot: {
    gap: 8,
  },
  projectSnapshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectSnapshotContent: {
    flex: 1,
  },
  projectSnapshotName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  projectSnapshotDetails: {
    fontSize: 12,
  },
  reflectionSection: {},
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  reflectionDisplay: {
    minHeight: 40,
    justifyContent: 'center',
  },
  reflectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  reflectionPlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  reflectionEdit: {
    gap: 12,
  },
  reflectionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  reflectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reflectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  reflectionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});