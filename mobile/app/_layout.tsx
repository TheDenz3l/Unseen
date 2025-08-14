import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { database } from '../src/storage/db';
import { useMonetizationStore } from '../src/state/useMonetizationStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const initMonetization = useMonetizationStore(state => state.init);

  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize database
        await database.init();
        
        // Initialize monetization system
        await initMonetization();
        
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsReady(true); // Continue anyway for now
      }
    }

    initializeApp();
  }, [initMonetization]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#b6c649" />
        <Text style={styles.loadingText}>Initializing InboxUnseen...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#2c4251" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#2c4251' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '600' },
            headerBackTitle: '',
          }}
        >
          <Stack.Screen name="index" options={{ title: 'InboxUnseen' }} />
          <Stack.Screen name="analyze" options={{ title: 'Analyze' }} />
          <Stack.Screen name="result" options={{ title: 'Result' }} />
          <Stack.Screen name="history" options={{ title: 'History' }} />
          <Stack.Screen name="paywall" options={{ title: 'Upgrade to Pro' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#2c4251',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
});