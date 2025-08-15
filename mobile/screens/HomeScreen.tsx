import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { fetchTestRow } from '../src/supabase/client';
import { useNavigation } from '@react-navigation/native';
import { semanticColors } from '../src/theme/colors';


export default function HomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function handleTestSupabase() {
    setLoading(true);
    setTestResult(null);
    try {
      const data = await fetchTestRow();
      setTestResult('Success: ' + JSON.stringify(data));
    } catch (e: any) {
      setTestResult('Error: ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>InboxUnseen</Text>
        <Text style={styles.subtitle}>Stop double-texting. Start getting replies.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('Analyze' as never)}
        >
          <Text style={styles.primaryButtonText}>📱 Analyze Conversation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('History' as never)}
        >
          <Text style={styles.secondaryButtonText}>📊 History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Paywall' as never)}
        >
          <Text style={styles.secondaryButtonText}>✨ Upgrade to Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Text style={styles.secondaryButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, { marginTop: 32 }]}
        onPress={handleTestSupabase}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>
          {loading ? 'Testing Supabase...' : 'Test Supabase Connection'}
        </Text>
        {loading && <ActivityIndicator style={{ marginLeft: 8 }} />}
      </TouchableOpacity>

      {testResult && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: testResult.startsWith('Success') ? 'green' : 'red', fontSize: 14 }}>
            {testResult}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Local-only analysis • Private by default</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.bg,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: semanticColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: semanticColors.accent,
  },
  secondaryButton: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: semanticColors.text,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: semanticColors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: semanticColors.textMuted,
  },
});
