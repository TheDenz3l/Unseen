/**
 * Privacy store for managing local-only mode and data controls
 * Phase 4 - Privacy & Data Controls
 */

import { create } from 'zustand';

interface PrivacyState {
  // Privacy settings
  localOnly: boolean;
  
  // Actions
  setLocalOnly: (localOnly: boolean) => void;
  
  // Internal stats (for debugging)
  suppressedEvents: number;
  _incrementSuppressed: () => void;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  // Initial state
  localOnly: false,
  suppressedEvents: 0,

  // Actions
  setLocalOnly: (localOnly: boolean) => {
    set({ localOnly });
    if (localOnly) {
      console.log('[Privacy] Local-only mode enabled - analytics disabled');
    } else {
      console.log('[Privacy] Local-only mode disabled - analytics enabled');
    }
  },

  _incrementSuppressed: () => {
    set(state => ({ suppressedEvents: state.suppressedEvents + 1 }));
  },
}));
