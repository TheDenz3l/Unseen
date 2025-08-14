import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { semanticColors } from '../src/theme/colors';

export default function HistoryScreen() {
  const router = useRouter();

  // Mock data for minimal version
  const mockHistory = [
    {
      id: '1',
      contactId: 'John',
      timestamp: new Date().toISOString(),
      bucket: 'Unlikely',
      prob: 0.3,
      gotReply: null,
    },
    {
      id: '2', 
      contactId: 'Sarah',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      bucket: 'Likely',
      prob: 0.8,
      gotReply: true,
    }
  ];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case 'Very Likely':
      case 'Likely': 
        return '#b6c649';
      case 'Maybe': 
        return '#c1c1c1';
      case 'Unlikely':
      case 'Very Unlikely': 
        return '#cd5c5c';
      default: 
        return '#c1c1c1';
    }
  };

  const renderAnalysisItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.analysisItem}>
      <View style={styles.analysisHeader}>
        <Text style={styles.contactName}>{item.contactId || 'Unknown'}</Text>
        <Text style={styles.analysisTime}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <View style={styles.analysisContent}>
        <View style={styles.bucketContainer}>
          <View 
            style={[
              styles.bucketDot, 
              { backgroundColor: getBucketColor(item.bucket) }
            ]} 
          />
          <Text style={styles.bucketText}>{item.bucket}</Text>
        </View>
        
        <Text style={styles.probText}>
          {(item.prob * 100).toFixed(0)}% likely
        </Text>
      </View>

      {item.gotReply !== null && (
        <View style={styles.outcomeContainer}>
          <Text style={styles.outcomeLabel}>Outcome:</Text>
          <Text style={[
            styles.outcomeText,
            { color: item.gotReply ? '#b6c649' : '#cd5c5c' }
          ]}>
            {item.gotReply ? '✅ Got Reply' : '❌ No Reply'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis History</Text>
        <Text style={styles.subtitle}>Your past conversation analyses</Text>
      </View>

      {mockHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No analyses yet</Text>
          <Text style={styles.emptyText}>
            Your conversation analyses will appear here once you start using InboxUnseen.
          </Text>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/analyze')}
          >
            <Text style={styles.primaryButtonText}>Analyze Your First Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mockHistory}
          renderItem={renderAnalysisItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
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
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  analysisItem: {
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
  },
  analysisTime: {
    fontSize: 14,
    color: semanticColors.textMuted,
  },
  analysisContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bucketContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bucketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bucketText: {
    fontSize: 14,
    fontWeight: '500',
    color: semanticColors.text,
  },
  probText: {
    fontSize: 14,
    color: semanticColors.textMuted,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: semanticColors.borderDim,
  },
  outcomeLabel: {
    fontSize: 14,
    color: semanticColors.textMuted,
    marginRight: 8,
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: semanticColors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: semanticColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: semanticColors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: semanticColors.text,
  },
});
