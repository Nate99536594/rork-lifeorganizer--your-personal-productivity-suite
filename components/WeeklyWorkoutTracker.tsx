import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useWorkoutSessionStore } from '@/store/workoutSessionStore';
import { useWeeklyWorkoutStore } from '@/store/weeklyWorkoutStore';
import { FlameIcon } from './FlameIcon';
import { CheckCircle, Circle, Calendar, Target, Settings } from 'lucide-react-native';
import { DayPlan } from '@/types';

interface WeeklyWorkoutTrackerProps {
  onEditPlan?: () => void;
}

export const WeeklyWorkoutTracker: React.FC<WeeklyWorkoutTrackerProps> = ({ onEditPlan }) => {
  const colors = useColors();
  const { sessions } = useWorkoutSessionStore();
  const { 
    resetWeekIfNeeded, 
    getWeekProgress,
    weeklyStreak,
    checkAndUpdateWeeklyStreak,
    updateWeekProgress,
    getCurrentWeekPlan,
    completeWorkout,
    canCompleteWorkout,
    getWorkoutTypesForWeek,
    getOriginalPlanForStreak,
    isPlanActuallyModified,
    isCurrentPlanSameAsOriginal
  } = useWeeklyWorkoutStore();
  
  // Add state to track current date and force re-renders
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Effect to check and reset week if needed on component mount and date change
  useEffect(() => {
    // Reset week if needed and update streak based on current sessions
    resetWeekIfNeeded();
    updateWeekProgress(sessions);
    checkAndUpdateWeeklyStreak(sessions);
    
    // Set up an interval to check the date every minute
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Compare with the stored date to see if the day has changed
      setCurrentDate(prevDate => {
        if (
          prevDate.getDate() !== currentDay ||
          prevDate.getMonth() !== currentMonth ||
          prevDate.getFullYear() !== currentYear
        ) {
          // Day has changed, trigger a reset check
          resetWeekIfNeeded();
          updateWeekProgress(sessions);
          checkAndUpdateWeeklyStreak(sessions);
          return now;
        }
        return prevDate;
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [sessions]);
  
  const weekProgress = getWeekProgress(sessions);
  const currentWeekPlan = getCurrentWeekPlan();
  const originalPlan = getOriginalPlanForStreak();
  const workoutTypes = getWorkoutTypesForWeek();
  const planActuallyModified = isPlanActuallyModified();
  const planSameAsOriginal = isCurrentPlanSameAsOriginal();
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date();
  const todayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Day abbreviations for Sunday through Saturday (permanently arranged)
  const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Calculate progress based on original weekly plan for streak calculation
  const getCompletedWorkoutDays = () => {
    if (!originalPlan) return 0;
    return originalPlan.days.filter((day: DayPlan) => 
      (day.originalIsWorkoutDay || day.isWorkoutDay) && day.isCompleted
    ).length;
  };
  
  const getTotalWorkoutDays = () => {
    if (!originalPlan) return 0;
    return originalPlan.days.filter((day: DayPlan) => 
      day.originalIsWorkoutDay || day.isWorkoutDay
    ).length;
  };
  
  const handleCompleteWorkout = (dayIndex: number) => {
    if (canCompleteWorkout(dayIndex)) {
      // Show confirmation dialog with more detailed message
      const dayPlan = currentWeekPlan?.days.find((day: DayPlan) => day.dayIndex === dayIndex);
      const workoutType = dayPlan?.workoutType || 'workout';
      
      Alert.alert(
        'Complete Today\'s Workout',
        `Are you sure you want to mark today's ${workoutType.toLowerCase()} as completed?

This will count towards your weekly streak progress.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Complete Workout',
            style: 'default',
            onPress: () => {
              completeWorkout(dayIndex);
              Alert.alert(
                'Great job! 🎉', 
                'Workout completed for today! Keep up the great work.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } else {
      const dayPlan = currentWeekPlan?.days.find((day: DayPlan) => day.dayIndex === dayIndex);
      if (dayPlan?.isCompleted) {
        Alert.alert('Already completed', 'You have already completed your workout for today!');
      } else if (!dayPlan?.isWorkoutDay) {
        Alert.alert('Rest day', 'Today is scheduled as a rest day.');
      } else if (dayIndex !== todayIndex) {
        Alert.alert('Not today', 'You can only complete workouts for today.');
      }
    }
  };
  
  const completedWorkoutDays = getCompletedWorkoutDays();
  const totalWorkoutDays = getTotalWorkoutDays();
  
  // Determine if we should show the modification notice
  // Only show if plan is actually modified AND not reverted to original
  const shouldShowModificationNotice = planActuallyModified && !planSameAsOriginal;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <View style={styles.streakContainer}>
          <FlameIcon size={24} streak={weeklyStreak} color={colors.streakFlame} />
          <Text style={[styles.streakText, { color: colors.primary }]}>
            Weekly Streak: {weeklyStreak} {weeklyStreak === 1 ? 'Week' : 'Weeks'}
          </Text>
        </View>
        
        {/* Edit Plan Button */}
        {onEditPlan && (
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.background.secondary }]}
            onPress={onEditPlan}
          >
            <Settings size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.weekTracker}>
        {dayAbbreviations.map((dayAbbr, index) => {
          const dayPlan = currentWeekPlan?.days.find((day: DayPlan) => day.dayIndex === index);
          const originalDay = originalPlan?.days.find((day: DayPlan) => day.dayIndex === index);
          const isToday = todayIndex === index;
          const isWorkoutDay = dayPlan?.isWorkoutDay || false;
          const isCompleted = dayPlan?.isCompleted || false;
          const canComplete = canCompleteWorkout(index);
          
          // Check if this day was modified from original plan
          const wasModified = originalDay && (
            originalDay.isWorkoutDay !== dayPlan?.isWorkoutDay ||
            originalDay.workoutType !== dayPlan?.workoutType
          );
          
          return (
            <TouchableOpacity 
              key={`week-day-${index}`} 
              style={styles.dayContainer}
              onPress={() => isWorkoutDay && isToday ? handleCompleteWorkout(index) : null}
              disabled={!canComplete}
              activeOpacity={canComplete ? 0.7 : 1}
            >
              <View style={[
                styles.dayCircle,
                { 
                  backgroundColor: isCompleted ? colors.success : 
                                 isWorkoutDay ? colors.primary + '20' : colors.background.secondary,
                  borderColor: isToday ? colors.primary : 
                              isWorkoutDay ? colors.primary + '40' : colors.border
                },
                isToday && styles.todayBorder,
                isCompleted && styles.completedCircle,
                wasModified && index <= todayIndex && shouldShowModificationNotice && styles.modifiedDayBorder
              ]}>
                {isWorkoutDay ? (
                  isCompleted ? (
                    <CheckCircle size={16} color="white" />
                  ) : (
                    <Text style={[
                      styles.dayLabel,
                      { 
                        color: isToday ? colors.primary : colors.text.secondary,
                        fontWeight: isToday ? '700' : '500'
                      }
                    ]}>
                      {dayAbbr}
                    </Text>
                  )
                ) : (
                  <Text style={[
                    styles.dayLabel,
                    { 
                      color: isToday ? colors.primary : colors.text.light,
                      fontWeight: isToday ? '700' : '400'
                    }
                  ]}>
                    {dayAbbr}
                  </Text>
                )}
              </View>
              
              {/* Workout type indicator */}
              {isWorkoutDay && workoutTypes[index] && (
                <Text style={[styles.workoutTypeLabel, { color: colors.text.light }]}>
                  {workoutTypes[index].length > 8 ? 
                    workoutTypes[index].slice(0, 8) + '...' : 
                    workoutTypes[index]
                  }
                </Text>
              )}
              
              {/* Rest day indicator */}
              {!isWorkoutDay && (
                <Text style={[styles.restLabel, { color: colors.text.light }]}>
                  Rest
                </Text>
              )}
              
              {/* Modified indicator for past/current days - only show if plan is actually modified and not reverted */}
              {wasModified && index <= todayIndex && shouldShowModificationNotice && (
                <View style={[styles.modifiedIndicator, { backgroundColor: colors.warning }]}>
                  <Text style={styles.modifiedText}>•</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.progressSummary}>
        <View style={styles.progressHeader}>
          <Target size={16} color={colors.primary} />
          <Text style={[styles.progressText, { color: colors.text.secondary }]}>
            {completedWorkoutDays} of {totalWorkoutDays} workout days completed
          </Text>
        </View>
        
        {totalWorkoutDays > 0 && (
          <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.success,
                  width: `${(completedWorkoutDays / totalWorkoutDays) * 100}%`
                }
              ]} 
            />
          </View>
        )}
        
        {/* Show note about modified plan if applicable - only if plan is actually different and not reverted */}
        {shouldShowModificationNotice && (
          <View style={[styles.modifiedPlanNote, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
            <Text style={[styles.modifiedPlanText, { color: colors.warning }]}>
              Plan modified mid-week. Streak calculated using original requirements.
            </Text>
          </View>
        )}
        
        {/* Today's workout button */}
        {currentWeekPlan?.days[todayIndex]?.isWorkoutDay && !currentWeekPlan?.days[todayIndex]?.isCompleted && (
          <TouchableOpacity 
            style={[styles.completeButton, { backgroundColor: colors.primary }]}
            onPress={() => handleCompleteWorkout(todayIndex)}
          >
            <CheckCircle size={18} color="white" />
            <Text style={styles.completeButtonText}>Complete Today's Workout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  weekTracker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  dayContainer: {
    alignItems: 'center',
    minWidth: 35,
    position: 'relative',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  todayBorder: {
    borderWidth: 2,
  },
  completedCircle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  modifiedDayBorder: {
    borderStyle: 'dashed',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  workoutTypeLabel: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 35,
  },
  restLabel: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
  modifiedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifiedText: {
    fontSize: 6,
    color: 'white',
    fontWeight: 'bold',
  },
  progressSummary: {
    alignItems: 'center',
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modifiedPlanNote: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    width: '100%',
  },
  modifiedPlanText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});