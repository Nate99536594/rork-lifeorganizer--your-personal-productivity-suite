import React from 'react';
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
import { ArrowLeft, UserPlus, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFriendStore } from '@/store/friendStore';
import { FriendRequestItem } from '@/components/FriendRequestItem';
import { Button } from '@/components/Button';

export default function FriendRequestsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { 
    getFriendRequests, 
    acceptFriendRequest, 
    declineFriendRequest, 
    isLoading 
  } = useFriendStore();
  
  const pendingRequests = getFriendRequests();
  
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };
  
  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      Alert.alert('Success', 'Friend request declined');
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
    }
  };
  
  const handleAcceptAll = async () => {
    Alert.alert(
      'Accept All Requests',
      'Are you sure you want to accept all friend requests?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept All', 
          onPress: async () => {
            try {
              for (const request of pendingRequests) {
                await acceptFriendRequest(request.id);
              }
              Alert.alert('Success', 'All friend requests accepted!');
            } catch (error) {
              Alert.alert('Error', 'Failed to accept all requests');
            }
          }
        },
      ]
    );
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Friend Requests</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Processing request...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {pendingRequests.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
              <UserPlus size={48} color={colors.text.light} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No friend requests
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                When someone sends you a friend request, it will appear here
              </Text>
              
              <Button
                title="Find Friends"
                onPress={() => router.push('/search-users')}
                icon={<UserPlus size={18} color="white" />}
                style={styles.findFriendsButton}
              />
            </View>
          ) : (
            <>
              <View style={styles.requestsHeader}>
                <View style={styles.requestsInfo}>
                  <Clock size={18} color={colors.warning} />
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Pending Requests ({pendingRequests.length})
                  </Text>
                </View>
                
                {pendingRequests.length > 1 && (
                  <TouchableOpacity 
                    style={[styles.acceptAllButton, { backgroundColor: colors.success + '20' }]}
                    onPress={handleAcceptAll}
                  >
                    <Text style={[styles.acceptAllText, { color: colors.success }]}>
                      Accept All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {pendingRequests.map(request => (
                <FriendRequestItem
                  key={request.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                  isLoading={isLoading}
                />
              ))}
            </>
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
    padding: 16,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  requestsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  acceptAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  acceptAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
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
  findFriendsButton: {
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
});