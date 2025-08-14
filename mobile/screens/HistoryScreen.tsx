import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { semanticColors } from '../src/theme/colors';
import { useAnalysisStore } from '../src/state/useAnalysisStore';

// Dev flag to auto-clear history once after a cold reload
let devAutoCleared = false;

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { recentAnalyses, loadRecentAnalyses, logOutcome, deleteAllData } = useAnalysisStore();
  const [loading, setLoading] = useState(true);
  // Add header clear button (dev utility)
  useLayoutEffect(() => {
    (navigation as any).setOptions?.({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Clear History',
              'Delete all stored analyses? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                      await deleteAllData();
                      await loadRecentAnalyses();
                      console.log('HistoryScreen: all analyses cleared');
                    } catch (e) {
                      console.log('HistoryScreen: failed to clear data', e);
                    }
                  } }
              ]
            );
          }}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Text style={{ color: semanticColors.accent, fontWeight: '600' }}>Clear</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, deleteAllData, loadRecentAnalyses]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadRecentAnalyses();
      setLoading(false);
    };
    loadData();
  }, [loadRecentAnalyses]);

  // One-time dev auto-clear to fulfill "clear history tab" request
  useEffect(() => {
    const maybeClear = async () => {
      if (!devAutoCleared) {
        try {
          await deleteAllData();
          await loadRecentAnalyses();
          devAutoCleared = true;
          console.log('HistoryScreen: auto-cleared analyses (dev)');
        } catch (e) {
          console.log('HistoryScreen: auto-clear failed', e);
        }
      }
    };
    maybeClear();
  }, [deleteAllData, loadRecentAnalyses]);

  const handleOutcomeLog = async (analysisId: string, gotReply: boolean) => {
    await logOutcome(analysisId, gotReply);
  };

  const formatDate = (timestamp: string | number) => {
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

  const handleAnalysisPress = async (analysisId: string) => {
    try {
      console.log('HistoryScreen: item pressed', analysisId);
      // optimistic navigate with param; ResultScreen should fetch by id
      (navigation as any).navigate('Result', { analysisId });
    } catch (e) {
      console.log('HistoryScreen: navigation failed', e);
    }
  };

  const renderAnalysisItem = ({ item }: { item: any }) => {
    const hasOutcome = item.outcome !== undefined;
    
    return (
      <TouchableOpacity style={styles.analysisItem} onPress={() => handleAnalysisPress(item.id)}>
        <View style={styles.analysisHeader}>
          <Text style={styles.contactName}>{item.contact_id || 'Unknown'}</Text>
          <Text style={styles.analysisTime}>{formatDate(item.created_at)}</Text>
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

        {hasOutcome ? (
          <View style={styles.outcomeContainer}>
            <Text style={styles.outcomeLabel}>Outcome:</Text>
            <Text style={[
              styles.outcomeText,
              { color: item.outcome.gotReply ? '#b6c649' : '#cd5c5c' }
            ]}>
              {item.outcome.gotReply ? '✅ Got Reply' : '❌ No Reply'}
            </Text>
          </View>
        ) : (
          <View style={styles.outcomeButtons}>
            <TouchableOpacity 
              style={[styles.outcomeButton, styles.replyButton]}
              onPress={() => handleOutcomeLog(item.id, true)}
            >
              <Text style={styles.outcomeButtonText}>Got Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.outcomeButton, styles.noReplyButton]}
              onPress={() => handleOutcomeLog(item.id, false)}
            >
              <Text style={styles.outcomeButtonText}>No Reply</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis History</Text>
        <Text style={styles.subtitle}>Your past conversation analyses</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={semanticColors.accent} />
          <Text style={styles.loadingText}>Loading analyses...</Text>
        </View>
      ) : recentAnalyses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No analyses yet</Text>
          <Text style={styles.emptyText}>
            Your conversation analyses will appear here once you start using InboxUnseen.
          </Text>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => (navigation as any).navigate('Analyze')}
          >
            <Text style={styles.primaryButtonText}>Analyze Your First Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentAnalyses}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: semanticColors.textMuted,
    marginTop: 16,
  },
  outcomeButtons: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: semanticColors.borderDim,
    gap: 12,
  },
  outcomeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  replyButton: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#b6c649',
  },
  noReplyButton: {
    backgroundColor: '#fdf2f2',
    borderWidth: 1,
    borderColor: '#cd5c5c',
  },
  outcomeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
});
