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
  MessageCircle, 
  Inbox, 
  Send, 
  Filter,
  Trash2
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useNudgeStore } from '@/store/nudgeStore';
import { useAuthStore } from '@/store/authStore';
import { NudgeItem } from '@/components/NudgeItem';
import { Button } from '@/components/Button';

export default function NudgesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthStore();
  const { 
    getReceivedNudges, 
    getSentNudges, 
    markAsRead, 
    deleteNudge,
    isLoading
  } = useNudgeStore();
  
  const [filter, setFilter] = useState<'received' | 'sent'>('received');
  
  const receivedNudges = getReceivedNudges();
  const sentNudges = getSentNudges();
  
  const nudges = filter === 'received' ? receivedNudges : sentNudges;
  
  const handleMarkAsRead = (nudgeId: string) => {
    markAsRead(nudgeId);
  };
  
  const handleDeleteNudge = (nudgeId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteNudge(nudgeId);
            Alert.alert('Success', 'Message deleted');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleReply = (senderId: string, senderName: string) => {
    // Navigate to send nudge screen with pre-filled recipient
    router.push({
      pathname: '/send-nudge',
      params: { recipientId: senderId, recipientName: senderName }
    });
  };
  
  const handleBackPress = () => {
    // Go back to previous screen
    router.back();
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <View style={[styles.tabSelector, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              filter === 'received' && { 
                backgroundColor: colors.primary + '20',
                borderBottomColor: colors.primary,
                borderBottomWidth: 2
              }
            ]}
            onPress={() => setFilter('received')}
          >
            <Inbox 
              size={18} 
              color={filter === 'received' ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: filter === 'received' ? colors.primary : colors.text.secondary }
            ]}>
              Received
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              filter === 'sent' && { 
                backgroundColor: colors.primary + '20',
                borderBottomColor: colors.primary,
                borderBottomWidth: 2
              }
            ]}
            onPress={() => setFilter('sent')}
          >
            <Send 
              size={18} 
              color={filter === 'sent' ? colors.primary : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: filter === 'sent' ? colors.primary : colors.text.secondary }
            ]}>
              Sent
            </Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading messages...
            </Text>
          </View>
        ) : nudges.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
            <MessageCircle size={48} color={colors.text.light} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No {filter} messages
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {filter === 'received' 
                ? 'When friends send you encouragement, you will see it here' 
                : 'Send encouragement to your friends to help them stay motivated'}
            </Text>
            
            {filter === 'sent' && (
              <Button
                title="Send Encouragement"
                onPress={() => router.push('/send-nudge')}
                icon={<MessageCircle size={18} color="white" />}
                style={styles.emptyActionButton}
              />
            )}
          </View>
        ) : (
          <ScrollView 
            style={styles.nudgesList}
            contentContainerStyle={styles.nudgesListContent}
            showsVerticalScrollIndicator={false}
          >
            {nudges.map(nudge => (
              <NudgeItem
                key={nudge.id}
                nudge={nudge}
                onMarkAsRead={filter === 'received' && !nudge.read ? () => handleMarkAsRead(nudge.id) : undefined}
                onDelete={() => handleDeleteNudge(nudge.id)}
                onReply={filter === 'received' ? () => handleReply(nudge.senderId, nudge.senderName) : undefined}
              />
            ))}
          </ScrollView>
        )}
        
        {filter === 'received' && receivedNudges.length > 0 && (
          <View style={styles.actionButtonContainer}>
            <Button
              title="Send Encouragement"
              onPress={() => router.push('/send-nudge')}
              icon={<MessageCircle size={18} color="white" />}
            />
          </View>
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
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
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
  nudgesList: {
    flex: 1,
  },
  nudgesListContent: {
    paddingBottom: 80,
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});