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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, Trash2, AlertCircle, Folder, Plus } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/Button';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, updateTask, deleteTask, toggleComplete } = useTaskStore();
  const { projects, addProject } = useProjectStore();
  const colors = useColors();
  
  const task = tasks.find(t => t.id === id);
  
  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    task?.priority || 'medium'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    task?.projectId
  );
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6');
  
  const projectColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];
  
  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>Task not found</Text>
          <Button 
            title="Go Back" 
            onPress={() => router.push("/(tabs)/tasks")} 
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }
    
    updateTask(id, {
      title: title.trim(),
      notes: notes.trim(),
      priority,
      projectId: selectedProjectId,
    });
    
    // Navigate to tasks screen instead of using back
    router.push("/(tabs)/tasks");
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            deleteTask(id);
            router.push("/(tabs)/tasks");
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  const handleToggleComplete = () => {
    toggleComplete(id);
    
    // Navigate to tasks screen after toggling
    setTimeout(() => {
      router.push("/(tabs)/tasks");
    }, 500);
  };
  
  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Project name cannot be empty');
      return;
    }
    
    const projectId = addProject({
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      color: newProjectColor,
      startDate: new Date().toISOString(),
    });
    
    setSelectedProjectId(projectId);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectColor('#3B82F6');
    setShowCreateProjectModal(false);
    Alert.alert('Success', 'Project created successfully!');
  };
  
  const getPriorityColor = (p: 'low' | 'medium' | 'high') => {
    switch (p) {
      case 'low':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.danger;
    }
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.priorityContainer}>
          <AlertCircle size={18} color={getPriorityColor(priority)} />
          <Text 
            style={[
              styles.priorityText,
              { color: getPriorityColor(priority) }
            ]}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Trash2 size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={[styles.titleInput, { color: colors.text.primary }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Task title"
        placeholderTextColor={colors.text.light}
      />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Project</Text>
        <TouchableOpacity
          style={[styles.projectSelector, { 
            backgroundColor: colors.background.primary, 
            borderColor: colors.border 
          }]}
          onPress={() => setShowProjectModal(true)}
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
                <Folder size={16} color={colors.text.secondary} />
                <Text style={[styles.projectSelectorText, { color: colors.text.secondary }]}>
                  No Project
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Priority</Text>
        <View style={styles.priorityButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.priorityButton,
              priority === 'low' && styles.activePriorityButton,
              { 
                backgroundColor: priority === 'low' ? colors.success + '20' : undefined,
                borderColor: colors.border
              }
            ]}
            onPress={() => setPriority('low')}
          >
            <AlertCircle size={16} color={colors.success} />
            <Text 
              style={[
                styles.priorityButtonText,
                priority === 'low' && styles.activePriorityButtonText,
                { color: colors.success }
              ]}
            >
              Low
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.priorityButton,
              priority === 'medium' && styles.activePriorityButton,
              { 
                backgroundColor: priority === 'medium' ? colors.warning + '20' : undefined,
                borderColor: colors.border
              }
            ]}
            onPress={() => setPriority('medium')}
          >
            <AlertCircle size={16} color={colors.warning} />
            <Text 
              style={[
                styles.priorityButtonText,
                priority === 'medium' && styles.activePriorityButtonText,
                { color: colors.warning }
              ]}
            >
              Medium
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.priorityButton,
              priority === 'high' && styles.activePriorityButton,
              { 
                backgroundColor: priority === 'high' ? colors.danger + '20' : undefined,
                borderColor: colors.border
              }
            ]}
            onPress={() => setPriority('high')}
          >
            <AlertCircle size={16} color={colors.danger} />
            <Text 
              style={[
                styles.priorityButtonText,
                priority === 'high' && styles.activePriorityButtonText,
                { color: colors.danger }
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
          style={[
            styles.notesInput, 
            { 
              backgroundColor: colors.background.primary,
              borderColor: colors.border,
              color: colors.text.primary
            }
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes here..."
          placeholderTextColor={colors.text.light}
          multiline
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title={task.completed ? "Mark as Incomplete" : "Mark as Complete"}
          onPress={handleToggleComplete}
          variant="outline"
          style={styles.completeButton}
        />
        
        <Button
          title="Save Changes"
          onPress={handleSave}
          icon={<Save size={18} color="white" />}
          style={styles.saveButton}
        />
      </View>
      
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
                    No Project
                  </Text>
                </View>
                {selectedProjectId === undefined && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
              
              {projects.map(project => (
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
                    </View>
                  </View>
                  {selectedProjectId === project.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[styles.createProjectButton, { borderColor: colors.primary }]}
                onPress={() => {
                  setShowProjectModal(false);
                  setTimeout(() => setShowCreateProjectModal(true), 100);
                }}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={[styles.createProjectText, { color: colors.primary }]}>
                  Create New Project
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  deleteButton: {
    padding: 16,
    borderRadius: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    padding: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  },
  priorityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  activePriorityButton: {
    borderColor: 'transparent',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  activePriorityButtonText: {
    fontWeight: '600',
  },
  notesInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    borderWidth: 1,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 40,
  },
  completeButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'center',
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
});