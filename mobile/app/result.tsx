import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { semanticColors, ghostMeterColors } from '../src/theme/colors';
import { useAnalysisStore } from '../src/state/useAnalysisStore';
import { useMonetizationStore } from '../src/state/useMonetizationStore';
import { trackPaywallView } from '../src/analytics/events';
import { FREE_ANALYSES_PER_DAY } from '../src/monetization/constants';

export default function ResultScreen() {
  const router = useRouter();
  const { currentResult, clearCurrentAnalysis, logOutcome } = useAnalysisStore();
  const { entitlement, usageToday } = useMonetizationStore();
  const [outcomeLogged, setOutcomeLogged] = useState(false);
  
  const isPro = entitlement === 'pro';
  
  // If no current analysis, show error or redirect
  if (!currentResult) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No analysis found</Text>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => router.push('/analyze')}
          >
            <Text style={styles.primaryButtonText}>Analyze a Conversation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const { prob, bucket, recommendation, waitMinutes, reasons, suggestions = [], id } = currentResult;

  const handleGoHome = () => {
    clearCurrentAnalysis();
    router.push('/');
  };

  const handleAnalyzeAnother = () => {
    clearCurrentAnalysis();
    router.push('/analyze');
  };

  const handleLogOutcome = async (gotReply: boolean) => {
    if (!id) {
      Alert.alert('Error', 'Cannot log outcome - analysis ID missing');
      return;
    }
    
    try {
      await logOutcome(id, gotReply);
      setOutcomeLogged(true);
      Alert.alert('Thank you!', 'Your feedback helps improve our predictions.');
    } catch (error) {
      Alert.alert('Error', 'Failed to log outcome. Please try again.');
    }
  };

  const renderActionButton = () => {
    if (recommendation === 'send') {
      return '✅ Good to Send';
    } else {
      return `⏳ Wait ${formatWaitTime(waitMinutes || 120)}`;
    }
  };

  const getBucketColor = () => {
    switch (bucket) {
      case 'Likely': 
        return ghostMeterColors.likely.bg;
      case 'Unlikely': 
        return ghostMeterColors.unlikely.bg;
      case 'Uncertain':
      default: 
        return ghostMeterColors.uncertain.bg;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Ghost Meter */}
        <View style={styles.ghostMeter}>
          <View style={styles.ghostMeterHeader}>
            <Text style={styles.ghostMeterTitle}>👻 Ghost Meter</Text>
            <Text style={styles.ghostMeterBucket}>{bucket}</Text>
            <Text style={styles.ghostMeterProb}>
              {(prob * 100).toFixed(0)}% likely to get a reply
            </Text>
          </View>
          
          <View style={styles.ghostMeterBar}>
            <View 
              style={[
                styles.ghostMeterFill, 
                { 
                  width: `${prob * 100}%`,
                  backgroundColor: getBucketColor()
                }
              ]} 
            />
          </View>

          {recommendation === 'wait' && (
            <View style={styles.waitRecommendation}>
              <Text style={styles.waitText}>
                Recommended wait time: {formatWaitTime(waitMinutes || 120)}
              </Text>
            </View>
          )}
        </View>

        {/* Reasons */}
        <View style={styles.reasonsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.reasonsTitle}>Why?</Text>
            {!isPro && reasons.length === 1 && (
              <TouchableOpacity 
                style={styles.proPrompt}
                onPress={() => {
                  trackPaywallView('result_truncated');
                  router.push('/paywall');
                }}
              >
                <Text style={styles.proPromptText}>+{2} more • Unlock Pro</Text>
              </TouchableOpacity>
            )}
          </View>
          {reasons.map((reason: string, index: number) => (
            <View key={index} style={styles.reasonItem}>
              <Text style={styles.reasonBullet}>•</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.suggestionsTitle}>Alternative Messages</Text>
              {!isPro && suggestions.length === 1 && (
                <TouchableOpacity 
                  style={styles.proPrompt}
                  onPress={() => {
                    trackPaywallView('result_truncated');
                    router.push('/paywall');
                  }}
                >
                  <Text style={styles.proPromptText}>+{2} more • Pro</Text>
                </TouchableOpacity>
              )}
            </View>
            {suggestions.map((suggestion: any, index: number) => (
              <TouchableOpacity key={index} style={styles.suggestionItem}>
                <Text style={styles.suggestionTone}>{suggestion.tone || 'Suggestion'}</Text>
                <Text style={styles.suggestionText}>{suggestion.text || suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Usage Status for Free Users */}
        {!isPro && (
          <View style={styles.usageSection}>
            <Text style={styles.usageText}>
              Free usage today: {usageToday}/{FREE_ANALYSES_PER_DAY}
            </Text>
            {usageToday >= FREE_ANALYSES_PER_DAY - 1 && (
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => {
                  trackPaywallView('limit_reached');
                  router.push('/paywall');
                }}
              >
                <Text style={styles.upgradeButtonText}>Upgrade for Unlimited</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Outcome Logging */}
        {!outcomeLogged && (
          <View style={styles.outcomeSection}>
            <Text style={styles.outcomeSectionTitle}>Did you get a reply?</Text>
            <Text style={styles.outcomeSectionSubtitle}>Help us improve predictions</Text>
            <View style={styles.outcomeButtons}>
              <TouchableOpacity 
                style={[styles.outcomeButton, styles.replyButton]}
                onPress={() => handleLogOutcome(true)}
              >
                <Text style={styles.outcomeButtonText}>✅ Got Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.outcomeButton, styles.noReplyButton]}
                onPress={() => handleLogOutcome(false)}
              >
                <Text style={styles.outcomeButtonText}>❌ No Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}        {/* Outcome Logging */}
        {!outcomeLogged && (
          <View style={styles.outcomeSection}>
            <Text style={styles.outcomeSectionTitle}>Did you get a reply?</Text>
            <Text style={styles.outcomeSectionSubtitle}>Help us improve predictions</Text>
            <View style={styles.outcomeButtons}>
              <TouchableOpacity 
                style={[styles.outcomeButton, styles.replyButton]}
                onPress={() => handleLogOutcome(true)}
              >
                <Text style={styles.outcomeButtonText}>✅ Got Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.outcomeButton, styles.noReplyButton]}
                onPress={() => handleLogOutcome(false)}
              >
                <Text style={styles.outcomeButtonText}>❌ No Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAnalyzeAnother}>
            <Text style={styles.primaryButtonText}>Analyze Another</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function formatWaitTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  } else {
    const days = Math.round(minutes / 1440);
    return `${days}d`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    padding: 20,
  },
  ghostMeter: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  ghostMeterHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ghostMeterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 8,
  },
  ghostMeterBucket: {
    fontSize: 20,
    fontWeight: '600',
    color: semanticColors.accent,
    marginBottom: 4,
  },
  ghostMeterProb: {
    fontSize: 16,
    color: semanticColors.textMuted,
  },
  ghostMeterBar: {
    width: '100%',
    height: 12,
    backgroundColor: semanticColors.borderDim,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  ghostMeterFill: {
    height: '100%',
    borderRadius: 6,
  },
  waitRecommendation: {
    backgroundColor: semanticColors.bg,
    borderWidth: 1,
    borderColor: semanticColors.borderDim,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  waitText: {
    fontSize: 14,
    color: semanticColors.textMuted,
    textAlign: 'center',
  },
  reasonsSection: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  reasonsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reasonBullet: {
    fontSize: 16,
    color: semanticColors.accent,
    marginRight: 12,
    marginTop: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: semanticColors.text,
    lineHeight: 22,
  },
  actionSection: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: semanticColors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: semanticColors.text,
  },
  secondaryButton: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: semanticColors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: semanticColors.text,
    marginBottom: 20,
  },
  suggestionsSection: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 16,
  },
  suggestionItem: {
    backgroundColor: semanticColors.bg,
    borderWidth: 1,
    borderColor: semanticColors.borderDim,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  suggestionTone: {
    fontSize: 14,
    fontWeight: '600',
    color: semanticColors.accent,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 16,
    color: semanticColors.text,
    lineHeight: 22,
  },
  outcomeSection: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  outcomeSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  outcomeSectionSubtitle: {
    fontSize: 16,
    color: semanticColors.textMuted,
    marginBottom: 20,
    textAlign: 'center',
  },
  outcomeButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  outcomeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  replyButton: {
    backgroundColor: '#e8f5e8',
    borderColor: '#b6c649',
  },
  noReplyButton: {
    backgroundColor: '#fdf2f2',
    borderColor: '#cd5c5c',
  },
  outcomeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  proPrompt: {
    backgroundColor: semanticColors.accent + '20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  proPromptText: {
    fontSize: 12,
    color: semanticColors.accent,
    fontWeight: '600',
  },
  usageSection: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  usageText: {
    fontSize: 16,
    color: semanticColors.textMuted,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: semanticColors.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
  },
});
