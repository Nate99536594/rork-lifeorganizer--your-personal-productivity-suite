import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Award, Calendar, Flame, Users, Star, Shield, Activity, AtSign, Trophy, Settings } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { useTaskStore } from '@/store/taskStore';
import { useGoalStore } from '@/store/goalStore';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useWeeklyWorkoutStore } from '@/store/weeklyWorkoutStore';
import { useFriendStore } from '@/store/friendStore';
import { useActivityFeedStore } from '@/store/activityFeedStore';
import { useAchievementStore } from '@/store/achievementStore';
import { FlameIcon } from '@/components/FlameIcon';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { AchievementItem } from '@/components/AchievementItem';
import { AchievementPopup } from '@/components/AchievementPopup';
import { Achievement } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthStore();
  const { currentStreak, longestStreak, lastCompletedDate } = useStreakStore();
  const { tasks } = useTaskStore();
  const { goals } = useGoalStore();
  const { sessions } = useWorkoutSessionStore();
  const { getWeekProgress, weeklyStreak } = useWeeklyWorkoutStore();
  const { getFriends } = useFriendStore();
  const { getUserActivities } = useActivityFeedStore();
  const { 
    getUserAchievements, 
    getUnlockedAchievements, 
    getPendingNotifications,
    markNotificationShown 
  } = useAchievementStore();
  
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [currentAchievementPopup, setCurrentAchievementPopup] = useState<Achievement | null>(null);
  
  const allFriends = getFriends();
  const friendsCount = allFriends.length;
  const favoriteFriendsCount = allFriends.filter(friend => friend.isFavorite).length;
  
  const completedTasks = tasks.filter(task => task.completed).length;
  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  
  // Calculate weekly workout days completed
  const weekProgress = getWeekProgress(sessions);
  const weeklyWorkoutDays = weekProgress.filter(Boolean).length;
  
  // Get user's recent activities
  const userActivities = user ? getUserActivities(user.id).slice(0, 3) : [];
  
  // Get achievements
  const userAchievements = getUserAchievements();
  const unlockedAchievements = getUnlockedAchievements();
  const recentAchievements = unlockedAchievements.slice(-3); // Show last 3 unlocked
  
  // Handle achievement notifications
  useEffect(() => {
    const pendingNotifications = getPendingNotifications();
    if (pendingNotifications.length > 0) {
      const achievement = pendingNotifications[0];
      setCurrentAchievementPopup(achievement);
      setShowAchievementPopup(true);
    }
  }, []);
  
  const handleAchievementPopupClose = () => {
    if (currentAchievementPopup) {
      markNotificationShown(currentAchievementPopup.id);
    }
    setShowAchievementPopup(false);
    setCurrentAchievementPopup(null);
    
    // Check for more pending notifications
    setTimeout(() => {
      const pendingNotifications = getPendingNotifications();
      if (pendingNotifications.length > 0) {
        const achievement = pendingNotifications[0];
        setCurrentAchievementPopup(achievement);
        setShowAchievementPopup(true);
      }
    }, 500);
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAccountCreationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get first letter of first name for avatar
  const getAvatarInitial = () => {
    if (!user?.firstName) return 'U';
    return user.firstName.charAt(0).toUpperCase();
  };

  // Get first name only for display
  const getDisplayName = () => {
    if (!user?.firstName) return 'User';
    return user.firstName;
  };
  
  // Get the current username based on user preference
  const getCurrentUsername = () => {
    if (!user) return 'Not set';
    return user.usernameType === 'real' ? user.username : user.anonymousUsername;
  };
  
  // Get privacy status text
  const getPrivacyStatusText = () => {
    if (!user?.privacySettings) return 'Friends Only';
    
    switch (user.privacySettings.accountVisibility) {
      case 'private':
        return 'Private';
      case 'friends':
        return 'Friends Only';
      case 'public':
        return 'Public';
      default:
        return 'Friends Only';
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileSection, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {getAvatarInitial()}
            </Text>
          </View>
          
          <Text style={[styles.userName, { color: colors.text.primary }]}>
            {getDisplayName()}
          </Text>
          
          {/* Username Display */}
          <View style={styles.usernameContainer}>
            <AtSign size={14} color={colors.text.secondary} />
            <Text style={[styles.usernameText, { color: colors.text.secondary }]}>
              {getCurrentUsername()}
            </Text>
          </View>
          
          <Text style={[styles.userEmail, { color: colors.text.secondary }]}>
            {user?.email || 'user@example.com'}
          </Text>
          
          {/* Account creation date */}
          {user?.createdAt && (
            <Text style={[styles.accountCreatedText, { color: colors.text.light }]}>
              Account created on {formatAccountCreationDate(user.createdAt)}
            </Text>
          )}
          
          {/* Privacy Status */}
          <TouchableOpacity 
            style={[
              styles.privacyBadge,
              user?.privacySettings?.accountVisibility === 'private' 
                ? { backgroundColor: colors.danger + '20' }
                : user?.privacySettings?.accountVisibility === 'public'
                  ? { backgroundColor: colors.success + '20' }
                  : { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => router.push('/settings')}
          >
            <Shield 
              size={14} 
              color={
                user?.privacySettings?.accountVisibility === 'private' 
                  ? colors.danger
                  : user?.privacySettings?.accountVisibility === 'public'
                    ? colors.success
                    : colors.primary
              } 
            />
            <Text 
              style={[
                styles.privacyText,
                { 
                  color: user?.privacySettings?.accountVisibility === 'private' 
                    ? colors.danger
                    : user?.privacySettings?.accountVisibility === 'public'
                      ? colors.success
                      : colors.primary
                }
              ]}
            >
              {getPrivacyStatusText()}
            </Text>
          </TouchableOpacity>
          
          {/* Friends count */}
          <View style={styles.friendsStatsRow}>
            <TouchableOpacity 
              style={[styles.friendsContainer, { backgroundColor: colors.primary + '20' }]}
              onPress={() => router.push('/friends')}
            >
              <Users size={16} color={colors.primary} />
              <Text style={[styles.friendsText, { color: colors.primary }]}>
                {friendsCount} {friendsCount === 1 ? 'Friend' : 'Friends'}
              </Text>
            </TouchableOpacity>
            
            {favoriteFriendsCount > 0 && (
              <TouchableOpacity 
                style={[styles.friendsContainer, { backgroundColor: colors.warning + '20' }]}
                onPress={() => router.push({
                  pathname: '/friends',
                  params: { filter: 'favorites' }
                })}
              >
                <Star size={16} color={colors.warning} />
                <Text style={[styles.friendsText, { color: colors.warning }]}>
                  {favoriteFriendsCount} Favorites
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Achievements Section */}
        {unlockedAchievements.length > 0 && (
          <View style={[styles.achievementsSection, { backgroundColor: colors.background.primary }]}>
            <View style={styles.achievementsHeader}>
              <Trophy size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Recent Achievements</Text>
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/achievements')}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentAchievements.map(achievement => {
              const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
              return (
                <AchievementItem
                  key={achievement.id}
                  achievement={achievement}
                  userAchievement={userAchievement}
                  size="small"
                  showProgress={false}
                />
              );
            })}
            
            <TouchableOpacity 
              style={[styles.viewAchievementsButton, { backgroundColor: colors.warning + '20' }]}
              onPress={() => router.push('/achievements')}
            >
              <Trophy size={18} color={colors.warning} />
              <Text style={[styles.viewAchievementsText, { color: colors.warning }]}>
                View All Achievements ({unlockedAchievements.length} unlocked)
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Recent Activity Section */}
        {userActivities.length > 0 && (
          <View style={[styles.activitySection, { backgroundColor: colors.background.primary }]}>
            <View style={styles.activityHeader}>
              <Activity size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Recent Activity</Text>
            </View>
            
            {userActivities.map(activity => (
              <ActivityFeedItem
                key={activity.id}
                activity={activity}
              />
            ))}
          </View>
        )}
        
        <View style={[styles.streakSection, { backgroundColor: colors.background.primary }]}>
          <View style={styles.streakHeader}>
            <Flame size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Streaks</Text>
          </View>
          
          <View style={styles.streakCards}>
            <View style={[styles.streakCard, { backgroundColor: colors.background.secondary }]}>
              <FlameIcon size={40} streak={currentStreak} color={colors.dailyStreakFlame} />
              <Text style={[styles.streakCount, { color: colors.text.primary }]}>{currentStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.text.secondary }]}>Daily Streak</Text>
            </View>
            
            <View style={[styles.streakCard, { backgroundColor: colors.background.secondary }]}>
              <Award size={40} color={colors.primary} />
              <Text style={[styles.streakCount, { color: colors.text.primary }]}>{longestStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.text.secondary }]}>Longest Streak</Text>
            </View>
          </View>
          
          <View style={[styles.workoutStreakCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.workoutStreakHeader}>
              <Activity size={20} color={colors.primary} />
              <Text style={[styles.workoutStreakTitle, { color: colors.text.primary }]}>
                Weekly Workout Streak
              </Text>
            </View>
            <View style={styles.workoutStreakContent}>
              <FlameIcon size={32} streak={weeklyStreak} color={colors.primary} />
              <Text style={[styles.workoutStreakCount, { color: colors.text.primary }]}>
                {weeklyStreak} {weeklyStreak === 1 ? 'Week' : 'Weeks'}
              </Text>
              <Text style={[styles.workoutStreakSubtext, { color: colors.text.secondary }]}>
                Consecutive
              </Text>
            </View>
          </View>
          
          <View style={[styles.workoutDaysCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.workoutDaysHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.workoutDaysTitle, { color: colors.text.primary }]}>
                This Week's Progress
              </Text>
            </View>
            <View style={styles.workoutDaysContent}>
              <Text style={[styles.workoutDaysCount, { color: colors.primary }]}>
                {weeklyWorkoutDays} of 7 Days
              </Text>
              <View style={styles.workoutDaysProgress}>
                {weekProgress.map((completed, index) => (
                  <View 
                    key={`day-progress-${index}`}
                    style={[
                      styles.workoutDayDot,
                      { backgroundColor: completed ? colors.success : colors.border }
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.lastCompletedContainer}>
            <Calendar size={16} color={colors.text.secondary} />
            <Text style={[styles.lastCompletedText, { color: colors.text.secondary }]}>
              Last completed: {formatDate(lastCompletedDate)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statsSection, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.statCount, { color: colors.text.primary }]}>{tasks.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Total Tasks</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.statCount, { color: colors.text.primary }]}>{completedTasks}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completed Tasks</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.statCount, { color: colors.text.primary }]}>{goals.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Total Goals</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.statCount, { color: colors.text.primary }]}>{completedGoals}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Achieved Goals</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.statCount, { color: colors.text.primary }]}>{sessions.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Total Workouts</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.statCount, { color: colors.text.primary }]}>
                {sessions.reduce((total, session) => total + (session.duration ?? 0), 0)}m
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Workout Time</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.friendsSection, { backgroundColor: colors.background.primary }]}>
          <View style={styles.friendsSectionHeader}>
            <Users size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Friends</Text>
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/friends')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {friendsCount === 0 ? (
            <View style={styles.noFriendsContainer}>
              <Text style={[styles.noFriendsText, { color: colors.text.secondary }]}>
                You haven't added any friends yet
              </Text>
              <TouchableOpacity 
                style={[styles.findFriendsButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/search-users')}
              >
                <Text style={styles.findFriendsText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsRow}
            >
              {allFriends.slice(0, 5).map(friend => (
                <TouchableOpacity 
                  key={friend.id}
                  style={styles.friendBubble}
                  onPress={() => router.push('/friends')}
                >
                  <View style={[styles.friendAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.friendAvatarText}>
                      {friend.friendName.charAt(0).toUpperCase()}
                    </Text>
                    {friend.isOnline && (
                      <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
                    )}
                  </View>
                  <Text style={[styles.friendName, { color: colors.text.primary }]} numberOfLines={1}>
                    {friend.friendName.split(' ')[0]}
                  </Text>
                  {friend.isFavorite && (
                    <Star size={12} color={colors.warning} fill={colors.warning} style={styles.favoriteIcon} />
                  )}
                </TouchableOpacity>
              ))}
              
              {friendsCount > 5 && (
                <TouchableOpacity 
                  style={[styles.friendBubble, styles.moreFriendsBubble]}
                  onPress={() => router.push('/friends')}
                >
                  <View style={[styles.friendAvatar, { backgroundColor: colors.text.light }]}>
                    <Text style={styles.friendAvatarText}>+{friendsCount - 5}</Text>
                  </View>
                  <Text style={[styles.friendName, { color: colors.text.primary }]}>More</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </ScrollView>
      
      {/* Achievement Popup */}
      <AchievementPopup
        achievement={currentAchievementPopup}
        visible={showAchievementPopup}
        onClose={handleAchievementPopupClose}
      />
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
  settingsButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  accountCreatedText: {
    fontSize: 12,
    marginBottom: 12,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  friendsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  friendsText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  achievementsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAchievementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  viewAchievementsText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  activitySection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  streakCards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  streakCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    minWidth: 120,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  workoutStreakCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  workoutStreakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutStreakTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workoutStreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutStreakCount: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
    marginRight: 8,
  },
  workoutStreakSubtext: {
    fontSize: 14,
  },
  workoutDaysCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  workoutDaysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutDaysTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workoutDaysContent: {
    alignItems: 'center',
  },
  workoutDaysCount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  workoutDaysProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  lastCompletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastCompletedText: {
    fontSize: 14,
    marginLeft: 6,
  },
  statsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  friendsSection: {
    borderRadius: 12,
    padding: 16,
  },
  friendsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    marginLeft: 'auto',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noFriendsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noFriendsText: {
    fontSize: 14,
    marginBottom: 8,
  },
  findFriendsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  findFriendsText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  friendsRow: {
    paddingBottom: 8,
  },
  friendBubble: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
    bottom: 0,
    right: 0,
  },
  friendName: {
    fontSize: 12,
    textAlign: 'center',
  },
  favoriteIcon: {
    position: 'absolute',
    top: 0,
    right: 5,
  },
  moreFriendsBubble: {
    opacity: 0.8,
  },
});