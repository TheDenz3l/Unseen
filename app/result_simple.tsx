import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { semanticColors, ghostMeterColors } from '../src/theme/colors';

export default function ResultScreen() {
  const router = useRouter();

  // Mock data for minimal version
  const mockResult = {
    prob: 0.3,
    bucket: 'Unlikely',
    waitMinutes: 240,
    reasons: [
      'The conversation shows minimal recent engagement',
      'Your message length suggests over-eagerness',  
      'Time of day indicates they may be busy'
    ],
    recommendation: 'wait'
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleAnalyzeAnother = () => {
    router.push('/analyze');
  };

  const renderActionButton = () => {
    if (mockResult.recommendation === 'send') {
      return '✅ Good to Send';
    } else {
      return `⏳ Wait ${formatWaitTime(mockResult.waitMinutes || 120)}`;
    }
  };

  const getBucketColor = () => {
    switch (mockResult.bucket) {
      case 'Very Likely':
      case 'Likely': 
        return ghostMeterColors.likely.bg;
      case 'Maybe': 
        return ghostMeterColors.uncertain.bg;
      case 'Unlikely':
      case 'Very Unlikely': 
        return ghostMeterColors.unlikely.bg;
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
            <Text style={styles.ghostMeterBucket}>{mockResult.bucket}</Text>
            <Text style={styles.ghostMeterProb}>
              {(mockResult.prob * 100).toFixed(0)}% likely to get a reply
            </Text>
          </View>
          
          <View style={styles.ghostMeterBar}>
            <View 
              style={[
                styles.ghostMeterFill, 
                { 
                  width: `${mockResult.prob * 100}%`,
                  backgroundColor: getBucketColor()
                }
              ]} 
            />
          </View>

          {mockResult.recommendation === 'wait' && (
            <View style={styles.waitRecommendation}>
              <Text style={styles.waitText}>
                Recommended wait time: {formatWaitTime(mockResult.waitMinutes)}
              </Text>
            </View>
          )}
        </View>

        {/* Reasons */}
        <View style={styles.reasonsSection}>
          <Text style={styles.reasonsTitle}>Why?</Text>
          {mockResult.reasons.map((reason: string, index: number) => (
            <View key={index} style={styles.reasonItem}>
              <Text style={styles.reasonBullet}>•</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

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
});
