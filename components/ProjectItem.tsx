import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { 
  Folder, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Calendar, 
  Clock,
  Users,
  Share2,
  Crown
} from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { Project } from '@/types';
import { ProgressBar } from './ProgressBar';

interface ProjectItemProps {
  project: Project;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onShare?: () => void;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  onPress,
  onEdit,
  onDelete,
  onComplete,
  onShare
}) => {
  const colors = useColors();
  
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
    if (!project.progress) return colors.primary;
    if (project.progress < 30) return colors.danger;
    if (project.progress < 70) return colors.warning;
    return colors.primary;
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
        project.status === 'completed' && { borderLeftWidth: 4, borderLeftColor: colors.success },
        project.isShared && { borderLeftWidth: 4, borderLeftColor: colors.secondary }
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor() }]}>
            <Text style={[styles.statusText, { color: 'white' }]}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Text>
          </View>
          
          {project.isShared && (
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
            </View>
          )}
        </View>
        
        <View style={styles.projectColorIndicator}>
          <View style={[styles.colorDot, { backgroundColor: project.color }]} />
        </View>
      </View>
      
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {project.name}
      </Text>
      
      {project.isShared && project.sharedByName && (
        <Text style={[styles.sharedByText, { color: colors.text.secondary }]}>
          Shared by {project.sharedByName}
        </Text>
      )}
      
      {project.description && (
        <Text style={[styles.description, { color: colors.text.secondary }]} numberOfLines={2}>
          {project.description}
        </Text>
      )}
      
      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={project.progress || 0} 
          color={getProgressColor()}
          showPercentage={true}
        />
      </View>
      
      <View style={styles.metaInfo}>
        <View style={styles.metaItem}>
          <Folder size={14} color={colors.text.secondary} />
          <Text style={[styles.metaText, { color: colors.text.secondary }]}>
            Project
          </Text>
        </View>
        
        {project.startDate && (
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.text.secondary} />
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>
              {formatDate(project.startDate)}
            </Text>
          </View>
        )}
        
        {project.endDate && (
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.text.secondary} />
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>
              Due: {formatDate(project.endDate)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.background.secondary }]} 
          onPress={onEdit}
        >
          <Edit size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        
        {project.status === 'active' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.success + '20' }]} 
            onPress={onComplete}
          >
            <CheckCircle size={16} color={colors.success} />
          </TouchableOpacity>
        )}
        
        {onShare && !project.isShared && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]} 
            onPress={onShare}
          >
            <Share2 size={16} color={colors.secondary} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]} 
          onPress={onDelete}
        >
          <Trash2 size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sharedByText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});