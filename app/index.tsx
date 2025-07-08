import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Apple } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { SocialButton } from '@/components/SocialButton';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { signInWithApple, isLoading } = useAuthStore();

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Apple sign in error:', error);
      // Handle Apple sign in error
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[
            styles.title, 
            { 
              color: colors.text.primary,
              fontFamily: colors.fonts.bold
            }
          ]}>
            Welcome
          </Text>
          <Text style={[
            styles.subtitle, 
            { 
              color: colors.text.secondary,
              fontFamily: colors.fonts.regular
            }
          ]}>
            Sign in to continue your journey
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <SocialButton
            title="Continue with Apple"
            icon={<Apple size={20} color={colors.text.primary} />}
            onPress={handleAppleSignIn}
            isLoading={isLoading}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={[
            styles.footerText, 
            { 
              color: colors.text.secondary,
              fontFamily: colors.fonts.regular
            }
          ]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});