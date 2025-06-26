import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { AppTitle } from "@/components/AppTitle";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Disable web development tools and element selection - web only
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Disable right-click context menu that might show "select element"
      const disableContextMenu = (e: Event) => {
        e.preventDefault();
        return false;
      };
      
      // Disable developer tools shortcuts
      const disableDevTools = (e: KeyboardEvent) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
          return false;
        }
      };
      
      document.addEventListener('contextmenu', disableContextMenu);
      document.addEventListener('keydown', disableDevTools);
      
      // Disable text selection that might trigger element selection
      if (document.body) {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
      }
      
      return () => {
        document.removeEventListener('contextmenu', disableContextMenu);
        document.removeEventListener('keydown', disableDevTools);
      };
    }
  }, []);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="index" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="task/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: () => <AppTitle logoSize={24} fontSize={18} />,
              headerBackTitle: "Tasks"
            }} 
          />
          <Stack.Screen 
            name="goal/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: () => <AppTitle logoSize={24} fontSize={18} />,
              headerBackTitle: "Goals"
            }} 
          />
          <Stack.Screen 
            name="expense/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: () => <AppTitle logoSize={24} fontSize={18} />,
              headerBackTitle: "Budget"
            }} 
          />
          <Stack.Screen 
            name="nutrition/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: () => <AppTitle logoSize={24} fontSize={18} />,
              headerBackTitle: "Health"
            }} 
          />
          <Stack.Screen 
            name="workout/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: () => <AppTitle logoSize={24} fontSize={18} />,
              headerBackTitle: "Health"
            }} 
          />
          <Stack.Screen 
            name="workout-session/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: () => <AppTitle logoSize={24} fontSize={18} />,
              headerBackTitle: "Health"
            }} 
          />
          <Stack.Screen 
            name="user-profile/[id]" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="profile" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="support" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="friends" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="search-users" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="friend-requests" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="add-task" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="add-goal" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="nudges" 
            options={{ 
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="send-nudge" 
            options={{ 
              headerShown: false
            }} 
          />
        </>
      )}
    </Stack>
  );
}