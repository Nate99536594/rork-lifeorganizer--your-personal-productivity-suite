import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Send,
  MessageCircle,
  Bug,
  Heart,
  HelpCircle,
  Settings
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

type SupportCategory = 'bug' | 'feedback' | 'question' | 'other';

export default function SupportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<SupportCategory>('question');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categories = [
    { id: 'question' as const, label: 'Question', icon: HelpCircle, description: 'General questions about the app' },
    { id: 'bug' as const, label: 'Bug Report', icon: Bug, description: 'Report a problem or issue' },
    { id: 'feedback' as const, label: 'Feedback', icon: Heart, description: 'Suggestions and improvements' },
    { id: 'other' as const, label: 'Other', icon: MessageCircle, description: 'Something else' },
  ];
  
  const handleSubmit = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would send to your support system
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create support request object (in real app, this would be sent to backend)
      const supportRequest = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim(),
        category,
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      };
      
      console.log('Support request submitted:', supportRequest);
      
      Alert.alert(
        'Thank you! 🙏',
        'Your message has been sent successfully. We will get back to you soon via email.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setName(user?.name || '');
              setEmail(user?.email || '');
              setCategory('question');
              setMessage('');
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCategoryIcon = (categoryId: SupportCategory) => {
    const categoryData = categories.find(cat => cat.id === categoryId);
    if (!categoryData) return MessageCircle;
    return categoryData.icon;
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Contact Support
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.introCard, { backgroundColor: colors.background.primary }]}>
            <MessageCircle size={32} color={colors.primary} style={styles.introIcon} />
            <Text style={[styles.introTitle, { color: colors.text.primary }]}>
              Need help or have feedback?
            </Text>
            <Text style={[styles.introDescription, { color: colors.text.secondary }]}>
              Reach out to us below and we will get back to you as soon as possible.
            </Text>
          </View>
          
          <View style={[styles.formCard, { backgroundColor: colors.background.primary }]}>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            
            <Input
              label="Email *"
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.categorySection}>
              <Text style={[styles.categoryLabel, { color: colors.text.primary }]}>
                Category
              </Text>
              <Text style={[styles.categoryDescription, { color: colors.text.secondary }]}>
                Help us route your message to the right team
              </Text>
              
              <View style={styles.categoryOptions}>
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = category === cat.id;
                  
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        { 
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary + '10' : 'transparent'
                        }
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <IconComponent 
                        size={20} 
                        color={isSelected ? colors.primary : colors.text.secondary} 
                      />
                      <View style={styles.categoryContent}>
                        <Text style={[
                          styles.categoryTitle,
                          { color: isSelected ? colors.primary : colors.text.primary }
                        ]}>
                          {cat.label}
                        </Text>
                        <Text style={[
                          styles.categoryDesc,
                          { color: isSelected ? colors.text.primary : colors.text.secondary }
                        ]}>
                          {cat.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={styles.messageSection}>
              <Text style={[styles.messageLabel, { color: colors.text.primary }]}>
                Message *
              </Text>
              <TextInput
                style={[styles.messageInput, { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border,
                  color: colors.text.primary
                }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your question, issue, or feedback in detail..."
                placeholderTextColor={colors.text.light}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
            
            <Button
              title={isSubmitting ? 'Sending...' : 'Send Message'}
              onPress={handleSubmit}
              icon={<Send size={18} color="white" />}
              style={styles.submitButton}
              disabled={isSubmitting}
            />
            
            <View style={[styles.privacyNote, { backgroundColor: colors.background.secondary }]}>
              <Text style={[styles.privacyText, { color: colors.text.secondary }]}>
                We respect your privacy. Your information will only be used to respond to your inquiry.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  introIcon: {
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  categoryOptions: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryContent: {
    marginLeft: 12,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 14,
  },
  messageSection: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  messageInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  submitButton: {
    marginBottom: 16,
  },
  privacyNote: {
    padding: 12,
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});