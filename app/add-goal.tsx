import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Save, X, Clock, Target } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGoalStore } from '@/store/goalStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';

export default function AddGoalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { addGoal, goals, getGoalLimits } = useGoalStore();
  const { user } = useAuthStore();
  const colors = useColors();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'short-term' | 'long-term'>(
    params.type === 'long-term' ? 'long-term' : 'short-term'
  );
  
  // Get goal limits based on premium status
  const goalLimits = getGoalLimits(user?.isPremium);
  
  useEffect(() => {
    if (params.type === 'long-term') {
      setType('long-term');
    } else if (params.type === 'short-term') {
      setType('short-term');
    }
  }, [params.type]);
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Goal title cannot be empty');
      return;
    }
    
    const result = addGoal({
      title: title.trim(),
      description: description.trim(),
      type,
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
    }, user?.isPremium);
    
    if (result.success) {
      Alert.alert('Success', result.message, [
        { text: 'OK', onPress: () => router.push("/(tabs)") }
      ]);
    } else {
      Alert.alert('Limit Reached', result.message);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };

  const getTypeColor = (goalType: 'short-term' | 'long-term') => {
    return goalType === 'short-term' ? colors.goalTypes.shortTerm : colors.goalTypes.longTerm;
  };
  
  // Check if at goal limit
  const isAtLimit = goals.length >= goalLimits.total;
  
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Add {type === 'short-term' ? 'Short Term' : 'Long Term'} Goal
        </Text>
        <Text style={[styles.goalCount, { color: colors.text.secondary }]}>
          {goals.length}/{goalLimits.total}
        </Text>
      </View>
      
      {isAtLimit ? (
        <View style={[styles.limitContainer, { backgroundColor: colors.background.primary }]}>
          <Target size={48} color={colors.warning} />
          <Text style={[styles.limitTitle, { color: colors.text.primary }]}>
            Goal Limit Reached
          </Text>
          <Text style={[styles.limitMessage, { color: colors.text.secondary }]}>
            You have reached the maximum of {goalLimits.total} goals. {!user?.isPremium ? 'Upgrade to Premium for up to 12 goals, or ' : ''}Please complete or delete some goals before adding new ones.
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
              placeholder="Enter goal title"
              placeholderTextColor={colors.text.light}
              autoFocus
            />
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity 
                style={[
                  styles.typeButton,
                  { borderColor: type === 'short-term' ? getTypeColor('short-term') : colors.border },
                  type === 'short-term' && { backgroundColor: getTypeColor('short-term') + '20' }
                ]}
                onPress={() => setType('short-term')}
              >
                <Clock size={16} color={type === 'short-term' ? getTypeColor('short-term') : colors.text.secondary} />
                <Text 
                  style={[
                    styles.typeText,
                    { color: type === 'short-term' ? getTypeColor('short-term') : colors.text.secondary },
                    type === 'short-term' && styles.activeTypeText
                  ]}
                >
                  Short Term
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.typeButton,
                  { borderColor: type === 'long-term' ? getTypeColor('long-term') : colors.border },
                  type === 'long-term' && { backgroundColor: getTypeColor('long-term') + '20' }
                ]}
                onPress={() => setType('long-term')}
              >
                <Target size={16} color={type === 'long-term' ? getTypeColor('long-term') : colors.text.secondary} />
                <Text 
                  style={[
                    styles.typeText,
                    { color: type === 'long-term' ? getTypeColor('long-term') : colors.text.secondary },
                    type === 'long-term' && styles.activeTypeText
                  ]}
                >
                  Long Term
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Description</Text>
            <TextInput
              style={[styles.descriptionInput, { 
                backgroundColor: colors.background.primary, 
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add description here..."
              placeholderTextColor={colors.text.light}
              multiline
              textAlignVertical="top"
            />
          </View>
          
          <Button
            title="Create Goal"
            onPress={handleSave}
            icon={<Save size={18} color="white" />}
            style={styles.saveButton}
          />
        </ScrollView>
      )}
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
  goalCount: {
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
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTypeText: {
    fontWeight: '600',
  },
  descriptionInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 16,
  },
});