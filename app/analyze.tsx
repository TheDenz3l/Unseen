import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { semanticColors } from '../src/theme/colors';
import { useAnalysisStore } from '../src/state/useAnalysisStore';

export default function AnalyzeScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const { analyzeConversation, isAnalyzing } = useAnalysisStore();

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please paste your conversation or enter a message to analyze');
      return;
    }

    try {
      // Convert text input to conversation format
      const conversation = {
        messages: [
          {
            author: 'you' as const,
            text: inputText.trim(),
            timestamp: Date.now(),
          }
        ]
      };
      
      await analyzeConversation(conversation);
      router.push('/result');
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze conversation. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Analyze Your Conversation</Text>
        <Text style={styles.subtitle}>
          Paste your conversation or enter the message you want to send
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Conversation / Draft Message</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={10}
            placeholder="Paste your conversation here or enter your draft message..."
            placeholderTextColor={semanticColors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
          onPress={handleAnalyze}
          disabled={isAnalyzing}
        >
          <Text style={styles.analyzeButtonText}>
            {isAnalyzing ? '⚡ Analyzing...' : '🔍 Analyze Now'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📱 How it works:</Text>
          <Text style={styles.infoText}>
            • Paste your conversation or draft message{'\n'}
            • Get instant analysis (Likely/Uncertain/Unlikely){'\n'}
            • See recommendations (Send now / Wait Xh){'\n'}
            • All processing happens locally on your device
          </Text>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Local-only analysis • Your data never leaves your device
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: semanticColors.textMuted,
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 12,
    padding: 16,
    color: semanticColors.text,
    fontSize: 16,
    minHeight: 200,
    maxHeight: 300,
  },
  analyzeButton: {
    backgroundColor: semanticColors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: semanticColors.text,
  },
  infoBox: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.borderDim,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: semanticColors.textMuted,
    lineHeight: 20,
  },
  privacyNote: {
    alignItems: 'center',
    paddingTop: 20,
  },
  privacyText: {
    fontSize: 14,
    color: semanticColors.textMuted,
    textAlign: 'center',
  },
});
