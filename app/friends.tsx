import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, UserPlus, Inbox, Search, Star, Filter, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFriendStore } from '@/store/friendStore';
import { FriendItem } from '@/components/FriendItem';
import { Button } from '@/components/Button';

export default function FriendsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { 
    getFriends, 
    getPendingRequestsCount, 
    removeFriend, 
    blockFriend,
    toggleFavoriteFriend
  } = useFriendStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterOption, setFilterOption] = useState('all'); // 'all', 'favorites', 'recent'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const allFriends = getFriends();
  const pendingRequestsCount = getPendingRequestsCount();
  
  // Filter friends based on search query and filter option
  const filteredFriends = allFriends.filter(friend => {
    const matchesSearch = friend.friendName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         friend.friendEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterOption === 'favorites') {
      return friend.isFavorite;
    } else if (filterOption === 'recent') {
      // Consider friends added in the last 7 days as recent
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(friend.createdAt) >= oneWeekAgo;
    }
    
    return true;
  });
  
  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      Alert.alert('Success', 'Friend removed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove friend');
    }
  };
  
  const handleBlockFriend = async (friendId: string) => {
    try {
      await blockFriend(friendId);
      Alert.alert('Success', 'User blocked successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to block user');
    }
  };
  
  const handleToggleFavorite = async (friendId: string) => {
    try {
      await toggleFavoriteFriend(friendId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };
  
  const handleViewProfile = (friendId: string) => {
    // Navigate to friend profile (would be implemented in a real app)
    Alert.alert('View Profile', 'This would navigate to the friend\'s profile');
  };
  
  const renderFilterMenu = () => {
    if (!showFilterMenu) return null;
    
    return (
      <View style={[styles.filterMenu, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.filterOption, 
            filterOption === 'all' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => {
            setFilterOption('all');
            setShowFilterMenu(false);
          }}
        >
          <Users size={16} color={filterOption === 'all' ? colors.primary : colors.text.secondary} />
          <Text style={[
            styles.filterOptionText, 
            { color: filterOption === 'all' ? colors.primary : colors.text.primary }
          ]}>
            All Friends
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterOption, 
            filterOption === 'favorites' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => {
            setFilterOption('favorites');
            setShowFilterMenu(false);
          }}
        >
          <Star size={16} color={filterOption === 'favorites' ? colors.primary : colors.text.secondary} />
          <Text style={[
            styles.filterOptionText, 
            { color: filterOption === 'favorites' ? colors.primary : colors.text.primary }
          ]}>
            Favorites
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterOption, 
            filterOption === 'recent' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => {
            setFilterOption('recent');
            setShowFilterMenu(false);
          }}
        >
          <Users size={16} color={filterOption === 'recent' ? colors.primary : colors.text.secondary} />
          <Text style={[
            styles.filterOptionText, 
            { color: filterOption === 'recent' ? colors.primary : colors.text.primary }
          ]}>
            Recently Added
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderFilterLabel = () => {
    switch (filterOption) {
      case 'favorites':
        return 'Favorites';
      case 'recent':
        return 'Recently Added';
      default:
        return 'All Friends';
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Friends</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.actionsSection}>
          <Button
            title="Find Friends"
            onPress={() => router.push('/search-users')}
            icon={<UserPlus size={18} color="white" />}
            style={styles.actionButton}
          />
          
          <Button
            title={`Requests${pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ''}`}
            onPress={() => router.push('/friend-requests')}
            variant="outline"
            icon={<Inbox size={18} color={colors.primary} />}
            style={[styles.actionButton, pendingRequestsCount > 0 && { borderColor: colors.warning }]}
            textStyle={pendingRequestsCount > 0 ? { color: colors.warning } : undefined}
          />
        </View>
        
        {allFriends.length > 0 && (
          <View style={styles.searchFilterSection}>
            {showSearch ? (
              <View style={[styles.searchContainer, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
                <Search size={18} color={colors.text.secondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text.primary }]}
                  placeholder="Search friends..."
                  placeholderTextColor={colors.text.light}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setShowSearch(false);
                }}>
                  <X size={18} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.listControls}>
                <View style={styles.listHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    {renderFilterLabel()} ({filteredFriends.length})
                  </Text>
                  
                  <View style={styles.listActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => setShowSearch(true)}
                    >
                      <Search size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.iconButton, 
                        showFilterMenu && { backgroundColor: colors.primary + '20' }
                      ]}
                      onPress={() => setShowFilterMenu(!showFilterMenu)}
                    >
                      <Filter size={20} color={showFilterMenu ? colors.primary : colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {renderFilterMenu()}
              </View>
            )}
          </View>
        )}
        
        <ScrollView 
          style={styles.friendsList}
          showsVerticalScrollIndicator={false}
        >
          {allFriends.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
              <Users size={48} color={colors.text.light} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No friends yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Start building your network by finding and adding friends
              </Text>
              
              <Button
                title="Find Friends"
                onPress={() => router.push('/search-users')}
                icon={<UserPlus size={18} color="white" />}
                style={styles.emptyActionButton}
              />
            </View>
          ) : filteredFriends.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
              <Search size={48} color={colors.text.light} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No matching friends
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Try a different search term or filter
              </Text>
              
              <Button
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setFilterOption('all');
                }}
                variant="outline"
                style={styles.emptyActionButton}
              />
            </View>
          ) : (
            <>
              {filterOption === 'favorites' && filteredFriends.some(friend => friend.isFavorite) && (
                <Text style={[styles.listLabel, { color: colors.text.secondary }]}>
                  Favorite friends
                </Text>
              )}
              
              {filteredFriends.map(friend => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  onRemove={handleRemoveFriend}
                  onBlock={handleBlockFriend}
                  onToggleFavorite={handleToggleFavorite}
                  onViewProfile={handleViewProfile}
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
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  searchFilterSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  listControls: {
    position: 'relative',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  filterMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 180,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    zIndex: 10,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  friendsList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
  emptyActionButton: {
    paddingHorizontal: 32,
  },
});