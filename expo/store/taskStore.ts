import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, DailySession, SharedTodoList, TodoListShare, DailyTaskLog, TaskSnapshot } from '@/types';

interface TaskState {
  tasks: Task[];
  dailySessions: DailySession[];
  dailyTaskLogs: DailyTaskLog[];
  sharedTodoLists: SharedTodoList[];
  todoListShares: TodoListShare[];
  lastResetDate: string;
  addTask: (task: Omit<Task, 'id'>, isPremium?: boolean, projectTaskLimit?: number) => { success: boolean; message: string };
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  addReflection: (date: string, reflection: string) => void;
  getDailySession: (date: string) => DailySession | undefined;
  createDailySession: (date: string) => void;
  getTasksByProject: (projectId?: string) => Task[];
  getTasksCountByProject: (projectId: string) => { total: number; completed: number };
  getGeneralTasks: () => Task[];
  getProjectTasks: () => Task[];
  getMonthlyTaskStats: () => { completed: number; incomplete: number; total: number };
  getTaskLimits: (isPremium?: boolean) => { general: number; project: number };
  checkAndResetDaily: () => void;
  getDailyTaskLogs: () => DailyTaskLog[];
  cleanupOldLogs: () => void;
  
  // Sharing features
  shareTodoListWithFriend: (friendId: string, friendName: string, title: string, description?: string) => Promise<{ success: boolean; message: string }>;
  acceptTodoListShare: (shareId: string) => Promise<{ success: boolean; message: string }>;
  declineTodoListShare: (shareId: string) => Promise<{ success: boolean; message: string }>;
  unshareTodoList: (sharedListId: string) => Promise<{ success: boolean; message: string }>;
  getSharedTodoLists: () => SharedTodoList[];
  getTodoListShares: () => TodoListShare[];
  getPendingTodoListShares: () => TodoListShare[];
  getCollaboratorCount: (listId: string) => number;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      dailySessions: [],
      dailyTaskLogs: [],
      sharedTodoLists: [],
      todoListShares: [],
      lastResetDate: new Date().toISOString().split('T')[0],
      
      getTaskLimits: (isPremium = false) => ({
        general: isPremium ? 30 : 8,
        project: isPremium ? 20 : 5 // Project task limits based on premium status
      }),
      
      cleanupOldLogs: () => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffDate = threeMonthsAgo.toISOString().split('T')[0];
        
        set((state) => ({
          dailyTaskLogs: state.dailyTaskLogs.filter(log => log.date >= cutoffDate),
          dailySessions: state.dailySessions.filter(session => session.date >= cutoffDate)
        }));
      },
      
      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const { lastResetDate, tasks } = get();
        
        // Clean up old logs first
        get().cleanupOldLogs();
        
        if (lastResetDate !== today && tasks.length > 0) {
          // Save current day's general tasks to daily log
          const generalTasks = tasks.filter(task => !task.projectId);
          const completedCount = generalTasks.filter(task => task.completed).length;
          
          const dailyLog: DailyTaskLog = {
            id: Date.now().toString(),
            date: lastResetDate,
            tasks: generalTasks.map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed
            })),
            totalTasksCount: generalTasks.length,
            completedTasksCount: completedCount,
            streakCount: 0 // This will be updated by streak store
          };
          
          set((state) => ({
            dailyTaskLogs: [dailyLog, ...state.dailyTaskLogs],
            tasks: state.tasks.filter(task => task.projectId), // Keep only project tasks
            lastResetDate: today
          }));
        } else if (lastResetDate !== today) {
          // Just update the date if no tasks
          set({ lastResetDate: today });
        }
      },
      
      addTask: (task, isPremium = false, projectTaskLimit) => {
        get().checkAndResetDaily();
        
        const { tasks } = get();
        const limits = get().getTaskLimits(isPremium);
        
        // Check limits based on task type
        if (task.projectId) {
          // Project task - use the provided project task limit
          // This limit comes from the project's createdByPremium flag
          const effectiveLimit = projectTaskLimit || limits.project;
          const projectTasks = tasks.filter(t => t.projectId === task.projectId);
          if (projectTasks.length >= effectiveLimit) {
            return {
              success: false,
              message: `You've reached the maximum of ${effectiveLimit} tasks per project.`
            };
          }
        } else {
          // General task - check general task limit (8 for non-premium, 30 for premium)
          const generalTasks = tasks.filter(t => !t.projectId);
          if (generalTasks.length >= limits.general) {
            return {
              success: false,
              message: isPremium 
                ? `You've reached the maximum of ${limits.general} general tasks.`
                : `You've reached the maximum of ${limits.general} general tasks. Upgrade to Premium for up to 30 tasks!`
            };
          }
        }
        
        const newTask = { ...task, id: Date.now().toString() };
        
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));
        
        return {
          success: true,
          message: "Task added successfully!"
        };
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === id ? { ...task, ...updates } : task
          )
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter(task => task.id !== id)
        }));
      },
      
      createDailySession: (date) => {
        const { tasks, dailySessions } = get();
        const existingSession = dailySessions.find(session => session.date === date);
        
        if (!existingSession) {
          // Only count general tasks for daily sessions
          const todayGeneralTasks = tasks.filter(task => 
            !task.projectId && 
            new Date(task.createdAt).toISOString().split('T')[0] === date
          );
          
          const completedCount = todayGeneralTasks.filter(task => task.completed).length;
          
          const newSession: DailySession = {
            id: Date.now().toString(),
            date,
            tasks: todayGeneralTasks.map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed
            })),
            totalTasksCount: todayGeneralTasks.length,
            completedTasksCount: completedCount,
            streakCount: 0, // Will be updated by streak store
          };
          
          set((state) => ({
            dailySessions: [...state.dailySessions, newSession]
          }));
        }
      },
      
      getDailySession: (date) => {
        const { dailySessions } = get();
        return dailySessions.find(session => session.date === date);
      },
      
      addReflection: (date, reflection) => {
        set((state) => ({
          dailySessions: state.dailySessions.map(session =>
            session.date === date 
              ? { ...session, reflection }
              : session
          )
        }));
      },
      
      getTasksByProject: (projectId) => {
        const { tasks } = get();
        if (projectId === undefined) {
          return tasks.filter(task => !task.projectId);
        }
        return tasks.filter(task => task.projectId === projectId);
      },
      
      getTasksCountByProject: (projectId) => {
        const { tasks } = get();
        const projectTasks = tasks.filter(task => task.projectId === projectId);
        const completedCount = projectTasks.filter(task => task.completed).length;
        
        return {
          total: projectTasks.length,
          completed: completedCount
        };
      },
      
      getGeneralTasks: () => {
        const { tasks } = get();
        return tasks.filter(task => !task.projectId);
      },
      
      getProjectTasks: () => {
        const { tasks } = get();
        return tasks.filter(task => task.projectId);
      },
      
      getMonthlyTaskStats: () => {
        const { tasks, dailyTaskLogs } = get();
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get current month's general tasks
        const currentMonthTasks = tasks.filter(task => {
          if (task.projectId) return false; // Exclude project tasks
          const taskDate = new Date(task.createdAt);
          return taskDate >= firstDayOfMonth && taskDate <= now;
        });
        
        // Get completed tasks from daily logs for this month
        const currentMonthLogs = dailyTaskLogs.filter(log => {
          const logDate = new Date(log.date);
          return logDate >= firstDayOfMonth && logDate < now;
        });
        
        const completedFromLogs = currentMonthLogs.reduce((sum, log) => sum + log.completedTasksCount, 0);
        const totalFromLogs = currentMonthLogs.reduce((sum, log) => sum + log.totalTasksCount, 0);
        
        // Combine current tasks with logged tasks
        const currentCompleted = currentMonthTasks.filter(task => task.completed).length;
        const currentTotal = currentMonthTasks.length;
        
        const totalCompleted = completedFromLogs + currentCompleted;
        const totalTasks = totalFromLogs + currentTotal;
        const incomplete = totalTasks - totalCompleted;
        
        return {
          completed: totalCompleted,
          incomplete: incomplete,
          total: totalTasks
        };
      },
      
      getDailyTaskLogs: () => {
        const { dailyTaskLogs } = get();
        return dailyTaskLogs.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      
      toggleComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        }));
        
        // Create or update daily session after task completion (only for general tasks)
        const today = new Date().toISOString().split('T')[0];
        const store = get();
        const task = store.tasks.find(t => t.id === id);
        
        // Only create daily session for general tasks
        if (task && !task.projectId) {
          store.createDailySession(today);
        }
      },
      
      // Get the number of collaborators for a list
      getCollaboratorCount: (listId: string) => {
        const { sharedTodoLists } = get();
        return sharedTodoLists.filter(list => 
          list.listId === listId && list.isActive
        ).length;
      },
      
      // Sharing features
      shareTodoListWithFriend: async (friendId: string, friendName: string, title: string, description?: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { tasks, sharedTodoLists } = get();
          const generalTasks = tasks.filter(task => !task.projectId);
          
          if (generalTasks.length === 0) {
            return {
              success: false,
              message: "You don't have any tasks to share."
            };
          }
          
          // Check if we've reached the maximum number of collaborators (3)
          const collaboratorCount = sharedTodoLists.filter(list => 
            list.listId === 'general' && list.isActive
          ).length;
          
          if (collaboratorCount >= 3) {
            return {
              success: false,
              message: "You've reached the maximum of 3 collaborators for this list."
            };
          }
          
          // Check if already shared with this friend
          const alreadyShared = sharedTodoLists.some(list => 
            list.listId === 'general' && 
            list.sharedWithId === friendId && 
            list.isActive
          );
          
          if (alreadyShared) {
            return {
              success: false,
              message: "You've already shared this list with this friend."
            };
          }
          
          const newShare: TodoListShare = {
            id: Date.now().toString(),
            listId: 'general',
            listTitle: title,
            ownerId: '1', // Current user ID
            ownerName: 'Current User',
            sharedWithId: friendId,
            sharedWithName: friendName,
            status: 'pending',
            createdAt: new Date().toISOString(),
            message: description,
          };
          
          set(state => ({
            todoListShares: [...state.todoListShares, newShare]
          }));
          
          return {
            success: true,
            message: `To-do list shared with ${friendName}!`
          };
        } catch (error) {
          return {
            success: false,
            message: "Failed to share to-do list. Please try again."
          };
        }
      },
      
      acceptTodoListShare: async (shareId: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const { todoListShares, tasks } = get();
          const share = todoListShares.find(s => s.id === shareId);
          
          if (!share) {
            return {
              success: false,
              message: "Share not found."
            };
          }
          
          // Get owner's general tasks (mock data for demo)
          const ownerTasks = tasks.filter(task => !task.projectId);
          
          const newSharedList: SharedTodoList = {
            id: Date.now().toString(),
            listId: share.listId,
            ownerId: share.ownerId,
            ownerName: share.ownerName,
            sharedWithId: share.sharedWithId,
            sharedWithName: share.sharedWithName,
            tasks: ownerTasks,
            title: share.listTitle,
            description: share.message,
            sharedAt: share.createdAt,
            lastUpdated: new Date().toISOString(),
            isActive: true,
            permissions: {
              canView: true,
              canComment: false,
            },
          };
          
          set(state => ({
            sharedTodoLists: [...state.sharedTodoLists, newSharedList],
            todoListShares: state.todoListShares.map(s => 
              s.id === shareId ? { ...s, status: 'accepted' as const } : s
            )
          }));
          
          return {
            success: true,
            message: "To-do list access granted!"
          };
        } catch (error) {
          return {
            success: false,
            message: "Failed to accept share. Please try again."
          };
        }
      },
      
      declineTodoListShare: async (shareId: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            todoListShares: state.todoListShares.map(s => 
              s.id === shareId ? { ...s, status: 'declined' as const } : s
            )
          }));
          
          return {
            success: true,
            message: "Share declined."
          };
        } catch (error) {
          return {
            success: false,
            message: "Failed to decline share. Please try again."
          };
        }
      },
      
      unshareTodoList: async (sharedListId: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => ({
            sharedTodoLists: state.sharedTodoLists.map(list => 
              list.id === sharedListId ? { ...list, isActive: false } : list
            )
          }));
          
          return {
            success: true,
            message: "To-do list unshared successfully."
          };
        } catch (error) {
          return {
            success: false,
            message: "Failed to unshare to-do list. Please try again."
          };
        }
      },
      
      getSharedTodoLists: () => {
        const { sharedTodoLists } = get();
        return sharedTodoLists.filter(list => list.isActive);
      },
      
      getTodoListShares: () => {
        const { todoListShares } = get();
        return todoListShares;
      },
      
      getPendingTodoListShares: () => {
        const { todoListShares } = get();
        return todoListShares.filter(share => share.status === 'pending');
      },
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);