import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, ProjectShare, SharedProject, ProjectPermissions, DailyProjectLog } from '@/types';
import { useAuthStore } from './authStore';

interface ProjectState {
  projects: Project[];
  projectShares: ProjectShare[];
  sharedProjects: SharedProject[];
  dailyProjectLogs: DailyProjectLog[];
  lastResetDate: string;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string; projectId?: string };
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  updateTaskCount: (projectId: string, count: number) => void;
  updateProjectProgress: (projectId: string, progress: number) => void;
  completeProject: (id: string) => void;
  getProjectsByStatus: (status: 'active' | 'completed') => Project[];
  getActiveProjects: () => Project[];
  getMonthlyProjectStats: () => { completed: number; inProgress: number; total: number };
  getProjectLimits: (isPremium?: boolean) => { regular: number; premium: number };
  getProjectTaskLimit: (project: Project) => number;
  checkAndResetDaily: () => void;
  getDailyProjectLogs: () => DailyProjectLog[];
  cleanupOldLogs: () => void;
  
  // Sharing functionality
  shareProject: (projectId: string, friendId: string, friendName: string, message?: string, permissions?: Partial<ProjectPermissions>) => Promise<{ success: boolean; message: string }>;
  acceptProjectShare: (shareId: string) => Promise<{ success: boolean; message: string }>;
  declineProjectShare: (shareId: string) => Promise<{ success: boolean; message: string }>;
  removeSharedProject: (projectId: string) => Promise<{ success: boolean; message: string }>;
  leaveProject: (projectId: string) => Promise<{ success: boolean; message: string }>;
  updateSharedProjectPermissions: (projectId: string, permissions: Partial<ProjectPermissions>) => Promise<{ success: boolean; message: string }>;
  getSharedProjects: () => Project[];
  getPendingProjectShares: () => ProjectShare[];
  getProjectsSharedWithMe: () => Project[];
  getProjectsSharedByMe: () => Project[];
  isProjectShared: (projectId: string) => boolean;
  getProjectShareById: (shareId: string) => ProjectShare | undefined;
  getSharedProjectById: (projectId: string) => SharedProject | undefined;
  getCollaboratorCount: (projectId: string) => number;
}

// Default permissions for shared projects
const defaultPermissions: ProjectPermissions = {
  canEdit: false,
  canAddTasks: true,
  canDeleteTasks: false,
  canCompleteTasks: true,
  canInviteOthers: false,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      projectShares: [],
      sharedProjects: [],
      dailyProjectLogs: [],
      lastResetDate: new Date().toISOString().split('T')[0],
      
      getProjectLimits: (isPremium = false) => ({
        regular: 0, // Non-premium users cannot create projects
        premium: 5  // Premium users can create up to 5 projects
      }),
      
      getProjectTaskLimit: (project: Project) => {
        // If createdByPremium is undefined (existing projects), default to 5 tasks
        if (project.createdByPremium === undefined) {
          return 5;
        }
        // If project was created by premium user, allow 20 tasks
        // If project was created by non-premium user, allow 5 tasks
        return project.createdByPremium ? 20 : 5;
      },
      
      cleanupOldLogs: () => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];
        
        set((state) => ({
          dailyProjectLogs: state.dailyProjectLogs.filter(log => log.date >= cutoffDate)
        }));
      },
      
      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastResetDate, projects } = get();
        
        // Clean up old logs first
        get().cleanupOldLogs();
        
        if (lastResetDate !== today) {
          // Check if there were any project updates yesterday
          const yesterdayProjects = projects.filter(project => {
            const projectDate = new Date(project.createdAt).toISOString().split('T')[0];
            return projectDate === lastResetDate;
          });
          
          // Create a daily log if there were projects or updates
          if (yesterdayProjects.length > 0 || projects.length > 0) {
            const completedProjects = projects.filter(project => project.status === 'completed').length;
            
            const dailyLog: DailyProjectLog = {
              id: Date.now().toString(),
              date: lastResetDate,
              projects: [...projects],
              totalProjects: projects.length,
              completedProjects,
              tasksAdded: 0, // This would be tracked if we monitored task additions
              tasksCompleted: 0, // This would be tracked if we monitored task completions
              projectUpdates: [] // This would be populated if we tracked project updates
            };
            
            set((state) => ({
              dailyProjectLogs: [dailyLog, ...state.dailyProjectLogs],
              lastResetDate: today
            }));
          } else {
            set({ lastResetDate: today });
          }
        }
      },
      
      addProject: (project) => {
        get().checkAndResetDaily();
        
        const { projects } = get();
        const user = useAuthStore.getState().user;
        const limits = get().getProjectLimits(user?.isPremium);
        const currentLimit = user?.isPremium ? limits.premium : limits.regular;
        
        // Check if user is premium - projects are a premium-only feature
        if (!user?.isPremium) {
          return {
            success: false,
            message: "Projects are a premium feature. Upgrade to Premium to create projects!"
          };
        }
        
        // Check project limit based on premium status
        if (projects.length >= currentLimit) {
          return {
            success: false,
            message: `You've reached the maximum of ${currentLimit} projects.`
          };
        }
        
        const id = Date.now().toString();
        const newProject: Project = {
          ...project,
          id,
          createdAt: new Date().toISOString(),
          status: 'active',
          taskLimit: user?.isPremium ? 20 : 5, // Set task limit based on creator's premium status
          createdByPremium: user?.isPremium || false, // Track if created by premium user
        };
        
        set((state) => ({
          projects: [...state.projects, newProject]
        }));
        
        return {
          success: true,
          message: "Project created successfully!",
          projectId: id
        };
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map(project => 
            project.id === id ? { ...project, ...updates } : project
          )
        }));
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter(project => project.id !== id)
        }));
      },
      
      getProject: (id) => {
        const { projects } = get();
        return projects.find(project => project.id === id);
      },
      
      updateTaskCount: (projectId, count) => {
        // This method is kept for backward compatibility
        // but we don't update a taskCount property anymore
        console.log(`Task count for project ${projectId} updated to ${count}`);
      },
      
      updateProjectProgress: (projectId, progress) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === projectId ? { ...project, progress } : project
          )
        }));
      },
      
      completeProject: (id) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === id ? { ...project, status: 'completed', completedAt: new Date().toISOString() } : project
          )
        }));
      },
      
      getProjectsByStatus: (status) => {
        const { projects } = get();
        return projects.filter(project => project.status === status);
      },
      
      getActiveProjects: () => {
        const { projects } = get();
        return projects.filter(project => project.status === 'active');
      },
      
      getMonthlyProjectStats: () => {
        const { projects } = get();
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get projects created or updated this month
        const monthlyProjects = projects.filter(project => {
          const createdDate = new Date(project.createdAt);
          return createdDate >= firstDayOfMonth && createdDate <= now;
        });
        
        const completed = monthlyProjects.filter(project => project.status === 'completed').length;
        const inProgress = monthlyProjects.filter(project => project.status === 'active').length;
        
        return {
          completed,
          inProgress,
          total: monthlyProjects.length
        };
      },
      
      getDailyProjectLogs: () => {
        const { dailyProjectLogs } = get();
        return dailyProjectLogs.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      
      // Get the number of collaborators for a project
      getCollaboratorCount: (projectId: string) => {
        const { sharedProjects } = get();
        return sharedProjects.filter(sp => 
          sp.projectId === projectId && sp.isActive
        ).length;
      },
      
      // Sharing functionality
      shareProject: async (projectId, friendId, friendName, message, permissions) => {
        try {
          const { projects, projectShares, sharedProjects } = get();
          const project = projects.find(p => p.id === projectId);
          
          if (!project) {
            return {
              success: false,
              message: "Project not found."
            };
          }
          
          // Check if already shared with this friend
          const existingShare = projectShares.find(
            share => share.projectId === projectId && 
                    share.sharedWithId === friendId &&
                    share.status === 'pending'
          );
          
          if (existingShare) {
            return {
              success: false,
              message: "You've already shared this project with this friend."
            };
          }
          
          // Check if we've reached the maximum number of collaborators (3)
          const collaboratorCount = sharedProjects.filter(sp => 
            sp.projectId === projectId && sp.isActive
          ).length;
          
          if (collaboratorCount >= 3) {
            return {
              success: false,
              message: "You've reached the maximum of 3 collaborators for this project."
            };
          }
          
          const user = useAuthStore.getState().user;
          if (!user) {
            return {
              success: false,
              message: "You must be logged in to share projects."
            };
          }
          
          const newShare: ProjectShare = {
            id: Date.now().toString(),
            projectId,
            projectName: project.name,
            ownerId: user.id,
            ownerName: user.usernameType === 'real' ? user.username : user.anonymousUsername,
            sharedWithId: friendId,
            sharedWithName: friendName,
            status: 'pending',
            createdAt: new Date().toISOString(),
            message,
            permissions: {
              ...defaultPermissions,
              ...permissions
            }
          };
          
          set(state => ({
            projectShares: [...state.projectShares, newShare]
          }));
          
          return {
            success: true,
            message: `Project shared with ${friendName}!`
          };
        } catch (error) {
          console.error("Error sharing project:", error);
          return {
            success: false,
            message: "Failed to share project. Please try again."
          };
        }
      },
      
      acceptProjectShare: async (shareId) => {
        try {
          const { projectShares, projects } = get();
          const share = projectShares.find(s => s.id === shareId);
          
          if (!share) {
            return {
              success: false,
              message: "Share not found."
            };
          }
          
          const user = useAuthStore.getState().user;
          const limits = get().getProjectLimits(user?.isPremium);
          const currentLimit = user?.isPremium ? limits.premium : limits.regular;
          
          // Check if accepting this project would exceed the user's project limit
          if (projects.length >= currentLimit) {
            return {
              success: false,
              message: user?.isPremium 
                ? `You've reached the maximum of ${currentLimit} projects.`
                : `Projects are a premium feature. Upgrade to Premium to access shared projects!`
            };
          }
          
          // Find the original project
          const originalProject = projects.find(p => p.id === share.projectId);
          
          if (!originalProject) {
            return {
              success: false,
              message: "The shared project no longer exists."
            };
          }
          
          // Create a shared project record
          const newSharedProject: SharedProject = {
            id: Date.now().toString(),
            projectId: share.projectId,
            ownerId: share.ownerId,
            ownerName: share.ownerName,
            sharedWithId: share.sharedWithId,
            sharedWithName: share.sharedWithName,
            permissions: share.permissions,
            sharedAt: share.createdAt,
            lastUpdated: new Date().toISOString(),
            isActive: true
          };
          
          // Add the project to the user's projects list with shared flag
          // Preserve the original task limit from the project creator
          const projectTaskLimit = get().getProjectTaskLimit(originalProject);
          const sharedProjectCopy: Project = {
            ...originalProject,
            id: `shared_${originalProject.id}_${Date.now()}`, // Create a new ID for the shared copy
            isShared: true,
            sharedBy: share.ownerId,
            sharedByName: share.ownerName,
            taskLimit: projectTaskLimit, // Preserve original task limit based on creator's premium status
            createdByPremium: originalProject.createdByPremium // Preserve the original creator's premium status
          };
          
          set(state => ({
            projectShares: state.projectShares.map(s => 
              s.id === shareId ? { ...s, status: 'accepted' } : s
            ),
            sharedProjects: [...state.sharedProjects, newSharedProject],
            projects: [...state.projects, sharedProjectCopy]
          }));
          
          return {
            success: true,
            message: "Project shared successfully!"
          };
        } catch (error) {
          console.error("Error accepting project share:", error);
          return {
            success: false,
            message: "Failed to accept shared project. Please try again."
          };
        }
      },
      
      declineProjectShare: async (shareId) => {
        try {
          set(state => ({
            projectShares: state.projectShares.map(s => 
              s.id === shareId ? { ...s, status: 'declined' } : s
            )
          }));
          
          return {
            success: true,
            message: "Project share declined."
          };
        } catch (error) {
          console.error("Error declining project share:", error);
          return {
            success: false,
            message: "Failed to decline shared project. Please try again."
          };
        }
      },
      
      removeSharedProject: async (projectId) => {
        try {
          set(state => ({
            projects: state.projects.filter(p => p.id !== projectId),
            sharedProjects: state.sharedProjects.map(sp => 
              sp.projectId === projectId ? { ...sp, isActive: false } : sp
            )
          }));
          
          return {
            success: true,
            message: "Shared project removed successfully."
          };
        } catch (error) {
          console.error("Error removing shared project:", error);
          return {
            success: false,
            message: "Failed to remove shared project. Please try again."
          };
        }
      },
      
      leaveProject: async (projectId) => {
        try {
          const { projects } = get();
          const project = projects.find(p => p.id === projectId);
          
          if (!project) {
            return {
              success: false,
              message: "Project not found."
            };
          }
          
          if (!project.isShared) {
            return {
              success: false,
              message: "You cannot leave a project you created. Use delete instead."
            };
          }
          
          set(state => ({
            projects: state.projects.filter(p => p.id !== projectId),
            sharedProjects: state.sharedProjects.map(sp => 
              sp.projectId === projectId ? { ...sp, isActive: false } : sp
            )
          }));
          
          return {
            success: true,
            message: "You have left the project successfully."
          };
        } catch (error) {
          console.error("Error leaving project:", error);
          return {
            success: false,
            message: "Failed to leave project. Please try again."
          };
        }
      },
      
      updateSharedProjectPermissions: async (projectId, permissions) => {
        try {
          set(state => ({
            sharedProjects: state.sharedProjects.map(sp => 
              sp.projectId === projectId 
                ? { 
                    ...sp, 
                    permissions: { ...sp.permissions, ...permissions },
                    lastUpdated: new Date().toISOString()
                  } 
                : sp
            )
          }));
          
          return {
            success: true,
            message: "Permissions updated successfully."
          };
        } catch (error) {
          console.error("Error updating permissions:", error);
          return {
            success: false,
            message: "Failed to update permissions. Please try again."
          };
        }
      },
      
      getSharedProjects: () => {
        const { projects } = get();
        return projects.filter(project => project.isShared);
      },
      
      getPendingProjectShares: () => {
        const { projectShares } = get();
        const user = useAuthStore.getState().user;
        
        if (!user) return [];
        
        return projectShares.filter(
          share => share.status === 'pending' && share.sharedWithId === user.id
        );
      },
      
      getProjectsSharedWithMe: () => {
        const { projects } = get();
        const user = useAuthStore.getState().user;
        
        if (!user) return [];
        
        return projects.filter(
          project => project.isShared && project.sharedBy !== user.id
        );
      },
      
      getProjectsSharedByMe: () => {
        const { projects, sharedProjects } = get();
        const user = useAuthStore.getState().user;
        
        if (!user) return [];
        
        // Get all project IDs that the user has shared with others
        const sharedProjectIds = sharedProjects
          .filter(sp => sp.ownerId === user.id && sp.isActive)
          .map(sp => sp.projectId);
        
        // Return the original projects that match these IDs
        return projects.filter(
          project => sharedProjectIds.includes(project.id)
        );
      },
      
      isProjectShared: (projectId) => {
        const { sharedProjects } = get();
        return sharedProjects.some(sp => sp.projectId === projectId && sp.isActive);
      },
      
      getProjectShareById: (shareId) => {
        const { projectShares } = get();
        return projectShares.find(share => share.id === shareId);
      },
      
      getSharedProjectById: (projectId) => {
        const { sharedProjects } = get();
        return sharedProjects.find(sp => sp.projectId === projectId && sp.isActive);
      },
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);