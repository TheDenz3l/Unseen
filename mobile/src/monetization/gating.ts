/**
 * Pure gating functions for monetization logic
 * These functions have no side effects and are easily testable
 */

import { FREE_ANALYSES_PER_DAY, type EntitlementStatus } from './constants';
import type { AnalysisResult } from '../analysis';

/**
 * Get current date stamp in YYYY-MM-DD format (local timezone)
 */
export function getCurrentDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check if the date has changed (for daily usage reset)
 */
export function isDayChanged(prevDate: string, currentDate: string): boolean {
  return prevDate !== currentDate;
}

/**
 * Determine if a free user should be blocked from analysis
 */
export function shouldBlockFreeUser(
  entitlement: EntitlementStatus,
  usageToday: number,
  limit: number = FREE_ANALYSES_PER_DAY
): boolean {
  if (entitlement === 'pro') return false;
  return usageToday >= limit;
}

/**
 * Truncate reasons for free users (show only first reason)
 */
export function truncateReasons(
  reasons: string[],
  entitlement: EntitlementStatus
): string[] {
  if (entitlement === 'pro') return reasons;
  return reasons.slice(0, 1);
}

/**
 * Truncate suggestions for free users (show only first suggestion)
 */
export function truncateSuggestions(
  suggestions: string[] | undefined,
  entitlement: EntitlementStatus
): string[] | undefined {
  if (entitlement === 'pro') return suggestions;
  if (!suggestions || suggestions.length === 0) return suggestions;
  return suggestions.slice(0, 1);
}

/**
 * Apply free user limitations to analysis result
 */
export function applyFreeLimitations(
  result: AnalysisResult,
  entitlement: EntitlementStatus
): AnalysisResult {
  if (entitlement === 'pro') return result;

  return {
    ...result,
    reasons: truncateReasons(result.reasons, entitlement),
    suggestions: truncateSuggestions(result.suggestions, entitlement),
  };
}

/**
 * Calculate usage after reset if day changed
 */
export function calculateCurrentUsage(
  prevUsage: number,
  prevDateStamp: string,
  currentDateStamp: string
): number {
  if (isDayChanged(prevDateStamp, currentDateStamp)) {
    return 0;
  }
  return prevUsage;
}

/**
 * Check if user can perform analysis without showing paywall
 */
export function canPerformAnalysis(
  entitlement: EntitlementStatus,
  usageToday: number
): boolean {
  return !shouldBlockFreeUser(entitlement, usageToday);
}
