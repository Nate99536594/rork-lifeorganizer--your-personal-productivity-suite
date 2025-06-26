import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Users, 
  UserPlus, 
  Inbox, 
  Search, 
  Star, 
  Filter, 
  X, 
  Bell,
  Trophy,
  Plus,
  Flame,
  Target,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Edit,
  Clock,
  Crown,
  Share2,
  List,
  Eye,
  Folder
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '@/hooks/useColors';
import { useFriendStore } from '@/store/friendStore';
import { useActivityFeedStore } from '@/store/activityFeedStore';
import { useChallengeStore } from '@/store/challengeStore';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { FriendItem } from '@/components/FriendItem';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { ChallengeItem } from '@/components/ChallengeItem';
import { ProjectShareItem } from '@/components/ProjectShareItem';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function FriendsTab() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthStore();
  const { 
    getFriends, 
    getPendingRequestsCount, 
    removeFriend, 
    blockFriend,
    toggleFavoriteFriend,
    isLoading,
    getContactSuggestions,
    inviteContact
  } = useFriendStore();
  
  const { getFriendActivities } = useActivityFeedStore();
  const { 
    getPendingChallenges,
    getActiveChallenges,
    getCompletedChallenges,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    isLoading: challengeLoading
  } = useChallengeStore();
  
  const {
    getPendingProjectShares,
    acceptProjectShare,
    declineProjectShare
  } = useProjectStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterOption, setFilterOption] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'activity' | 'challenges' | 'projects'>('friends');
  
  // Challenge creation modal state
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [durationOption, setDurationOption] = useState<'preset' | 'custom'>('preset');
  const [presetDuration, setPresetDuration] = useState<3 | 7>(7);
  const [customDuration, setCustomDuration] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState('');
  
  // Contact suggestions state - fixed state management
  const [contactSuggestions, setContactSuggestions] = useState<any[]>([]);
  const [showContactSuggestions, setShowContactSuggestions] = useState(true);
  const [showInviteContacts, setShowInviteContacts] = useState(true);
  const [showShareProfile, setShowShareProfile] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  
  const allFriends = getFriends();
  const pendingRequestsCount = getPendingRequestsCount();
  const friendActivities = getFriendActivities();
  const pendingChallenges = getPendingChallenges();
  const activeChallenges = getActiveChallenges();
  const completedChallenges = getCompletedChallenges();
  const pendingProjectShares = getPendingProjectShares();
  
  // Load contact suggestions on component mount
  useEffect(() => {
    loadContactSuggestions();
  }, []);
  
  const loadContactSuggestions = async () => {
    if (Platform.OS === 'web') {
      // Skip contact loading on web
      return;
    }
    
    setLoadingContacts(true);
    try {
      const suggestions = await getContactSuggestions();
      setContactSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load contact suggestions:', error);
    } finally {
      setLoadingContacts(false);
    }
  };
  
  // Filter friends based on search query and filter option
  const filteredFriends = allFriends.filter(friend => {
    const matchesSearch = friend.friendName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterOption === 'favorites') {
      return friend.isFavorite;
    } else if (filterOption === 'recent') {
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
  
  const handleCreateChallenge = async () => {
    if (!challengeName.trim()) {
      Alert.alert('Error', 'Please enter a challenge name');
      return;
    }
    
    if (!selectedFriendId) {
      Alert.alert('Error', 'Please select a friend to challenge');
      return;
    }
    
    const selectedFriend = allFriends.find(f => f.friendId === selectedFriendId);
    if (!selectedFriend || !user) {
      Alert.alert('Error', 'Invalid friend selection');
      return;
    }
    
    // Validate custom duration if selected
    let finalDuration: number = presetDuration;
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
        creatorName: user.usernameType === 'real' ? user.username : user.anonymousUsername,
        participantId: selectedFriend.friendId,
        participantName: selectedFriend.friendName,
        type: 'streak',
        duration: finalDuration,
      });
      
      // Reset form
      setChallengeName('');
      setChallengeDescription('');
      setSelectedFriendId('');
      setCustomDuration('');
      setDurationOption('preset');
      setPresetDuration(7);
      setShowCreateChallengeModal(false);
      
      Alert.alert('Success', `Challenge sent to ${selectedFriend.friendName}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create challenge');
    }
  };
  
  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
      Alert.alert('Success', 'Challenge accepted! Good luck!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept challenge');
    }
  };
  
  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await declineChallenge(challengeId);
      Alert.alert('Success', 'Challenge declined');
    } catch (error) {
      Alert.alert('Error', 'Failed to decline challenge');
    }
  };
  
  const handleAcceptProjectShare = async (shareId: string) => {
    try {
      const result = await acceptProjectShare(shareId);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept project share');
    }
  };
  
  const handleDeclineProjectShare = async (shareId: string) => {
    try {
      const result = await declineProjectShare(shareId);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decline project share');
    }
  };
  
  const handleCopyProfileLink = async () => {
    if (!user) return;
    
    const profileLink = `https://rork.app/user/${user.username}`;
    
    try {
      await Clipboard.setStringAsync(profileLink);
      Alert.alert('Success', 'Your profile link has been copied!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };
  
  const handleShareProfile = async () => {
    if (!user) return;
    
    const profileLink = `https://rork.app/user/${user.username}`;
    const message = `Check out my Rork profile! Join me by downloading the app: ${profileLink}`;
    
    try {
      if (Platform.OS === 'web') {
        // Fallback for web
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied', 'Share message copied to clipboard!');
      } else {
        await Share.share({
          message,
          url: profileLink,
          title: 'Join me on Rork!',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share profile');
    }
  };
  
  const handleInviteContact = async (contact: any) => {
    try {
      await inviteContact(contact);
      
      const message = `Hey! I'm using Rork to track my workouts and progress. Join me by downloading the app here: https://rork.app — You can follow me directly!`;
      
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied', 'Invite message copied to clipboard!');
      } else {
        await Share.share({
          message,
          title: 'Join me on Rork!',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite');
    }
  };
  
  const isCurrentUser = (userId: string) => {
    return user?.id === userId;
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
  
  const renderContactSuggestions = () => {
    if (Platform.OS === 'web') return null;
    
    const suggestionsOnRork = contactSuggestions.filter(s => s.isOnRork);
    
    if (suggestionsOnRork.length === 0) return null;
    
    return (
      <View style={[styles.suggestionSection, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setShowContactSuggestions(!showContactSuggestions)}
        >
          <View style={styles.sectionHeaderLeft}>
            <Users size={20} color={colors.primary} />
            <Text style={[styles.sectionHeaderText, { color: colors.primary }]}>
              People You May Know
            </Text>
          </View>
          {showContactSuggestions ? 
            <ChevronUp size={20} color={colors.text.secondary} /> : 
            <ChevronDown size={20} color={colors.text.secondary} />
          }
        </TouchableOpacity>
        
        {showContactSuggestions && (
          <View style={styles.sectionContent}>
            {suggestionsOnRork.slice(0, 3).map((suggestion, index) => (
              <View key={index} style={[styles.suggestionItem, { borderColor: colors.border }]}>
                <View style={styles.suggestionInfo}>
                  <View style={[styles.suggestionAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.suggestionAvatarText}>
                      {suggestion.user?.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.suggestionDetails}>
                    <Text style={[styles.suggestionName, { color: colors.text.primary }]}>
                      {suggestion.user?.name}
                    </Text>
                    <Text style={[styles.suggestionEmail, { color: colors.text.secondary }]}>
                      {suggestion.user?.email}
                    </Text>
                  </View>
                </View>
                <Button
                  title="Add Friend"
                  onPress={() => router.push('/search-users')}
                  variant="outline"
                  style={styles.suggestionButton}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  const renderInviteContacts = () => {
    if (Platform.OS === 'web') return null;
    
    const contactsNotOnRork = contactSuggestions.filter(s => !s.isOnRork);
    
    if (contactsNotOnRork.length === 0) return null;
    
    return (
      <View style={[styles.suggestionSection, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setShowInviteContacts(!showInviteContacts)}
        >
          <View style={styles.sectionHeaderLeft}>
            <UserPlus size={20} color={colors.secondary} />
            <Text style={[styles.sectionHeaderText, { color: colors.secondary }]}>
              Invite Friends
            </Text>
          </View>
          {showInviteContacts ? 
            <ChevronUp size={20} color={colors.text.secondary} /> : 
            <ChevronDown size={20} color={colors.text.secondary} />
          }
        </TouchableOpacity>
        
        {showInviteContacts && (
          <View style={styles.sectionContent}>
            {contactsNotOnRork.slice(0, 3).map((suggestion, index) => (
              <View key={index} style={[styles.suggestionItem, { borderColor: colors.border }]}>
                <View style={styles.suggestionInfo}>
                  <View style={[styles.suggestionAvatar, { backgroundColor: colors.text.light }]}>
                    <Text style={styles.suggestionAvatarText}>
                      {suggestion.contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.suggestionDetails}>
                    <Text style={[styles.suggestionName, { color: colors.text.primary }]}>
                      {suggestion.contact.name}
                    </Text>
                    <Text style={[styles.suggestionEmail, { color: colors.text.secondary }]}>
                      {suggestion.contact.emails[0] || suggestion.contact.phoneNumbers[0]}
                    </Text>
                  </View>
                </View>
                <Button
                  title="Invite"
                  onPress={() => handleInviteContact(suggestion.contact)}
                  style={styles.suggestionButton}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  const renderShareProfile = () => {
    if (!user) return null;
    
    return (
      <View style={[styles.suggestionSection, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setShowShareProfile(!showShareProfile)}
        >
          <View style={styles.sectionHeaderLeft}>
            <ExternalLink size={20} color={colors.warning} />
            <Text style={[styles.sectionHeaderText, { color: colors.warning }]}>
              Share Your Profile
            </Text>
          </View>
          {showShareProfile ? 
            <ChevronUp size={20} color={colors.text.secondary} /> : 
            <ChevronDown size={20} color={colors.text.secondary} />
          }
        </TouchableOpacity>
        
        {showShareProfile && (
          <View style={styles.sectionContent}>
            <View style={[styles.profileLinkContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
              <Text style={[styles.profileLink, { color: colors.text.secondary }]} numberOfLines={1}>
                https://rork.app/user/{user.username}
              </Text>
            </View>
            
            <View style={styles.shareButtons}>
              <Button
                title="Copy Link"
                onPress={handleCopyProfileLink}
                icon={<Copy size={16} color="white" />}
                style={styles.shareButton}
              />
              <Button
                title="Share"
                onPress={handleShareProfile}
                variant="outline"
                icon={<ExternalLink size={16} color={colors.primary} />}
                style={styles.shareButton}
              />
            </View>
          </View>
        )}
      </View>
    );
  };
  
  const renderCreateChallengeModal = () => {
    return (
      <Modal
        visible={showCreateChallengeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateChallengeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Create Challenge
              </Text>
              <TouchableOpacity onPress={() => setShowCreateChallengeModal(false)}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Input
                label="Challenge Name"
                value={challengeName}
                onChangeText={setChallengeName}
                placeholder="e.g., 7-Day Streak Challenge"
              />
              
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Duration Type</Text>
              <View style={styles.durationTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.durationTypeButton,
                    { borderColor: colors.border },
                    durationOption === 'preset' && { 
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary
                    }
                  ]}
                  onPress={() => setDurationOption('preset')}
                >
                  <Clock size={18} color={durationOption === 'preset' ? colors.primary : colors.text.secondary} />
                  <Text style={[
                    styles.durationTypeText,
                    { color: colors.text.secondary },
                    durationOption === 'preset' && { 
                      color: colors.primary,
                      fontWeight: '600'
                    }
                  ]}>
                    Preset
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.durationTypeButton,
                    { borderColor: colors.border },
                    durationOption === 'custom' && { 
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary
                    }
                  ]}
                  onPress={() => setDurationOption('custom')}
                >
                  <Edit size={18} color={durationOption === 'custom' ? colors.primary : colors.text.secondary} />
                  <Text style={[
                    styles.durationTypeText,
                    { color: colors.text.secondary },
                    durationOption === 'custom' && { 
                      color: colors.primary,
                      fontWeight: '600'
                    }
                  ]}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
              
              {durationOption === 'preset' ? (
                <>
                  <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Duration</Text>
                  <View style={styles.durationContainer}>
                    <TouchableOpacity
                      style={[
                        styles.durationButton,
                        { borderColor: colors.border },
                        presetDuration === 3 && { 
                          backgroundColor: colors.primary + '20',
                          borderColor: colors.primary
                        }
                      ]}
                      onPress={() => setPresetDuration(3)}
                    >
                      <Text style={[
                        styles.durationText,
                        { color: colors.text.secondary },
                        presetDuration === 3 && { 
                          color: colors.primary,
                          fontWeight: '600'
                        }
                      ]}>
                        3 Days
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.durationButton,
                        { borderColor: colors.border },
                        presetDuration === 7 && { 
                          backgroundColor: colors.primary + '20',
                          borderColor: colors.primary
                        }
                      ]}
                      onPress={() => setPresetDuration(7)}
                    >
                      <Text style={[
                        styles.durationText,
                        { color: colors.text.secondary },
                        presetDuration === 7 && { 
                          color: colors.primary,
                          fontWeight: '600'
                        }
                      ]}>
                        7 Days
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Custom Duration</Text>
                  <View style={[styles.customDurationContainer, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}>
                    <TextInput
                      style={[styles.customDurationInput, { color: colors.text.primary }]}
                      value={customDuration}
                      onChangeText={setCustomDuration}
                      keyboardType="number-pad"
                      placeholder="Enter days (1-30)"
                      placeholderTextColor={colors.text.light}
                      maxLength={2}
                    />
                    <Text style={[styles.customDurationUnit, { color: colors.text.secondary }]}>days</Text>
                  </View>
                  <Text style={[styles.customDurationHint, { color: colors.text.secondary }]}>
                    Enter a number between 1 and 30 days
                  </Text>
                </>
              )}
              
              <Text style={[styles.modalLabel, { color: colors.text.primary }]}>Select Friend</Text>
              <View style={styles.friendSelectionContainer}>
                {allFriends.map(friend => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendSelectionItem,
                      { borderColor: colors.border },
                      selectedFriendId === friend.friendId && { 
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary
                      }
                    ]}
                    onPress={() => setSelectedFriendId(friend.friendId)}
                  >
                    <Text style={[
                      styles.friendSelectionText,
                      { color: colors.text.primary },
                      selectedFriendId === friend.friendId && { 
                        color: colors.primary,
                        fontWeight: '600'
                      }
                    ]}>
                      {friend.friendName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Input
                label="Description (Optional)"
                value={challengeDescription}
                onChangeText={setChallengeDescription}
                placeholder="Add a motivational message..."
                multiline
                numberOfLines={3}
              />
              
              <Button
                title="Create Challenge"
                onPress={handleCreateChallenge}
                icon={<Trophy size={18} color="white" />}
                style={styles.modalButton}
                disabled={challengeLoading}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  const renderFriendsTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading friends...
          </Text>
        </View>
      );
    }
    
    if (allFriends.length === 0) {
      return (
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
      );
    }
    
    if (filteredFriends.length === 0) {
      return (
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
      );
    }
    
    return (
      <View>
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
          />
        ))}
      </View>
    );
  };
  
  const renderActivityTab = () => {
    if (friendActivities.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
          <Bell size={48} color={colors.text.light} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No activity yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Your friends have not shared any activities yet. Check back later!
          </Text>
        </View>
      );
    }
    
    return (
      <View>
        <Text style={[styles.activityHeader, { color: colors.text.secondary }]}>
          Recent Activity
        </Text>
        
        {friendActivities.map(activity => (
          <ActivityFeedItem
            key={activity.id}
            activity={activity}
          />
        ))}
      </View>
    );
  };
  
  const renderChallengesTab = () => {
    const allChallenges = [...pendingChallenges, ...activeChallenges, ...completedChallenges];
    
    if (allChallenges.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
          <Trophy size={48} color={colors.text.light} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No challenges yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Create your first challenge to compete with friends and stay motivated!
          </Text>
          
          <Button
            title="Create Challenge"
            onPress={() => setShowCreateChallengeModal(true)}
            icon={<Plus size={18} color="white" />}
            style={styles.emptyActionButton}
          />
        </View>
      );
    }
    
    return (
      <View>
        {pendingChallenges.length > 0 && (
          <View>
            <Text style={[styles.challengeSectionTitle, { color: colors.text.secondary }]}>
              Pending Challenges
            </Text>
            {pendingChallenges.map(challenge => (
              <ChallengeItem
                key={challenge.id}
                challenge={challenge}
                isCurrentUser={isCurrentUser}
                onAccept={() => handleAcceptChallenge(challenge.id)}
                onDecline={() => handleDeclineChallenge(challenge.id)}
              />
            ))}
          </View>
        )}
        
        {activeChallenges.length > 0 && (
          <View>
            <Text style={[styles.challengeSectionTitle, { color: colors.text.secondary }]}>
              Active Challenges
            </Text>
            {activeChallenges.map(challenge => (
              <ChallengeItem
                key={challenge.id}
                challenge={challenge}
                isCurrentUser={isCurrentUser}
              />
            ))}
          </View>
        )}
        
        {completedChallenges.length > 0 && (
          <View>
            <Text style={[styles.challengeSectionTitle, { color: colors.text.secondary }]}>
              Completed Challenges
            </Text>
            {completedChallenges.map(challenge => (
              <ChallengeItem
                key={challenge.id}
                challenge={challenge}
                isCurrentUser={isCurrentUser}
              />
            ))}
          </View>
        )}
      </View>
    );
  };
  
  const renderProjectsTab = () => {
    if (pendingProjectShares.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
          <Folder size={48} color={colors.text.light} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No project invitations
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            When friends invite you to collaborate on projects, they will appear here.
          </Text>
        </View>
      );
    }
    
    return (
      <View>
        <Text style={[styles.projectsSectionTitle, { color: colors.text.secondary }]}>
          Project Collaboration Requests
        </Text>
        
        {pendingProjectShares.map(share => (
          <ProjectShareItem
            key={share.id}
            shareRequest={share}
            onAccept={handleAcceptProjectShare}
            onDecline={handleDeclineProjectShare}
          />
        ))}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Suggestions and Profile Sharing */}
        {renderContactSuggestions()}
        {renderInviteContacts()}
        {renderShareProfile()}
        
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
        
        {/* Tab Selector - 2x2 Grid */}
        <View style={[styles.tabSelector, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
          {/* First Row */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'friends' && { 
                  backgroundColor: colors.primary + '20',
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2
                }
              ]}
              onPress={() => setActiveTab('friends')}
            >
              <Users 
                size={18} 
                color={activeTab === 'friends' ? colors.primary : colors.text.secondary} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'friends' ? colors.primary : colors.text.secondary }
              ]}>
                Friends
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'projects' && { 
                  backgroundColor: colors.primary + '20',
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2
                }
              ]}
              onPress={() => setActiveTab('projects')}
            >
              <Folder 
                size={18} 
                color={activeTab === 'projects' ? colors.primary : colors.text.secondary} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'projects' ? colors.primary : colors.text.secondary }
              ]}>
                Projects
              </Text>
              {pendingProjectShares.length > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.notificationBadgeText}>{pendingProjectShares.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Second Row */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'challenges' && { 
                  backgroundColor: colors.primary + '20',
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2
                }
              ]}
              onPress={() => setActiveTab('challenges')}
            >
              <Trophy 
                size={18} 
                color={activeTab === 'challenges' ? colors.primary : colors.text.secondary} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'challenges' ? colors.primary : colors.text.secondary }
              ]}>
                Challenges
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'activity' && { 
                  backgroundColor: colors.primary + '20',
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2
                }
              ]}
              onPress={() => setActiveTab('activity')}
            >
              <Bell 
                size={18} 
                color={activeTab === 'activity' ? colors.primary : colors.text.secondary} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'activity' ? colors.primary : colors.text.secondary }
              ]}>
                Activity
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {activeTab === 'friends' && allFriends.length > 0 && (
          <View style={styles.searchFilterSection}>
            {showSearch ? (
              <View style={[styles.searchContainer, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
                <Search size={18} color={colors.text.secondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text.primary }]}
                  placeholder="Search friends by name..."
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
        
        {activeTab === 'challenges' && (
          <View style={styles.challengeActions}>
            <Button
              title="Create Challenge"
              onPress={() => setShowCreateChallengeModal(true)}
              icon={<Plus size={18} color="white" />}
              style={styles.createChallengeButton}
            />
          </View>
        )}
        
        <View style={styles.contentSection}>
          {activeTab === 'friends' && renderFriendsTab()}
          {activeTab === 'activity' && renderActivityTab()}
          {activeTab === 'challenges' && renderChallengesTab()}
          {activeTab === 'projects' && renderProjectsTab()}
        </View>
      </ScrollView>
      
      {renderCreateChallengeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  contentSection: {
    flex: 1,
  },
  suggestionSection: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  suggestionDetails: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionEmail: {
    fontSize: 14,
  },
  suggestionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  profileLinkContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  profileLink: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  tabSelector: {
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
  challengeActions: {
    marginBottom: 16,
  },
  createChallengeButton: {
    alignSelf: 'flex-start',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  activityHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  challengeSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  projectsSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalForm: {
    maxHeight: 400,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  durationTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  durationTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  durationTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customDurationContainer: {
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
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 4,
  },
  customDurationUnit: {
    fontSize: 14,
    marginLeft: 8,
  },
  customDurationHint: {
    fontSize: 12,
    marginBottom: 16,
  },
  friendSelectionContainer: {
    marginBottom: 16,
  },
  friendSelectionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  friendSelectionText: {
    fontSize: 16,
  },
  modalButton: {
    marginTop: 16,
  },
});