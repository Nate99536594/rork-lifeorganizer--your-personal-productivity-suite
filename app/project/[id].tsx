import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Folder, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  Plus, 
  Trash2, 
  ArrowLeft,
  AlertCircle,
  X,
  Users,
  Share2,
  UserPlus,
  Settings,
  LogOut,
  Crown
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';
import { TaskItem } from '@/components/TaskItem';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/Button';
import { ProjectPermissions } from '@/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { 
    projects, 
    updateProject, 
    deleteProject, 
    completeProject, 
    updateProjectProgress, 
    shareProject, 
    isProjectShared,
    getCollaboratorCount,
    leaveProject,
    getProjectTaskLimit
  } = useProjectStore();
  const { tasks, toggleComplete, deleteTask, addTask, getTaskLimits } = useTaskStore();
  const { getFriends } = useFriendStore();
  const { user } = useAuthStore();
  
  const project = projects.find(p => p.id === id);
  const projectTasks = tasks.filter(task => task.projectId === id);
  const friends = getFriends();
  
  // Get task limits based on premium status
  const taskLimits = getTaskLimits(user?.isPremium);
  
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [showQuickAddTask, setShowQuickAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Share project modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [permissions, setPermissions] = useState<ProjectPermissions>({
    canEdit: false,
    canAddTasks: true,
    canDeleteTasks: false,
    canCompleteTasks: true,
    canInviteOthers: false
  });
  
  // Collaborators modal state
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  
  // Get collaborator count
  const collaboratorCount = project ? getCollaboratorCount(project.id) : 0;
  
  // Calculate remaining collaborator slots
  const remainingCollaboratorSlots = 3 - collaboratorCount;
  
  // Check if current user is the project creator
  const isProjectCreator = project && user && (
    (!project.isShared && !project.sharedBy) || // User created the project originally
    (project.sharedBy === user.id) // User is the one who shared it
  );
  
  // Memoize the progress calculation to prevent infinite re-renders
  const currentProgress = React.useMemo(() => {
    if (projectTasks.length === 0) return 0;
    const completedCount = projectTasks.filter(task => task.completed).length;
    return Math.round((completedCount / projectTasks.length) * 100);
  }, [projectTasks]);
  
  // Update progress when it changes, but prevent infinite loops
  useEffect(() => {
    if (id && project && currentProgress !== project.progress) {
      updateProjectProgress(id, currentProgress);
    }
  }, [id, currentProgress, project?.progress, updateProjectProgress]);
  
  if (!project) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>Project not found</Text>
          <Button 
            title="Go Back to Tasks" 
            onPress={() => router.push('/(tabs)/tasks')} 
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const handleToggleComplete = (taskId: string) => {
    toggleComplete(taskId);
  };
  
  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteTask(taskId);
            Alert.alert('Success', 'Task deleted successfully');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This will not delete the tasks associated with this project.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteProject(project.id);
            router.replace('/(tabs)/tasks');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleLeaveProject = () => {
    Alert.alert(
      'Leave Project',
      'Are you sure you want to leave this project? You will lose access to all project tasks and updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          onPress: async () => {
            try {
              const result = await leaveProject(project.id);
              if (result.success) {
                Alert.alert('Success', result.message, [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)/tasks')
                  }
                ]);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to leave project');
            }
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleCompleteProject = () => {
    Alert.alert(
      'Complete Project',
      'Are you sure you want to mark this project as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            completeProject(project.id);
            Alert.alert('Success', 'Project marked as completed');
          }
        },
      ]
    );
  };
  
  const handleQuickAddTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }
    
    // Use the project's specific task limit
    const projectTaskLimit = getProjectTaskLimit(project);
    
    const result = addTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      completed: false,
      createdAt: new Date().toISOString(),
      projectId: project.id,
    }, user?.isPremium, projectTaskLimit);
    
    if (result.success) {
      setNewTaskTitle('');
      setNewTaskPriority('medium');
      setShowQuickAddTask(false);
      Alert.alert('Success', 'Task added successfully!');
    } else {
      Alert.alert('Limit Reached', result.message);
    }
  };
  
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prevSelected => {
      if (prevSelected.includes(friendId)) {
        // Remove friend if already selected
        return prevSelected.filter(id => id !== friendId);
      } else {
        // Add friend if not at limit
        if (prevSelected.length < remainingCollaboratorSlots) {
          return [...prevSelected, friendId];
        } else {
          Alert.alert(
            'Selection Limit Reached', 
            `You can only select up to ${remainingCollaboratorSlots} friend${remainingCollaboratorSlots === 1 ? '' : 's'} (maximum 3 collaborators total).`
          );
          return prevSelected;
        }
      }
    });
  };
  
  const handleShareProject = async () => {
    if (selectedFriendIds.length === 0) {
      Alert.alert('Error', 'Please select at least one friend to share with');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to share projects');
      return;
    }
    
    try {
      // Create an array of promises for each friend share
      const sharePromises = selectedFriendIds.map(friendId => {
        const selectedFriend = friends.find(f => f.friendId === friendId);
        if (!selectedFriend) {
          return Promise.resolve({
            success: false,
            message: `Invalid friend selection for ID: ${friendId}`
          });
        }
        
        return shareProject(
          project.id,
          selectedFriend.friendId,
          selectedFriend.friendName,
          shareMessage,
          permissions
        );
      });
      
      // Wait for all shares to complete
      const results = await Promise.all(sharePromises);
      
      // Check if all shares were successful
      const allSuccessful = results.every(result => result.success);
      const successCount = results.filter(result => result.success).length;
      
      if (allSuccessful) {
        setSelectedFriendIds([]);
        setShareMessage('');
        setPermissions({
          canEdit: false,
          canAddTasks: true,
          canDeleteTasks: false,
          canCompleteTasks: true,
          canInviteOthers: false
        });
        setShowShareModal(false);
        
        Alert.alert('Success', `Project shared with ${successCount} friend${successCount !== 1 ? 's' : ''}!`);
      } else {
        // Some shares failed
        const failedCount = results.length - successCount;
        Alert.alert(
          'Partial Success', 
          `Project shared with ${successCount} friend${successCount !== 1 ? 's' : ''}, but ${failedCount} share${failedCount !== 1 ? 's' : ''} failed.`
        );
      }
    } catch (error) {
      console.error("Error sharing project:", error);
      Alert.alert('Error', 'Failed to share project. Please try again.');
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getStatusColor = () => {
    switch (project.status) {
      case 'active':
        return colors.primary;
      case 'completed':
        return colors.success;
      default:
        return colors.text.secondary;
    }
  };
  
  const getProgressColor = () => {
    if (project.status === 'completed') return colors.success;
    if (currentProgress < 30) return colors.danger;
    if (currentProgress < 70) return colors.warning;
    return colors.primary;
  };
  
  const filteredTasks = projectTasks
    .filter(task => showCompletedTasks || !task.completed)
    .sort((a, b) => {
      // Sort by completion status first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  
  const completedTasksCount = projectTasks.filter(task => task.completed).length;
  const isShared = project.isShared || isProjectShared(project.id);
  
  // Get the project's task limit
  const projectTaskLimit = getProjectTaskLimit(project);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.backButtonContainer}
          onPress={() => router.push('/(tabs)/tasks')}
        >
          <ArrowLeft size={20} color={colors.text.secondary} />
          <Text style={[styles.backButtonText, { color: colors.text.secondary }]}>
            Back to Tasks
          </Text>
        </TouchableOpacity>
        
        <View style={[styles.projectHeader, { backgroundColor: colors.background.primary }]}>
          <View style={styles.projectHeaderTop}>
            <View style={styles.projectHeaderTopLeft}>
              <View style={[styles.statusTag, { backgroundColor: getStatusColor() }]}>
                <Text style={[styles.statusText, { color: 'white' }]}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Text>
              </View>
              
              {isShared && (
                <View style={[styles.sharedTag, { backgroundColor: colors.secondary }]}>
                  <Users size={12} color="white" />
                  <Text style={[styles.sharedText, { color: 'white' }]}>
                    Shared
                  </Text>
                </View>
              )}
              
              {project.createdByPremium === true && (
                <View style={[styles.premiumTag, { backgroundColor: colors.warning }]}>
                  <Crown size={12} color="white" />
                  <Text style={[styles.premiumText, { color: 'white' }]}>
                    Premium
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.projectColorIndicator}>
              <View style={[styles.colorDot, { backgroundColor: project.color }]} />
            </View>
          </View>
          
          <Text style={[styles.projectTitle, { color: colors.text.primary }]}>
            {project.name}
          </Text>
          
          {project.isShared && project.sharedByName && (
            <Text style={[styles.sharedByText, { color: colors.text.secondary }]}>
              Shared by {project.sharedByName}
            </Text>
          )}
          
          {project.description && (
            <Text style={[styles.projectDescription, { color: colors.text.secondary }]}>
              {project.description}
            </Text>
          )}
          
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={currentProgress} 
              color={getProgressColor()}
              showPercentage={true}
            />
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {completedTasksCount} of {projectTasks.length} tasks completed
            </Text>
          </View>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={colors.text.secondary} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                Started: {formatDate(project.startDate)}
              </Text>
            </View>
            
            {project.endDate && (
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.text.secondary} />
                <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                  Due: {formatDate(project.endDate)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.projectActions}>
            {project.status === 'active' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.success + '20' }]} 
                onPress={handleCompleteProject}
              >
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>Complete</Text>
              </TouchableOpacity>
            )}
            
            {isProjectCreator && !project.isShared && (
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: colors.secondary + '20',
                    opacity: collaboratorCount >= 3 ? 0.5 : 1
                  }
                ]} 
                onPress={() => {
                  if (collaboratorCount >= 3) {
                    Alert.alert('Limit Reached', "You've reached the maximum of 3 collaborators for this project.");
                  } else {
                    setShowShareModal(true);
                  }
                }}
                disabled={collaboratorCount >= 3}
              >
                <Share2 size={16} color={colors.secondary} />
                <Text style={[styles.actionButtonText, { color: colors.secondary }]}>
                  Share {collaboratorCount > 0 ? `(${collaboratorCount}/3)` : ''}
                </Text>
              </TouchableOpacity>
            )}
            
            {isShared && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} 
                onPress={() => setShowCollaboratorsModal(true)}
              >
                <Users size={16} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Collaborators</Text>
              </TouchableOpacity>
            )}
            
            {isProjectCreator ? (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]} 
                onPress={handleDeleteProject}
              >
                <Trash2 size={16} color={colors.danger} />
                <Text style={[styles.actionButtonText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            ) : project.isShared && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]} 
                onPress={handleLeaveProject}
              >
                <LogOut size={16} color={colors.warning} />
                <Text style={[styles.actionButtonText, { color: colors.warning }]}>Leave</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Tasks ({projectTasks.length})
            </Text>
            
            <View style={styles.taskActions}>
              <TouchableOpacity 
                style={[
                  styles.toggleButton, 
                  { borderColor: colors.border }
                ]}
                onPress={() => setShowCompletedTasks(!showCompletedTasks)}
              >
                {showCompletedTasks ? (
                  <CheckCircle size={16} color={colors.text.secondary} />
                ) : (
                  <Circle size={16} color={colors.text.secondary} />
                )}
                <Text style={[styles.toggleButtonText, { color: colors.text.secondary }]}>
                  {showCompletedTasks ? 'Hide Completed' : 'Show Completed'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.addTaskButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (projectTasks.length >= projectTaskLimit) {
                    Alert.alert('Limit Reached', `You've reached the maximum of ${projectTaskLimit} tasks for this project.`);
                  } else {
                    setShowQuickAddTask(true);
                  }
                }}
              >
                <Plus size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Quick Add Task Form */}
          {showQuickAddTask && (
            <View style={[styles.quickAddContainer, { backgroundColor: colors.background.primary }]}>
              <View style={styles.quickAddHeader}>
                <Text style={[styles.quickAddTitle, { color: colors.text.primary }]}>
                  Quick Add Task
                </Text>
                <TouchableOpacity onPress={() => setShowQuickAddTask(false)}>
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.quickAddInput, { 
                  backgroundColor: colors.background.secondary, 
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Enter task title"
                placeholderTextColor={colors.text.light}
                autoFocus
              />
              
              <View style={styles.priorityContainer}>
                <Text style={[styles.priorityLabel, { color: colors.text.secondary }]}>Priority:</Text>
                <View style={styles.priorityOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.priorityButton,
                      { borderColor: newTaskPriority === 'low' ? colors.success : colors.border },
                      newTaskPriority === 'low' && { backgroundColor: colors.success + '20' }
                    ]}
                    onPress={() => setNewTaskPriority('low')}
                  >
                    <AlertCircle size={16} color={colors.success} />
                    <Text 
                      style={[
                        styles.priorityText,
                        { color: colors.success },
                        newTaskPriority === 'low' && styles.activePriorityText
                      ]}
                    >
                      Low
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.priorityButton,
                      { borderColor: newTaskPriority === 'medium' ? colors.warning : colors.border },
                      newTaskPriority === 'medium' && { backgroundColor: colors.warning + '20' }
                    ]}
                    onPress={() => setNewTaskPriority('medium')}
                  >
                    <AlertCircle size={16} color={colors.warning} />
                    <Text 
                      style={[
                        styles.priorityText,
                        { color: colors.warning },
                        newTaskPriority === 'medium' && styles.activePriorityText
                      ]}
                    >
                      Medium
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.priorityButton,
                      { borderColor: newTaskPriority === 'high' ? colors.danger : colors.border },
                      newTaskPriority === 'high' && { backgroundColor: colors.danger + '20' }
                    ]}
                    onPress={() => setNewTaskPriority('high')}
                  >
                    <AlertCircle size={16} color={colors.danger} />
                    <Text 
                      style={[
                        styles.priorityText,
                        { color: colors.danger },
                        newTaskPriority === 'high' && styles.activePriorityText
                      ]}
                    >
                      High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.quickAddActions}>
                <Button
                  title="Add Task"
                  onPress={handleQuickAddTask}
                  icon={<Plus size={18} color="white" />}
                  style={styles.quickAddButton}
                />
                
                <Button
                  title="Advanced"
                  onPress={() => {
                    setShowQuickAddTask(false);
                    router.push(`/add-task?projectId=${project.id}`);
                  }}
                  variant="outline"
                  style={styles.advancedButton}
                />
              </View>
            </View>
          )}
          
          {filteredTasks.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                {projectTasks.length === 0 
                  ? 'No tasks in this project yet. Add your first task!' 
                  : 'No tasks match your filter.'}
              </Text>
              <Button
                title="Add Task"
                onPress={() => {
                  if (projectTasks.length >= projectTaskLimit) {
                    Alert.alert('Limit Reached', `You've reached the maximum of ${projectTaskLimit} tasks for this project.`);
                  } else {
                    router.push(`/add-task?projectId=${project.id}`);
                  }
                }}
                icon={<Plus size={18} color="white" />}
                style={styles.emptyAddButton}
              />
            </View>
          ) : (
            filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggleComplete(task.id)}
                onDelete={() => handleDeleteTask(task.id)}
                onPress={() => router.push(`/task/${task.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
      
      {!showQuickAddTask && (
        <TouchableOpacity 
          style={[
            styles.floatingAddButton, 
            { backgroundColor: colors.primary }
          ]}
          onPress={() => {
            if (projectTasks.length >= projectTaskLimit) {
              Alert.alert('Limit Reached', `You've reached the maximum of ${projectTaskLimit} tasks for this project.`);
            } else {
              router.push(`/add-task?projectId=${project.id}`);
            }
          }}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}
      
      {/* Share Project Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Share Project
              </Text>
              <TouchableOpacity onPress={() => {
                setShowShareModal(false);
                setSelectedFriendIds([]);
              }}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.collaboratorLimitInfo}>
                <Users size={16} color={colors.text.secondary} />
                <Text style={[styles.collaboratorLimitText, { color: colors.text.secondary }]}>
                  {collaboratorCount}/3 collaborators • Select up to {remainingCollaboratorSlots} friend{remainingCollaboratorSlots !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <Text style={[styles.modalSectionTitle, { color: colors.text.primary }]}>
                Select Friends
              </Text>
              
              {friends.length === 0 ? (
                <View style={styles.noFriendsContainer}>
                  <UserPlus size={32} color={colors.text.light} />
                  <Text style={[styles.noFriendsText, { color: colors.text.secondary }]}>
                    You don't have any friends yet. Add friends to share projects with them.
                  </Text>
                  <Button
                    title="Find Friends"
                    onPress={() => {
                      setShowShareModal(false);
                      router.push('/search-users');
                    }}
                    style={styles.findFriendsButton}
                  />
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {friends.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendItem,
                        { borderColor: colors.border },
                        selectedFriendIds.includes(friend.friendId) && {
                          backgroundColor: colors.primary + '20',
                          borderColor: colors.primary
                        }
                      ]}
                      onPress={() => toggleFriendSelection(friend.friendId)}
                    >
                      <View style={styles.friendInfo}>
                        <View style={[styles.friendAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.friendAvatarText}>
                            {friend.friendName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[
                          styles.friendName,
                          { color: colors.text.primary },
                          selectedFriendIds.includes(friend.friendId) && { color: colors.primary }
                        ]}>
                          {friend.friendName}
                        </Text>
                      </View>
                      
                      {selectedFriendIds.includes(friend.friendId) && (
                        <CheckCircle size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <Text style={[styles.modalSectionTitle, { color: colors.text.primary }]}>
                Permissions
              </Text>
              
              <View style={styles.permissionsContainer}>
                <TouchableOpacity
                  style={styles.permissionItem}
                  onPress={() => setPermissions(prev => ({ ...prev, canEdit: !prev.canEdit }))}
                >
                  {permissions.canEdit ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <Circle size={20} color={colors.text.secondary} />
                  )}
                  <View style={styles.permissionInfo}>
                    <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
                      Edit Project Details
                    </Text>
                    <Text style={[styles.permissionDescription, { color: colors.text.secondary }]}>
                      Allow editing project name, description, and dates
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.permissionItem}
                  onPress={() => setPermissions(prev => ({ ...prev, canAddTasks: !prev.canAddTasks }))}
                >
                  {permissions.canAddTasks ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <Circle size={20} color={colors.text.secondary} />
                  )}
                  <View style={styles.permissionInfo}>
                    <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
                      Add Tasks
                    </Text>
                    <Text style={[styles.permissionDescription, { color: colors.text.secondary }]}>
                      Allow adding new tasks to the project
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.permissionItem}
                  onPress={() => setPermissions(prev => ({ ...prev, canDeleteTasks: !prev.canDeleteTasks }))}
                >
                  {permissions.canDeleteTasks ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <Circle size={20} color={colors.text.secondary} />
                  )}
                  <View style={styles.permissionInfo}>
                    <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
                      Delete Tasks
                    </Text>
                    <Text style={[styles.permissionDescription, { color: colors.text.secondary }]}>
                      Allow deleting tasks from the project
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.permissionItem}
                  onPress={() => setPermissions(prev => ({ ...prev, canCompleteTasks: !prev.canCompleteTasks }))}
                >
                  {permissions.canCompleteTasks ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <Circle size={20} color={colors.text.secondary} />
                  )}
                  <View style={styles.permissionInfo}>
                    <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
                      Complete Tasks
                    </Text>
                    <Text style={[styles.permissionDescription, { color: colors.text.secondary }]}>
                      Allow marking tasks as complete or incomplete
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.permissionItem}
                  onPress={() => setPermissions(prev => ({ ...prev, canInviteOthers: !prev.canInviteOthers }))}
                >
                  {permissions.canInviteOthers ? (
                    <CheckCircle size={20} color={colors.success} />
                  ) : (
                    <Circle size={20} color={colors.text.secondary} />
                  )}
                  <View style={styles.permissionInfo}>
                    <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
                      Invite Others
                    </Text>
                    <Text style={[styles.permissionDescription, { color: colors.text.secondary }]}>
                      Allow inviting other collaborators to the project
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalSectionTitle, { color: colors.text.primary }]}>
                Message (Optional)
              </Text>
              
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border,
                    color: colors.text.primary
                  }
                ]}
                value={shareMessage}
                onChangeText={setShareMessage}
                placeholder="Add a message to your friends..."
                placeholderTextColor={colors.text.light}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <Button
                title={`Share with ${selectedFriendIds.length} Friend${selectedFriendIds.length !== 1 ? 's' : ''}`}
                onPress={handleShareProject}
                icon={<Share2 size={18} color="white" />}
                style={styles.shareButton}
                disabled={selectedFriendIds.length === 0 || friends.length === 0 || collaboratorCount >= 3}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Collaborators Modal */}
      <Modal
        visible={showCollaboratorsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCollaboratorsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Project Collaborators
              </Text>
              <TouchableOpacity onPress={() => setShowCollaboratorsModal(false)}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.collaboratorsSection}>
                <View style={styles.collaboratorItem}>
                  <View style={styles.collaboratorInfo}>
                    <View style={[styles.collaboratorAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.collaboratorAvatarText}>
                        {project.sharedByName ? project.sharedByName.charAt(0).toUpperCase() : 'O'}
                      </Text>
                    </View>
                    <View style={styles.collaboratorDetails}>
                      <Text style={[styles.collaboratorName, { color: colors.text.primary }]}>
                        {project.sharedByName || 'Project Owner'}
                      </Text>
                      <Text style={[styles.collaboratorRole, { color: colors.text.secondary }]}>
                        {project.isShared ? 'Owner' : 'You (Owner)'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* This would be populated with actual collaborators in a real implementation */}
                <View style={styles.collaboratorItem}>
                  <View style={styles.collaboratorInfo}>
                    <View style={[styles.collaboratorAvatar, { backgroundColor: colors.secondary }]}>
                      <Text style={styles.collaboratorAvatarText}>
                        {user?.username.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.collaboratorDetails}>
                      <Text style={[styles.collaboratorName, { color: colors.text.primary }]}>
                        {project.isShared ? user?.username || 'You' : 'Collaborator'}
                      </Text>
                      <Text style={[styles.collaboratorRole, { color: colors.text.secondary }]}>
                        {project.isShared ? 'Collaborator' : 'Invited'}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.collaboratorAction}>
                    <Settings size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.collaboratorLimitInfo}>
                <Users size={16} color={colors.text.secondary} />
                <Text style={[styles.collaboratorLimitText, { color: colors.text.secondary }]}>
                  {collaboratorCount}/3 collaborators
                </Text>
              </View>
              
              <View style={styles.collaboratorActions}>
                {isProjectCreator && (
                  <Button
                    title="Invite More"
                    onPress={() => {
                      setShowCollaboratorsModal(false);
                      setShowShareModal(true);
                    }}
                    icon={<UserPlus size={18} color="white" />}
                    style={styles.inviteMoreButton}
                    disabled={collaboratorCount >= 3}
                  />
                )}
                
                <Button
                  title="Done"
                  onPress={() => setShowCollaboratorsModal(false)}
                  variant="outline"
                  style={styles.doneButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  projectHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectHeaderTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sharedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  sharedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '500',
  },
  projectColorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sharedByText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 6,
  },
  projectActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  tasksSection: {
    flex: 1,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  addTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyAddButton: {
    minWidth: 120,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    minWidth: 160,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickAddContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quickAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickAddInput: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  activePriorityText: {
    fontWeight: '600',
  },
  quickAddActions: {
    flexDirection: 'row',
  },
  quickAddButton: {
    flex: 2,
    marginRight: 8,
  },
  advancedButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  friendsList: {
    marginBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionsContainer: {
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permissionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 14,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    marginBottom: 16,
  },
  shareButton: {
    marginBottom: 16,
  },
  noFriendsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noFriendsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  findFriendsButton: {
    minWidth: 150,
  },
  collaboratorsSection: {
    marginBottom: 16,
  },
  collaboratorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  collaboratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collaboratorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collaboratorAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  collaboratorRole: {
    fontSize: 14,
  },
  collaboratorAction: {
    padding: 8,
  },
  collaboratorActions: {
    marginTop: 16,
  },
  inviteMoreButton: {
    marginBottom: 12,
  },
  doneButton: {
    marginBottom: 16,
  },
  collaboratorLimitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  collaboratorLimitText: {
    fontSize: 14,
  },
});