/**
 * Monetization store for managing subscription state and usage limits
 */

import { create } from 'zustand';
import { getCurrentDateStamp, calculateCurrentUsage } from '../monetization/gating';
import type { EntitlementStatus, ProductInfo } from '../monetization/constants';

interface MonetizationState {
  // Subscription state
  entitlement: EntitlementStatus;
  isInitializing: boolean;
  products: ProductInfo[];
  lastError?: string;

  // Usage tracking
  usageToday: number;
  dateStamp: string;

  // Actions
  init: () => Promise<void>;
  purchase: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
  recordAnalysis: () => void;
  resetDayIfNeeded: () => void;
  setError: (error: string) => void;
  clearError: () => void;

  // Internal state setters
  _setEntitlement: (entitlement: EntitlementStatus) => void;
  _setProducts: (products: ProductInfo[]) => void;
  _setInitializing: (initializing: boolean) => void;
}

export const useMonetizationStore = create<MonetizationState>((set, get) => ({
  // Initial state
  entitlement: null,
  isInitializing: false,
  products: [],
  usageToday: 0,
  dateStamp: getCurrentDateStamp(),

  // Actions
  init: async () => {
    const state = get();
    if (state.isInitializing) return;

    set({ isInitializing: true, lastError: undefined });

    try {
      // Reset usage if day changed
      state.resetDayIfNeeded();

      // Initialize RevenueCat (placeholder - will implement with real SDK)
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async init
      
      // Check entitlement status (placeholder)
      const entitlement: EntitlementStatus = 'free'; // Will come from RevenueCat
      
      // Fetch products (placeholder)
      const products: ProductInfo[] = [
        {
          identifier: 'prod_monthly',
          title: 'Pro Monthly',
          description: 'Unlimited analyses and insights',
          price_string: '$9.99',
          price: 9.99,
          currency_code: 'USD',
        },
        {
          identifier: 'prod_weekly',
          title: 'Pro Weekly',
          description: 'Unlimited analyses and insights',
          price_string: '$2.99',
          price: 2.99,
          currency_code: 'USD',
        },
      ];

      set({ 
        entitlement,
        products,
        isInitializing: false,
      });

      console.log('[Monetization] Initialized with entitlement:', entitlement);
    } catch (error) {
      console.error('[Monetization] Init failed:', error);
      set({ 
        lastError: 'Failed to initialize subscription system',
        isInitializing: false,
        entitlement: 'free', // Fallback to free on error
      });
    }
  },

  purchase: async (productId: string) => {
    const state = get();
    set({ lastError: undefined });

    try {
      console.log('[Monetization] Attempting purchase:', productId);
      
      // Simulate purchase flow (will implement with real SDK)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - grant pro entitlement
      set({ entitlement: 'pro' });
      console.log('[Monetization] Purchase successful, granted pro access');
      
    } catch (error) {
      console.error('[Monetization] Purchase failed:', error);
      set({ lastError: 'Purchase failed. Please try again.' });
      throw error;
    }
  },

  restore: async () => {
    set({ lastError: undefined });

    try {
      console.log('[Monetization] Attempting restore');
      
      // Simulate restore flow (will implement with real SDK)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user has active subscription (placeholder)
      const hasActiveSubscription = false; // Will come from RevenueCat
      
      const entitlement: EntitlementStatus = hasActiveSubscription ? 'pro' : 'free';
      set({ entitlement });
      
      console.log('[Monetization] Restore completed, entitlement:', entitlement);
      
    } catch (error) {
      console.error('[Monetization] Restore failed:', error);
      set({ lastError: 'Failed to restore purchases' });
      throw error;
    }
  },

  recordAnalysis: () => {
    const state = get();
    
    // Reset usage if day changed
    state.resetDayIfNeeded();
    
    // Only increment usage for free users
    if (state.entitlement !== 'pro') {
      set({ usageToday: state.usageToday + 1 });
      console.log('[Monetization] Recorded analysis, usage today:', state.usageToday + 1);
    }
  },

  resetDayIfNeeded: () => {
    const state = get();
    const currentDate = getCurrentDateStamp();
    const newUsage = calculateCurrentUsage(
      state.usageToday,
      state.dateStamp,
      currentDate
    );

    if (newUsage !== state.usageToday || state.dateStamp !== currentDate) {
      set({ 
        usageToday: newUsage,
        dateStamp: currentDate,
      });
      console.log('[Monetization] Day reset, usage reset to:', newUsage);
    }
  },

  setError: (error: string) => set({ lastError: error }),
  clearError: () => set({ lastError: undefined }),

  // Internal setters
  _setEntitlement: (entitlement: EntitlementStatus) => set({ entitlement }),
  _setProducts: (products: ProductInfo[]) => set({ products }),
  _setInitializing: (initializing: boolean) => set({ isInitializing: initializing }),
}));
