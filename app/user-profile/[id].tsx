import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Star, 
  UserMinus, 
  MessageCircle, 
  Users, 
  Calendar,
  Activity,
  Trophy,
  Target,
  Flame
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFriendStore } from '@/store/friendStore';
import { useActivityFeedStore } from '@/store/activityFeedStore';
import { useChallengeStore } from '@/store/challengeStore';
import { useAuthStore } from '@/store/authStore';
import { useAchievementStore } from '@/store/achievementStore';
import { Button } from '@/components/Button';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { ChallengeItem } from '@/components/ChallengeItem';
import { AchievementItem } from '@/components/AchievementItem';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const { user: currentUser } = useAuthStore();
  
  const { 
    getFriends, 
    removeFriend, 
    toggleFavoriteFriend,
    getUserById 
  } = useFriendStore();
  
  const { getUserActivities } = useActivityFeedStore();
  const { getUserChallenges } = useChallengeStore();
  const { getUserAchievements, getUnlockedAchievements } = useAchievementStore();
  
  const [activeTab, setActiveTab] = useState<'activity' | 'challenges' | 'achievements' | 'stats'>('activity');
  
  // Get user data
  const friend = getFriends().find(f => f.friendId === id);
  const userActivities = getUserActivities(id as string);
  const userChallenges = getUserChallenges(id as string);
  
  // Get achievements for this user (in a real app, this would be fetched from the server)
  // For now, we'll show a subset of achievements as if they belong to this user
  const userAchievements = getUserAchievements(); // This would be user-specific
  const unlockedAchievements = getUnlockedAchievements().slice(0, 3); // Show first 3 as example
  
  if (!friend) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>User Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}>
          <Users size={48} color={colors.text.light} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            User not found
          </Text>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            This user is not in your friends list or doesn't exist.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const getAvatarInitial = () => {
    return friend.friendName.charAt(0).toUpperCase();
  };

  const getFirstName = () => {
    return friend.friendName.split(' ')[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLastActiveText = () => {
    if (friend.isOnline) {
      return 'Online now';
    }
    
    const lastActive = new Date(friend.lastActive);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Active just now';
    } else if (diffHours < 24) {
      return `Active ${Math.floor(diffHours)}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Active ${diffDays}d ago`;
    }
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${getFirstName()} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: async () => {
            try {
              await removeFriend(friend.id);
              Alert.alert('Success', 'Friend removed successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
          style: 'destructive'
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavoriteFriend(friend.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleSendMessage = () => {
    Alert.alert('Message', `This would open a chat with ${getFirstName()}`);
  };

  const isCurrentUser = (userId: string) => {
    return currentUser?.id === userId;
  };

  const renderActivityTab = () => {
    if (userActivities.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
          <Activity size={48} color={colors.text.light} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No recent activity
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {getFirstName()} hasn't shared any activities recently.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {userActivities.map(activity => (
          <ActivityFeedItem
            key={activity.id}
            activity={activity}
          />
        ))}
      </View>
    );
  };

  const renderChallengesTab = () => {
    if (userChallenges.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
          <Trophy size={48} color={colors.text.light} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No challenges
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {getFirstName()} hasn't participated in any challenges yet.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {userChallenges.map(challenge => (
          <ChallengeItem
            key={challenge.id}
            challenge={challenge}
            isCurrentUser={isCurrentUser}
          />
        ))}
      </View>
    );
  };

  const renderAchievementsTab = () => {
    if (unlockedAchievements.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
          <Trophy size={48} color={colors.text.light} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No achievements yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {getFirstName()} hasn't unlocked any achievements yet.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {unlockedAchievements.map(achievement => {
          const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
          return (
            <AchievementItem
              key={achievement.id}
              achievement={achievement}
              userAchievement={userAchievement}
              size="medium"
              showProgress={false}
            />
          );
        })}
      </View>
    );
  };

  const renderStatsTab = () => {
    const totalActivities = userActivities.length;
    const totalChallenges = userChallenges.length;
    const completedChallenges = userChallenges.filter(c => c.status === 'completed').length;
    const winRate = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

    return (
      <View style={styles.tabContent}>
        <View style={[styles.statsGrid, { backgroundColor: colors.background.primary }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
              <Activity size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{totalActivities}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Activities</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Trophy size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{totalChallenges}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Challenges</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <Target size={24} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{winRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Win Rate</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
              <Users size={24} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{friend.mutualFriends}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Mutual Friends</Text>
          </View>
        </View>

        <View style={[styles.friendshipInfo, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Friendship</Text>
          
          <View style={styles.friendshipDetail}>
            <Calendar size={16} color={colors.text.secondary} />
            <Text style={[styles.friendshipText, { color: colors.text.secondary }]}>
              Friends since {formatDate(friend.createdAt)}
            </Text>
          </View>

          <View style={styles.friendshipDetail}>
            <Activity size={16} color={colors.text.secondary} />
            <Text style={[styles.friendshipText, { color: colors.text.secondary }]}>
              {getLastActiveText()}
            </Text>
          </View>

          {friend.mutualFriends > 0 && (
            <View style={styles.friendshipDetail}>
              <Users size={16} color={colors.text.secondary} />
              <Text style={[styles.friendshipText, { color: colors.text.secondary }]}>
                {friend.mutualFriends} mutual friend{friend.mutualFriends !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.background.primary }]}>
          <View style={styles.profileInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
              {friend.isOnline && (
                <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
              )}
            </View>
            
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text.primary }]}>
                  {friend.friendName}
                </Text>
                {friend.isFavorite && (
                  <Star size={20} color={colors.warning} fill={colors.warning} />
                )}
              </View>
              <Text style={[styles.userEmail, { color: colors.text.secondary }]}>
                {friend.friendEmail}
              </Text>
              <Text style={[styles.lastActive, { color: colors.text.light }]}>
                {getLastActiveText()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Message"
              onPress={handleSendMessage}
              icon={<MessageCircle size={18} color="white" />}
              style={styles.primaryButton}
            />
            
            <View style={styles.secondaryButtons}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: friend.isFavorite ? colors.warning + '20' : colors.background.secondary }
                ]}
                onPress={handleToggleFavorite}
              >
                <Star 
                  size={20} 
                  color={friend.isFavorite ? colors.warning : colors.text.secondary}
                  fill={friend.isFavorite ? colors.warning : 'none'}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.background.secondary }]}
                onPress={handleRemoveFriend}
              >
                <UserMinus size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabSelector, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'activity' && { 
                backgroundColor: colors.primary + '20',
                borderBottomColor: colors.primary,
                borderBottomWidth: 2
              }
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <Activity 
              size={18} 
              color={activeTab === 'activity' ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'activity' ? colors.primary : colors.text.secondary }
            ]}>
              Activity
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'challenges' && { 
                backgroundColor: colors.primary + '20',
                borderBottomColor: colors.primary,
                borderBottomWidth: 2
              }
            ]}
            onPress={() => setActiveTab('challenges')}
          >
            <Trophy 
              size={18} 
              color={activeTab === 'challenges' ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'challenges' ? colors.primary : colors.text.secondary }
            ]}>
              Challenges
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'achievements' && { 
                backgroundColor: colors.primary + '20',
                borderBottomColor: colors.primary,
                borderBottomWidth: 2
              }
            ]}
            onPress={() => setActiveTab('achievements')}
          >
            <Trophy 
              size={18} 
              color={activeTab === 'achievements' ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'achievements' ? colors.primary : colors.text.secondary }
            ]}>
              Achievements
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'stats' && { 
                backgroundColor: colors.primary + '20',
                borderBottomColor: colors.primary,
                borderBottomWidth: 2
              }
            ]}
            onPress={() => setActiveTab('stats')}
          >
            <Target 
              size={18} 
              color={activeTab === 'stats' ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'stats' ? colors.primary : colors.text.secondary }
            ]}>
              Stats
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'challenges' && renderChallengesTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
        {activeTab === 'stats' && renderStatsTab()}
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
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
    bottom: 4,
    right: 4,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 4,
  },
  lastActive: {
    fontSize: 14,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  friendshipInfo: {
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  friendshipDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendshipText: {
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    borderRadius: 12,
    margin: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 32,
  },
});