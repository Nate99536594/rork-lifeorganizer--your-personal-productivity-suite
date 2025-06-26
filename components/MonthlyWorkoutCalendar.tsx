import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { ChevronLeft, ChevronRight, X, Clock, Flame, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWorkoutSessionStore, WorkoutSession } from '@/store/workoutSessionStore';

const { width: screenWidth } = Dimensions.get('window');

export const MonthlyWorkoutCalendar: React.FC = () => {
  const colors = useColors();
  const router = useRouter();
  const { sessions, getSessionsForMonth, getSessionsForDate, getSessionById } = useWorkoutSessionStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Use shorter, unique abbreviations for each day to ensure they fit
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Calculate remaining cells to complete the grid (6 rows x 7 days = 42 cells)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(null);
    }
    
    return days;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const hasWorkoutOnDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return sessions.some(session => {
      const sessionDate = new Date(session.date);
      const sessionYear = sessionDate.getFullYear();
      const sessionMonth = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const sessionDay = String(sessionDate.getDate()).padStart(2, '0');
      const sessionDateString = `${sessionYear}-${sessionMonth}-${sessionDay}`;
      return sessionDateString === dateString;
    });
  };
  
  const handleDatePress = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const dateSessions = getSessionsForDate(dateString);
    
    if (dateSessions.length > 0) {
      setSelectedDate(dateString);
      setShowModal(true);
    } else {
      Alert.alert('No Workout', 'No workout was logged on this date.');
    }
  };
  
  const handleEditSession = (sessionId: string) => {
    setShowModal(false);
    
    // Verify the session exists before navigating
    const session = getSessionById(sessionId);
    if (session) {
      // Use a small delay to ensure modal closes before navigation
      setTimeout(() => {
        router.push(`/workout-session/${sessionId}`);
      }, 100);
    } else {
      Alert.alert(
        'Session Not Found',
        'This workout session could not be found. It may have been deleted.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  const renderWorkoutModal = () => {
    if (!selectedDate) return null;
    
    const dateSessions = getSessionsForDate(selectedDate);
    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Filter out any sessions that might have been deleted
    const validSessions = dateSessions.filter(session => getSessionById(session.id));
    
    if (validSessions.length === 0) {
      return (
        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  No Workouts Found
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.noSessionsText, { color: colors.text.secondary }]}>
                The workouts for this date are no longer available.
              </Text>
            </View>
          </View>
        </Modal>
      );
    }
    
    return (
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Workouts on {formattedDate}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {validSessions.map((session, index) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, { backgroundColor: colors.background.secondary }]}
                  onPress={() => handleEditSession(session.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTime}>
                      <Clock size={16} color={colors.text.secondary} />
                      <Text style={[styles.sessionTimeText, { color: colors.text.secondary }]}>
                        {formatDuration(session.duration)}
                      </Text>
                    </View>
                    
                    {session.calories && (
                      <View style={styles.sessionCalories}>
                        <Flame size={16} color={colors.warning} />
                        <Text style={[styles.sessionCaloriesText, { color: colors.text.secondary }]}>
                          {session.calories} cal
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.editIcon}>
                      <Edit2 size={16} color={colors.primary} />
                    </View>
                  </View>
                  
                  {session.exercises.length > 0 && (
                    <View style={styles.exercisesList}>
                      <Text style={[styles.exercisesTitle, { color: colors.text.primary }]}>
                        Exercises:
                      </Text>
                      {session.exercises.slice(0, 3).map((exercise, idx) => (
                        <Text key={idx} style={[styles.exerciseItem, { color: colors.text.secondary }]}>
                          • {exercise}
                        </Text>
                      ))}
                      {session.exercises.length > 3 && (
                        <Text style={[styles.moreExercises, { color: colors.primary }]}>
                          +{session.exercises.length - 3} more
                        </Text>
                      )}
                    </View>
                  )}
                    
                  {session.notes && (
                    <View style={styles.notesSection}>
                      <Text style={[styles.notesTitle, { color: colors.text.primary }]}>
                        Notes:
                      </Text>
                      <Text style={[styles.notesText, { color: colors.text.secondary }]} numberOfLines={2}>
                        {session.notes}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.tapHint}>
                    <Text style={[styles.tapHintText, { color: colors.primary }]}>
                      Tap to edit
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  const days = getDaysInMonth(currentDate);
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <ChevronLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
          {currentMonth} {currentYear}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <ChevronRight size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.dayHeaders}>
        {dayNames.map((day, index) => (
          <View key={`day-header-${index}`} style={styles.dayHeaderCell}>
            <Text style={[styles.dayHeader, { color: colors.text.secondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.calendar}>
        {days.map((day, index) => {
          if (!day) {
            return (
              <View 
                key={`empty-${index}`} 
                style={styles.emptyDay} 
              />
            );
          }
          
          const hasWorkout = hasWorkoutOnDate(day);
          const today = new Date();
          const isToday = day.getDate() === today.getDate() && 
                         day.getMonth() === today.getMonth() && 
                         day.getFullYear() === today.getFullYear();
          
          return (
            <TouchableOpacity
              key={`day-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
              style={[
                styles.dayCell,
                hasWorkout && { backgroundColor: colors.success + '20' },
                isToday && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => handleDatePress(day)}
              disabled={!hasWorkout}
            >
              <Text style={[
                styles.dayNumber,
                { color: hasWorkout ? colors.success : colors.text.secondary },
                isToday && { color: colors.primary, fontWeight: '700' }
              ]}>
                {day.getDate()}
              </Text>
              
              {hasWorkout && (
                <View style={[styles.workoutDot, { backgroundColor: colors.success }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {renderWorkoutModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: `${100/7}%`,
    height: 40,
    padding: 1,
  },
  dayCell: {
    width: `${100/7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 4,
    padding: 1,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  workoutDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  modalBody: {
    maxHeight: 400,
  },
  noSessionsText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  sessionCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTimeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  sessionCalories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionCaloriesText: {
    fontSize: 14,
    marginLeft: 4,
  },
  editIcon: {
    padding: 4,
  },
  exercisesList: {
    marginBottom: 8,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseItem: {
    fontSize: 14,
    marginLeft: 8,
  },
  moreExercises: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    marginTop: 2,
  },
  notesSection: {
    marginTop: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  tapHint: {
    marginTop: 8,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
});