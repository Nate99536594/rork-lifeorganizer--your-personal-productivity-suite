import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Filter, Folder, X, ChevronDown, CheckCircle, Circle, Crown, Check, CreditCard, Users, Share2 } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { TaskItem } from '@/components/TaskItem';
import { ProjectItem } from '@/components/ProjectItem';
import { ProjectShareItem } from '@/components/ProjectShareItem';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { useStreakStore } from '@/store/streakStore';
import { useAuthStore } from '@/store/authStore';

export default function TasksScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tasks, addTask, toggleComplete, deleteTask, getTaskLimits, checkAndResetDaily } = useTaskStore();
  const { 
    projects, 
    addProject, 
    updateProject, 
    deleteProject, 
    completeProject,
    getPendingProjectShares,
    acceptProjectShare,
    declineProjectShare,
    removeSharedProject,
    getProjectsSharedWithMe,
    getProjectLimits
  } = useProjectStore();
  const { incrementStreak } = useStreakStore();
  const { user, upgradeToPremium } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'projects'>('general');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Project filtering
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'shared'>('all');
  
  // Project sharing
  const [showProjectSharesModal, setShowProjectSharesModal] = useState(false);
  
  // Credit card form state
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cardholderName: '',
    cvv: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });
  const [cardFormErrors, setCardFormErrors] = useState<{[key: string]: string}>({});
  
  // Check for daily reset when component mounts
  useEffect(() => {
    checkAndResetDaily();
    
    // Set up an interval to check for date changes
    const intervalId = setInterval(() => {
      checkAndResetDaily();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get pending project shares
  const pendingProjectShares = getPendingProjectShares();
  const sharedProjects = getProjectsSharedWithMe();
  
  // Get task limits based on premium status
  const taskLimits = getTaskLimits(user?.isPremium);
  const projectLimits = getProjectLimits(user?.isPremium);
  const currentProjectLimit = user?.isPremium ? projectLimits.premium : projectLimits.regular;
  
  // Get general tasks (tasks without projectId)
  const generalTasks = tasks.filter(task => !task.projectId).filter(task => {
    // Filter by completion status
    if (!showCompleted && task.completed) return false;
    
    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  }).sort((a, b) => {
    // Sort by completion status first
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Get filtered projects - include shared projects for all collaborators
  const filteredProjects = projects
    .filter(project => {
      // Filter by status
      if (statusFilter === 'active' && project.status !== 'active') return false;
      if (statusFilter === 'completed' && project.status !== 'completed') return false;
      if (statusFilter === 'shared' && !project.isShared) return false;
      
      // Filter by search query
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by shared status first (shared projects first)
      if ((a.isShared && !b.isShared) || (!a.isShared && b.isShared)) {
        return a.isShared ? -1 : 1;
      }
      
      // Then sort by status (active first, then completed)
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  
  const handleToggleComplete = (id: string, completed: boolean) => {
    toggleComplete(id);
    
    // If marking as completed and it's a general task, check if we should increment streak
    const task = tasks.find(t => t.id === id);
    if (!completed && task && !task.projectId) {
      incrementStreak();
    }
  };
  
  const handleDeleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteTask(id);
            Alert.alert('Success', 'Task deleted successfully');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleAddTaskPress = () => {
    // Check if we're at the limit before navigating
    if (activeTab === 'general' && generalTasks.length >= taskLimits.general) {
      if (!user?.isPremium) {
        Alert.alert(
          'Limit Reached', 
          `You've reached the maximum of ${taskLimits.general} daily tasks. Upgrade to Premium for up to 30 tasks!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: () => setShowPremiumModal(true) }
          ]
        );
      } else {
        Alert.alert('Limit Reached', `You've reached the maximum of ${taskLimits.general} daily tasks.`);
      }
      return;
    }
    
    router.push('/add-task');
  };
  
  const cycleStatusFilter = () => {
    const filters: Array<'all' | 'active' | 'completed' | 'shared'> = ['all', 'active', 'completed', 'shared'];
    const currentIndex = filters.indexOf(statusFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setStatusFilter(filters[nextIndex]);
  };
  
  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This will not delete the tasks associated with this project.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteProject(projectId);
            Alert.alert('Success', 'Project deleted successfully');
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleCompleteProject = (projectId: string) => {
    Alert.alert(
      'Complete Project',
      'Are you sure you want to mark this project as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            completeProject(projectId);
            Alert.alert('Success', 'Project marked as completed');
          }
        },
      ]
    );
  };
  
  const handleAddProjectPress = () => {
    // Check if user is premium
    if (!user?.isPremium) {
      Alert.alert(
        'Premium Feature', 
        'Projects are a premium feature. Upgrade to Premium to create and manage projects!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Premium', onPress: () => setShowPremiumModal(true) }
        ]
      );
      return;
    }
    
    // Check if we're at the project limit
    if (projects.length >= currentProjectLimit) {
      Alert.alert('Limit Reached', `You've reached the maximum of ${currentProjectLimit} projects.`);
      return;
    }
    
    router.push('/add-task?createProject=true');
  };
  
  const handleProjectsTabPress = () => {
    if (!user?.isPremium) {
      // Show premium modal for non-premium users
      setShowPremiumModal(true);
    } else {
      // Switch to projects tab for premium users
      setActiveTab('projects');
    }
  };
  
  const handleShareProject = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };
  
  const handleAcceptProjectShare = async (shareId: string) => {
    try {
      // Check if user is premium
      if (!user?.isPremium) {
        Alert.alert(
          'Premium Feature', 
          'Projects are a premium feature. Upgrade to Premium to access shared projects!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: () => setShowPremiumModal(true) }
          ]
        );
        return;
      }
      
      // Check if accepting this project would exceed the limit
      if (projects.length >= currentProjectLimit) {
        Alert.alert('Limit Reached', `You've reached the maximum of ${currentProjectLimit} projects.`);
        return;
      }
      
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
  
  const handleRemoveSharedProject = async (projectId: string) => {
    try {
      const result = await removeSharedProject(projectId);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove shared project');
    }
  };
  
  const showPremiumFeatures = () => {
    // Show premium modal for premium features
    setShowPremiumModal(true);
    setShowPaymentOptions(false);
    setShowCreditCardForm(false);
  };
  
  const premiumFeatures = [
    'Projects - Create and manage up to 5 projects to organize your tasks',
    'AI workout assistant - Get personalized workout plans tailored to your fitness goals',
    'Up to 30 tasks - Expand beyond the standard 8 task limit',
    'Up to 12 goals - Expand beyond the standard 3 goal limit',
    'Up to 20 tasks per project - Organize your work efficiently',
    'Monthly recap - Detailed insights on completed and unfinished tasks/workouts'
  ];

  const handleUpgradeToPremium = () => {
    setShowPaymentOptions(true);
  };

  const handleApplePayPurchase = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Pay is only available on iOS devices.');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Simulate Apple Pay payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      await upgradeToPremium();
      
      Alert.alert(
        'Payment Successful!',
        'Welcome to Premium! You now have access to all premium features.',
        [
          {
            text: 'Get Started',
            onPress: () => {
              setShowPaymentOptions(false);
              setShowPremiumModal(false);
              setShowCreditCardForm(false);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const validateCardForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Card number validation (16 digits)
    const cardNumber = cardForm.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardNumber)) {
      errors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    // Expiry date validation (MM/YY)
    if (!cardForm.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardForm.expiryDate)) {
      errors.expiryDate = 'Please enter date in MM/YY format';
    } else {
      // Check if date is not in the past
      const [month, year] = cardForm.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      }
    }
    
    // Cardholder name validation
    if (!cardForm.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    } else if (cardForm.cardholderName.trim().length < 2) {
      errors.cardholderName = 'Please enter a valid name';
    }
    
    // CVV validation (3-4 digits)
    if (!cardForm.cvv) {
      errors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      errors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    // Billing address validation
    if (!cardForm.billingAddress.street.trim()) {
      errors.street = 'Street address is required';
    }
    
    if (!cardForm.billingAddress.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!cardForm.billingAddress.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!cardForm.billingAddress.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(cardForm.billingAddress.zipCode)) {
      errors.zipCode = 'Please enter a valid ZIP code';
    }
    
    setCardFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleCreditCardPurchase = () => {
    setShowCreditCardForm(true);
  };

  const handleProcessCreditCardPayment = async () => {
    if (!validateCardForm()) {
      Alert.alert('Invalid Information', 'Please check all fields and try again.');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Simulate credit card payment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful payment
      await upgradeToPremium();
      
      Alert.alert(
        'Payment Successful!',
        'Welcome to Premium! You now have access to all premium features.',
        [
          {
            text: 'Get Started',
            onPress: () => {
              setShowPaymentOptions(false);
              setShowPremiumModal(false);
              setShowCreditCardForm(false);
              // Reset form
              setCardForm({
                cardNumber: '',
                expiryDate: '',
                cardholderName: '',
                cvv: '',
                billingAddress: {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: 'United States'
                }
              });
              setCardFormErrors({});
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBackToPaymentOptions = () => {
    setShowCreditCardForm(false);
    setCardFormErrors({});
  };

  const handleBackToFeatures = () => {
    setShowPaymentOptions(false);
    setShowCreditCardForm(false);
  };

  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
    setShowPaymentOptions(false);
    setShowCreditCardForm(false);
    setCardFormErrors({});
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'general' && { backgroundColor: colors.primary + '20' },
            { borderColor: activeTab === 'general' ? colors.primary : colors.border }
          ]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'general' ? colors.primary : colors.text.secondary }
          ]}>
            Daily Tasks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'projects' && { backgroundColor: colors.primary + '20' },
            { borderColor: activeTab === 'projects' ? colors.primary : colors.border },
            !user?.isPremium && { backgroundColor: colors.background.primary }
          ]}
          onPress={handleProjectsTabPress}
        >
          <View style={styles.projectsTabContent}>
            <Text style={[
              styles.tabText,
              { color: activeTab === 'projects' ? colors.primary : colors.text.secondary }
            ]}>
              Projects
            </Text>
            {!user?.isPremium && (
              <Crown size={14} color={colors.primary} style={styles.crownIcon} />
            )}
            {pendingProjectShares.length > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.notificationBadgeText}>{pendingProjectShares.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'general' ? (
          <>
            {/* Daily Tasks Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={[styles.title, { color: colors.text.primary }]}>
                    Daily Tasks
                  </Text>
                  <View style={styles.taskCountContainer}>
                    <Text style={[styles.taskCount, { color: colors.text.secondary }]}>
                      {generalTasks.length}/{taskLimits.general} tasks
                    </Text>
                    {!user?.isPremium && (
                      <Text style={[styles.premiumHint, { color: colors.primary }]}>
                        • Premium: 30 tasks
                      </Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.addButton, 
                    { 
                      backgroundColor: generalTasks.length >= taskLimits.general ? colors.text.light : colors.primary,
                      opacity: generalTasks.length >= taskLimits.general ? 0.5 : 1
                    }
                  ]}
                  onPress={handleAddTaskPress}
                  disabled={generalTasks.length >= taskLimits.general}
                >
                  <Plus size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Search and Filters for Daily Tasks */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput, 
                  { 
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border,
                    color: colors.text.primary
                  }
                ]}
                placeholder="Search daily tasks..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.text.light}
              />
              
              <TouchableOpacity 
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: colors.background.primary,
                    borderColor: !showCompleted ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setShowCompleted(!showCompleted)}
              >
                <Filter size={18} color={!showCompleted ? colors.primary : colors.text.secondary} />
                <Text 
                  style={[
                    styles.filterText,
                    { color: !showCompleted ? colors.primary : colors.text.secondary }
                  ]}
                >
                  {showCompleted ? 'All' : 'Active'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Daily Tasks Content */}
            <View style={styles.tasksSection}>
              {generalTasks.length === 0 ? (
                <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    {searchQuery 
                      ? 'No tasks match your search' 
                      : 'No daily tasks yet. Add your first task!'}
                  </Text>
                </View>
              ) : (
                generalTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleComplete(task.id, task.completed)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onPress={() => router.push(`/task/${task.id}`)}
                  />
                ))
              )}
            </View>
          </>
        ) : (
          <>
            {/* Projects Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={[styles.title, { color: colors.text.primary }]}>
                    Projects
                  </Text>
                  <View style={styles.taskCountContainer}>
                    <Text style={[styles.taskCount, { color: colors.text.secondary }]}>
                      {filteredProjects.length}/{currentProjectLimit} projects
                    </Text>
                  </View>
                </View>
                
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={[
                      styles.addButton, 
                      { 
                        backgroundColor: projects.length >= currentProjectLimit ? colors.text.light : colors.primary,
                        opacity: projects.length >= currentProjectLimit ? 0.5 : 1
                      }
                    ]}
                    onPress={handleAddProjectPress}
                    disabled={projects.length >= currentProjectLimit}
                  >
                    <Plus size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Search and Filters for Projects */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput, 
                  { 
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border,
                    color: colors.text.primary
                  }
                ]}
                placeholder="Search projects..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.text.light}
              />
              
              <TouchableOpacity 
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: colors.background.primary,
                    borderColor: statusFilter !== 'all' ? colors.primary : colors.border
                  }
                ]}
                onPress={cycleStatusFilter}
              >
                <Filter size={18} color={statusFilter !== 'all' ? colors.primary : colors.text.secondary} />
                <Text 
                  style={[
                    styles.filterText,
                    { color: statusFilter !== 'all' ? colors.primary : colors.text.secondary }
                  ]}
                >
                  {statusFilter === 'all' ? 'All' : 
                   statusFilter === 'active' ? 'Active' : 
                   statusFilter === 'completed' ? 'Completed' : 'Shared'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Projects Content */}
            <View style={styles.projectsSection}>
              {filteredProjects.length === 0 ? (
                <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    {searchQuery 
                      ? 'No projects match your search' 
                      : 'No projects yet. Create your first project!'}
                  </Text>
                </View>
              ) : (
                <>
                  {/* Shared Projects Section */}
                  {statusFilter === 'all' && sharedProjects.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
                        Shared Projects
                      </Text>
                    </View>
                  )}
                  
                  {/* Project List */}
                  {filteredProjects.map(project => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onPress={() => router.push(`/project/${project.id}`)}
                      onEdit={() => router.push(`/project/${project.id}?edit=true`)}
                      onDelete={() => handleDeleteProject(project.id)}
                      onComplete={() => handleCompleteProject(project.id)}
                      onShare={() => handleShareProject(project.id)}
                    />
                  ))}
                </>
              )}
            </View>
            
            {/* Premium Features Banner */}
            {!user?.isPremium && (
              <TouchableOpacity 
                style={[styles.premiumBanner, { backgroundColor: colors.primary + '15' }]}
                onPress={showPremiumFeatures}
              >
                <View style={styles.premiumBannerContent}>
                  <Crown size={20} color="#FFD700" />
                  <View style={styles.premiumBannerText}>
                    <Text style={[styles.premiumBannerTitle, { color: colors.text.primary }]}>
                      Upgrade to Premium
                    </Text>
                    <Text style={[styles.premiumBannerDescription, { color: colors.text.secondary }]}>
                      Unlock Projects, 30 tasks, 12 goals, and more!
                    </Text>
                  </View>
                </View>
                <ChevronDown size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Premium Features Modal */}
      <Modal
        visible={showPremiumModal && !showPaymentOptions && !showCreditCardForm}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePremiumModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.premiumModalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumTitleContainer}>
                <Crown size={24} color={colors.primary} />
                <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
                  Premium Plan
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClosePremiumModal}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.premiumPricing}>
              <Text style={[styles.premiumPrice, { color: colors.primary }]}>
                $3.99
              </Text>
              <Text style={[styles.premiumPeriod, { color: colors.text.secondary }]}>
                per month
              </Text>
            </View>
            
            <ScrollView style={styles.premiumFeaturesContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.premiumFeatures}>
                <Text style={[styles.featuresTitle, { color: colors.text.primary }]}>
                  Premium Features
                </Text>
                
                {premiumFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={20} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.premiumActions}>
              <TouchableOpacity 
                style={[styles.upgradeToPremiumButton, { backgroundColor: colors.primary }]}
                onPress={handleUpgradeToPremium}
              >
                <Crown size={20} color="white" />
                <Text style={styles.upgradeToPremiumButtonText}>
                  Upgrade to Premium
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelPremiumButton}
                onPress={handleClosePremiumModal}
              >
                <Text style={[styles.cancelPremiumButtonText, { color: colors.text.secondary }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Options Modal */}
      <Modal
        visible={showPaymentOptions && !showCreditCardForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.premiumModalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.premiumHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackToFeatures}
              >
                <Text style={[styles.backButtonText, { color: colors.primary }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
              <View style={styles.premiumTitleContainer}>
                <Crown size={24} color={colors.primary} />
                <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
                  Choose Payment
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClosePremiumModal}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.premiumPricing}>
              <Text style={[styles.premiumPrice, { color: colors.primary }]}>
                $3.99
              </Text>
              <Text style={[styles.premiumPeriod, { color: colors.text.secondary }]}>
                per month
              </Text>
            </View>
            
            <View style={styles.premiumActions}>
              <Text style={[styles.paymentTitle, { color: colors.text.primary }]}>
                Choose Payment Method
              </Text>
              
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={[styles.applePayButton, { backgroundColor: '#000' }]}
                  onPress={handleApplePayPurchase}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.applePayButtonText}>
                    {isProcessingPayment ? 'Processing...' : ' Pay'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.creditCardButton, { backgroundColor: colors.primary }]}
                onPress={handleCreditCardPurchase}
                disabled={isProcessingPayment}
              >
                <CreditCard size={20} color="white" />
                <Text style={styles.creditCardButtonText}>
                  Pay with Card
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelPremiumButton}
                onPress={handleClosePremiumModal}
                disabled={isProcessingPayment}
              >
                <Text style={[styles.cancelPremiumButtonText, { color: colors.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Credit Card Form Modal */}
      <Modal
        visible={showCreditCardForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreditCardForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.creditCardModalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.premiumHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackToPaymentOptions}
              >
                <Text style={[styles.backButtonText, { color: colors.primary }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
              <View style={styles.premiumTitleContainer}>
                <CreditCard size={24} color={colors.primary} />
                <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
                  Payment Details
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClosePremiumModal}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.creditCardForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Card Information
                </Text>
                
                <Input
                  label="Card Number"
                  value={cardForm.cardNumber}
                  onChangeText={(text) => setCardForm(prev => ({ ...prev, cardNumber: formatCardNumber(text) }))}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="numeric"
                  error={cardFormErrors.cardNumber}
                  maxLength={19}
                />
                
                <View style={styles.formRow}>
                  <Input
                    label="Expiry Date"
                    value={cardForm.expiryDate}
                    onChangeText={(text) => setCardForm(prev => ({ ...prev, expiryDate: formatExpiryDate(text) }))}
                    placeholder="MM/YY"
                    keyboardType="numeric"
                    error={cardFormErrors.expiryDate}
                    containerStyle={styles.halfWidth}
                    maxLength={5}
                  />
                  
                  <Input
                    label="CVV"
                    value={cardForm.cvv}
                    onChangeText={(text) => setCardForm(prev => ({ ...prev, cvv: text.replace(/\D/g, '').substring(0, 4) }))}
                    placeholder="123"
                    keyboardType="numeric"
                    error={cardFormErrors.cvv}
                    containerStyle={styles.halfWidth}
                    maxLength={4}
                  />
                </View>
                
                <Input
                  label="Cardholder Name"
                  value={cardForm.cardholderName}
                  onChangeText={(text) => setCardForm(prev => ({ ...prev, cardholderName: text }))}
                  placeholder="John Doe"
                  error={cardFormErrors.cardholderName}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Billing Address
                </Text>
                
                <Input
                  label="Street Address"
                  value={cardForm.billingAddress.street}
                  onChangeText={(text) => setCardForm(prev => ({ 
                    ...prev, 
                    billingAddress: { ...prev.billingAddress, street: text }
                  }))}
                  placeholder="123 Main Street"
                  error={cardFormErrors.street}
                />
                
                <Input
                  label="City"
                  value={cardForm.billingAddress.city}
                  onChangeText={(text) => setCardForm(prev => ({ 
                    ...prev, 
                    billingAddress: { ...prev.billingAddress, city: text }
                  }))}
                  placeholder="New York"
                  error={cardFormErrors.city}
                />
                
                <View style={styles.formRow}>
                  <Input
                    label="State"
                    value={cardForm.billingAddress.state}
                    onChangeText={(text) => setCardForm(prev => ({ 
                      ...prev, 
                      billingAddress: { ...prev.billingAddress, state: text }
                    }))}
                    placeholder="NY"
                    error={cardFormErrors.state}
                    containerStyle={styles.halfWidth}
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                  
                  <Input
                    label="ZIP Code"
                    value={cardForm.billingAddress.zipCode}
                    onChangeText={(text) => setCardForm(prev => ({ 
                      ...prev, 
                      billingAddress: { ...prev.billingAddress, zipCode: text }
                    }))}
                    placeholder="10001"
                    keyboardType="numeric"
                    error={cardFormErrors.zipCode}
                    containerStyle={styles.halfWidth}
                  />
                </View>
                
                <Input
                  label="Country"
                  value={cardForm.billingAddress.country}
                  onChangeText={(text) => setCardForm(prev => ({ 
                    ...prev, 
                    billingAddress: { ...prev.billingAddress, country: text }
                  }))}
                  placeholder="United States"
                />
              </View>
              
              <View style={styles.paymentSummary}>
                <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
                  Payment Summary
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                    Premium Plan (Monthly)
                  </Text>
                  <Text style={[styles.summaryAmount, { color: colors.text.primary }]}>
                    $3.99
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
                    Total
                  </Text>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>
                    $3.99
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.creditCardActions}>
              <TouchableOpacity 
                style={[styles.processPaymentButton, { backgroundColor: colors.primary }]}
                onPress={handleProcessCreditCardPayment}
                disabled={isProcessingPayment}
              >
                <Text style={styles.processPaymentButtonText}>
                  {isProcessingPayment ? 'Processing Payment...' : 'Complete Payment'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelPremiumButton}
                onPress={handleClosePremiumModal}
                disabled={isProcessingPayment}
              >
                <Text style={[styles.cancelPremiumButtonText, { color: colors.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  projectsTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
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
  crownIcon: {
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sharesButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sharesButtonText: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    color: 'white',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  taskCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  premiumHint: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  tasksSection: {
    flex: 1,
  },
  projectsSection: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  premiumBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumBannerText: {
    marginLeft: 12,
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  premiumBannerDescription: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumModalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  creditCardModalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  projectSharesModalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  projectSharesList: {
    flex: 1,
    marginBottom: 20,
  },
  emptySharesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptySharesText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  closeSharesButton: {
    marginTop: 8,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumPricing: {
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumPrice: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 4,
  },
  premiumPeriod: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumFeaturesContainer: {
    flex: 1,
    marginBottom: 24,
  },
  premiumFeatures: {
    paddingBottom: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  premiumActions: {
    gap: 12,
  },
  upgradeToPremiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  upgradeToPremiumButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  applePayButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  applePayButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  creditCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  creditCardButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelPremiumButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelPremiumButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  creditCardForm: {
    flex: 1,
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  paymentSummary: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 122, 255, 0.2)',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  creditCardActions: {
    gap: 12,
  },
  processPaymentButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  processPaymentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});