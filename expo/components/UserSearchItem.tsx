import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { UserPlus, UserCheck, Clock, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { UserSearchResult } from '@/types';
import { Button } from './Button';

interface UserSearchItemProps {
  user: UserSearchResult;
  onSendRequest: (userId: string, userName: string, userEmail: string) => void;
  isLoading?: boolean;
}

export const UserSearchItem: React.FC<UserSearchItemProps> = ({
  user,
  onSendRequest,
  isLoading = false,
}) => {
  const router = useRouter();
  const colors = useColors();

  const handleViewProfile = () => {
    if (user.isFriend) {
      router.push(`/user-profile/${user.id}`);
    }
  };

  const getActionButton = () => {
    if (user.isFriend) {
      return (
        <View style={styles.actionButtons}>
          <View style={[styles.statusContainer, { backgroundColor: colors.success + '20' }]}>
            <UserCheck size={16} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Friends</Text>
          </View>
          
          <Button
            title="Profile"
            onPress={handleViewProfile}
            size="small"
            variant="outline"
            icon={<User size={16} color={colors.primary} />}
            style={styles.profileButton}
          />
        </View>
      );
    }

    if (user.hasPendingRequest) {
      return (
        <View style={[styles.statusContainer, { backgroundColor: colors.warning + '20' }]}>
          <Clock size={16} color={colors.warning} />
          <Text style={[styles.statusText, { color: colors.warning }]}>
            {user.requestSentByMe ? 'Request Sent' : 'Pending Approval'}
          </Text>
        </View>
      );
    }

    return (
      <Button
        title="Add Friend"
        onPress={() => onSendRequest(user.id, user.name, user.email)}
        size="small"
        isLoading={isLoading}
        icon={<UserPlus size={16} color="white" />}
        style={styles.addButton}
      />
    );
  };

  const getAvatarInitial = () => {
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container, 
        { 
          backgroundColor: colors.background.primary, 
          borderColor: colors.border,
          opacity: pressed && user.isFriend ? 0.9 : 1
        }
      ]}
      onPress={user.isFriend ? handleViewProfile : undefined}
      disabled={!user.isFriend}
    >
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
        </View>
        
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text.primary }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.text.secondary }]}>{user.email}</Text>
        </View>
      </View>
      
      {getActionButton()}
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
  },
  actionButtons: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  addButton: {
    paddingHorizontal: 16,
  },
  profileButton: {
    paddingHorizontal: 12,
  },
});