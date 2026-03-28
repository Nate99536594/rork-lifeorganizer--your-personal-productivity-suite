import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Flame, 
  Users, 
  Clock, 
  Calendar, 
  Check,
  Edit
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useChallengeStore } from '@/store/challengeStore';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Friend } from '@/types';

export default function CreateChallengeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthStore();
  const { createChallenge, isLoading, error } = useChallengeStore();
  const { getFriends } = useFriendStore();
  
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [durationOption, setDurationOption] = useState<'preset' | 'custom'>('preset');
  const [presetDuration, setPresetDuration] = useState<3 | 7>(7);
  const [customDuration, setCustomDuration] = useState('');
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  
  const friends = getFriends();
  
  const handleCreateChallenge = async () => {
    if (!selectedFriend) {
      Alert.alert('Error', 'Please select a friend to challenge');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a challenge');
      return;
    }
    
    // Validate custom duration if selected
    let finalDuration = presetDuration;
    if (durationOption === 'custom') {
      const parsedDuration = parseInt(customDuration, 10);
      if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 30) {
        Alert.alert('Error', 'Please enter a valid duration between 1 and 30 days');
        return;
      }
      finalDuration = parsedDuration;
    }
    
    try {
      await createChallenge({
        creatorId: user.id,
        creatorName: user.name,
        participantId: selectedFriend.friendId,
        participantName: selectedFriend.friendName,
        type: 'streak',
        duration: finalDuration,
      });
      
      Alert.alert(
        'Challenge Created',
        `You've challenged ${selectedFriend.friendName} to a ${finalDuration}-day streak challenge!`,
        [
          { text: 'OK', onPress: () => router.replace('/(tabs)/friends') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create challenge');
    }
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Create Challenge</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flame size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Streak Challenge
            </Text>
          </View>
          
          <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
            Challenge a friend to maintain a daily streak. The first person to reach the goal days wins!
          </Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Select Friend
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.friendSelector,
              { 
                backgroundColor: colors.background.primary,
                borderColor: colors.border
              }
            ]}
            onPress={() => setShowFriendSelector(!showFriendSelector)}
          >
            <Text style={[
              styles.friendSelectorText,
              { color: selectedFriend ? colors.text.primary : colors.text.light }
            ]}>
              {selectedFriend ? selectedFriend.friendName : 'Select a friend to challenge'}
            </Text>
            <Users size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          
          {showFriendSelector && (
            <View style={[styles.friendList, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
              {friends.length === 0 ? (
                <Text style={[styles.noFriendsText, { color: colors.text.secondary }]}>
                  You don't have any friends yet. Add friends to challenge them!
                </Text>
              ) : (
                friends.map(friend => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendItem,
                      selectedFriend?.id === friend.id && { 
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary
                      }
                    ]}
                    onPress={() => {
                      setSelectedFriend(friend);
                      setShowFriendSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.friendName,
                      { color: selectedFriend?.id === friend.id ? colors.primary : colors.text.primary }
                    ]}>
                      {friend.friendName}
                    </Text>
                    
                    {selectedFriend?.id === friend.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Challenge Duration
            </Text>
          </View>
          
          <View style={styles.durationTypeSelector}>
            <TouchableOpacity
              style={[
                styles.durationTypeOption,
                { 
                  borderColor: durationOption === 'preset' ? colors.primary : colors.border,
                  backgroundColor: durationOption === 'preset' ? colors.primary + '20' : colors.background.primary
                }
              ]}
              onPress={() => setDurationOption('preset')}
            >
              <Clock size={18} color={durationOption === 'preset' ? colors.primary : colors.text.secondary} />
              <Text style={[
                styles.durationTypeText,
                { color: durationOption === 'preset' ? colors.primary : colors.text.primary }
              ]}>
                Preset Durations
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.durationTypeOption,
                { 
                  borderColor: durationOption === 'custom' ? colors.primary : colors.border,
                  backgroundColor: durationOption === 'custom' ? colors.primary + '20' : colors.background.primary
                }
              ]}
              onPress={() => setDurationOption('custom')}
            >
              <Edit size={18} color={durationOption === 'custom' ? colors.primary : colors.text.secondary} />
              <Text style={[
                styles.durationTypeText,
                { color: durationOption === 'custom' ? colors.primary : colors.text.primary }
              ]}>
                Custom Duration
              </Text>
            </TouchableOpacity>
          </View>
          
          {durationOption === 'preset' ? (
            <View style={styles.durationOptions}>
              <TouchableOpacity
                style={[
                  styles.durationOption,
                  { 
                    borderColor: presetDuration === 3 ? colors.primary : colors.border,
                    backgroundColor: presetDuration === 3 ? colors.primary + '20' : colors.background.primary
                  }
                ]}
                onPress={() => setPresetDuration(3)}
              >
                <Clock size={20} color={presetDuration === 3 ? colors.primary : colors.text.secondary} />
                <Text style={[
                  styles.durationTitle,
                  { color: presetDuration === 3 ? colors.primary : colors.text.primary }
                ]}>
                  3-Day Challenge
                </Text>
                <Text style={[styles.durationDescription, { color: colors.text.secondary }]}>
                  Quick challenge for beginners
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.durationOption,
                  { 
                    borderColor: presetDuration === 7 ? colors.primary : colors.border,
                    backgroundColor: presetDuration === 7 ? colors.primary + '20' : colors.background.primary
                  }
                ]}
                onPress={() => setPresetDuration(7)}
              >
                <Flame size={20} color={presetDuration === 7 ? colors.primary : colors.text.secondary} />
                <Text style={[
                  styles.durationTitle,
                  { color: presetDuration === 7 ? colors.primary : colors.text.primary }
                ]}>
                  7-Day Challenge
                </Text>
                <Text style={[styles.durationDescription, { color: colors.text.secondary }]}>
                  Full week streak for serious competitors
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.customDurationContainer}>
              <Text style={[styles.customDurationLabel, { color: colors.text.secondary }]}>
                Enter number of days (1-30):
              </Text>
              <View style={[styles.customDurationInputContainer, { borderColor: colors.border, backgroundColor: colors.background.primary }]}>
                <TextInput
                  style={[styles.customDurationInput, { color: colors.text.primary }]}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  keyboardType="number-pad"
                  placeholder="Enter days"
                  placeholderTextColor={colors.text.light}
                  maxLength={2}
                />
                <Text style={[styles.customDurationUnit, { color: colors.text.secondary }]}>days</Text>
              </View>
              <Text style={[styles.customDurationHint, { color: colors.text.secondary }]}>
                Customize your challenge length to match your goals
              </Text>
            </View>
          )}
        </View>
        
        <Button
          title="Create Challenge"
          onPress={handleCreateChallenge}
          icon={<Flame size={18} color="white" />}
          style={styles.createButton}
          isLoading={isLoading}
        />
        
        {error && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        )}
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
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  friendSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  friendSelectorText: {
    fontSize: 16,
  },
  friendList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  friendName: {
    fontSize: 16,
  },
  noFriendsText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  durationTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  durationTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  durationTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationOptions: {
    gap: 12,
  },
  durationOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  durationDescription: {
    fontSize: 14,
  },
  customDurationContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  customDurationLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  customDurationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  customDurationInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 4,
  },
  customDurationUnit: {
    fontSize: 16,
    marginLeft: 8,
  },
  customDurationHint: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  createButton: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
});