import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, Users, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFriendStore } from '@/store/friendStore';
import { UserSearchItem } from '@/components/UserSearchItem';

export default function SearchUsersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = params.query as string || '';
  
  const colors = useColors();
  const { 
    searchResults, 
    isLoading, 
    searchUsers, 
    clearSearchResults, 
    sendFriendRequest 
  } = useFriendStore();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, []);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a name or username to search');
      return;
    }
    
    await searchUsers(searchQuery.trim());
  };
  
  const handleSendRequest = async (userId: string, userName: string, userEmail: string) => {
    try {
      await sendFriendRequest(userId, userName, userEmail);
      Alert.alert('Success', `Friend request sent to ${userName}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearchResults();
  };
  
  const handleViewProfile = (userId: string) => {
    Alert.alert('View Profile', "This would navigate to the user's profile");
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Find Friends</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
            <Search size={20} color={colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Search by name or username..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.text.light}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.searchActions}>
            <TouchableOpacity 
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              onPress={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
            >
              <Text style={styles.searchButtonText}>
                {isLoading ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView 
          style={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Searching for users...
              </Text>
            </View>
          ) : searchResults.length === 0 && !isLoading && searchQuery ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
              <Users size={48} color={colors.text.light} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No users found
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Try searching with a different name or username
              </Text>
            </View>
          ) : searchResults.length === 0 && !searchQuery ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
              <Search size={48} color={colors.text.light} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                Find your friends
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Search for users by their name or username to send friend requests
              </Text>
              <Text style={[styles.searchTipsTitle, { color: colors.text.primary }]}>
                Search Tips
              </Text>
              <View style={styles.searchTips}>
                <Text style={[styles.searchTipText, { color: colors.text.secondary }]}>
                  • Try searching by full or partial name
                </Text>
                <Text style={[styles.searchTipText, { color: colors.text.secondary }]}>
                  • Search by username for exact matches
                </Text>
                <Text style={[styles.searchTipText, { color: colors.text.secondary }]}>
                  • You can search for multiple users at once
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.resultsTitle, { color: colors.text.primary }]}>
                Search Results ({searchResults.length})
              </Text>
              
              {searchResults.map(user => (
                <UserSearchItem
                  key={user.id}
                  user={user}
                  onSendRequest={handleSendRequest}
                  onViewProfile={handleViewProfile}
                  isLoading={isLoading}
                />
              ))}
            </>
          )}
        </ScrollView>
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
  searchSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  searchTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchTips: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  searchTipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
});