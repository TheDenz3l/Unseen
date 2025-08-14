import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { semanticColors } from '../src/theme/colors';

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'weekly'>('monthly');

  const handleSubscribe = () => {
    // In Week 1, this is just a placeholder
    // RevenueCat integration will be added
    alert('Subscription feature coming soon!\n\nFor now, enjoy the free features.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Stop double-texting.{'\n'}Start getting replies.</Text>
          <Text style={styles.heroSubtitle}>
            Unlock advanced features to master your messaging game
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Pro Features</Text>
          
          <View style={styles.featuresList}>
            <FeatureItem 
              icon="🔍"
              title="Unlimited Analyses"
              subtitle="Analyze as many conversations as you want"
            />
            
            <FeatureItem 
              icon="💡"
              title="Full Insights"
              subtitle="See all 3 reasons behind every recommendation"
            />
            
            <FeatureItem 
              icon="✍️"
              title="Message Rewrites"
              subtitle="Get 3 tone variations for better responses"
            />
            
            <FeatureItem 
              icon="🎯"
              title="RTwin Profiles"
              subtitle="Per-contact learning for personalized timing"
            />
            
            <FeatureItem 
              icon="⏰"
              title="Timing Coach"
              subtitle="Smart notifications for optimal send times"
            />
            
            <FeatureItem 
              icon="📊"
              title="Green Windows"
              subtitle="Visual timing radar for each contact"
            />
          </View>
        </View>

        {/* Pricing Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.plansTitle}>Choose Your Plan</Text>
          
          <TouchableOpacity 
            style={[styles.planOption, selectedPlan === 'monthly' && styles.planSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>$24.99/mo</Text>
            </View>
            <Text style={styles.planSubtext}>Most popular</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.planOption, selectedPlan === 'weekly' && styles.planSelected]}
            onPress={() => setSelectedPlan('weekly')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Weekly</Text>
              <Text style={styles.planPrice}>$6.99/week</Text>
            </View>
            <Text style={styles.planSubtext}>Try it out</Text>
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeButtonText}>
            Unlock Pro — ${selectedPlan === 'monthly' ? '24.99/mo' : '6.99/wk'}
          </Text>
        </TouchableOpacity>

        {/* Legal & Features Note */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            • Cancel anytime in App Store settings{'\n'}
            • All analysis stays private on your device{'\n'}
            • 7-day free trial (coming soon)
          </Text>
        </View>

        {/* Free Version Info */}
        <View style={styles.freeInfo}>
          <Text style={styles.freeInfoTitle}>What you get for free:</Text>
          <Text style={styles.freeInfoText}>
            • Basic analysis (Likely/Uncertain/Unlikely){'\n'}
            • 1 reason per analysis{'\n'}
            • Send/Wait recommendations{'\n'}
            • Local-only privacy
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureItem({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: semanticColors.text,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: semanticColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: semanticColors.textMuted,
    lineHeight: 20,
  },
  plansContainer: {
    marginBottom: 30,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 20,
  },
  planOption: {
    backgroundColor: semanticColors.surface,
    borderWidth: 2,
    borderColor: semanticColors.borderDim,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planSelected: {
    borderColor: semanticColors.accent,
    backgroundColor: `${semanticColors.accent}20`,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: semanticColors.text,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: semanticColors.accent,
  },
  planSubtext: {
    fontSize: 14,
    color: semanticColors.textMuted,
  },
  subscribeButton: {
    backgroundColor: semanticColors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: semanticColors.text,
  },
  legalContainer: {
    marginBottom: 30,
  },
  legalText: {
    fontSize: 14,
    color: semanticColors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  freeInfo: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.borderDim,
    borderRadius: 12,
    padding: 16,
  },
  freeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
    marginBottom: 8,
  },
  freeInfoText: {
    fontSize: 14,
    color: semanticColors.textMuted,
    lineHeight: 20,
  },
});
