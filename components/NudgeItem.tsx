import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircle, Clock, Check, Trash2 } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { Nudge } from '@/types';

interface NudgeItemProps {
  nudge: Nudge;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
}

export const NudgeItem: React.FC<NudgeItemProps> = ({
  nudge,
  onMarkAsRead,
  onDelete,
  onReply
}) => {
  const colors = useColors();
  
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const nudgeTime = new Date(timestamp);
    const diffMs = now.getTime() - nudgeTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHour < 24) {
      return `${diffHour}h ago`;
    } else if (diffDay < 7) {
      return `${diffDay}d ago`;
    } else {
      return nudgeTime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  return (
    <View
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background.primary,
          borderColor: nudge.read ? colors.border : colors.primary,
          borderLeftWidth: nudge.read ? 1 : 4
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.senderContainer}>
          <MessageCircle size={18} color={colors.primary} />
          <Text style={[styles.senderName, { color: colors.text.primary }]}>
            {nudge.senderName}
          </Text>
        </View>
        
        <View style={styles.timeContainer}>
          <Clock size={12} color={colors.text.light} />
          <Text style={[styles.timeText, { color: colors.text.light }]}>
            {getTimeAgo(nudge.createdAt)}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.message, { color: colors.text.primary }]}>
        {nudge.message}
      </Text>
      
      <View style={styles.actions}>
        {!nudge.read && onMarkAsRead && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={onMarkAsRead}
          >
            <Check size={14} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              Mark as read
            </Text>
          </TouchableOpacity>
        )}
        
        {onReply && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: colors.secondary }]}
            onPress={onReply}
          >
            <MessageCircle size={14} color={colors.secondary} />
            <Text style={[styles.actionText, { color: colors.secondary }]}>
              Reply
            </Text>
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: colors.danger }]}
            onPress={onDelete}
          >
            <Trash2 size={14} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});