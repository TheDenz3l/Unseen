/**
 * Tests for data export functionality
 * Phase 4 - Privacy & Data Controls
 */

import { buildExportBundle, serializeExport, getExportSizeEstimate } from '../privacy/export';
import { database } from '../storage/db';

// Mock database for tests
jest.mock('../storage/db');

describe('Data Export', () => {
  const mockDatabase = database as jest.Mocked<typeof database>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildExportBundle', () => {
    test('builds complete export bundle with all tables', async () => {
      // Mock database response
      mockDatabase.exportAllData.mockResolvedValue({
        contacts: [
          { id: 'hash123', display_hint: 'John', n_msgs: 5, created_at: 1628000000000 }
        ],
        contact_stats: [],
        threads: [
          { id: 'thread1', contact_id: 'hash123', created_at: 1628000000000 }
        ],
        analyses: [
          {
            id: 'analysis1',
            thread_id: 'thread1',
            bucket: 'Likely',
            reasons: ['Feature: message length is reasonable'],
            suggestions: ['Send now'],
            created_at: 1628000000000
          }
        ],
        outcomes: [],
        exported_at: '2024-01-01T12:00:00.000Z'
      });

      const bundle = await buildExportBundle();

      expect(bundle.contacts).toHaveLength(1);
      expect(bundle.threads).toHaveLength(1);
      expect(bundle.analyses).toHaveLength(1);
      expect(bundle.metadata.total_records).toBe(3);
      expect(bundle.metadata.version).toBe('1.0');
      expect(bundle.metadata.app_version).toBe('0.4.0');
      expect(bundle.exported_at).toBeTruthy();
    });

    test('handles empty database', async () => {
      mockDatabase.exportAllData.mockResolvedValue({
        contacts: [],
        contact_stats: [],
        threads: [],
        analyses: [],
        outcomes: [],
        exported_at: '2024-01-01T12:00:00.000Z'
      });

      const bundle = await buildExportBundle();

      expect(bundle.metadata.total_records).toBe(0);
      expect(Array.isArray(bundle.contacts)).toBe(true);
      expect(Array.isArray(bundle.analyses)).toBe(true);
    });

    test('propagates database errors', async () => {
      mockDatabase.exportAllData.mockRejectedValue(new Error('Database error'));

      await expect(buildExportBundle()).rejects.toThrow('Database error');
    });
  });

  describe('serializeExport', () => {
    test('produces valid JSON string', () => {
      const bundle = {
        contacts: [{ id: 'test', name: 'Test' }],
        contact_stats: [],
        threads: [],
        analyses: [],
        outcomes: [],
        exported_at: '2024-01-01T12:00:00.000Z',
        metadata: {
          version: '1.0',
          total_records: 1,
          app_version: '0.4.0'
        }
      };

      const serialized = serializeExport(bundle);
      
      expect(() => JSON.parse(serialized)).not.toThrow();
      expect(serialized).toContain('"contacts"');
      expect(serialized).toContain('"metadata"');
    });

    test('handles empty bundle', () => {
      const bundle = {
        contacts: [],
        contact_stats: [],
        threads: [],
        analyses: [],
        outcomes: [],
        exported_at: '2024-01-01T12:00:00.000Z',
        metadata: {
          version: '1.0',
          total_records: 0,
          app_version: '0.4.0'
        }
      };

      const serialized = serializeExport(bundle);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.contacts).toEqual([]);
      expect(parsed.metadata.total_records).toBe(0);
    });

    test('round-trip JSON parsing works', () => {
      const bundle = {
        contacts: [{ id: 'hash123', display_hint: 'Test User' }],
        contact_stats: [],
        threads: [],
        analyses: [{ id: 'analysis1', reasons: ['test reason'], bucket: 'Likely' }],
        outcomes: [],
        exported_at: '2024-01-01T12:00:00.000Z',
        metadata: {
          version: '1.0',
          total_records: 2,
          app_version: '0.4.0'
        }
      };

      const serialized = serializeExport(bundle);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.contacts[0].id).toBe('hash123');
      expect(parsed.analyses[0].reasons).toEqual(['test reason']);
      expect(parsed.metadata.total_records).toBe(2);
    });
  });

  describe('getExportSizeEstimate', () => {
    test('calculates size estimate correctly', async () => {
      mockDatabase.exportAllData.mockResolvedValue({
        contacts: [{ id: 'test' }],
        contact_stats: [],
        threads: [],
        analyses: [],
        outcomes: [],
        exported_at: '2024-01-01T12:00:00.000Z'
      });

      const estimate = await getExportSizeEstimate();
      
      expect(estimate.records).toBe(1);
      expect(estimate.sizeKB).toBeGreaterThan(0);
      expect(typeof estimate.sizeKB).toBe('number');
    });

    test('handles database errors gracefully', async () => {
      mockDatabase.exportAllData.mockRejectedValue(new Error('Database error'));

      const estimate = await getExportSizeEstimate();
      
      expect(estimate.records).toBe(0);
      expect(estimate.sizeKB).toBe(0);
    });
  });
});
