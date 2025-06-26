import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Pressable } from 'react-native';
import { MoreVertical, UserMinus, UserX, Star, MessageCircle, User, Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Friend } from '@/types';
import { useActivityFeedStore } from '@/store/activityFeedStore';

interface FriendItemProps {
  friend: Friend;
  onRemove: (friendId: string) => void;
  onBlock: (friendId: string) => void;
  onToggleFavorite: (friendId: string) => void;
}

export const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  onRemove,
  onBlock,
  onToggleFavorite,
}) => {
  const router = useRouter();
  const colors = useColors();
  const [showActions, setShowActions] = useState(false);
  const { getUserActivities } = useActivityFeedStore();
  
  // Get the most recent activity for this friend
  const friendActivities = getUserActivities(friend.friendId);
  const latestActivity = friendActivities.length > 0 ? friendActivities[0] : null;

  const getAvatarInitial = () => {
    return friend.friendName.charAt(0).toUpperCase();
  };

  const getFirstName = () => {
    return friend.friendName.split(' ')[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLastActiveText = () => {
    if (latestActivity) {
      const activityTime = new Date(latestActivity.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - activityTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return 'Active just now';
      } else if (diffHours < 24) {
        return `Active ${Math.floor(diffHours)}h ago`;
      } else {
        return `Active on ${formatDate(latestActivity.createdAt)}`;
      }
    }
    
    return 'Active recently';
  };

  const getActivityDescription = (activityType: string) => {
    switch (activityType) {
      case 'task_completed':
        return 'Completed tasks';
      case 'goal_achieved':
        return 'Achieved a goal';
      case 'workout_completed':
        return 'Completed a workout';
      case 'streak_milestone':
        return 'Reached a streak';
      case 'challenge_completed':
        return 'Completed a challenge';
      case 'friend_added':
        return 'Made a new friend';
      default:
        return 'Had some activity';
    }
  };

  const handleViewProfile = () => {
    router.push(`/user-profile/${friend.friendId}`);
  };

  const showActionMenu = () => {
    Alert.alert(
      getFirstName(),
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add to Favorites', 
          onPress: () => onToggleFavorite(friend.id),
        },
        { 
          text: 'View Profile', 
          onPress: handleViewProfile,
        },
        { 
          text: 'Remove Friend', 
          onPress: () => confirmRemove(),
          style: 'destructive'
        },
        { 
          text: 'Block User', 
          onPress: () => confirmBlock(),
          style: 'destructive'
        },
      ]
    );
  };

  const confirmRemove = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${getFirstName()} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: () => onRemove(friend.id),
          style: 'destructive'
        },
      ]
    );
  };

  const confirmBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${getFirstName()}? They will be removed from your friends and won't be able to send you requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          onPress: () => onBlock(friend.id),
          style: 'destructive'
        },
      ]
    );
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container, 
        { 
          backgroundColor: colors.background.primary, 
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1
        }
      ]}
      onPress={handleViewProfile}
    >
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
        </View>
        
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text.primary }]}>
              {getFirstName()}
            </Text>
          </View>
          <Text style={[styles.email, { color: colors.text.secondary }]}>
            {friend.friendUsername}
          </Text>
          
          {latestActivity && (
            <View style={[styles.activityBadge, { backgroundColor: colors.background.secondary }]}>
              <Activity size={12} color={colors.primary} />
              <Text style={[styles.activityText, { color: colors.text.secondary }]} numberOfLines={1}>
                {getActivityDescription(latestActivity.type)}
              </Text>
            </View>
          )}
          
          <Text style={[styles.infoText, { color: colors.text.light }]}>
            Friends since {formatDate(friend.createdAt)} • {getLastActiveText()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => Alert.alert('Message', `This would open a chat with ${getFirstName()}`)}
        >
          <MessageCircle size={18} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
          onPress={showActionMenu}
        >
          <MoreVertical size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter',
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  activityText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
});