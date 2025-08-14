/**
 * Tests for monetization gating logic
 */

import {
  getCurrentDateStamp,
  isDayChanged,
  shouldBlockFreeUser,
  truncateReasons,
  truncateSuggestions,
  applyFreeLimitations,
  calculateCurrentUsage,
  canPerformAnalysis,
} from '../monetization/gating';
import { FREE_ANALYSES_PER_DAY } from '../monetization/constants';
import type { AnalysisResult } from '../analysis/features';

describe('Monetization Gating', () => {
  const mockDate = '2025-08-14';
  const nextDate = '2025-08-15';

  beforeEach(() => {
    // Mock Date to return consistent values
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate + 'T12:00:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Date handling', () => {
    test('getCurrentDateStamp returns YYYY-MM-DD format', () => {
      expect(getCurrentDateStamp()).toBe(mockDate);
    });

    test('isDayChanged detects day changes', () => {
      expect(isDayChanged(mockDate, mockDate)).toBe(false);
      expect(isDayChanged(mockDate, nextDate)).toBe(true);
      expect(isDayChanged('2025-08-13', mockDate)).toBe(true);
    });
  });

  describe('Usage limits', () => {
    test('pro users are never blocked', () => {
      expect(shouldBlockFreeUser('pro', 0)).toBe(false);
      expect(shouldBlockFreeUser('pro', 100)).toBe(false);
    });

    test('free users blocked at limit', () => {
      expect(shouldBlockFreeUser('free', FREE_ANALYSES_PER_DAY - 1)).toBe(false);
      expect(shouldBlockFreeUser('free', FREE_ANALYSES_PER_DAY)).toBe(true);
      expect(shouldBlockFreeUser('free', FREE_ANALYSES_PER_DAY + 1)).toBe(true);
    });

    test('null entitlement treated as free', () => {
      expect(shouldBlockFreeUser(null, FREE_ANALYSES_PER_DAY)).toBe(true);
    });

    test('custom limit respected', () => {
      const customLimit = 3;
      expect(shouldBlockFreeUser('free', 2, customLimit)).toBe(false);
      expect(shouldBlockFreeUser('free', 3, customLimit)).toBe(true);
    });

    test('canPerformAnalysis wraps blocking logic', () => {
      expect(canPerformAnalysis('pro', 10)).toBe(true);
      expect(canPerformAnalysis('free', FREE_ANALYSES_PER_DAY - 1)).toBe(true);
      expect(canPerformAnalysis('free', FREE_ANALYSES_PER_DAY)).toBe(false);
    });
  });

  describe('Content truncation', () => {
    const reasons = ['Reason 1', 'Reason 2', 'Reason 3'];
    const suggestions = ['Suggestion 1', 'Suggestion 2'];

    test('pro users see all reasons', () => {
      expect(truncateReasons(reasons, 'pro')).toEqual(reasons);
    });

    test('free users see only first reason', () => {
      expect(truncateReasons(reasons, 'free')).toEqual(['Reason 1']);
      expect(truncateReasons(reasons, null)).toEqual(['Reason 1']);
    });

    test('pro users see all suggestions', () => {
      expect(truncateSuggestions(suggestions, 'pro')).toEqual(suggestions);
    });

    test('free users see only first suggestion', () => {
      expect(truncateSuggestions(suggestions, 'free')).toEqual(['Suggestion 1']);
      expect(truncateSuggestions(suggestions, null)).toEqual(['Suggestion 1']);
    });

    test('undefined suggestions handled gracefully', () => {
      expect(truncateSuggestions(undefined, 'free')).toBeUndefined();
      expect(truncateSuggestions([], 'free')).toEqual([]);
    });
  });

  describe('Analysis result limitations', () => {
    const mockResult: AnalysisResult = {
      prob: 0.8,
      bucket: 'Likely',
      recommendation: 'send',
      reasons: ['Reason 1', 'Reason 2', 'Reason 3'],
      suggestions: ['Suggestion 1', 'Suggestion 2'],
      featuresHash: 'abc123',
    };

    test('pro users get full result', () => {
      const result = applyFreeLimitations(mockResult, 'pro');
      expect(result).toEqual(mockResult);
    });

    test('free users get truncated result', () => {
      const result = applyFreeLimitations(mockResult, 'free');
      expect(result.reasons).toEqual(['Reason 1']);
      expect(result.suggestions).toEqual(['Suggestion 1']);
      expect(result.prob).toBe(mockResult.prob); // Other fields unchanged
      expect(result.bucket).toBe(mockResult.bucket);
    });

    test('result without suggestions handled', () => {
      const resultNoSuggestions = { ...mockResult, suggestions: undefined };
      const result = applyFreeLimitations(resultNoSuggestions, 'free');
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('Usage calculation', () => {
    test('usage persists on same day', () => {
      expect(calculateCurrentUsage(5, mockDate, mockDate)).toBe(5);
    });

    test('usage resets on day change', () => {
      expect(calculateCurrentUsage(5, mockDate, nextDate)).toBe(0);
      expect(calculateCurrentUsage(10, '2025-08-13', mockDate)).toBe(0);
    });

    test('zero usage persists', () => {
      expect(calculateCurrentUsage(0, mockDate, mockDate)).toBe(0);
      expect(calculateCurrentUsage(0, mockDate, nextDate)).toBe(0);
    });
  });
});
