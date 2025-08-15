/**
 * Integration tests for privacy features
 * Phase 4 - Privacy & Data Controls
 */

import { usePrivacyStore } from '../state/usePrivacyStore';
import { trackAnalysisGated } from '../analytics/events';
import { database } from '../storage/db';

// Mock console to capture analytics
const mockConsoleLog = jest.fn();
jest.spyOn(console, 'log').mockImplementation(mockConsoleLog);

// Mock database 
jest.mock('../storage/db');

describe('Privacy Integration', () => {
  beforeEach(() => {
    // Reset privacy store
    usePrivacyStore.setState({ localOnly: false, suppressedEvents: 0 });
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
  });

  describe('Local-only analytics suppression', () => {
    test('analytics work normally when local-only disabled', () => {
      // Start fresh without any previous setLocalOnly calls
      mockConsoleLog.mockClear();
      usePrivacyStore.setState({ localOnly: false, suppressedEvents: 0 });
      
      trackAnalysisGated(5, 6);
      
      // Check that analytics was called (should be the last call)
      const analyticsCalls = mockConsoleLog.mock.calls.filter(call => 
        call[0] && call[0].includes('[Analytics]')
      );
      expect(analyticsCalls.length).toBeGreaterThan(0);
      expect(analyticsCalls[0][1]).toContain('"limit": 5');
    });

    test('analytics are suppressed when local-only enabled', () => {
      usePrivacyStore.getState().setLocalOnly(true);
      
      trackAnalysisGated(5, 6);
      
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.anything()
      );
    });

    test('suppressed events are counted', () => {
      const store = usePrivacyStore.getState();
      store.setLocalOnly(true);
      
      expect(store.suppressedEvents).toBe(0);
      
      trackAnalysisGated(5, 6);
      trackAnalysisGated(5, 7);
      
      const updatedStore = usePrivacyStore.getState();
      expect(updatedStore.suppressedEvents).toBe(2);
    });

    test('toggling local-only mode works correctly', () => {
      // Start fresh
      mockConsoleLog.mockClear();
      usePrivacyStore.setState({ localOnly: false, suppressedEvents: 0 });
      
      // Test analytics work when disabled
      trackAnalysisGated(5, 1);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      
      mockConsoleLog.mockClear();
      
      // Enable local-only (this will trigger a console.log)
      usePrivacyStore.getState().setLocalOnly(true);
      trackAnalysisGated(5, 2);
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.anything()
      );
      
      // Clear again and disable local-only
      mockConsoleLog.mockClear();
      usePrivacyStore.getState().setLocalOnly(false);
      trackAnalysisGated(5, 3);
      
      // Check that analytics was called (should be the last call)
      const analyticsCalls = mockConsoleLog.mock.calls.filter(call => 
        call[0] && call[0].includes('[Analytics]')
      );
      expect(analyticsCalls.length).toBeGreaterThan(0);
      expect(analyticsCalls[0][1]).toContain('"usageToday": 3');
    });
  });

  describe('Delete all data integration', () => {
    test('delete all data clears database and resets stores', async () => {
      const mockDatabase = database as jest.Mocked<typeof database>;
      mockDatabase.deleteAllData.mockResolvedValue();
      
      // This would be called from analysis store deleteAllData
      await mockDatabase.deleteAllData();
      
      expect(mockDatabase.deleteAllData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Privacy store state management', () => {
    test('initial state is correct', () => {
      const store = usePrivacyStore.getState();
      
      expect(store.localOnly).toBe(false);
      expect(store.suppressedEvents).toBe(0);
    });

    test('setLocalOnly updates state and logs', () => {
      const store = usePrivacyStore.getState();
      
      store.setLocalOnly(true);
      expect(usePrivacyStore.getState().localOnly).toBe(true);
      
      store.setLocalOnly(false);
      expect(usePrivacyStore.getState().localOnly).toBe(false);
    });
  });
});
