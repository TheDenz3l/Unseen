/**
 * Data export service for privacy compliance
 * Phase 4 - Privacy & Data Controls
 */

import { database } from '../storage/db';

export interface ExportBundle {
  contacts: any[];
  contact_stats: any[];
  threads: any[];
  analyses: any[];
  outcomes: any[];
  exported_at: string;
  metadata: {
    version: string;
    total_records: number;
    app_version: string;
  };
}

/**
 * Build complete export bundle from database
 */
export async function buildExportBundle(): Promise<ExportBundle> {
  const rawData = await database.exportAllData();
  
  const totalRecords = rawData.contacts.length + 
                      rawData.contact_stats.length + 
                      rawData.threads.length + 
                      rawData.analyses.length + 
                      rawData.outcomes.length;
  
  return {
    ...rawData,
    metadata: {
      version: '1.0',
      total_records: totalRecords,
      app_version: '0.4.0', // Phase 4
    },
  };
}

/**
 * Serialize export bundle to JSON string
 */
export function serializeExport(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Platform-aware data sharing
 * Falls back to returning JSON string if sharing unavailable
 */
export async function shareExport(): Promise<{ success: boolean; message: string; data?: string }> {
  try {
    // Build export bundle
    const bundle = await buildExportBundle();
    const jsonString = serializeExport(bundle);
    
    // Try to use platform sharing if available
    try {
      // Dynamic import to handle missing modules gracefully
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          message: 'Sharing not available on this device',
          data: jsonString
        };
      }
      
      // Create temporary file
      const fileName = `inboxunseen_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export InboxUnseen Data'
      });
      
      return {
        success: true,
        message: `Exported ${bundle.metadata.total_records} records successfully`
      };
      
    } catch (platformError) {
      console.log('[Export] Platform sharing unavailable, using fallback:', platformError);
      
      // Fallback: return JSON string for manual handling
      return {
        success: false,
        message: 'Export completed, but sharing unavailable. Data returned for manual save.',
        data: jsonString
      };
    }
    
  } catch (error) {
    console.error('[Export] Failed to build export:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Export failed'
    };
  }
}

/**
 * Get export size estimate for UI
 */
export async function getExportSizeEstimate(): Promise<{ records: number; sizeKB: number }> {
  try {
    const bundle = await buildExportBundle();
    const jsonString = serializeExport(bundle);
    
    return {
      records: bundle.metadata.total_records,
      sizeKB: Math.ceil(jsonString.length / 1024)
    };
  } catch (error) {
    console.error('[Export] Size estimate failed:', error);
    return { records: 0, sizeKB: 0 };
  }
}
