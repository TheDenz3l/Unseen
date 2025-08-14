/**
 * Integration tests for monetization workflow
 */

import { FREE_ANALYSES_PER_DAY } from '../monetization/constants';
import { 
  shouldBlockFreeUser, 
  canPerformAnalysis,
  applyFreeLimitations,
  calculateCurrentUsage,
  getCurrentDateStamp 
} from '../monetization/gating';
import type { AnalysisResult } from '../analysis/features';

describe('Monetization Integration', () => {
  describe('Gating logic integration', () => {
    test('free user workflow from start to limit', () => {
      // Start fresh
      let usageToday = 0;
      const entitlement = 'free';

      // User can do analyses up to limit
      for (let i = 0; i < FREE_ANALYSES_PER_DAY; i++) {
        expect(canPerformAnalysis(entitlement, usageToday)).toBe(true);
        expect(shouldBlockFreeUser(entitlement, usageToday)).toBe(false);
        
        // After analysis, increment usage
        usageToday += 1;
      }

      // Now at limit - should be blocked
      expect(canPerformAnalysis(entitlement, usageToday)).toBe(false);
      expect(shouldBlockFreeUser(entitlement, usageToday)).toBe(true);
    });

    test('pro user is never blocked regardless of usage', () => {
      const entitlement = 'pro';
      
      // Even with high usage, pro user can continue
      const highUsage = FREE_ANALYSES_PER_DAY + 50;
      expect(canPerformAnalysis(entitlement, highUsage)).toBe(true);
      expect(shouldBlockFreeUser(entitlement, highUsage)).toBe(false);
    });
  });

  describe('Content truncation workflow', () => {
    const fullResult: AnalysisResult = {
      prob: 0.8,
      bucket: 'Likely',
      recommendation: 'send',
      reasons: ['Reason 1', 'Reason 2', 'Reason 3'],
      suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
      featuresHash: 'hash123',
    };

    test('complete free user content flow', () => {
      // Free user gets truncated content
      const freeResult = applyFreeLimitations(fullResult, 'free');
      
      expect(freeResult.reasons).toEqual(['Reason 1']);
      expect(freeResult.suggestions).toEqual(['Suggestion 1']);
      
      // Core analysis data unchanged
      expect(freeResult.prob).toBe(fullResult.prob);
      expect(freeResult.bucket).toBe(fullResult.bucket);
      expect(freeResult.recommendation).toBe(fullResult.recommendation);
    });

    test('complete pro user content flow', () => {
      // Pro user gets full content
      const proResult = applyFreeLimitations(fullResult, 'pro');
      
      expect(proResult).toEqual(fullResult);
      expect(proResult.reasons.length).toBe(3);
      expect(proResult.suggestions?.length).toBe(3);
    });
  });

  describe('Daily usage reset workflow', () => {
    test('usage calculation with day changes', () => {
      const today = getCurrentDateStamp();
      
      // Usage persists same day
      expect(calculateCurrentUsage(3, today, today)).toBe(3);
      
      // Usage resets on day change
      const yesterday = '2025-08-13';
      expect(calculateCurrentUsage(5, yesterday, today)).toBe(0);
      
      // Edge case: zero usage
      expect(calculateCurrentUsage(0, yesterday, today)).toBe(0);
    });
  });

  describe('Full user journey scenarios', () => {
    test('free user hits limit, upgrades, gets unlimited access', () => {
      let usage = FREE_ANALYSES_PER_DAY;
      
      // Free user blocked at limit
      expect(canPerformAnalysis('free', usage)).toBe(false);
      
      // After upgrade to pro, can analyze with same usage count
      expect(canPerformAnalysis('pro', usage)).toBe(true);
      
      // Pro users usage doesn't matter
      expect(canPerformAnalysis('pro', usage + 100)).toBe(true);
    });

    test('result presentation changes with entitlement', () => {
      const fullAnalysis: AnalysisResult = {
        prob: 0.65,
        bucket: 'Uncertain',
        recommendation: 'wait',
        waitMinutes: 120,
        reasons: ['Low engagement lately', 'They seem busy', 'Your message is long'],
        suggestions: ['Short version', 'Casual tone', 'Direct ask'],
        featuresHash: 'analysis123',
      };

      // Free user sees limited version
      const freeVersion = applyFreeLimitations(fullAnalysis, 'free');
      expect(freeVersion.reasons).toHaveLength(1);
      expect(freeVersion.suggestions).toHaveLength(1);
      
      // Pro user sees everything
      const proVersion = applyFreeLimitations(fullAnalysis, 'pro');
      expect(proVersion.reasons).toHaveLength(3);
      expect(proVersion.suggestions).toHaveLength(3);
      
      // But core recommendation is same for both
      expect(freeVersion.recommendation).toBe(proVersion.recommendation);
      expect(freeVersion.prob).toBe(proVersion.prob);
    });
  });
});
