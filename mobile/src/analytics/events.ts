/**
 * Analytics events for monetization tracking
 * Phase 3 - fire-and-forget implementation with console logging
 * Can be extended later to route to real analytics services
 */

import { ANALYTICS_EVENTS } from '../monetization/constants';

interface EventData {
  [key: string]: any;
}

/**
 * Base event tracking function
 */
function trackEvent(eventName: string, data?: EventData): void {
  // For now, just log to console
  // In production, this would route to analytics service (Amplitude, Mixpanel, etc.)
  console.log(`[Analytics] ${eventName}`, data ? JSON.stringify(data, null, 2) : '');
  
  // TODO: Add real analytics service integration
  // Example: analytics.track(eventName, data);
}

/**
 * Track paywall view
 */
export function trackPaywallView(trigger: 'limit_reached' | 'upgrade_button' | 'result_truncated'): void {
  trackEvent(ANALYTICS_EVENTS.PAYWALL_VIEW, { trigger });
}

/**
 * Track paywall close
 */
export function trackPaywallClose(action: 'dismiss' | 'purchase' | 'restore'): void {
  trackEvent(ANALYTICS_EVENTS.PAYWALL_CLOSE, { action });
}

/**
 * Track subscription attempt
 */
export function trackSubscribeAttempt(productId: string): void {
  trackEvent(ANALYTICS_EVENTS.SUBSCRIBE_ATTEMPT, { productId });
}

/**
 * Track successful subscription
 */
export function trackSubscribeSuccess(entitlement: string, productId: string): void {
  trackEvent(ANALYTICS_EVENTS.SUBSCRIBE_SUCCESS, { entitlement, productId });
}

/**
 * Track subscription failure
 */
export function trackSubscribeFail(errorCode: string, productId: string): void {
  trackEvent(ANALYTICS_EVENTS.SUBSCRIBE_FAIL, { errorCode, productId });
}

/**
 * Track restore attempt
 */
export function trackRestoreAttempt(): void {
  trackEvent(ANALYTICS_EVENTS.RESTORE_ATTEMPT);
}

/**
 * Track successful restore
 */
export function trackRestoreSuccess(entitlement: string): void {
  trackEvent(ANALYTICS_EVENTS.RESTORE_SUCCESS, { entitlement });
}

/**
 * Track restore failure
 */
export function trackRestoreFail(errorCode: string): void {
  trackEvent(ANALYTICS_EVENTS.RESTORE_FAIL, { errorCode });
}

/**
 * Track when analysis is gated due to limits
 */
export function trackAnalysisGated(limit: number, usageToday: number): void {
  trackEvent(ANALYTICS_EVENTS.ANALYSIS_GATED, { limit, usageToday });
}
