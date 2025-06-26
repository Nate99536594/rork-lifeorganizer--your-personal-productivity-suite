import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  Clock, 
  Calendar,
  Users,
  Check,
  X
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useChallengeStore } from '@/store/challengeStore';
import { useAuthStore } from '@/store/authStore';
import { useNudgeStore } from '@/store/nudgeStore';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuthStore();
  const { 
    getChallengeById, 
    acceptChallenge, 
    declineChallenge,
    updateChallengeProgress,
    isLoading,
    error
  } = useChallengeStore();
  const { sendNudge } = useNudgeStore();
  
  const challenge = getChallengeById(id);
  
  useEffect(() => {
    // Update challenge progress when viewing the challenge
    updateChallengeProgress();
  }, []);
  
  if (!challenge) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push("/(tabs)/friends")}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Challenge Details</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text.primary }]}>
            Challenge not found
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.push("/(tabs)/friends")}
            variant="outline"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const isCreator = user?.id === challenge.creatorId;
  const otherPersonId = isCreator ? challenge.participantId : challenge.creatorId;
  const otherPersonName = isCreator ? challenge.participantName : challenge.creatorName;
  
  const handleAcceptChallenge = async () => {
    try {
      await acceptChallenge(challenge.id);
      Alert.alert('Success', 'Challenge accepted! Keep your streak going to win!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept challenge');
    }
  };
  
  const handleDeclineChallenge = async () => {
    try {
      await declineChallenge(challenge.id);
      Alert.alert('Success', 'Challenge declined');
      router.push("/(tabs)/friends");
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to decline challenge');
    }
  };
  
  const handleSendNudge = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send a nudge');
      return;
    }
    
    try {
      // Show options for nudge messages
      Alert.alert(
        'Send Encouragement',
        'Choose a message to send:',
        [
          { text: "Keep up the good work!", onPress: () => sendNudgeMessage("Keep up the good work!") },
          { text: "You're almost there!", onPress: () => sendNudgeMessage("You're almost there!") },
          { text: "Don't give up!", onPress: () => sendNudgeMessage("Don't give up!") },
          { text: "Let's crush this challenge!", onPress: () => sendNudgeMessage("Let's crush this challenge!") },
          { text: "Cancel", style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send nudge');
    }
  };
  
  const sendNudgeMessage = async (message: string) => {
    try {
      await sendNudge({
        senderId: user!.id,
        senderName: user!.name,
        receiverId: otherPersonId,
        receiverName: otherPersonName,
        message
      });
      
      Alert.alert('Success', 'Encouragement sent!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send message');
    }
  };
  
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
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/friends")}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Challenge Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading challenge...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Flame size={24} color={getStatusColor()} />
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                {challenge.duration}-Day Streak Challenge
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
            
            {challenge.status === 'active' && daysLeft !== null && (
              <View style={styles.daysLeftContainer}>
                <Clock size={16} color={colors.text.secondary} />
                <Text style={[styles.daysLeftText, { color: colors.text.secondary }]}>
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </Text>
              </View>
            )}
            
            <View style={styles.dateSection}>
              <View style={styles.dateItem}>
                <Calendar size={16} color={colors.text.secondary} />
                <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>
                  Created:
                </Text>
                <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                  {formatDate(challenge.createdAt)}
                </Text>
              </View>
              
              {challenge.startDate && (
                <View style={styles.dateItem}>
                  <Calendar size={16} color={colors.text.secondary} />
                  <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>
                    Started:
                  </Text>
                  <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                    {formatDate(challenge.startDate)}
                  </Text>
                </View>
              )}
              
              {challenge.endDate && (
                <View style={styles.dateItem}>
                  <Calendar size={16} color={colors.text.secondary} />
                  <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>
                    Ends:
                  </Text>
                  <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                    {formatDate(challenge.endDate)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.participantsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Participants
              </Text>
              
              <View style={styles.participant}>
                <View style={styles.participantInfo}>
                  <Text style={[styles.participantName, { color: colors.text.primary }]}>
                    {challenge.creatorName} {isCreator && '(You)'}
                  </Text>
                  <Text style={[styles.participantRole, { color: colors.text.secondary }]}>
                    Creator
                  </Text>
                </View>
                
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={(challenge.creatorProgress || 0) / challenge.duration}
                    color={colors.primary}
                    style={styles.progressBar}
                  />
                  <Text style={[styles.progressText, { color: colors.text.primary }]}>
                    {challenge.creatorProgress || 0}/{challenge.duration} days
                  </Text>
                </View>
              </View>
              
              <View style={styles.participant}>
                <View style={styles.participantInfo}>
                  <Text style={[styles.participantName, { color: colors.text.primary }]}>
                    {challenge.participantName} {!isCreator && '(You)'}
                  </Text>
                  <Text style={[styles.participantRole, { color: colors.text.secondary }]}>
                    Participant
                  </Text>
                </View>
                
                <View style={styles.progressContainer}>
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
            </View>
            
            {challenge.status === 'completed' && challenge.winnerId && (
              <View style={[styles.winnerSection, { backgroundColor: colors.warning + '20' }]}>
                <Trophy size={24} color={colors.warning} />
                <Text style={[styles.winnerText, { color: colors.text.primary }]}>
                  {challenge.winnerId === (isCreator ? challenge.creatorId : challenge.participantId) 
                    ? 'You won!' 
                    : `${challenge.winnerId === challenge.creatorId ? challenge.creatorName : challenge.participantName} won!`}
                </Text>
              </View>
            )}
            
            {challenge.status === 'pending' && !isCreator && (
              <View style={styles.actionButtons}>
                <Button
                  title="Decline"
                  onPress={handleDeclineChallenge}
                  icon={<X size={18} color={colors.danger} />}
                  variant="outline"
                  style={[styles.actionButton, { borderColor: colors.danger }]}
                  textStyle={{ color: colors.danger }}
                />
                
                <Button
                  title="Accept"
                  onPress={handleAcceptChallenge}
                  icon={<Check size={18} color="white" />}
                  style={styles.actionButton}
                />
              </View>
            )}
            
            {challenge.status === 'active' && (
              <Button
                title="Send Encouragement"
                onPress={handleSendNudge}
                icon={<Users size={18} color="white" />}
                style={styles.encourageButton}
              />
            )}
          </View>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.danger + '10' }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  daysLeftText: {
    fontSize: 14,
    marginLeft: 8,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    marginLeft: 8,
    marginRight: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  participantsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  participant: {
    marginBottom: 16,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  participantRole: {
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  encourageButton: {
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});