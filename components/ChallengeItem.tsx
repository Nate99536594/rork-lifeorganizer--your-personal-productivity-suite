import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Trophy, Clock, ChevronRight, X, Check } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { Challenge } from '@/types';
import { ProgressBar } from './ProgressBar';

interface ChallengeItemProps {
  challenge: Challenge;
  isCurrentUser: (userId: string) => boolean;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  compact?: boolean; // For inline display in friends tab
}

export const ChallengeItem: React.FC<ChallengeItemProps> = ({
  challenge,
  isCurrentUser,
  onPress,
  onAccept,
  onDecline,
  compact = false
}) => {
  const colors = useColors();
  
  const isCreator = isCurrentUser(challenge.creatorId);
  const otherPersonName = isCreator ? challenge.participantName : challenge.creatorName;
  
  const getStatusColor = () => {
    switch (challenge.status) {
      case 'pending':
        return colors.warning;
      case 'active':
        return colors.success;
      case 'completed':
        return colors.primary;
      case 'declined':
        return colors.danger;
      default:
        return colors.text.secondary;
    }
  };
  
  const getStatusText = () => {
    switch (challenge.status) {
      case 'pending':
        return isCreator ? 'Waiting for response' : 'Respond to challenge';
      case 'active':
        return `${challenge.duration}-day streak challenge`;
      case 'completed':
        if (challenge.winnerId) {
          const winnerName = challenge.winnerId === challenge.creatorId 
            ? challenge.creatorName 
            : challenge.participantName;
          return `${winnerName} won the challenge`;
        }
        return 'Challenge completed (tie)';
      case 'declined':
        return 'Challenge declined';
      default:
        return '';
    }
  };
  
  const getDaysLeft = () => {
    if (!challenge.endDate || challenge.status !== 'active') return null;
    
    const endDate = new Date(challenge.endDate);
    const today = new Date();
    
    // Set hours to 0 to compare just the dates
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  const daysLeft = getDaysLeft();
  
  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer, 
          { 
            backgroundColor: colors.background.primary,
            borderColor: colors.border
          }
        ]}
      >
        <View style={styles.compactHeader}>
          <Flame size={16} color={getStatusColor()} />
          <Text style={[styles.compactTitle, { color: colors.text.primary }]}>
            {challenge.status === 'pending' 
              ? `Challenge with ${otherPersonName}` 
              : `${challenge.duration}-day challenge`}
          </Text>
          <Text style={[styles.compactStatus, { color: getStatusColor() }]}>
            {challenge.status}
          </Text>
        </View>
        
        {challenge.status === 'active' && (
          <View style={styles.compactProgress}>
            <Text style={[styles.compactProgressText, { color: colors.text.secondary }]}>
              {isCreator ? 'You' : challenge.creatorName}: {challenge.creatorProgress || 0}/{challenge.duration}
            </Text>
            <Text style={[styles.compactProgressText, { color: colors.text.secondary }]}>
              {isCreator ? challenge.participantName : 'You'}: {challenge.participantProgress || 0}/{challenge.duration}
            </Text>
          </View>
        )}
      </View>
    );
  }
  
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
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Flame size={20} color={getStatusColor()} />
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {challenge.status === 'pending' 
              ? `${isCreator ? 'You' : otherPersonName} invited ${isCreator ? otherPersonName : 'you'} to a challenge` 
              : `Challenge with ${otherPersonName}`}
          </Text>
        </View>
        
        {onPress && <ChevronRight size={18} color={colors.text.secondary} />}
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        
        {challenge.status === 'active' && daysLeft !== null && (
          <View style={styles.daysLeftContainer}>
            <Clock size={14} color={colors.text.secondary} />
            <Text style={[styles.daysLeftText, { color: colors.text.secondary }]}>
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </Text>
          </View>
        )}
      </View>
      
      {challenge.status === 'active' && (
        <View style={styles.progressSection}>
          <View style={styles.participantProgress}>
            <Text style={[styles.participantName, { color: colors.text.secondary }]}>
              {challenge.creatorName}
            </Text>
            <ProgressBar 
              progress={(challenge.creatorProgress || 0) / challenge.duration}
              color={colors.primary}
              style={styles.progressBar}
            />
            <Text style={[styles.progressText, { color: colors.text.primary }]}>
              {challenge.creatorProgress || 0}/{challenge.duration} days
            </Text>
          </View>
          
          <View style={styles.participantProgress}>
            <Text style={[styles.participantName, { color: colors.text.secondary }]}>
              {challenge.participantName}
            </Text>
            <ProgressBar 
              progress={(challenge.participantProgress || 0) / challenge.duration}
              color={colors.secondary}
              style={styles.progressBar}
            />
            <Text style={[styles.progressText, { color: colors.text.primary }]}>
              {challenge.participantProgress || 0}/{challenge.duration} days
            </Text>
          </View>
        </View>
      )}
      
      {challenge.status === 'completed' && challenge.winnerId && (
        <View style={styles.winnerSection}>
          <Trophy size={18} color={colors.warning} />
          <Text style={[styles.winnerText, { color: colors.text.primary }]}>
            {challenge.winnerId === (isCurrentUser(challenge.creatorId) ? challenge.creatorId : challenge.participantId) 
              ? 'You won!' 
              : `${challenge.winnerId === challenge.creatorId ? challenge.creatorName : challenge.participantName} won!`}
          </Text>
        </View>
      )}
      
      {challenge.status === 'pending' && !isCreator && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.declineButton, { borderColor: colors.danger }]}
            onPress={onDecline}
          >
            <X size={16} color={colors.danger} />
            <Text style={[styles.actionButtonText, { color: colors.danger }]}>
              Decline
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={onAccept}
          >
            <Check size={16} color="white" />
            <Text style={[styles.actionButtonText, { color: 'white' }]}>
              Accept
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  compactContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  compactStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysLeftText: {
    fontSize: 12,
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  compactProgress: {
    gap: 2,
  },
  compactProgressText: {
    fontSize: 12,
  },
  participantProgress: {
    marginBottom: 8,
  },
  participantName: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  winnerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  winnerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  declineButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  acceptButton: {
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});