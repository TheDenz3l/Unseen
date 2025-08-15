import { create } from 'zustand';
import { extractFeatures, runAnalysis, generateFeaturesHash, type Conversation, type AnalysisResult } from '../analysis/index';
import { database } from '../storage/db';
import { scheduleOutcomeNudge, cancelOutcomeNudge, restorePendingNudges } from '../notifications/scheduler';
import { useMonetizationStore } from './useMonetizationStore';
import { canPerformAnalysis, applyFreeLimitations } from '../monetization/gating';
import { trackAnalysisGated } from '../analytics/events';
import { FREE_ANALYSES_PER_DAY } from '../monetization/constants';

interface AnalysisState {
  // Current analysis data
  currentConversation: Conversation | null;
  currentResult: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  
  // Recent analyses
  recentAnalyses: any[];
  
  // Gating state
  isGated: boolean;
  
  // Actions
  analyzeConversation: (conversation: Conversation, contactId?: string) => Promise<void>;
  clearCurrentAnalysis: () => void;
  loadRecentAnalyses: () => Promise<void>;
  loadAnalysisById: (analysisId: string) => Promise<any | null>;
  logOutcome: (analysisId: string, gotReply: boolean, latencyMinutes?: number) => Promise<void>;
  deleteAllData: () => Promise<void>;
  
  // Gating actions
  checkGating: () => { canAnalyze: boolean; reason?: string };
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentConversation: null,
  currentResult: null,
  isAnalyzing: false,
  error: null,
  recentAnalyses: [],
  isGated: false,

  checkGating: () => {
    const monetizationState = useMonetizationStore.getState();
    monetizationState.resetDayIfNeeded();
    
    const canAnalyze = canPerformAnalysis(
      monetizationState.entitlement,
      monetizationState.usageToday
    );

    if (!canAnalyze) {
      trackAnalysisGated(FREE_ANALYSES_PER_DAY, monetizationState.usageToday);
      return {
        canAnalyze: false,
        reason: `You've reached your daily limit of ${FREE_ANALYSES_PER_DAY} analyses. Upgrade to Pro for unlimited access.`
      };
    }

    return { canAnalyze: true };
  },

  analyzeConversation: async (conversation: Conversation, contactId?: string) => {
    // Check if analysis is gated
    const gatingCheck = get().checkGating();
    if (!gatingCheck.canAnalyze) {
      set({ 
        isGated: true,
        error: gatingCheck.reason
      });
      throw new Error(gatingCheck.reason || 'Analysis blocked');
    }

    set({ isAnalyzing: true, error: null, isGated: false });
    
    try {
      const startTime = performance.now();
      
      // Extract features from conversation
      const features = extractFeatures(conversation);
      
      // Generate features hash for deduplication
      const featuresHash = generateFeaturesHash(features);
      
      // Run analysis model
      const rawResult = runAnalysis(features);
      
      // Apply free user limitations
      const monetizationState = useMonetizationStore.getState();
      const result = applyFreeLimitations(rawResult, monetizationState.entitlement);
      
      const endTime = performance.now();
      const analysisTime = endTime - startTime;
      
      console.log(`Analysis completed in ${analysisTime.toFixed(1)}ms`);
      
      // Record usage (will only increment for free users)
      monetizationState.recordAnalysis();
      
      // Store in database
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const threadId = `thread_${Date.now()}`;
      
      if (contactId) {
        await database.createThread(threadId, contactId);
      }
      
      await database.createAnalysis({
        id: analysisId,
        threadId,
        featuresHash: featuresHash,
        prob: result.prob,
        bucket: result.bucket,
        recommendation: `${result.recommendation}${result.waitMinutes ? `;${result.waitMinutes}` : ''}`,
        reasons: result.reasons,
        suggestions: [], // Will be populated with actual suggestions later
      });

      // Schedule outcome nudge (12h) if user has not yet logged outcome
      try {
        await scheduleOutcomeNudge(analysisId, Date.now());
      } catch (e) {
        console.warn('[Notifications] Failed to schedule nudge', e);
      }
      
      set({
        currentConversation: conversation,
        currentResult: { ...result, id: analysisId } as any,
        isAnalyzing: false,
      });
      
      // Reload recent analyses
      get().loadRecentAnalyses();
      
    } catch (error) {
      console.error('Analysis failed:', error);
      set({
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
    }
  },

  clearCurrentAnalysis: () => {
    set({
      currentConversation: null,
      currentResult: null,
      error: null,
    });
  },

  loadRecentAnalyses: async () => {
    try {
      // One-time restore (simple guard using window global flag)
      if (!(global as any).__nudges_restored) {
        (global as any).__nudges_restored = true;
        restorePendingNudges();
      }
      const analyses = await database.getRecentAnalyses(20);
      set({ recentAnalyses: analyses });
    } catch (error) {
      console.error('Failed to load recent analyses:', error);
    }
  },

  loadAnalysisById: async (analysisId: string) => {
    try {
      const analysis = await database.getAnalysisById(analysisId);
      return analysis;
    } catch (error) {
      console.error('Failed to load analysis by ID:', error);
      return null;
    }
  },

  logOutcome: async (analysisId: string, gotReply: boolean, latencyMinutes?: number) => {
    try {
  await database.logOutcome(analysisId, gotReply, latencyMinutes);
  // Cancel pending nudge (if any)
  cancelOutcomeNudge(analysisId);
      
      // Update the analysis in our recent list
      const { recentAnalyses } = get();
      const updatedAnalyses = recentAnalyses.map(analysis => {
        if (analysis.id === analysisId) {
          return {
            ...analysis,
            outcome: { gotReply, latencyMinutes, loggedAt: Date.now() }
          };
        }
        return analysis;
      });
      
      set({ recentAnalyses: updatedAnalyses });
    } catch (error) {
      console.error('Failed to log outcome:', error);
    }
  },

  deleteAllData: async () => {
    try {
      await database.deleteAllData();
      set({ 
        recentAnalyses: [],
        currentResult: null,
        currentConversation: null,
        error: null
      });
    } catch (error) {
      console.error('Failed to delete data:', error);
      throw error;
    }
  },
}));
