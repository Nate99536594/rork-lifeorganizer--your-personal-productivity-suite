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
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  AtSign,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Crown
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
import { Logo } from '@/components/Logo';

type ExpandedSection = 'theme' | 'profile' | 'password' | 'privacy' | 'subscription' | 'support' | 'delete' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, updateProfile, updatePrivacySettings, switchUsernameType, logout, deleteAccount } = useAuthStore();
  const { themeMode, setTheme } = useThemeStore();
  
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountVisibility, setAccountVisibility] = useState<'private' | 'friends' | 'public'>(
    user?.privacySettings?.accountVisibility || 'friends'
  );
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
              
              achievementStore.userAchievements = [];
              achievementStore.achievementProgress = {};
              
              activityFeedStore.activities = [];
              
              characterStore.character = {
                id: 'default',
                skinTone: 'light',
                hairColor: 'black',
                hairStyle: 'short',
                eyeColor: 'brown',
                bodyType: 'average',
                clothingColor: 'blue',
                accessories: [],
              };
              
              weeklyWorkoutStore.currentWeeklyPlan = null;
              weeklyWorkoutStore.weeklyStreak = 0;
              weeklyWorkoutStore.currentWeekStart = '';
              
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Settings
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
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
        
        {/* Subscription Section */}
        {renderCollapsibleSection(
          'subscription',
          'StreakFlow Premium',
          <Crown size={20} color={colors.primary} />,
          <View>
            <View style={[styles.subscriptionHeader, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
              <View style={styles.subscriptionLogoContainer}>
                <Logo size={32} color={colors.primary} />
                <View style={styles.subscriptionTitleContainer}>
                  <Text style={[styles.subscriptionTitle, { color: colors.text.primary }]}>
                    StreakFlow Premium
                  </Text>
                  <View style={styles.subscriptionStatusContainer}>
                    {user?.isPremium ? (
                      <>
                        <Check size={16} color={colors.success} />
                        <Text style={[styles.subscriptionStatus, { color: colors.success }]}>
                          Active
                        </Text>
                      </>
                    ) : (
                      <>
                        <Crown size={16} color={colors.text.secondary} />
                        <Text style={[styles.subscriptionStatus, { color: colors.text.secondary }]}>
                          Not Active
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              {user?.isPremium 
                ? 'You have access to all premium features including AI workout assistance, project collaboration, and advanced analytics.'
                : 'Upgrade to Premium to unlock AI workout assistance, project collaboration, and advanced analytics.'
              }
            </Text>
            
            {!user?.isPremium && (
              <Button
                title="Upgrade to Premium"
                onPress={() => router.push('/modal')}
                icon={<Crown size={18} color="white" />}
                style={styles.saveButton}
              />
            )}
            
            {user?.isPremium && (
              <View style={[styles.premiumInfo, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
                <Text style={[styles.premiumInfoText, { color: colors.text.primary }]}>
                  Thank you for being a Premium member! You have access to all features.
                </Text>
              </View>
            )}
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
  subscriptionHeader: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  subscriptionLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subscriptionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  premiumInfo: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  premiumInfoText: {
    fontSize: 14,
    textAlign: 'center',
  },
});