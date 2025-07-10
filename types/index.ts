// User types
export interface PrivacySettings {
  accountVisibility: 'private' | 'friends' | 'public';
}

export interface User {
  id: string;
  username: string;
  anonymousUsername: string;
  usernameType: 'real' | 'anonymous';
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  isPremium: boolean;
  createdAt: string;
  character?: Character;
  privacySettings?: PrivacySettings;
}

// Character types
export interface Character {
  id: string;
  name: string;
  level: number;
  experience: number;
  experienceToNext: number;
  appearance: CharacterAppearance;
  stats: CharacterStats;
  equipment: CharacterEquipment;
}

export interface CharacterAppearance {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  bodyType: string;
}

export interface CharacterStats {
  strength: number;
  endurance: number;
  flexibility: number;
  balance: number;
  speed: number;
}

export interface CharacterEquipment {
  outfit: string;
  accessories: string[];
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
  projectId?: string;
}

export interface TaskSnapshot {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailySession {
  id: string;
  date: string; // YYYY-MM-DD format
  tasks: TaskSnapshot[];
  totalTasksCount: number;
  completedTasksCount: number;
  streakCount: number;
  reflection?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  status: 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  progress?: number;
  isShared?: boolean;
  sharedBy?: string;
  sharedByName?: string;
  taskLimit?: number; // Task limit for this project (5 for regular, 20 for premium)
  createdByPremium?: boolean; // Flag to track if project was created by premium user
}

export interface ProjectPermissions {
  canEdit: boolean;
  canAddTasks: boolean;
  canDeleteTasks: boolean;
  canCompleteTasks: boolean;
  canInviteOthers: boolean;
}

export interface ProjectShare {
  id: string;
  projectId: string;
  projectName: string;
  ownerId: string;
  ownerName: string;
  sharedWithId: string;
  sharedWithName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  message?: string;
  permissions: ProjectPermissions;
}

export interface SharedProject {
  id: string;
  projectId: string;
  ownerId: string;
  ownerName: string;
  sharedWithId: string;
  sharedWithName: string;
  permissions: ProjectPermissions;
  sharedAt: string;
  lastUpdated: string;
  isActive: boolean;
}

// Goal types
export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'short-term' | 'long-term';
  targetValue: number;
  currentValue: number;
  progress: number;
  unit: string;
  category: 'fitness' | 'nutrition' | 'personal' | 'work' | 'health';
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  createdAt: string;
  status: 'active' | 'completed' | 'paused';
  completedAt?: string;
  milestones?: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: string;
}

// Nutrition types
export interface NutritionEntry {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  name?: string; // Alternative name field
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt: string;
  meals?: Array<{
    id: string;
    name: string;
    foodItems: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  }>;
}

export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: NutritionEntry[];
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

// Workout types
export interface WorkoutDay {
  id: string;
  day: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  restTime?: number; // in seconds
}

export interface ExerciseSet {
  id: string;
  reps?: number;
  weight?: number;
  duration?: number; // in seconds for time-based exercises
  distance?: number; // in meters for distance-based exercises
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  exercises: WorkoutExercise[];
  notes?: string;
  completed: boolean;
  duration?: number; // in minutes
}

export interface WeeklyWorkoutPlan {
  id: string;
  name: string;
  week: string; // YYYY-WW format
  weekStart: string; // YYYY-MM-DD format
  days: WeeklyWorkoutDay[];
  createdAt: string;
}

export interface WeeklyWorkoutDay {
  dayIndex: number; // 0-6 (Sunday-Saturday)
  isWorkoutDay: boolean;
  workoutType?: string;
  workoutDescription?: string;
  plannedDuration?: number;
  completed?: boolean;
  notes?: string;
  isCompleted?: boolean;
  completedAt?: string;
  customWorkoutName?: string;
}

// AI Workout Assistant types
export interface TrainingGoalSuggestion {
  id: string;
  name: string;
  description: string;
}

export interface WorkoutSpecifics {
  workoutDuration: number;
  includeWarmup: boolean;
  includeCooldown: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  availableEquipment: string[];
  numberOfExercises: number;
  repRange: string;
  weightPreference: string;
  restTime: string;
  focusAreas: string[];
  additionalNotes: string;
}

export interface AIWorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  restTime?: string;
  notes?: string;
}

export interface AIWorkoutPlan {
  dayIndex: number;
  dayName: string;
  workoutType: string;
  focus: string;
  estimatedDuration: number;
  warmup?: string[];
  exercises: AIWorkoutExercise[];
  cooldown?: string[];
  notes?: string;
}

export interface AIWorkoutRequest {
  trainingGoal: string;
  selectedDays: number[];
  weeklyPlan: WeeklyWorkoutPlan;
  workoutSpecifics: WorkoutSpecifics;
}

export interface AIWorkoutResponse {
  id: string;
  trainingGoal: string;
  generatedAt: string;
  workoutPlans: AIWorkoutPlan[];
  generalNotes?: string;
  workoutSpecifics: WorkoutSpecifics;
}

export interface SavedAIWorkout {
  id: string;
  name: string;
  workoutType: string;
  trainingGoal: string;
  workoutPlans: AIWorkoutPlan[];
  generalNotes?: string;
  workoutSpecifics: WorkoutSpecifics;
  tags: string[];
  isFavorite: boolean;
  savedAt: string;
}

// Archive Log types
export interface DailyTaskLog {
  id: string;
  date: string; // YYYY-MM-DD format
  tasks: TaskSnapshot[];
  totalTasksCount: number;
  completedTasksCount: number;
  streakCount: number;
}

export interface DailyNutritionLog {
  id: string;
  date: string; // YYYY-MM-DD format
  entries: NutritionEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DailyWorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD format
  sessions: WorkoutSession[];
  totalSessions: number;
  totalDuration: number; // in minutes
  totalExercises: number;
  workoutTypes: string[];
}

export interface DailyGoalLog {
  id: string;
  date: string; // YYYY-MM-DD format
  goals: Goal[];
  totalGoals: number;
  completedGoals: number;
  progressUpdates: Array<{
    goalId: string;
    goalTitle: string;
    oldProgress: number;
    newProgress: number;
    progressChange: number;
  }>;
}

export interface DailyProjectLog {
  id: string;
  date: string; // YYYY-MM-DD format
  projects: Project[];
  totalProjects: number;
  completedProjects: number;
  tasksAdded: number;
  tasksCompleted: number;
  projectUpdates: Array<{
    projectId: string;
    projectName: string;
    updateType: 'created' | 'completed' | 'updated';
    details?: string;
  }>;
}

// Streak types
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  streakHistory: StreakEntry[];
}

export interface StreakEntry {
  date: string;
  completed: boolean;
  tasksCompleted: number;
  totalTasks: number;
}

// Activity types
export type ActivityType = 'streak' | 'workout' | 'task' | 'goal' | 'challenge' | 'friend';

// Friend types
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendUsername?: string;
  friendEmail: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  acceptedAt?: string;
  isOnline?: boolean;
  isFavorite?: boolean;
  lastActive?: string;
  mutualFriends?: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  anonymousUsername: string;
  usernameType: 'real' | 'anonymous';
  displayName: string;
  bio?: string;
  isPrivate: boolean;
  friendStatus?: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';
  mutualFriends?: number;
  joinedAt: string;
  character?: Character;
}

// Search and Contact types
export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  requestSentByMe: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
}

export interface ContactSuggestion {
  contact: Contact;
  user?: {
    id: string;
    name: string;
    email: string;
    isFriend: boolean;
    hasPendingRequest: boolean;
    requestSentByMe: boolean;
  };
  isOnRork: boolean;
}

// Activity Feed types
export interface ActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  type: 'task_completed' | 'goal_achieved' | 'workout_completed' | 'streak_milestone' | 'friend_added' | 'challenge_completed';
  activityType: ActivityType;
  content: string;
  timestamp: string;
  metadata?: {
    taskTitle?: string;
    goalTitle?: string;
    workoutName?: string;
    streakCount?: number;
    friendName?: string;
    challengeTitle?: string;
    [key: string]: any;
  };
  createdAt: string;
  isVisible: boolean;
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'workout' | 'streak' | 'goal';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // in days
  targetValue?: number;
  unit?: string;
  reward: {
    experience: number;
    title?: string;
    badge?: string;
  };
  participants: ChallengeParticipant[];
  createdBy: string;
  createdByName: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'active' | 'completed' | 'upcoming' | 'cancelled' | 'declined';
  isPublic: boolean;
  maxParticipants?: number;
  createdAt: string;
  // Additional properties for challenge management
  creatorId: string;
  participantId?: string;
  creatorProgress?: number;
  participantProgress?: number;
  winnerId?: string;
}

export interface ChallengeParticipant {
  userId: string;
  userName: string;
  joinedAt: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  rank?: number;
}

// Nudge types
export interface Nudge {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  type: 'workout_reminder' | 'task_reminder' | 'goal_encouragement' | 'general_motivation';
  message: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}

// Achievement types
export type AchievementCategory = 'streak' | 'milestone' | 'social' | 'longevity';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'tasks' | 'workouts' | 'goals' | 'social' | 'streaks' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: string;
    value: number;
    description: string;
  };
  reward: {
    experience: number;
    title?: string;
  };
  unlockedAt?: string;
  progress?: number;
  isUnlocked: boolean;
}

// Shared Todo List types
export interface SharedTodoList {
  id: string;
  listId: string;
  ownerId: string;
  ownerName: string;
  sharedWithId: string;
  sharedWithName: string;
  tasks: Task[];
  title: string;
  description?: string;
  sharedAt: string;
  lastUpdated: string;
  isActive: boolean;
  permissions: {
    canView: boolean;
    canComment: boolean;
  };
}

export interface TodoListShare {
  id: string;
  listId: string;
  listTitle: string;
  ownerId: string;
  ownerName: string;
  sharedWithId: string;
  sharedWithName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  message?: string;
}