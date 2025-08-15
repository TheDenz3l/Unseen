import { create } from 'zustand';
import { extractFeatures, AnalysisFeatures, AnalysisResult, Conversation, Message } from '../analysis/features';
import { runAnalysis } from '../analysis/model';
import { generateSuggestions, Suggestion } from '../analysis/suggestions';

interface AnalysisState {
  // Current analysis state
  isAnalyzing: boolean;
  currentAnalysis: AnalysisResult | null;
  currentSuggestions: Suggestion[];
  currentFeatures: AnalysisFeatures | null;
  
  // Simple in-memory history for Phase 1
  analysisHistory: Array<{
    id: string;
    timestamp: number;
    analysis: AnalysisResult;
    originalText: string;
    suggestions: Suggestion[];
  }>;
  
  // Performance metrics
  lastAnalysisTime: number;
  
  // Actions
  analyzeConversation: (input: string) => Promise<void>;
  clearCurrentAnalysis: () => void;
  getHistory: () => AnalysisState['analysisHistory'];
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  isAnalyzing: false,
  currentAnalysis: null,
  currentSuggestions: [],
  currentFeatures: null,
  analysisHistory: [],
  lastAnalysisTime: 0,
  
  analyzeConversation: async (input: string) => {
    if (!input || input.trim().length === 0) {
      throw new Error('Input cannot be empty');
    }
    
    const startTime = performance.now();
    
    set({ isAnalyzing: true });
    
    try {
      // For Phase 1, we'll treat the input as a simple conversation
      // Later phases will have proper message parsing
      const conversation = parseInputToConversation(input);
      
      // Extract features
      const features = extractFeatures(conversation);
      
      // Run analysis
      const analysis = runAnalysis(features);
      
      // Generate suggestions
      const suggestions = generateSuggestions(input, features);
      
      const endTime = performance.now();
      const analysisTime = endTime - startTime;
      
      // Store result
      const historyEntry = {
        id: generateId(),
        timestamp: Date.now(),
        analysis,
        originalText: input,
        suggestions,
      };
      
      set({ 
        isAnalyzing: false,
        currentAnalysis: analysis,
        currentSuggestions: suggestions,
        currentFeatures: features,
        lastAnalysisTime: analysisTime,
        analysisHistory: [...get().analysisHistory, historyEntry],
      });
      
      // Log performance for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Analysis completed in ${analysisTime.toFixed(1)}ms`);
        console.log('Features:', features);
        console.log('Result:', analysis);
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      set({ isAnalyzing: false });
      throw error;
    }
  },
  
  clearCurrentAnalysis: () => {
    set({ 
      currentAnalysis: null, 
      currentSuggestions: [],
      currentFeatures: null,
    });
  },
  
  getHistory: () => get().analysisHistory,
}));

/**
 * Parse text input into a conversation structure
 * This is simplified for Phase 1 - Phase 6 will add OCR parsing
 */
function parseInputToConversation(input: string): Conversation {
  // Simple heuristic: try to detect if it's a conversation vs single message
  const lines = input.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 1) {
    // Single message - assume it's a draft they want to send
    return {
      messages: [{
        author: 'you',
        text: lines[0],
        timestamp: Date.now(),
      }],
    };
  }
  
  // Multiple lines - try to parse as conversation
  const messages: Message[] = [];
  let currentAuthor: 'you' | 'them' = 'you';
  
  for (const line of lines) {
    // Simple heuristics to detect speaker changes
    // This is very basic - Phase 6 OCR will be much better
    if (line.toLowerCase().includes('them:') || line.toLowerCase().includes('they said:')) {
      currentAuthor = 'them';
      messages.push({
        author: 'them',
        text: line.replace(/^[^:]+:/, '').trim(),
        timestamp: Date.now() - (messages.length * 3600000), // Mock timestamps
      });
    } else if (line.toLowerCase().includes('me:') || line.toLowerCase().includes('i said:')) {
      currentAuthor = 'you';
      messages.push({
        author: 'you',
        text: line.replace(/^[^:]+:/, '').trim(),
        timestamp: Date.now() - (messages.length * 3600000),
      });
    } else {
      // No explicit marker - alternate or use context
      messages.push({
        author: currentAuthor,
        text: line,
        timestamp: Date.now() - (messages.length * 3600000),
      });
      // Simple alternation assumption
      currentAuthor = currentAuthor === 'you' ? 'them' : 'you';
    }
  }
  
  return { messages };
}

/**
 * Generate unique ID for history entries
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Debug helper to get performance stats
 */
export function getPerformanceStats(): { 
  lastAnalysisTime: number;
  averageTime: number;
  totalAnalyses: number;
} {
  const state = useAnalysisStore.getState();
  const history = state.analysisHistory;
  
  return {
    lastAnalysisTime: state.lastAnalysisTime,
    averageTime: history.length > 0 ? state.lastAnalysisTime : 0, // For now, just last time
    totalAnalyses: history.length,
  };
}
