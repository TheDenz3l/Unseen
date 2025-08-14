import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { semanticColors } from '../src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>InboxUnseen</Text>
        <Text style={styles.subtitle}>Stop double-texting. Start getting replies.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={() => router.push('/analyze')}
        >
          <Text style={styles.primaryButtonText}>📱 Analyze Conversation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.secondaryButtonText}>📊 History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/paywall')}
        >
          <Text style={styles.secondaryButtonText}>✨ Upgrade to Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.secondaryButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

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
