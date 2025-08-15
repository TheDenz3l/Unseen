/**
 * Monetization constants for InboxUnseen
 * Phase 3 implementation
 */

// Free tier limits
export const FREE_ANALYSES_PER_DAY = 5;

// RevenueCat configuration
export const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || 'test_key';
export const ENTITLEMENT_KEY = 'pro_features';

// Product IDs (must match RevenueCat dashboard)
export const PRODUCT_IDS = {
  MONTHLY: 'prod_monthly',
  WEEKLY: 'prod_weekly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// Subscription status
export type EntitlementStatus = 'pro' | 'free' | null;

// Product info from RevenueCat
export interface ProductInfo {
  identifier: string;
  description: string;
  title: string;
  price_string: string;
  price: number;
  currency_code: string;
}

// Analytics event types
export const ANALYTICS_EVENTS = {
  PAYWALL_VIEW: 'paywall_view',
  PAYWALL_CLOSE: 'paywall_close',
  SUBSCRIBE_ATTEMPT: 'subscribe_attempt',
  SUBSCRIBE_SUCCESS: 'subscribe_success',
  SUBSCRIBE_FAIL: 'subscribe_fail',
  RESTORE_ATTEMPT: 'restore_attempt',
  RESTORE_SUCCESS: 'restore_success',
  RESTORE_FAIL: 'restore_fail',
  ANALYSIS_GATED: 'analysis_gated',
} as const;
