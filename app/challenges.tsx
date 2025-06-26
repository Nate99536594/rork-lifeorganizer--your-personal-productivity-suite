import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Flame, 
  Plus, 
  Trophy, 
  Clock, 
  Filter,
  Users
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useChallengeStore } from '@/store/challengeStore';
import { useAuthStore } from '@/store/authStore';
import { ChallengeItem } from '@/components/ChallengeItem';
import { Button } from '@/components/Button';

export default function ChallengesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthStore();
  const { 
    getPendingChallenges, 
    getActiveChallenges, 
    getCompletedChallenges,
    acceptChallenge,
    declineChallenge,
    isLoading,
    error
  } = useChallengeStore();
  
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  
  const pendingChallenges = getPendingChallenges();
  const activeChallenges = getActiveChallenges();
  const completedChallenges = getCompletedChallenges();
  
  const allChallenges = [
    ...pendingChallenges,
    ...activeChallenges,
    ...completedChallenges
  ];
  
  const filteredChallenges = filter === 'all' 
    ? allChallenges 
    : filter === 'active' 
      ? activeChallenges 
      : filter === 'pending' 
        ? pendingChallenges 
        : completedChallenges;
  
  const isCurrentUser = (userId: string) => {
    return userId === user?.id;
  };
  
  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
      Alert.alert('Success', 'Challenge accepted! Keep your streak going to win!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept challenge');
    }
  };
  
  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await declineChallenge(challengeId);
      Alert.alert('Success', 'Challenge declined');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to decline challenge');
    }
  };
  
  const handleViewChallenge = (challengeId: string) => {
    router.push(`/challenge/${challengeId}`);
  };
  
  const renderFilterButton = (filterType: 'all' | 'active' | 'pending' | 'completed', label: string, icon: React.ReactNode) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
      ]}
      onPress={() => setFilter(filterType)}
    >
      {icon}
      <Text 
        style={[
          styles.filterButtonText,
          { color: filter === filterType ? colors.primary : colors.text.secondary }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Challenges</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.actionsSection}>
          <Button
            title="Create Challenge"
            onPress={() => router.push('/create-challenge')}
            icon={<Plus size={18} color="white" />}
            style={styles.createButton}
          />
        </View>
        
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            {renderFilterButton('all', 'All', <Filter size={16} color={filter === 'all' ? colors.primary : colors.text.secondary} />)}
            {renderFilterButton('active', 'Active', <Flame size={16} color={filter === 'active' ? colors.primary : colors.text.secondary} />)}
            {renderFilterButton('pending', 'Pending', <Clock size={16} color={filter === 'pending' ? colors.primary : colors.text.secondary} />)}
            {renderFilterButton('completed', 'Completed', <Trophy size={16} color={filter === 'completed' ? colors.primary : colors.text.secondary} />)}
          </ScrollView>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading challenges...
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + '10' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
            <Button
              title="Try Again"
              onPress={() => router.replace('/challenges')}
              variant="outline"
              style={{ borderColor: colors.danger, marginTop: 12 }}
              textStyle={{ color: colors.danger }}
            />
          </View>
        ) : filteredChallenges.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
            <Flame size={48} color={colors.text.light} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {filter === 'all' 
                ? 'No challenges yet' 
                : filter === 'active' 
                  ? 'No active challenges' 
                  : filter === 'pending' 
                    ? 'No pending challenges' 
                    : 'No completed challenges'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {filter === 'all' 
                ? 'Challenge your friends to keep streaks together!' 
                : filter === 'active' 
                  ? 'Accept a challenge or create a new one' 
                  : filter === 'pending' 
                    ? 'No one has challenged you yet' 
                    : 'Complete challenges to see them here'}
            </Text>
            
            {filter === 'all' && (
              <Button
                title="Find Friends to Challenge"
                onPress={() => router.push('/friends')}
                icon={<Users size={18} color="white" />}
                style={styles.emptyActionButton}
              />
            )}
          </View>
        ) : (
          <ScrollView 
            style={styles.challengesList}
            contentContainerStyle={styles.challengesListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredChallenges.map(challenge => (
              <ChallengeItem
                key={challenge.id}
                challenge={challenge}
                isCurrentUser={isCurrentUser}
                onPress={() => handleViewChallenge(challenge.id)}
                onAccept={() => handleAcceptChallenge(challenge.id)}
                onDecline={() => handleDeclineChallenge(challenge.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
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
    padding: 16,
  },
  actionsSection: {
    marginBottom: 16,
  },
  createButton: {
    width: '100%',
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersContainer: {
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  challengesList: {
    flex: 1,
  },
  challengesListContent: {
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginTop: 40,
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
    marginBottom: 24,
  },
  emptyActionButton: {
    paddingHorizontal: 32,
  },
});