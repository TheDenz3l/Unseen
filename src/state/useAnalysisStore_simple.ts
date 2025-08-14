import { create } from 'zustand';

interface AnalysisState {
  // Current analysis data
  currentConversation: any | null;
  currentResult: any | null;
  isAnalyzing: boolean;
  error: string | null;
  
  // Recent analyses
  recentAnalyses: any[];
  
  // Actions
  analyzeConversation: (conversation: any, contactId?: string) => Promise<void>;
  clearCurrentAnalysis: () => void;
  loadRecentAnalyses: () => Promise<void>;
  logOutcome: (analysisId: string, gotReply: boolean, latencyMinutes?: number) => Promise<void>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentConversation: null,
  currentResult: null,
  isAnalyzing: false,
  error: null,
  recentAnalyses: [],

  analyzeConversation: async (conversation: any, contactId?: string) => {
    set({ isAnalyzing: true, error: null });
    
    try {
      // Mock analysis result for now
      const result = {
        id: `analysis_${Date.now()}`,
        prob: 0.3,
        bucket: 'Unlikely',
        recommendation: 'wait',
        waitMinutes: 240,
        reasons: ['You sent multiple messages in a row', 'Consider waiting for a better time', 'Evening hours work better'],
        featuresHash: 'mock_hash',
      };
      
      set({
        currentConversation: conversation,
        currentResult: result,
        isAnalyzing: false,
      });
      
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
      // Mock recent analyses for now
      set({ recentAnalyses: [] });
    } catch (error) {
      console.error('Failed to load recent analyses:', error);
    }
  },

  logOutcome: async (analysisId: string, gotReply: boolean, latencyMinutes?: number) => {
    try {
      console.log('Outcome logged:', { analysisId, gotReply, latencyMinutes });
    } catch (error) {
      console.error('Failed to log outcome:', error);
    }
  },
}));
