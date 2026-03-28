import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProjectShare, SharedProject } from '@/types';
import { useColors } from '@/hooks/useColors';
import { 
  CheckCircle, 
  Circle, 
  Calendar, 
  User, 
  Eye, 
  X,
  Check,
  Clock,
  Edit,
  Trash2,
  Users,
  Share2
} from 'lucide-react-native';

interface ProjectShareItemProps {
  shareRequest?: ProjectShare;
  sharedProject?: SharedProject;
  onAccept?: (shareId: string) => void;
  onDecline?: (shareId: string) => void;
  onRemove?: (projectId: string) => void;
  onView?: (projectId: string) => void;
  onManagePermissions?: (projectId: string) => void;
}

export function ProjectShareItem({ 
  shareRequest, 
  sharedProject, 
  onAccept, 
  onDecline, 
  onRemove, 
  onView,
  onManagePermissions
}: ProjectShareItemProps) {
  const colors = useColors();
  
  if (shareRequest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {shareRequest.projectName}
            </Text>
            <View style={styles.fromSection}>
              <User size={14} color={colors.text.secondary} />
              <Text style={[styles.fromText, { color: colors.text.secondary }]}>
                from {shareRequest.ownerName}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
            <Clock size={12} color={colors.warning} />
            <Text style={[styles.statusText, { color: colors.warning }]}>
              Pending
            </Text>
          </View>
        </View>
        
        {shareRequest.message && (
          <Text style={[styles.message, { color: colors.text.secondary }]}>
            {shareRequest.message}
          </Text>
        )}
        
        <View style={styles.permissionsSection}>
          <Text style={[styles.permissionsTitle, { color: colors.text.primary }]}>
            Permissions:
          </Text>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              {shareRequest.permissions.canEdit ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Edit project details
              </Text>
            </View>
            <View style={styles.permissionItem}>
              {shareRequest.permissions.canAddTasks ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Add tasks
              </Text>
            </View>
            <View style={styles.permissionItem}>
              {shareRequest.permissions.canDeleteTasks ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Delete tasks
              </Text>
            </View>
            <View style={styles.permissionItem}>
              {shareRequest.permissions.canCompleteTasks ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Complete tasks
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.dateSection}>
          <Calendar size={12} color={colors.text.light} />
          <Text style={[styles.dateText, { color: colors.text.light }]}>
            Shared {new Date(shareRequest.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={() => onAccept?.(shareRequest.id)}
          >
            <Check size={16} color="white" />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton, { borderColor: colors.error }]}
            onPress={() => onDecline?.(shareRequest.id)}
          >
            <X size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (sharedProject) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Project Collaboration
            </Text>
            <View style={styles.fromSection}>
              <User size={14} color={colors.text.secondary} />
              <Text style={[styles.fromText, { color: colors.text.secondary }]}>
                with {sharedProject.ownerName}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.secondary + '20' }]}>
            <Users size={12} color={colors.secondary} />
            <Text style={[styles.statusText, { color: colors.secondary }]}>
              Shared
            </Text>
          </View>
        </View>
        
        <View style={styles.permissionsSection}>
          <Text style={[styles.permissionsTitle, { color: colors.text.primary }]}>
            Your Permissions:
          </Text>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              {sharedProject.permissions.canEdit ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Edit project details
              </Text>
            </View>
            <View style={styles.permissionItem}>
              {sharedProject.permissions.canAddTasks ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Add tasks
              </Text>
            </View>
            <View style={styles.permissionItem}>
              {sharedProject.permissions.canDeleteTasks ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Delete tasks
              </Text>
            </View>
            <View style={styles.permissionItem}>
              {sharedProject.permissions.canCompleteTasks ? (
                <CheckCircle size={14} color={colors.success} />
              ) : (
                <Circle size={14} color={colors.text.light} />
              )}
              <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
                Complete tasks
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.dateSection}>
          <Calendar size={12} color={colors.text.light} />
          <Text style={[styles.dateText, { color: colors.text.light }]}>
            Last updated {new Date(sharedProject.lastUpdated).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={() => onView?.(sharedProject.projectId)}
          >
            <Eye size={16} color="white" />
            <Text style={styles.actionButtonText}>View Project</Text>
          </TouchableOpacity>
          
          {onManagePermissions && (
            <TouchableOpacity
              style={[styles.actionButton, styles.manageButton, { backgroundColor: colors.secondary }]}
              onPress={() => onManagePermissions(sharedProject.projectId)}
            >
              <Edit size={16} color="white" />
              <Text style={styles.actionButtonText}>Manage</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton, { borderColor: colors.text.light }]}
            onPress={() => onRemove?.(sharedProject.projectId)}
          >
            <Trash2 size={16} color={colors.text.secondary} />
            <Text style={[styles.actionButtonText, { color: colors.text.secondary }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fromSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fromText: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  permissionsSection: {
    marginBottom: 12,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 6,
    gap: 6,
  },
  permissionText: {
    fontSize: 12,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    // backgroundColor set via props
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  viewButton: {
    // backgroundColor set via props
  },
  manageButton: {
    // backgroundColor set via props
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});