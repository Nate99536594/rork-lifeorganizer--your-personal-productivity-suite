import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  MessageCircle, 
  Users, 
  Send, 
  Check
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useNudgeStore, NUDGE_MESSAGES } from '@/store/nudgeStore';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Friend } from '@/types';

export default function SendNudgeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipientId?: string, recipientName?: string }>();
  const colors = useColors();
  const { user } = useAuthStore();
  const { sendNudge, isLoading, error } = useNudgeStore();
  const { getFriends } = useFriendStore();
  
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string>('');
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  
  const friends = getFriends();
  
  // If recipient is passed in params, find the friend
  useEffect(() => {
    if (params.recipientId) {
      const friend = friends.find(f => f.friendId === params.recipientId);
      if (friend) {
        setSelectedFriend(friend);
      }
    }
  }, [params.recipientId, friends]);
  
  const handleSendNudge = async () => {
    if (!selectedFriend) {
      Alert.alert('Error', 'Please select a friend to send encouragement to');
      return;
    }
    
    if (!selectedMessage) {
      Alert.alert('Error', 'Please select a message to send');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send encouragement');
      return;
    }
    
    try {
      await sendNudge({
        senderId: user.id,
        senderName: user.name,
        receiverId: selectedFriend.friendId,
        receiverName: selectedFriend.friendName,
        message: selectedMessage
      });
      
      Alert.alert(
        'Message Sent',
        `Your encouragement has been sent to ${selectedFriend.friendName}!`,
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send message');
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Send Encouragement</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Send Encouragement
            </Text>
          </View>
          
          <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
            Send a quick message to motivate your friends and help them stay on track with their goals and streaks.
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
              {selectedFriend ? selectedFriend.friendName : 'Select a friend'}
            </Text>
            <Users size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          
          {showFriendSelector && (
            <View style={[styles.friendList, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
              {friends.length === 0 ? (
                <Text style={[styles.noFriendsText, { color: colors.text.secondary }]}>
                  You don't have any friends yet. Add friends to send them encouragement!
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
            <MessageCircle size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Choose Message
            </Text>
          </View>
          
          <View style={styles.messageOptions}>
            {NUDGE_MESSAGES.map((message, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.messageOption,
                  { 
                    borderColor: selectedMessage === message ? colors.primary : colors.border,
                    backgroundColor: selectedMessage === message ? colors.primary + '20' : colors.background.primary
                  }
                ]}
                onPress={() => setSelectedMessage(message)}
              >
                <Text style={[
                  styles.messageText,
                  { color: selectedMessage === message ? colors.primary : colors.text.primary }
                ]}>
                  {message}
                </Text>
                
                {selectedMessage === message && (
                  <Check size={16} color={colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <Button
          title="Send Encouragement"
          onPress={handleSendNudge}
          icon={<Send size={18} color="white" />}
          style={styles.sendButton}
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
  messageOptions: {
    gap: 8,
  },
  messageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  sendButton: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
});