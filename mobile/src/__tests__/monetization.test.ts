import { applyFreeLimitations, truncateReasons, truncateSuggestions, canPerformAnalysis, shouldBlockFreeUser } from '../monetization/gating';
import { FREE_ANALYSES_PER_DAY } from '../monetization/constants';

const baseResult = {
  prob: 0.5,
  bucket: 'Uncertain',
  recommendation: 'send',
  waitMinutes: undefined,
  reasons: ['Reason A', 'Reason B', 'Reason C'],
  suggestions: ['S1', 'S2', 'S3'],
  featuresHash: 'hash123'
} as any;

describe('Monetization Gating (Phase 3)', () => {
  test('free user truncated reasons & suggestions', () => {
    const limited = applyFreeLimitations(baseResult, 'free');
    expect(limited.reasons).toHaveLength(1);
    expect(limited.suggestions).toHaveLength(1);
  });

  test('pro user full content', () => {
    const full = applyFreeLimitations(baseResult, 'pro');
    expect(full.reasons).toHaveLength(3);
    expect(full.suggestions).toHaveLength(3);
  });

  test('usage gating blocks after limit', () => {
    expect(shouldBlockFreeUser('free', FREE_ANALYSES_PER_DAY)).toBe(true);
    expect(shouldBlockFreeUser('free', FREE_ANALYSES_PER_DAY - 1)).toBe(false);
    expect(shouldBlockFreeUser('pro', 999)).toBe(false);
  });

  test('canPerformAnalysis mirrors shouldBlockFreeUser', () => {
    expect(canPerformAnalysis('free', FREE_ANALYSES_PER_DAY - 1)).toBe(true);
    expect(canPerformAnalysis('free', FREE_ANALYSES_PER_DAY)).toBe(false);
  });

  test('truncate helpers handle empty gracefully', () => {
    expect(truncateReasons([], 'free')).toEqual([]);
    expect(truncateSuggestions([], 'free')).toEqual([]);
    expect(truncateSuggestions(undefined, 'free')).toBeUndefined();
  });
});
