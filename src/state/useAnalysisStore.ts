import { create } from 'zustand';
import { extractFeatures, runAnalysis, generateFeaturesHash, type Conversation, type AnalysisResult } from '../analysis/index';
import { database } from '../storage/db';

interface AnalysisState {
  // Current analysis data
  currentConversation: Conversation | null;
  currentResult: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  
  // Recent analyses
  recentAnalyses: any[];
  
  // Actions
  analyzeConversation: (conversation: Conversation, contactId?: string) => Promise<void>;
  clearCurrentAnalysis: () => void;
  loadRecentAnalyses: () => Promise<void>;
  logOutcome: (analysisId: string, gotReply: boolean, latencyMinutes?: number) => Promise<void>;
  deleteAllData: () => Promise<void>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentConversation: null,
  currentResult: null,
  isAnalyzing: false,
  error: null,
  recentAnalyses: [],

  analyzeConversation: async (conversation: Conversation, contactId?: string) => {
    set({ isAnalyzing: true, error: null });
    
    try {
      const startTime = performance.now();
      
      // Extract features from conversation
      const features = extractFeatures(conversation);
      
      // Generate features hash for deduplication
      const featuresHash = generateFeaturesHash(features);
      
      // Run analysis model
      const result = runAnalysis(features);
      
      const endTime = performance.now();
      const analysisTime = endTime - startTime;
      
      console.log(`Analysis completed in ${analysisTime.toFixed(1)}ms`);
      
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
      const analyses = await database.getRecentAnalyses(20);
      set({ recentAnalyses: analyses });
    } catch (error) {
      console.error('Failed to load recent analyses:', error);
    }
  },

  logOutcome: async (analysisId: string, gotReply: boolean, latencyMinutes?: number) => {
    try {
      await database.logOutcome(analysisId, gotReply, latencyMinutes);
      
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
