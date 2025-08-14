/**
 * Settings screen for privacy controls and data management
 * Phase 4 - Privacy & Data Controls
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePrivacyStore } from '../src/state/usePrivacyStore';
import { useAnalysisStore } from '../src/state/useAnalysisStore';
import { shareExport, getExportSizeEstimate } from '../src/privacy/export';

export default function SettingsScreen() {
  const router = useRouter();
  const { localOnly, setLocalOnly, suppressedEvents } = usePrivacyStore();
  const { deleteAllData } = useAnalysisStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportSize, setExportSize] = useState<{ records: number; sizeKB: number } | null>(null);

  React.useEffect(() => {
    // Load export size estimate on mount
    getExportSizeEstimate()
      .then(setExportSize)
      .catch(console.error);
  }, []);

  const handleToggleLocalOnly = () => {
    setLocalOnly(!localOnly);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      const result = await shareExport();
      
      if (result.success) {
        Alert.alert(
          'Export Successful',
          result.message,
          [{ text: 'OK' }]
        );
      } else {
        // Show data as fallback if sharing failed
        Alert.alert(
          'Export Ready',
          result.message + '\n\nData will be copied to clipboard.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Copy Data',
              onPress: () => {
                if (result.data) {
                  // In a real app, we'd copy to clipboard
                  console.log('[Settings] Export data:', result.data.slice(0, 200) + '...');
                  Alert.alert('Data Logged', 'Check console for export data (dev only)');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export data',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your analyses, history, and contacts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: confirmDeleteAllData
        }
      ]
    );
  };

  const confirmDeleteAllData = async () => {
    setIsDeleting(true);
    
    try {
      await deleteAllData();
      
      Alert.alert(
        'Data Deleted',
        'All your data has been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh export size estimate
              getExportSizeEstimate()
                .then(setExportSize)
                .catch(console.error);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Delete Failed',
        error instanceof Error ? error.message : 'Failed to delete data',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Local-Only Mode</Text>
              <Text style={styles.settingDescription}>
                Disable analytics and prevent data sharing. All analysis happens locally on your device.
              </Text>
              {localOnly && suppressedEvents > 0 && (
                <Text style={styles.debugText}>
                  {suppressedEvents} analytics events suppressed
                </Text>
              )}
            </View>
            <Switch
              value={localOnly}
              onValueChange={handleToggleLocalOnly}
              trackColor={{ false: '#ccc', true: '#b6c649' }}
              thumbColor={localOnly ? '#2c4251' : '#fff'}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          {/* Export Data */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Export My Data</Text>
                {exportSize && (
                  <Text style={styles.buttonSubtext}>
                    {exportSize.records} records, ~{exportSize.sizeKB}KB
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>

          {/* Delete All Data */}
          <TouchableOpacity 
            style={[styles.button, styles.destructiveButton]} 
            onPress={handleDeleteAllData}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Delete All Data</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Future Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Management</Text>
          <Text style={styles.placeholderText}>
            Individual contact management and selective deletion will be available in a future update.
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.infoText}>
            InboxUnseen analyzes your messages locally on your device. Your conversations never leave your phone unless you explicitly export or share them.
          </Text>
          <Text style={styles.versionText}>Version 0.4.0 - Phase 4</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c4251',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c4251',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#b6c649',
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#2c4251',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  destructiveButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
