import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { FriendRequest } from '@/types';
import { Button } from './Button';

interface FriendRequestItemProps {
  request: FriendRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  isLoading?: boolean;
}

export const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
  onAccept,
  onDecline,
  isLoading = false,
}) => {
  const colors = useColors();

  const getAvatarInitial = () => {
    return request.senderName.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
        </View>
        
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text.primary }]}>{request.senderName}</Text>
          <Text style={[styles.email, { color: colors.text.secondary }]}>{request.senderEmail}</Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color={colors.text.light} />
            <Text style={[styles.time, { color: colors.text.light }]}>
              {formatDate(request.createdAt)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Accept"
          onPress={() => onAccept(request.id)}
          size="small"
          isLoading={isLoading}
          icon={<Check size={16} color="white" />}
          style={[styles.actionButton, styles.acceptButton]}
        />
        
        <Button
          title="Decline"
          onPress={() => onDecline(request.id)}
          size="small"
          variant="outline"
          icon={<X size={16} color={colors.danger} />}
          style={[styles.actionButton, { borderColor: colors.danger }]}
          textStyle={{ color: colors.danger }}
        />
      </View>
    </View>
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
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
  },
  acceptButton: {
    minWidth: 80,
  },
});