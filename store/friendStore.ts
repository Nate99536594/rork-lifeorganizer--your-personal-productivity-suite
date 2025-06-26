import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';
import { Friend, FriendRequest, UserSearchResult, Contact, ContactSuggestion } from '@/types';
import { useAchievementStore } from './achievementStore';

interface FriendState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  searchResults: UserSearchResult[];
  contactSuggestions: ContactSuggestion[];
  isLoading: boolean;
  
  // Friend management
  getFriends: () => Friend[];
  getFriendRequests: () => FriendRequest[];
  getPendingRequestsCount: () => number;
  getUserById: (userId: string) => Friend | null;
  
  // Search functionality
  searchUsers: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  
  // Contact suggestions
  getContactSuggestions: () => Promise<ContactSuggestion[]>;
  inviteContact: (contact: Contact) => Promise<void>;
  
  // Friend request actions
  sendFriendRequest: (receiverId: string, receiverName: string, receiverEmail: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  
  // Friend actions
  removeFriend: (friendId: string) => Promise<void>;
  blockFriend: (friendId: string) => Promise<void>;
  toggleFavoriteFriend: (friendId: string) => Promise<void>;
  
  // Utility
  isFriend: (userId: string) => boolean;
  hasPendingRequest: (userId: string) => { pending: boolean; sentByMe: boolean };
}

// Mock users database for search functionality - now includes both names and usernames
const mockUsers = [
  { id: '2', name: 'SwiftEagle892', email: 'swift.eagle@example.com', firstName: 'Alex', lastName: 'Johnson' },
  { id: '3', name: 'BraveWolf234', email: 'brave.wolf@example.com', firstName: 'Sam', lastName: 'Wilson' },
  { id: '4', name: 'HappyDolphin567', email: 'happy.dolphin@example.com', firstName: 'Jordan', lastName: 'Taylor' },
  { id: '5', name: 'CleverFox123', email: 'clever.fox@example.com', firstName: 'Casey', lastName: 'Brown' },
  { id: '6', name: 'MightyLion789', email: 'mighty.lion@example.com', firstName: 'Riley', lastName: 'Davis' },
  { id: '7', name: 'GentleBear456', email: 'gentle.bear@example.com', firstName: 'Morgan', lastName: 'Miller' },
  { id: '8', name: 'WiseOwl321', email: 'wise.owl@example.com', firstName: 'Avery', lastName: 'Garcia' },
  { id: '9', name: 'FastCheetah654', email: 'fast.cheetah@example.com', firstName: 'Quinn', lastName: 'Martinez' },
  { id: '10', name: 'CalmTurtle987', email: 'calm.turtle@example.com', firstName: 'Sage', lastName: 'Anderson' },
  { id: '11', name: 'BoldHawk135', email: 'bold.hawk@example.com', firstName: 'River', lastName: 'Thomas' },
  // Users with traditional first and last names
  { id: '12', name: 'johnsmith2024', email: 'john.smith@example.com', firstName: 'John', lastName: 'Smith' },
  { id: '13', name: 'emilyjohnson', email: 'emily.johnson@example.com', firstName: 'Emily', lastName: 'Johnson' },
  { id: '14', name: 'mikebrown88', email: 'michael.brown@example.com', firstName: 'Michael', lastName: 'Brown' },
  { id: '15', name: 'sarahdavis', email: 'sarah.davis@example.com', firstName: 'Sarah', lastName: 'Davis' },
  { id: '16', name: 'davidwilson', email: 'david.wilson@example.com', firstName: 'David', lastName: 'Wilson' },
  { id: '17', name: 'jessicamoore', email: 'jessica.moore@example.com', firstName: 'Jessica', lastName: 'Moore' },
  { id: '18', name: 'chrislee', email: 'chris.lee@example.com', firstName: 'Christopher', lastName: 'Lee' },
  { id: '19', name: 'amandawhite', email: 'amanda.white@example.com', firstName: 'Amanda', lastName: 'White' },
];

export const useFriendStore = create<FriendState>()(
  persist(
    (set, get) => ({
      friends: [],
      friendRequests: [],
      searchResults: [],
      contactSuggestions: [],
      isLoading: false,
      
      getFriends: () => {
        return get().friends.filter(friend => friend.status === 'accepted');
      },
      
      getFriendRequests: () => {
        return get().friendRequests.filter(request => request.status === 'pending');
      },
      
      getPendingRequestsCount: () => {
        return get().friendRequests.filter(request => request.status === 'pending').length;
      },
      
      getUserById: (userId: string) => {
        const { friends } = get();
        return friends.find(friend => friend.friendId === userId && friend.status === 'accepted') || null;
      },
      
      getContactSuggestions: async () => {
        if (Platform.OS === 'web') {
          // Return mock data for web
          const mockContactSuggestions: ContactSuggestion[] = [
            {
              contact: {
                id: 'c1',
                name: 'John Doe',
                phoneNumbers: ['+1234567890'],
                emails: ['john.doe@example.com'],
              },
              user: {
                id: '12',
                name: 'John Smith',
                email: 'john.smith@example.com',
                isFriend: false,
                hasPendingRequest: false,
                requestSentByMe: false,
              },
              isOnRork: true,
            },
            {
              contact: {
                id: 'c2',
                name: 'Jane Smith',
                phoneNumbers: ['+1234567891'],
                emails: ['jane.smith@example.com'],
              },
              isOnRork: false,
            },
          ];
          
          set({ contactSuggestions: mockContactSuggestions });
          return mockContactSuggestions;
        }
        
        try {
          // Request permission to access contacts
          const { status } = await Contacts.requestPermissionsAsync();
          
          if (status !== 'granted') {
            console.log('Contact permission denied');
            return [];
          }
          
          // Get contacts
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
          });
          
          if (data.length > 0) {
            // Convert contacts to our format and check against mock users
            const suggestions: ContactSuggestion[] = data.slice(0, 10).map(contact => {
              // Safely extract emails and phone numbers, filtering out undefined values
              const contactEmails = contact.emails
                ?.map(e => e.email)
                .filter((email): email is string => email !== undefined && email !== null && email.trim() !== '') || [];
              
              const contactPhones = contact.phoneNumbers
                ?.map(p => p.number)
                .filter((phone): phone is string => phone !== undefined && phone !== null && phone.trim() !== '') || [];
              
              // Check if any contact email matches a user in our mock database
              const matchingUser = mockUsers.find(user => 
                contactEmails.some(email => email.toLowerCase() === user.email.toLowerCase())
              );
              
              const formattedContact: Contact = {
                id: contact.id || '',
                name: contact.name || 'Unknown',
                phoneNumbers: contactPhones,
                emails: contactEmails,
              };
              
              if (matchingUser) {
                const { friends, friendRequests } = get();
                const currentUserId = '1';
                
                const isFriend = friends.some(friend => friend.friendId === matchingUser.id);
                const pendingRequest = friendRequests.find(request => 
                  (request.senderId === currentUserId && request.receiverId === matchingUser.id) ||
                  (request.senderId === matchingUser.id && request.receiverId === currentUserId)
                );
                
                const displayName = matchingUser.firstName && matchingUser.lastName 
                  ? `${matchingUser.firstName} ${matchingUser.lastName}` 
                  : matchingUser.name;
                
                return {
                  contact: formattedContact,
                  user: {
                    id: matchingUser.id,
                    name: displayName,
                    email: matchingUser.email,
                    isFriend,
                    hasPendingRequest: !!pendingRequest && pendingRequest.status === 'pending',
                    requestSentByMe: !!pendingRequest && pendingRequest.senderId === currentUserId,
                  },
                  isOnRork: true,
                };
              }
              
              return {
                contact: formattedContact,
                isOnRork: false,
              };
            });
            
            set({ contactSuggestions: suggestions });
            return suggestions;
          }
        } catch (error) {
          console.error('Error getting contacts:', error);
        }
        
        return [];
      },
      
      inviteContact: async (contact: Contact) => {
        // In a real app, this would track the invite
        console.log('Inviting contact:', contact.name);
        // Could store invite tracking data here
      },
      
      searchUsers: async (query: string) => {
        set({ isLoading: true });
        
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { friends, friendRequests } = get();
          const currentUserId = '1';
          
          // Enhanced search: search by username, first name, last name, or full name
          const filteredUsers = mockUsers.filter(user => {
            const queryLower = query.toLowerCase();
            
            // Search by username
            if (user.name.toLowerCase().includes(queryLower)) {
              return true;
            }
            
            // Search by first name
            if (user.firstName && user.firstName.toLowerCase().includes(queryLower)) {
              return true;
            }
            
            // Search by last name
            if (user.lastName && user.lastName.toLowerCase().includes(queryLower)) {
              return true;
            }
            
            // Search by full name (first + last)
            if (user.firstName && user.lastName) {
              const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
              if (fullName.includes(queryLower)) {
                return true;
              }
            }
            
            return false;
          });
          
          // Map to search results with friend status
          const searchResults: UserSearchResult[] = filteredUsers.map(user => {
            const isFriend = friends.some(friend => friend.friendId === user.id);
            const pendingRequest = friendRequests.find(request => 
              (request.senderId === currentUserId && request.receiverId === user.id) ||
              (request.senderId === user.id && request.receiverId === currentUserId)
            );
            
            // Display name preference: show first + last name if available, otherwise username
            const displayName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.name;
            
            return {
              id: user.id,
              name: displayName,
              email: user.email,
              isFriend,
              hasPendingRequest: !!pendingRequest && pendingRequest.status === 'pending',
              requestSentByMe: !!pendingRequest && pendingRequest.senderId === currentUserId,
            };
          });
          
          set({ searchResults, isLoading: false });
        } catch (error) {
          console.error('Search users error:', error);
          set({ isLoading: false });
        }
      },
      
      clearSearchResults: () => {
        set({ searchResults: [] });
      },
      
      sendFriendRequest: async (receiverId: string, receiverName: string, receiverEmail: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newRequest: FriendRequest = {
            id: Date.now().toString(),
            senderId: '1',
            senderName: 'Current User',
            senderEmail: 'current@example.com',
            receiverId,
            receiverName,
            receiverEmail,
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          
          set(state => ({
            friendRequests: [...state.friendRequests, newRequest],
            isLoading: false,
          }));
          
          // Update search results to reflect the sent request
          set(state => ({
            searchResults: state.searchResults.map(user => 
              user.id === receiverId 
                ? { ...user, hasPendingRequest: true, requestSentByMe: true }
                : user
            ),
          }));
          
        } catch (error) {
          console.error('Send friend request error:', error);
          set({ isLoading: false });
        }
      },
      
      acceptFriendRequest: async (requestId: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { friendRequests } = get();
          const request = friendRequests.find(req => req.id === requestId);
          
          if (request) {
            const newFriend: Friend = {
              id: Date.now().toString(),
              userId: '1',
              friendId: request.senderId,
              friendName: request.senderName,
              friendEmail: request.senderEmail,
              createdAt: new Date().toISOString(),
              status: 'accepted',
              isFavorite: false,
              isOnline: Math.random() > 0.5,
              lastActive: new Date().toISOString(),
              mutualFriends: Math.floor(Math.random() * 5),
            };
            
            set(state => {
              const updatedFriends = [...state.friends, newFriend];
              
              // Update achievements
              setTimeout(() => {
                const achievementStore = useAchievementStore.getState();
                achievementStore.onFriendAdded(updatedFriends.filter(f => f.status === 'accepted').length);
                achievementStore.checkAndUnlockAchievements();
              }, 0);
              
              return {
                friendRequests: state.friendRequests.map(req => 
                  req.id === requestId ? { ...req, status: 'accepted' as const } : req
                ),
                friends: updatedFriends,
                isLoading: false,
              };
            });
          }
        } catch (error) {
          console.error('Accept friend request error:', error);
          set({ isLoading: false });
        }
      },
      
      declineFriendRequest: async (requestId: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            friendRequests: state.friendRequests.map(req => 
              req.id === requestId ? { ...req, status: 'declined' as const } : req
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Decline friend request error:', error);
          set({ isLoading: false });
        }
      },
      
      removeFriend: async (friendId: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            friends: state.friends.filter(friend => friend.id !== friendId),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Remove friend error:', error);
          set({ isLoading: false });
        }
      },
      
      blockFriend: async (friendId: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            friends: state.friends.map(friend => 
              friend.id === friendId ? { ...friend, status: 'blocked' as const } : friend
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Block friend error:', error);
          set({ isLoading: false });
        }
      },
      
      toggleFavoriteFriend: async (friendId: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            friends: state.friends.map(friend => 
              friend.id === friendId ? { ...friend, isFavorite: !friend.isFavorite } : friend
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Toggle favorite friend error:', error);
          set({ isLoading: false });
        }
      },
      
      isFriend: (userId: string) => {
        const { friends } = get();
        return friends.some(friend => friend.friendId === userId && friend.status === 'accepted');
      },
      
      hasPendingRequest: (userId: string) => {
        const { friendRequests } = get();
        const currentUserId = '1';
        
        const request = friendRequests.find(req => 
          ((req.senderId === currentUserId && req.receiverId === userId) ||
           (req.senderId === userId && req.receiverId === currentUserId)) &&
          req.status === 'pending'
        );
        
        return {
          pending: !!request,
          sentByMe: !!request && request.senderId === currentUserId,
        };
      },
    }),
    {
      name: 'friend-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);