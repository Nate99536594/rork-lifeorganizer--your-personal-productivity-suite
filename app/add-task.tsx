import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Save, X, AlertCircle, Folder, Plus, Calendar, Crown, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function AddTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string; createProject?: string }>();
  const { tasks, addTask, getGeneralTasks, getTaskLimits } = useTaskStore();
  const { projects, addProject, getProjectLimits, getProjectTaskLimit } = useProjectStore();
  const { user } = useAuthStore();
  const colors = useColors();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(params.projectId);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const projectColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];
  
  // Get task limits based on premium status
  const taskLimits = getTaskLimits(user?.isPremium);
  const projectLimits = getProjectLimits(user?.isPremium);
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }
    
    // Get the project's task limit if it's a project task
    let projectTaskLimit = undefined;
    if (selectedProjectId) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject) {
        projectTaskLimit = getProjectTaskLimit(selectedProject);
      } else {
        projectTaskLimit = taskLimits.project;
      }
    }
    
    const result = addTask({
      title: title.trim(),
      description: description.trim(),
      notes: description.trim(),
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
      projectId: selectedProjectId,
      dueDate: dueDate?.toISOString(),
    }, user?.isPremium, projectTaskLimit);
    
    if (result.success) {
      Alert.alert('Success', result.message, [
        { text: 'OK', onPress: () => {
          if (selectedProjectId) {
            router.push(`/project/${selectedProjectId}`);
          } else {
            router.back();
          }
        }}
      ]);
    } else {
      Alert.alert('Limit Reached', result.message);
    }
  };
  
  const handleCancel = () => {
    if (selectedProjectId) {
      router.push(`/project/${selectedProjectId}`);
    } else {
      router.back();
    }
  };
  
  const handleCreateProject = () => {
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
    
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Project name cannot be empty');
      return;
    }
    
    const result = addProject({
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      color: newProjectColor,
      startDate: new Date().toISOString(),
    });
    
    if (result.success && result.projectId) {
      setSelectedProjectId(result.projectId);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectColor('#3B82F6');
      setShowCreateProjectModal(false);
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // Check limits based on task type
  const generalTasks = getGeneralTasks();
  const isAtGeneralLimit = !selectedProjectId && generalTasks.length >= taskLimits.general;
  
  // For project tasks, use the project's specific task limit
  const projectTaskLimit = selectedProject ? getProjectTaskLimit(selectedProject) : taskLimits.project;
  const isAtProjectLimit = selectedProjectId && tasks.filter(t => t.projectId === selectedProjectId).length >= projectTaskLimit;
  const isAtLimit = isAtGeneralLimit || isAtProjectLimit;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
  };
  
  const premiumFeatures = [
    'Projects - Create and manage up to 5 projects to organize your tasks',
    'AI workout assistant - Get personalized workout plans tailored to your fitness goals',
    'Shared to-do lists - Collaborate on tasks with friends and family',
    'Up to 30 tasks - Expand beyond the standard 8 task limit',
    'Up to 12 goals - Expand beyond the standard 3 goal limit',
    'Up to 20 tasks per project - Organize your work efficiently',
    'Monthly recap - Detailed insights on completed and unfinished tasks/workouts'
  ];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleCancel}
        >
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Add Task</Text>
        <Text style={[styles.taskCount, { color: colors.text.secondary }]}>
          {selectedProjectId 
            ? `${tasks.filter(t => t.projectId === selectedProjectId).length}/${projectTaskLimit}`
            : `${generalTasks.length}/${taskLimits.general}`
          }
        </Text>
      </View>
      
      {isAtLimit ? (
        <View style={[styles.limitContainer, { backgroundColor: colors.background.primary }]}>
          <AlertCircle size={48} color={colors.warning} />
          <Text style={[styles.limitTitle, { color: colors.text.primary }]}>
            Task Limit Reached
          </Text>
          <Text style={[styles.limitMessage, { color: colors.text.secondary }]}>
            {isAtGeneralLimit 
              ? `You have reached the maximum of ${taskLimits.general} general tasks. ${!user?.isPremium ? 'Upgrade to Premium for up to 30 tasks, or ' : ''}Please complete or delete some tasks before adding new ones.`
              : `You have reached the maximum of ${projectTaskLimit} tasks for this project. Please complete or delete some tasks before adding new ones.`
            }
          </Text>
          <Button
            title="Go Back"
            onPress={handleCancel}
            style={styles.backButton}
          />
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Title</Text>
            <TextInput
              style={[styles.titleInput, { 
                backgroundColor: colors.background.primary, 
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              placeholderTextColor={colors.text.light}
              autoFocus
            />
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Project</Text>
            <TouchableOpacity
              style={[styles.projectSelector, { 
                backgroundColor: colors.background.primary, 
                borderColor: colors.border 
              }]}
              onPress={() => {
                if (!user?.isPremium && !selectedProjectId) {
                  // Show premium modal for non-premium users trying to select a project
                  setShowPremiumModal(true);
                } else {
                  setShowProjectModal(true);
                }
              }}
            >
              <View style={styles.projectSelectorContent}>
                {selectedProject ? (
                  <>
                    <View style={[styles.projectColorDot, { backgroundColor: selectedProject.color }]} />
                    <Text style={[styles.projectSelectorText, { color: colors.text.primary }]}>
                      {selectedProject.name}
                    </Text>
                  </>
                ) : (
                  <>
                    {!user?.isPremium && (
                      <Crown size={16} color={colors.primary} style={styles.crownIcon} />
                    )}
                    <Folder size={16} color={colors.text.secondary} />
                    <Text style={[styles.projectSelectorText, { color: colors.text.secondary }]}>
                      {!user?.isPremium ? 'Projects (Premium Feature)' : 'Select Project (Optional)'}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Due Date (Optional)</Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                backgroundColor: colors.background.primary, 
                borderColor: colors.border
              }]}
              onPress={() => setShowDueDatePicker(true)}
            >
              <Calendar size={18} color={colors.text.secondary} />
              <Text style={[styles.dateButtonText, { color: colors.text.primary }]}>
                {dueDate ? formatDate(dueDate) : 'No due date'}
              </Text>
            </TouchableOpacity>
            
            {(showDueDatePicker && Platform.OS === 'android') && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDueDatePicker(false);
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              <TouchableOpacity 
                style={[
                  styles.priorityButton,
                  { borderColor: priority === 'low' ? colors.success : colors.border },
                  priority === 'low' && { backgroundColor: colors.success + '20' }
                ]}
                onPress={() => setPriority('low')}
              >
                <AlertCircle size={16} color={colors.success} />
                <Text 
                  style={[
                    styles.priorityText,
                    { color: colors.success },
                    priority === 'low' && styles.activePriorityText
                  ]}
                >
                  Low
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.priorityButton,
                  { borderColor: priority === 'medium' ? colors.warning : colors.border },
                  priority === 'medium' && { backgroundColor: colors.warning + '20' }
                ]}
                onPress={() => setPriority('medium')}
              >
                <AlertCircle size={16} color={colors.warning} />
                <Text 
                  style={[
                    styles.priorityText,
                    { color: colors.warning },
                    priority === 'medium' && styles.activePriorityText
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.priorityButton,
                  { borderColor: priority === 'high' ? colors.danger : colors.border },
                  priority === 'high' && { backgroundColor: colors.danger + '20' }
                ]}
                onPress={() => setPriority('high')}
              >
                <AlertCircle size={16} color={colors.danger} />
                <Text 
                  style={[
                    styles.priorityText,
                    { color: colors.danger },
                    priority === 'high' && styles.activePriorityText
                  ]}
                >
                  High
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: colors.background.primary, 
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes here..."
              placeholderTextColor={colors.text.light}
              multiline
              textAlignVertical="top"
            />
          </View>
          
          <Button
            title="Create Task"
            onPress={handleSave}
            icon={<Save size={18} color="white" />}
            style={styles.saveButton}
          />
        </ScrollView>
      )}
      
      {/* Project Selection Modal */}
      <Modal
        visible={showProjectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Select Project
            </Text>
            
            <ScrollView style={styles.projectList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.projectOption, { borderColor: colors.border }]}
                onPress={() => {
                  setSelectedProjectId(undefined);
                  setShowProjectModal(false);
                }}
              >
                <View style={styles.projectOptionContent}>
                  <Folder size={20} color={colors.text.secondary} />
                  <Text style={[styles.projectOptionText, { color: colors.text.secondary }]}>
                    General Task (No Project)
                  </Text>
                </View>
                {selectedProjectId === undefined && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
              
              {projects.map(project => {
                const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;
                const projectTaskLimit = getProjectTaskLimit(project);
                
                return (
                  <TouchableOpacity
                    key={project.id}
                    style={[styles.projectOption, { borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedProjectId(project.id);
                      setShowProjectModal(false);
                    }}
                  >
                    <View style={styles.projectOptionContent}>
                      <View style={[styles.projectColorDot, { backgroundColor: project.color }]} />
                      <View style={styles.projectInfo}>
                        <Text style={[styles.projectOptionText, { color: colors.text.primary }]}>
                          {project.name}
                        </Text>
                        {project.description && (
                          <Text style={[styles.projectDescription, { color: colors.text.secondary }]}>
                            {project.description}
                          </Text>
                        )}
                        <Text style={[styles.projectTaskCount, { color: colors.text.light }]}>
                          {projectTaskCount}/{projectTaskLimit} tasks
                          {project.createdByPremium === true && ' (Premium)'}
                          {project.createdByPremium === false && ' (Regular)'}
                          {project.createdByPremium === undefined && ' (Legacy)'}
                        </Text>
                      </View>
                    </View>
                    {selectedProjectId === project.id && (
                      <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity
                style={[styles.createProjectButton, { borderColor: colors.primary }]}
                onPress={() => {
                  if (!user?.isPremium) {
                    // Show premium modal for non-premium users
                    setShowProjectModal(false);
                    setTimeout(() => setShowPremiumModal(true), 100);
                  } else {
                    setShowProjectModal(false);
                    setTimeout(() => setShowCreateProjectModal(true), 100);
                  }
                }}
              >
                {!user?.isPremium && (
                  <Crown size={20} color={colors.primary} />
                )}
                <Plus size={20} color={colors.primary} />
                <Text style={[styles.createProjectText, { color: colors.primary }]}>
                  Create New Project {!user?.isPremium && '(Premium)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowProjectModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Create Project Modal */}
      <Modal
        visible={showCreateProjectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateProjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Create New Project
            </Text>
            
            <View style={styles.createProjectForm}>
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Name</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background.secondary, 
                    borderColor: colors.border,
                    color: colors.text.primary
                  }]}
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                  placeholder="Enter project name"
                  placeholderTextColor={colors.text.light}
                />
              </View>
              
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Description</Text>
                <TextInput
                  style={[styles.formInput, { 
                    backgroundColor: colors.background.secondary, 
                    borderColor: colors.border,
                    color: colors.text.primary
                  }]}
                  value={newProjectDescription}
                  onChangeText={setNewProjectDescription}
                  placeholder="Enter project description (optional)"
                  placeholderTextColor={colors.text.light}
                />
              </View>
              
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>Color</Text>
                <View style={styles.colorPicker}>
                  {projectColors.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newProjectColor === color && styles.selectedColor
                      ]}
                      onPress={() => setNewProjectColor(color)}
                    />
                  ))}
                </View>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowCreateProjectModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateProject}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* iOS date picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDueDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.datePickerContainer}>
            <View style={[styles.datePickerContent, { backgroundColor: colors.background.primary }]}>
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
                style={styles.datePicker}
              />
              <View style={styles.datePickerActions}>
                <Button
                  title="Clear"
                  onPress={() => {
                    setDueDate(undefined);
                    setShowDueDatePicker(false);
                  }}
                  variant="outline"
                  style={styles.datePickerClearButton}
                />
                <Button
                  title="Done"
                  onPress={() => setShowDueDatePicker(false)}
                  style={styles.datePickerDoneButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Premium Features Modal */}
      <Modal
        visible={showPremiumModal}
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
                  Premium Feature
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.premiumCloseButton}
                onPress={handleClosePremiumModal}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.premiumMessage, { color: colors.text.secondary }]}>
              Projects are a premium feature. Upgrade to Premium to create and manage projects!
            </Text>
            
            <View style={styles.premiumPricing}>
              <Text style={[styles.premiumPrice, { color: colors.primary }]}>
                $3.99
              </Text>
              <Text style={[styles.premiumPeriod, { color: colors.text.secondary }]}>
                per month
              </Text>
            </View>
            
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
            
            <View style={styles.premiumActions}>
              <TouchableOpacity 
                style={[styles.upgradeToPremiumButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  handleClosePremiumModal();
                  router.push('/(tabs)/tasks');
                }}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  taskCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  limitContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 12,
  },
  limitTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  limitMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    width: '100%',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  titleInput: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  projectSelector: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  projectSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  projectSelectorText: {
    fontSize: 16,
    marginLeft: 8,
  },
  crownIcon: {
    marginRight: 4,
  },
  priorityContainer: {
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
  activePriorityText: {
    fontWeight: '600',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  notesInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  projectList: {
    maxHeight: 300,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  projectOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectInfo: {
    flex: 1,
  },
  projectOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  projectDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  projectTaskCount: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  createProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  createProjectText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  createProjectForm: {
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContent: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  datePicker: {
    height: 200,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  datePickerClearButton: {
    flex: 1,
    marginRight: 8,
  },
  datePickerDoneButton: {
    flex: 1,
    marginLeft: 8,
  },
  premiumModalContent: {
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
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  premiumMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  premiumCloseButton: {
    padding: 4,
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
  premiumFeatures: {
    marginBottom: 24,
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
  cancelPremiumButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelPremiumButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});