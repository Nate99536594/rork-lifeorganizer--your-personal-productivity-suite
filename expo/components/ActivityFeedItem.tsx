import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  CheckCircle, 
  Target, 
  Flame, 
  Dumbbell, 
  Clock, 
  Star,
  Users
} from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { ActivityFeedItem as ActivityItem } from '@/types';

interface ActivityFeedItemProps {
  activity: ActivityItem;
  onPress?: () => void;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  activity,
  onPress
}) => {
  const colors = useColors();
  
  const getActivityIcon = () => {
    switch (activity.activityType) {
      case 'task':
        return <CheckCircle size={20} color={colors.success} />;
      case 'goal':
        return <Target size={20} color={colors.primary} />;
      case 'streak':
        return <Flame size={20} color="#FF9500" />;
      case 'workout':
        return <Dumbbell size={20} color="#5E5CE6" />;
      case 'challenge':
        return <Star size={20} color="#FF6B35" />;
      case 'friend':
        return <Users size={20} color={colors.primary} />;
      default:
        return <Star size={20} color={colors.primary} />;
    }
  };
  
  const getActivityTitle = () => {
    // Display only first name in activity feeds
    const firstName = activity.userName.split(' ')[0];
    
    return (
      <Text style={[styles.title, { color: colors.text.primary }]}>
        <Text style={{ fontWeight: '600' }}>{firstName}</Text>
        {' '}
        {activity.description}
      </Text>
    );
  };
  
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
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
      return activityTime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background.primary,
          borderColor: colors.border
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.background.secondary }]}>
        {getActivityIcon()}
      </View>
      
      <View style={styles.content}>
        {getActivityTitle()}
        
        <View style={styles.timeRow}>
          <Clock size={12} color={colors.text.light} />
          <Text style={[styles.time, { color: colors.text.light }]}>
            {getTimeAgo(activity.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    marginLeft: 4,
  },
});