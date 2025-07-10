import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Target, ArrowRight, Filter, Crown, X, Check, BarChart, Calendar, Plus, Folder } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { GoalItem } from '@/components/GoalItem';
import { TaskItem } from '@/components/TaskItem';
import { ProjectItem } from '@/components/ProjectItem';
import { useGoalStore } from '@/store/goalStore';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { useStreakStore } from '@/store/streakStore';
import { useAuthStore } from '@/store/authStore';
import { StreakCounter } from '@/components/StreakCounter';
import { WeeklyWorkoutTracker } from '@/components/WeeklyWorkoutTracker';
import { Button } from '@/components/Button';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { goals, deleteGoal, getMonthlyGoalStats, getGoalLimits } = useGoalStore();
  const { tasks, toggleComplete, deleteTask, getMonthlyTaskStats, checkAndResetDaily } = useTaskStore();
  const { projects, getMonthlyProjectStats, deleteProject, completeProject } = useProjectStore();
  const { currentStreak, checkAndUpdateStreak } = useStreakStore();
  const { user, upgradeToPremium } = useAuthStore();
  const { getMonthlyWorkoutStats } = useWorkoutSessionStore();
  const [filterType, setFilterType] = useState<'all' | 'short-term' | 'long-term'>('all');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showMonthlyRecap, setShowMonthlyRecap] = useState(false);
  
  // Get goal limits based on premium status
  const goalLimits = getGoalLimits(user?.isPremium);
  
  // Monthly stats
  const [monthlyStats, setMonthlyStats] = useState({
    tasks: { completed: 0, incomplete: 0, total: 0 },
    workouts: { completed: 0, missed: 0, total: 0 },
    projects: { completed: 0, inProgress: 0, total: 0 },
    goals: { completed: 0, inProgress: 0, total: 0 }
  });
  
  // Check streak status and daily reset on component mount
  useEffect(() => {
    checkAndUpdateStreak();
    checkAndResetDaily();
    updateMonthlyStats();
    
    // Set up an interval to check for date changes
    const intervalId = setInterval(() => {
      checkAndUpdateStreak();
      checkAndResetDaily();
      updateMonthlyStats();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  const updateMonthlyStats = () => {
    const taskStats = getMonthlyTaskStats();
    const workoutStats = getMonthlyWorkoutStats();
    const projectStats = getMonthlyProjectStats();
    const goalStats = getMonthlyGoalStats();
    
    setMonthlyStats({
      tasks: taskStats,
      workouts: workoutStats,
      projects: projectStats,
      goals: goalStats
    });
  };
  
  const handleDeleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteGoal(id);
            Alert.alert('Success', 'Goal deleted successfully');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleDeleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteTask(id);
            Alert.alert('Success', 'Task deleted successfully');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleToggleComplete = (id: string, completed: boolean) => {
    toggleComplete(id);
    // Update monthly stats after toggling task completion
    setTimeout(updateMonthlyStats, 100);
  };
  
  // Filter goals based on type and sort (incomplete ones first, then by progress)
  const filteredGoals = goals
    .filter(goal => filterType === 'all' || goal.type === filterType)
    .sort((a, b) => {
      const aCompleted = a.status === 'completed';
      const bCompleted = b.status === 'completed';
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }
      return (b.progress || 0) - (a.progress || 0);
    });
  
  const handleAddShortTermGoal = () => {
    // Check goal limit before navigating
    if (goals.length >= goalLimits.total) {
      if (!user?.isPremium) {
        Alert.alert(
          'Limit Reached', 
          `You've reached the maximum of ${goalLimits.total} goals. Upgrade to Premium for up to 12 goals!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: () => setShowPremiumModal(true) }
          ]
        );
      } else {
        Alert.alert('Limit Reached', `You've reached the maximum of ${goalLimits.total} goals.`);
      }
      return;
    }
    
    router.push('/add-goal?type=short-term');
    setShowAddGoalModal(false);
  };
  
  const handleAddLongTermGoal = () => {
    // Check goal limit before navigating
    if (goals.length >= goalLimits.total) {
      if (!user?.isPremium) {
        Alert.alert(
          'Limit Reached', 
          `You've reached the maximum of ${goalLimits.total} goals. Upgrade to Premium for up to 12 goals!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: () => setShowPremiumModal(true) }
          ]
        );
      } else {
        Alert.alert('Limit Reached', `You've reached the maximum of ${goalLimits.total} goals.`);
      }
      return;
    }
    
    router.push('/add-goal?type=long-term');
    setShowAddGoalModal(false);
  };
  
  // Get only general tasks (tasks without projectId)
  const generalTasks = tasks.filter(task => !task.projectId);
  
  const handleDeleteProject = (id: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? All tasks within this project will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteProject(id);
            Alert.alert('Success', 'Project deleted successfully');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleCompleteProject = (id: string) => {
    Alert.alert(
      'Complete Project',
      'Are you sure you want to mark this project as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            completeProject(id);
            Alert.alert('Success', 'Project completed successfully!');
          }
        },
      ]
    );
  };
  
  const premiumFeatures = [
    'Projects - Create and manage up to 5 projects to organize your tasks',
    'AI workout assistant - Get personalized workout plans tailored to your fitness goals',
    'Up to 30 tasks - Expand beyond the standard 8 task limit',
    'Up to 12 goals - Expand beyond the standard 3 goal limit',
    'Up to 20 tasks per project - Organize your work efficiently',
    'Monthly recap - Detailed insights on completed and unfinished tasks/workouts'
  ];

  const handleUpgradeToPremium = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Directly upgrade to premium without payment processing
      await upgradeToPremium();
      
      // Close modal
      setShowPremiumModal(false);
    } catch (error) {
      Alert.alert('Upgrade Failed', 'There was an issue upgrading your account. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
  };
  
  // Get current month name
  const getCurrentMonthName = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonth = new Date().getMonth();
    return months[currentMonth];
  };
  
  // Calculate percentage for progress bars
  const calculatePercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text.primary, fontFamily: colors.fonts?.bold }]}>Welcome Back!</Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                Keep up the great work
              </Text>
            </View>
            
            {!user?.isPremium && (
              <TouchableOpacity 
                style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowPremiumModal(true)}
              >
                <Crown size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Daily Streak Section */}
        <View style={[styles.streakSection, { backgroundColor: colors.background.primary }]}>
          <View style={styles.streakHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
              Daily Streak
            </Text>
          </View>
          
          <View style={styles.streakContent}>
            <StreakCounter streak={currentStreak} size="large" type="daily" />
            <Text style={[styles.streakDescription, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
              {currentStreak === 0 
                ? "Complete a general task to start your streak!" 
                : currentStreak === 1 
                ? "Great start! Keep it going." 
                : `Amazing! You're on fire with ${currentStreak} days!`}
            </Text>
          </View>
        </View>

        {/* Weekly Workout Tracker */}
        <WeeklyWorkoutTracker />

        {/* Monthly Recap Section */}
        <View style={[styles.monthlyRecapSection, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity 
            style={styles.monthlyRecapHeader}
            onPress={() => {
              if (!user?.isPremium) {
                setShowPremiumModal(true);
              } else {
                setShowMonthlyRecap(!showMonthlyRecap);
              }
            }}
          >
            <View style={styles.monthlyRecapTitleContainer}>
              <BarChart size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                {getCurrentMonthName()} Recap
              </Text>
              {!user?.isPremium && (
                <View style={styles.premiumFeatureTag}>
                  <Crown size={16} color={colors.primary} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {user?.isPremium && showMonthlyRecap && (
            <View style={styles.monthlyRecapContent}>
              {/* Tasks Stats */}
              <View style={styles.recapCategory}>
                <Text style={[styles.recapCategoryTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Tasks
                </Text>
                <View style={styles.recapStats}>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.success, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.tasks.completed}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Completed
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.danger, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.tasks.incomplete}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Incomplete
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.text.primary, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.tasks.total}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Total
                    </Text>
                  </View>
                </View>
                <View style={styles.recapProgressContainer}>
                  <View style={[styles.recapProgressBackground, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.recapProgressFill, 
                        { 
                          backgroundColor: colors.success,
                          width: `${calculatePercentage(monthlyStats.tasks.completed, monthlyStats.tasks.total)}%` 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.recapProgressText, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                    {calculatePercentage(monthlyStats.tasks.completed, monthlyStats.tasks.total)}% Completion Rate
                  </Text>
                </View>
              </View>
              
              {/* Workouts Stats */}
              <View style={styles.recapCategory}>
                <Text style={[styles.recapCategoryTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Workouts
                </Text>
                <View style={styles.recapStats}>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.success, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.workouts.completed}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Completed
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.danger, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.workouts.missed}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Missed
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.text.primary, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.workouts.total}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Planned
                    </Text>
                  </View>
                </View>
                <View style={styles.recapProgressContainer}>
                  <View style={[styles.recapProgressBackground, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.recapProgressFill, 
                        { 
                          backgroundColor: colors.success,
                          width: `${calculatePercentage(monthlyStats.workouts.completed, monthlyStats.workouts.total)}%` 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.recapProgressText, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                    {calculatePercentage(monthlyStats.workouts.completed, monthlyStats.workouts.total)}% Completion Rate
                  </Text>
                </View>
              </View>
              
              {/* Projects Stats */}
              <View style={styles.recapCategory}>
                <Text style={[styles.recapCategoryTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Projects
                </Text>
                <View style={styles.recapStats}>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.success, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.projects.completed}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Completed
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.warning, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.projects.inProgress}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      In Progress
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.text.primary, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.projects.total}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Total
                    </Text>
                  </View>
                </View>
                <View style={styles.recapProgressContainer}>
                  <View style={[styles.recapProgressBackground, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.recapProgressFill, 
                        { 
                          backgroundColor: colors.success,
                          width: `${calculatePercentage(monthlyStats.projects.completed, monthlyStats.projects.total)}%` 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.recapProgressText, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                    {calculatePercentage(monthlyStats.projects.completed, monthlyStats.projects.total)}% Completion Rate
                  </Text>
                </View>
              </View>
              
              {/* Goals Stats */}
              <View style={styles.recapCategory}>
                <Text style={[styles.recapCategoryTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Goals
                </Text>
                <View style={styles.recapStats}>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.success, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.goals.completed}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Completed
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.warning, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.goals.inProgress}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      In Progress
                    </Text>
                  </View>
                  <View style={styles.recapStatItem}>
                    <Text style={[styles.recapStatValue, { color: colors.text.primary, fontFamily: colors.fonts?.bold }]}>
                      {monthlyStats.goals.total}
                    </Text>
                    <Text style={[styles.recapStatLabel, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      Total
                    </Text>
                  </View>
                </View>
                <View style={styles.recapProgressContainer}>
                  <View style={[styles.recapProgressBackground, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.recapProgressFill, 
                        { 
                          backgroundColor: colors.success,
                          width: `${calculatePercentage(monthlyStats.goals.completed, monthlyStats.goals.total)}%` 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.recapProgressText, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                    {calculatePercentage(monthlyStats.goals.completed, monthlyStats.goals.total)}% Completion Rate
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.viewDetailedRecapButton, { borderColor: colors.border }]}
                onPress={() => {
                  // This could navigate to a more detailed recap screen in the future
                  Alert.alert('Coming Soon', 'Detailed monthly analytics will be available in a future update!');
                }}
              >
                <Calendar size={16} color={colors.primary} />
                <Text style={[styles.viewDetailedRecapText, { color: colors.primary, fontFamily: colors.fonts?.medium }]}>
                  View Detailed Monthly Analytics
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {!user?.isPremium && (
            <View style={styles.premiumFeatureTeaser}>
              <Text style={[styles.premiumFeatureTeaser, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                Upgrade to Premium to access detailed monthly statistics and insights
              </Text>
              <Button 
                title="Upgrade to Premium" 
                onPress={() => setShowPremiumModal(true)}
                variant="primary"
                size="small"
                style={styles.upgradeButton}
              />
            </View>
          )}
        </View>

        {/* Projects Section - Now visible for all users */}
        <View style={[styles.projectsSection, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity 
            style={styles.projectsSectionHeader}
            onPress={() => {
              if (!user?.isPremium) {
                setShowPremiumModal(true);
              }
            }}
          >
            <View style={styles.projectsTitleContainer}>
              <Folder size={20} color="#8B5CF6" />
              <Text style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                Projects
              </Text>
              {!user?.isPremium && (
                <View style={styles.premiumFeatureTag}>
                  <Crown size={16} color={colors.primary} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {user?.isPremium ? (
            // Premium user content
            projects.length === 0 ? (
              <View style={styles.noProjectsContainer}>
                <Text style={[styles.noProjectsText, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                  No projects yet
                </Text>
                <Button
                  title="Create Project"
                  onPress={() => router.push('/add-task?createProject=true')}
                  icon={<Plus size={18} color="white" />}
                  style={styles.createProjectButton}
                  size="medium"
                />
              </View>
            ) : (
              <View style={styles.projectsList}>
                {projects.map(project => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onPress={() => router.push(`/project/${project.id}`)}
                    onEdit={() => router.push(`/project/${project.id}?edit=true`)}
                    onDelete={() => handleDeleteProject(project.id)}
                    onComplete={() => handleCompleteProject(project.id)}
                  />
                ))}
                
                <TouchableOpacity 
                  style={[styles.addProjectButton, { borderColor: colors.border }]}
                  onPress={() => router.push('/add-task?createProject=true')}
                >
                  <Plus size={20} color={colors.primary} />
                  <Text style={[styles.addProjectText, { color: colors.primary, fontFamily: colors.fonts?.medium }]}>
                    Add New Project
                  </Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            // Non-premium user content
            <View style={styles.premiumFeatureTeaser}>
              <Text style={[styles.premiumFeatureTeaser, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                Upgrade to Premium to create and manage up to 5 projects to organize your tasks
              </Text>
              <Button 
                title="Upgrade to Premium" 
                onPress={() => setShowPremiumModal(true)}
                variant="primary"
                size="small"
                style={styles.upgradeButton}
              />
            </View>
          )}
        </View>
        
        {/* General Tasks Section */}
        {generalTasks.length > 0 && (
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <View style={styles.tasksTitleContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Today's Tasks
                </Text>
              </View>
            </View>
            
            <View style={[styles.generalTasksGroup, { backgroundColor: colors.background.primary }]}>
              <View style={styles.generalTasksHeader}>
                <Text style={[styles.generalTasksTitle, { color: colors.text.primary }]}>
                  Daily Tasks ({generalTasks.length})
                </Text>
              </View>
              
              <View style={styles.generalTasksList}>
                {generalTasks
                  .sort((a, b) => {
                    // Sort by completion status first
                    if (a.completed !== b.completed) {
                      return a.completed ? 1 : -1;
                    }
                    // Then sort by priority
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  })
                  .map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleComplete(task.id, task.completed)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onPress={() => router.push(`/task/${task.id}`)}
                    />
                  ))}
              </View>
            </View>
          </View>
        )}
        
        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsSectionHeader}>
            <View style={styles.goalsTitleContainer}>
              <Target size={20} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                Your Goals
              </Text>
            </View>
            <Text style={[styles.goalCount, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
              ({goals.length}/{goalLimits.total})
            </Text>
            {!user?.isPremium && (
              <Text style={[styles.premiumHint, { color: colors.primary }]}>
                • Premium: 12 goals
              </Text>
            )}
          </View>
          
          {/* Filter and Add Goal buttons moved below the title */}
          <View style={styles.goalsActions}>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                { borderColor: colors.border }
              ]}
              onPress={() => {
                const nextFilter = filterType === 'all' 
                  ? 'short-term' 
                  : filterType === 'short-term' 
                  ? 'long-term' 
                  : 'all';
                setFilterType(nextFilter);
              }}
            >
              <Filter size={16} color={colors.text.secondary} />
              <Text style={[styles.filterText, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                {filterType === 'all' 
                  ? 'All' 
                  : filterType === 'short-term' 
                  ? 'Short Term' 
                  : 'Long Term'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.addButton, 
                { 
                  backgroundColor: goals.length >= goalLimits.total ? colors.text.light : colors.primary,
                  opacity: goals.length >= goalLimits.total ? 0.5 : 1
                }
              ]}
              onPress={() => {
                if (goals.length >= goalLimits.total) {
                  if (!user?.isPremium) {
                    Alert.alert(
                      'Limit Reached', 
                      `You've reached the maximum of ${goalLimits.total} goals. Upgrade to Premium for up to 12 goals!`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Upgrade to Premium', onPress: () => setShowPremiumModal(true) }
                      ]
                    );
                  } else {
                    Alert.alert('Limit Reached', `You've reached the maximum of ${goalLimits.total} goals.`);
                  }
                } else {
                  setShowAddGoalModal(true);
                }
              }}
              disabled={goals.length >= goalLimits.total}
            >
              <Text style={[styles.addButtonText, { fontFamily: colors.fonts?.semiBold }]}>Add Goal</Text>
            </TouchableOpacity>
          </View>
          
          {filteredGoals.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
              <Text style={[styles.emptyText, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                {filterType === 'all' 
                  ? 'No goals yet. Create your first goal to get started!' 
                  : `No ${filterType} goals yet. Add one to get started!`}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.addGoalButton, 
                  { 
                    backgroundColor: goals.length >= goalLimits.total ? colors.text.light : colors.primary,
                    opacity: goals.length >= goalLimits.total ? 0.5 : 1
                  }
                ]}
                onPress={() => {
                  if (goals.length >= goalLimits.total) {
                    if (!user?.isPremium) {
                      Alert.alert(
                        'Limit Reached', 
                        `You've reached the maximum of ${goalLimits.total} goals. Upgrade to Premium for up to 12 goals!`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Upgrade to Premium', onPress: () => setShowPremiumModal(true) }
                        ]
                      );
                    } else {
                      Alert.alert('Limit Reached', `You've reached the maximum of ${goalLimits.total} goals.`);
                    }
                  } else {
                    setShowAddGoalModal(true);
                  }
                }}
                disabled={goals.length >= goalLimits.total}
              >
                <Text style={[styles.addGoalButtonText, { fontFamily: colors.fonts?.semiBold }]}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredGoals.map(goal => (
              <GoalItem
                key={goal.id}
                goal={goal}
                onPress={() => router.push(`/goal/${goal.id}`)}
                onDelete={() => handleDeleteGoal(goal.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
      
      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
              Add New Goal
            </Text>
            
            <TouchableOpacity 
              style={[styles.goalTypeButton, { borderColor: colors.border }]}
              onPress={handleAddShortTermGoal}
            >
              <Target size={20} color={colors.goalTypes?.shortTerm} />
              <View style={styles.goalTypeInfo}>
                <Text style={[styles.goalTypeTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Short Term Goal
                </Text>
                <Text style={[styles.goalTypeDescription, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                  Achievable in days or weeks
                </Text>
              </View>
              <ArrowRight size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.goalTypeButton, { borderColor: colors.border }]}
              onPress={handleAddLongTermGoal}
            >
              <Target size={20} color={colors.goalTypes?.longTerm} />
              <View style={styles.goalTypeInfo}>
                <Text style={[styles.goalTypeTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Long Term Goal
                </Text>
                <Text style={[styles.goalTypeDescription, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                  Achievable in months or years
                </Text>
              </View>
              <ArrowRight size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowAddGoalModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Features Modal */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePremiumModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.premiumModalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumTitleContainer}>
                <Crown size={24} color={colors.primary} />
                <Text style={[styles.premiumTitle, { color: colors.text.primary, fontFamily: colors.fonts?.bold }]}>
                  Premium Plan
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClosePremiumModal}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.premiumPricing}>
              <Text style={[styles.premiumPrice, { color: colors.primary, fontFamily: colors.fonts?.bold }]}>
                $3.99
              </Text>
              <Text style={[styles.premiumPeriod, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                per month
              </Text>
            </View>
            
            <ScrollView style={styles.premiumFeaturesContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.premiumFeatures}>
                <Text style={[styles.featuresTitle, { color: colors.text.primary, fontFamily: colors.fonts?.semiBold }]}>
                  Premium Features
                </Text>
                
                {premiumFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={20} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.text.secondary, fontFamily: colors.fonts?.regular }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.premiumActions}>
              <TouchableOpacity 
                style={[styles.upgradeToPremiumButton, { backgroundColor: colors.primary }]}
                onPress={handleUpgradeToPremium}
                disabled={isProcessingPayment}
              >
                <Crown size={20} color="white" />
                <Text style={[styles.upgradeToPremiumButtonText, { fontFamily: colors.fonts?.semiBold }]}>
                  {isProcessingPayment ? 'Upgrading...' : 'Upgrade to Premium'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelPremiumButton}
                onPress={handleClosePremiumModal}
                disabled={isProcessingPayment}
              >
                <Text style={[styles.cancelPremiumButtonText, { color: colors.text.secondary, fontFamily: colors.fonts?.medium }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  streakContent: {
    alignItems: 'center',
  },
  streakDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  // Monthly Recap Section
  monthlyRecapSection: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  monthlyRecapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  monthlyRecapTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumFeatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  premiumFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  premiumFeatureTeaser: {
    padding: 20,
    paddingTop: 0,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  monthlyRecapContent: {
    padding: 20,
    paddingTop: 0,
  },
  recapCategory: {
    marginBottom: 24,
  },
  recapCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recapStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recapStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  recapStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  recapStatLabel: {
    fontSize: 12,
  },
  recapProgressContainer: {
    alignItems: 'center',
  },
  recapProgressBackground: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  recapProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  recapProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewDetailedRecapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  viewDetailedRecapText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Projects Section
  projectsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  projectsSectionHeader: {
    marginBottom: 16,
  },
  projectsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noProjectsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noProjectsText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  createProjectButton: {
    minWidth: 150,
  },
  projectsList: {
    gap: 12,
  },
  addProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  addProjectText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tasksSection: {
    marginBottom: 24,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generalTasksGroup: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  generalTasksHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  generalTasksTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  generalTasksList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  goalsSection: {
    flex: 1,
  },
  goalsSectionHeader: {
    marginBottom: 16,
  },
  goalsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  goalCount: {
    fontSize: 14,
    marginLeft: 8,
  },
  premiumHint: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  goalsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
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
    marginBottom: 16,
  },
  addGoalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addGoalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  goalTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  goalTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalTypeDescription: {
    fontSize: 14,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumModalContent: {
    width: '100%',
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
    marginBottom: 24,
  },
  premiumTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  premiumPricing: {
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumPrice: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 4,
  },
  premiumPeriod: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumFeaturesContainer: {
    flex: 1,
    marginBottom: 24,
  },
  premiumFeatures: {
    paddingBottom: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  premiumActions: {
    gap: 12,
  },
  upgradeToPremiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  upgradeToPremiumButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelPremiumButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelPremiumButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});